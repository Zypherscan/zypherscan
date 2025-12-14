use std::collections::HashMap;
use chrono::{DateTime, NaiveDate};
use zingolib::{
    lightclient::LightClient,
    config::{ZingoConfig, ChainType},
    wallet::{WalletBase, LightWallet},
    data::PollReport,
};
use zingolib::wallet::summary::data::TransactionKind;
use zip32::AccountId;

pub struct ZypherScanner {
    client: LightClient,
    #[allow(dead_code)]
    config: ZingoConfig,
}

#[derive(Debug, serde::Serialize)]
pub struct TxReport {
    pub txid: String,
    pub datetime: String,
    pub kind: String,
    pub value: u64,
    pub fee: Option<u64>,
    pub memos: Vec<String>,
}

#[derive(Debug, serde::Serialize)]
pub struct PoolBalances {
    pub sapling_balance: u64,
    pub orchard_balance: u64,
    pub transparent_balance: u64,
}

#[derive(Debug, serde::Serialize)]
pub struct AnalysisReport {
    pub total_transactions: usize,
    pub total_received: u64,
    pub total_sent: u64,
    pub total_fees: u64,
    pub avg_transaction_value: f64,
    pub most_active_day: String,
    pub most_active_day_count: usize,
    pub pending_tx_count: usize,
    pub pending_value: u64,
    pub pool_distribution: HashMap<String, usize>, // "Orchard" -> count, "Sapling" -> count
    pub type_distribution: HashMap<String, usize>, // "Incoming" -> count, "Outgoing" -> count
    pub scan_status: String,
    pub percent_complete: f32,
    pub last_synced_height: u64,
}

pub enum ScannerSyncStatus {
    Complete,
    Failed(String),
    InProgress(u32, f32, usize), // blocks, percent, tx_count
    FinishedOrNotRunning,
}

impl ZypherScanner {
    // ... (new_from_uvk and start_sync omitted)

    pub fn new_from_uvk(uvk_str: &str, birthday: u64) -> Result<Self, String> {
        let config = ZingoConfig::build(ChainType::Mainnet)
            .set_lightwalletd_uri("http://yamanote.proxy.rlwy.net:54918".parse().unwrap())
            .create();

        let view_wallet_base = WalletBase::Ufvk(uvk_str.to_string());
        
        let view_wallet = LightWallet::new(
            config.chain.clone(),
            view_wallet_base,
            (birthday as u32).into(),
            config.wallet_settings.clone()
        ).map_err(|e| format!("View wallet error: {:?}", e))?;

        let view_client = LightClient::create_from_wallet(view_wallet, config.clone(), false)
            .map_err(|e| format!("View client error: {:?}", e))?;

        Ok(Self {
            client: view_client,
            config,
        })
    }

    pub async fn start_sync(&mut self) -> Result<(), String> {
        self.client.sync().await.map_err(|e| format!("Sync error: {}", e))
    }

    pub async fn check_sync(&mut self) -> ScannerSyncStatus {
        match self.client.poll_sync() {
            PollReport::Ready(Ok(_)) => ScannerSyncStatus::Complete,
            PollReport::Ready(Err(e)) => ScannerSyncStatus::Failed(format!("{}", e)),
            PollReport::NotReady => {
                 ScannerSyncStatus::InProgress(0, 0.0, 0)
            },
            PollReport::NoHandle => ScannerSyncStatus::FinishedOrNotRunning,
        }
    }

    pub async fn get_balances(&self) -> PoolBalances {
        // We use AccountId::ZERO which corresponds to the first account derived from the seed/UVK
        let balance_res = self.client.account_balance(AccountId::ZERO).await;
        
        match balance_res {
            Ok(bal) => PoolBalances {
                sapling_balance: bal.total_sapling_balance.map(|z| z.into_u64()).unwrap_or(0),
                orchard_balance: bal.total_orchard_balance.map(|z| z.into_u64()).unwrap_or(0),
                transparent_balance: bal.total_transparent_balance.map(|z| z.into_u64()).unwrap_or(0),
            },
            Err(_) => PoolBalances {
                sapling_balance: 0,
                orchard_balance: 0,
                transparent_balance: 0,
            }
        }
    }

    pub async fn get_transaction_history(&self) -> Vec<TxReport> {
        let summaries = match self.client.transaction_summaries(true).await {
             Ok(s) => s.0,
             Err(_) => Vec::new(), 
        };
        
        summaries.into_iter().map(|s| {
            let mut memos = Vec::new();
            // Incoming notes
            for note in &s.orchard_notes {
                if let Some(m) = &note.memo { memos.push(m.clone()); }
            }
            for note in &s.sapling_notes {
                if let Some(m) = &note.memo { memos.push(m.clone()); }
            }
            // Outgoing notes
            for note in &s.outgoing_orchard_notes {
                if let Some(m) = &note.memo { memos.push(m.clone()); }
            }
            for note in &s.outgoing_sapling_notes {
                if let Some(m) = &note.memo { memos.push(m.clone()); }
            }
            
            TxReport {
                txid: s.txid.to_string(),
                datetime: if s.datetime > 0 {
                    DateTime::from_timestamp(s.datetime as i64, 0)
                        .map(|dt| dt.to_string())
                        .unwrap_or_else(|| "Unknown".to_string())
                } else {
                    "Unknown".to_string()
                },
                kind: match s.kind {
                    TransactionKind::Received => "Received".to_string(),
                    TransactionKind::Sent(_) => "Sent".to_string(),
                },
                value: s.value,
                fee: s.fee,
                memos,
            }
        }).collect()
    }

    pub async fn analyze_history(&mut self) -> AnalysisReport {
        let summaries = match self.client.transaction_summaries(true).await {
             Ok(s) => s.0,
             Err(_) => Vec::new(), 
        };

        let total_transactions = summaries.len();
        let mut total_received = 0;
        let mut total_sent = 0;
        let mut total_fees = 0;
        let mut total_value = 0;
        let mut pending_tx_count = 0;
        let mut pending_value = 0;
        let mut day_counts: HashMap<NaiveDate, usize> = HashMap::new();
        let mut pool_counts: HashMap<String, usize> = HashMap::new();
        let mut type_counts: HashMap<String, usize> = HashMap::new();

        pool_counts.insert("Orchard".to_string(), 0);
        pool_counts.insert("Sapling".to_string(), 0);
        pool_counts.insert("Transparent".to_string(), 0);

        for s in &summaries {
            // Volume and Fees
            match s.kind {
                TransactionKind::Received => {
                    total_received += s.value;
                    *type_counts.entry("Incoming".to_string()).or_insert(0) += 1;
                },
                TransactionKind::Sent(_) => {
                    total_sent += s.value;
                    if let Some(f) = s.fee {
                        total_fees += f;
                    }
                    *type_counts.entry("Outgoing".to_string()).or_insert(0) += 1;
                }
            }
            total_value += s.value;

            // Pending
            if !s.status.is_confirmed() {
                pending_tx_count += 1;
                pending_value += s.value;
            }

            // Most active day
            if s.datetime > 0 {
                if let Some(dt) = DateTime::from_timestamp(s.datetime as i64, 0) {
                     let date = dt.date_naive();
                     *day_counts.entry(date).or_insert(0) += 1;
                }
            }

            // Pool distribution
            if !s.orchard_notes.is_empty() || !s.outgoing_orchard_notes.is_empty() {
                *pool_counts.entry("Orchard".to_string()).or_insert(0) += 1;
            }
            if !s.sapling_notes.is_empty() || !s.outgoing_sapling_notes.is_empty() {
                *pool_counts.entry("Sapling".to_string()).or_insert(0) += 1;
            }
            if !s.transparent_coins.is_empty() || !s.outgoing_transparent_coins.is_empty() {
                *pool_counts.entry("Transparent".to_string()).or_insert(0) += 1;
            }
        }

        // Most active day calculation
        let (most_active_day, most_active_day_count) = day_counts.iter()
            .max_by_key(|entry| entry.1)
            .map(|(d, c)| (d.to_string(), *c))
            .unwrap_or(("None".to_string(), 0));

        // Get Sync Status
        // We assume analyze_history is called after sync loop in main, so it's "Complete"
        // But we can check poll_sync again to be sure or get height
        let (scan_status, percent, last_synced_height) = match self.client.poll_sync() {
            PollReport::Ready(Ok(_)) => ("Complete".to_string(), 100.0, 0), // Can we get height?
            PollReport::Ready(Err(e)) => (format!("Failed: {}", e), 0.0, 0),
            PollReport::NotReady => ("InProgress".to_string(), 0.0, 0), // Not actually returned by poll_sync in this form instantly?
            PollReport::NoHandle => ("Finished".to_string(), 100.0, 0),
        };
        
        AnalysisReport {
            total_transactions,
            total_received,
            total_sent,
            total_fees,
            avg_transaction_value: if total_transactions > 0 { total_value as f64 / total_transactions as f64 } else { 0.0 },
            most_active_day,
            most_active_day_count,
            pending_tx_count,
            pending_value,
            pool_distribution: pool_counts,
            type_distribution: type_counts,
            scan_status,
            percent_complete: percent,
            last_synced_height,
        }
    }
    
    pub async fn get_memo_by_txid(&self, txid: &str) -> Option<Vec<String>> {
        let summaries = match self.client.transaction_summaries(true).await {
             Ok(s) => s.0,
             Err(_) => return None,
        };
        for s in summaries {
            if s.txid.to_string() == txid {
                let mut memos = Vec::new();
                for note in s.orchard_notes {
                    if let Some(m) = note.memo { memos.push(m); }
                }
                for note in s.sapling_notes {
                    if let Some(m) = note.memo { memos.push(m); }
                }
                for note in s.outgoing_orchard_notes {
                    if let Some(m) = note.memo { memos.push(m); }
                }
                for note in s.outgoing_sapling_notes {
                    if let Some(m) = note.memo { memos.push(m); }
                }
                return Some(memos);
            }
        }
        None
    }

    pub async fn get_transaction_by_txid(&self, txid: &str) -> Option<TxReport> {
        let summaries = match self.client.transaction_summaries(true).await {
             Ok(s) => s.0,
             Err(_) => return None,
        };
        
        for s in summaries {
            if s.txid.to_string() == txid {
                let mut memos = Vec::new();
                // Collect memos just like in get_transaction_history
                for note in &s.orchard_notes {
                    if let Some(m) = &note.memo { memos.push(m.clone()); }
                }
                for note in &s.sapling_notes {
                    if let Some(m) = &note.memo { memos.push(m.clone()); }
                }
                for note in &s.outgoing_orchard_notes {
                    if let Some(m) = &note.memo { memos.push(m.clone()); }
                }
                for note in &s.outgoing_sapling_notes {
                    if let Some(m) = &note.memo { memos.push(m.clone()); }
                }

                return Some(TxReport {
                    txid: s.txid.to_string(),
                    datetime: if s.datetime > 0 {
                        DateTime::from_timestamp(s.datetime as i64, 0)
                            .map(|dt| dt.to_string())
                            .unwrap_or_else(|| "Unknown".to_string())
                    } else {
                        "Unknown".to_string()
                    },
                    kind: match s.kind {
                        TransactionKind::Received => "Received".to_string(),
                        TransactionKind::Sent(_) => "Sent".to_string(),
                    },
                    value: s.value,
                    fee: s.fee,
                    memos,
                });
            }
        }
        None
    }
}
