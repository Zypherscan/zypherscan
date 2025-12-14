use zypherscan_decrypt::{ZypherScanner, ScannerSyncStatus};
use std::env;
use std::time::Duration;
use tokio::time::sleep;

#[tokio::main]
async fn main() {
    let args: Vec<String> = env::args().collect();
    if args.len() < 3 {
        println!("Usage: zypherscan-decrypt <UVK> <BIRTHDAY> [ACTION]");
        println!("Actions:");
        println!("  all      (default) Show all reports");
        println!("  summary  Show balances and analysis");
        println!("  history  Show transaction history");
        println!("  memo <TXID> Show memos for specific transaction");
        return;
    }

    let uvk = &args[1];
    let birthday = args[2].parse::<u64>().unwrap_or(0);
    let action = args.get(3).map(|s| s.as_str()).unwrap_or("all");

    println!("Initializing Scanner...");
    let mut scanner = match ZypherScanner::new_from_uvk(uvk, birthday) {
        Ok(s) => s,
        Err(e) => {
            println!("Error initializing: {}", e);
            return;
        }
    };

    println!("Starting Sync (Birthday: {})...", birthday);
    if let Err(e) = scanner.start_sync().await {
        println!("Failed to start sync: {}", e);
        return;
    }

    loop {
        match scanner.check_sync().await {
            ScannerSyncStatus::Complete => {
                println!("\rSync Complete!              ");
                break;
            },
            ScannerSyncStatus::Failed(e) => {
                println!("\nSync Failed: {}", e);
                break;
            },
            ScannerSyncStatus::InProgress(blocks, pct, txs) => {
                print!("\rSyncing: {:.2}% ({} blocks) - {} txs found", pct, blocks, txs);
                use std::io::Write;
                std::io::stdout().flush().unwrap();
                sleep(Duration::from_millis(1000)).await;
            },
            ScannerSyncStatus::FinishedOrNotRunning => {
                println!("\nSync finished.");
                break;
            }
        }
    }

    
    if action == "all" || action == "summary" {
        let balances = scanner.get_balances().await;
        println!("{}", serde_json::to_string_pretty(&balances).unwrap());
        
        let analysis = scanner.analyze_history().await;
        println!("{}", serde_json::to_string_pretty(&analysis).unwrap());
    }

    if action == "all" || action == "history" {
        let history = scanner.get_transaction_history().await;
        println!("{}", serde_json::to_string_pretty(&history).unwrap());
    }

    if action == "memo" {
        if let Some(txid) = args.get(4) {
             match scanner.get_memo_by_txid(txid).await {
                 Some(memos) => {
                     if memos.is_empty() {
                         println!("No memos found.");
                     } else {
                         for (i, m) in memos.iter().enumerate() {
                             println!("Memo {}: {}", i + 1, m);
                         }
                     }
                 },
                 None => println!("Transaction not found.")
             }
        } else {
            println!("Error: TXID required for memo action.");
        }
    } else if action == "tx" {
        if let Some(txid) = args.get(4) {
            match scanner.get_transaction_by_txid(txid).await {
                Some(tx_report) => {
                    println!("{}", serde_json::to_string_pretty(&tx_report).unwrap());
                },
                None => println!("Transaction not found.")
            }
        } else {
             println!("Error: TXID required for tx action.");
        }
    } else if action == "all" {
        // Memos are already in history, but we can list specific ones if requested?
        // No, 'all' covers history which includes memos.
    }
}
