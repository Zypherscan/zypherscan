import { useEffect, useState, useRef } from "react";
import { useZcashAPI } from "./useZcashAPI";

export const useShieldingActivity = () => {
  const { getRecentShieldedTransactions, getNetworkStatus, getTransaction } =
    useZcashAPI();
  const [activity, setActivity] = useState<{
    shieldedAmount: number;
    unshieldedAmount: number;
    hasActivity: boolean;
    loading: boolean;
    blockHeight?: number;
  }>({
    shieldedAmount: 0,
    unshieldedAmount: 0,
    hasActivity: false,
    loading: true,
  });

  useEffect(() => {
    const checkActivity = async () => {
      try {
        // Fetch current height and 250 transactions
        const [stats, transactions] = await Promise.all([
          getNetworkStatus(),
          getRecentShieldedTransactions(250),
        ]);

        if (!stats || !stats.height || !transactions || !transactions) {
          setActivity((prev) => ({ ...prev, loading: false }));
          return;
        }

        // Find the latest block height with activity
        if (transactions.length === 0) {
          setActivity((prev) => ({
            ...prev,
            loading: false,
            hasActivity: false,
            blockHeight: stats.height,
          })); // Use current network height if no transactions
          return;
        }

        // Assuming API returns sorted, but let's be safe
        let maxHeight = 0;
        for (const tx of transactions) {
          const h =
            typeof tx.block_height === "number"
              ? tx.block_height
              : (tx as any).blockHeight || (tx as any).height || 0;
          if (h > maxHeight) maxHeight = h;
        }

        // Filter for transactions in this specific latest block
        const latestBlockTxs = transactions.filter((tx) => {
          const h =
            typeof tx.block_height === "number"
              ? tx.block_height
              : (tx as any).blockHeight || (tx as any).height || 0;
          return h === maxHeight;
        });

        // Fetch details for these transactions
        const detailsPromises = latestBlockTxs.map((tx) =>
          getTransaction(tx.txid)
        );
        const details = await Promise.all(detailsPromises);

        let shieldedAmount = 0;
        let unshieldedAmount = 0;

        for (const tx of details) {
          if (!tx) continue;

          let sVal = 0;
          let uVal = 0;

          // Robust sum of Sapling and Orchard activity

          // 1. Sapling Activity
          // Prefer explicit valueBalanceSapling if available (standard in many indices)
          const saplingBalanceRaw =
            tx.valueBalanceSapling !== undefined
              ? Number(tx.valueBalanceSapling)
              : tx.value_balance_sapling !== undefined
              ? Number(tx.value_balance_sapling)
              : null;

          const saplingBalance =
            saplingBalanceRaw !== null ? saplingBalanceRaw / 100000000 : null;

          if (saplingBalance !== null) {
            if (saplingBalance < 0) sVal += Math.abs(saplingBalance);
            else uVal += saplingBalance;
          } else {
            // Fallback to legacy vShielded fields
            // Assuming these are also in Zatoshis if valueBalance is
            const saplingInRaw = Number(tx.vshielded_output || 0);
            const saplingOutRaw = Number(tx.vshielded_spend || 0);

            // Heuristic: If values are large (> 1000), assume Zatoshis and divide
            // Otherwise assume ZEC. This handles inconsistent APIs.
            // 1000 ZEC is a reasonable threshold (block reward is small).
            const saplingIn =
              saplingInRaw > 1000 ? saplingInRaw / 100000000 : saplingInRaw;
            const saplingOut =
              saplingOutRaw > 1000 ? saplingOutRaw / 100000000 : saplingOutRaw;

            if (saplingIn > 0) sVal += saplingIn;
            if (saplingOut > 0) uVal += saplingOut;
          }

          // 2. Orchard Activity
          const orchardBalanceRaw =
            tx.valueBalanceOrchard !== undefined
              ? Number(tx.valueBalanceOrchard)
              : tx.value_balance_orchard !== undefined
              ? Number(tx.value_balance_orchard)
              : null;

          const orchardBalance =
            orchardBalanceRaw !== null ? orchardBalanceRaw / 100000000 : null;

          if (orchardBalance !== null) {
            if (orchardBalance < 0) sVal += Math.abs(orchardBalance);
            else uVal += orchardBalance;
          } else if (tx.active_pool === "orchard" || tx.hasOrchard) {
            // Fallback if specific orchard field missing but generic value_balance exists
          }

          // 3. Fallback for generic "value_balance" if specific fields are missing entirely or result in 0 activity
          if (
            sVal === 0 &&
            uVal === 0 &&
            (tx.value_balance !== undefined || tx.valueBalance !== undefined)
          ) {
            const vbRaw = Number(
              tx.value_balance !== undefined
                ? tx.value_balance
                : tx.valueBalance
            );
            const vb = vbRaw / 100000000;
            if (vb < 0) sVal += Math.abs(vb);
            else uVal += vb;
          }

          shieldedAmount += sVal;
          unshieldedAmount += uVal;
        }

        setActivity({
          shieldedAmount,
          unshieldedAmount,
          hasActivity: true, // If we found a block, we have activity
          loading: false,
          blockHeight: maxHeight,
        });
      } catch (error) {
        console.error("Failed to check shielding activity:", error);
        setActivity((prev) => ({ ...prev, loading: false }));
      }
    };

    const interval = setInterval(checkActivity, 60000);
    checkActivity();

    return () => clearInterval(interval);
  }, [getRecentShieldedTransactions, getNetworkStatus, getTransaction]);

  return activity;
};
