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
          if (
            tx.valueBalanceSapling !== undefined &&
            tx.valueBalanceSapling !== null
          ) {
            const vbS = Number(tx.valueBalanceSapling);
            if (vbS < 0) sVal += Math.abs(vbS);
            else uVal += vbS;
          } else {
            // Fallback to legacy vShielded fields
            // (Some APIs populate these for Sapling legacy support)
            const saplingIn = Number(tx.vshielded_output || 0);
            const saplingOut = Number(tx.vshielded_spend || 0);
            if (saplingIn > 0) sVal += saplingIn;
            if (saplingOut > 0) uVal += saplingOut;
          }

          // 2. Orchard Activity
          if (
            tx.valueBalanceOrchard !== undefined &&
            tx.valueBalanceOrchard !== null
          ) {
            const vbO = Number(tx.valueBalanceOrchard);
            if (vbO < 0) sVal += Math.abs(vbO);
            else uVal += vbO;
          } else if (tx.active_pool === "orchard" || tx.hasOrchard) {
            // Fallback if specific orchard field missing but generic value_balance exists and implies orchard
            // Risk of double counting if value_balance overlaps with sapling, but usually safe if hasOrchard is true
            // and we handled sapling above.
            // However, strictly speaking, if valueBalanceOrchard is missing,
            // we might look at generic value_balance ONLY if sapling was 0?
            // Let's stick to explicit fields to be safe.
            // User's example showed valueBalanceOrchard is present.
          }

          // 3. Fallback for generic "value_balance" if specific fields are missing entirely
          // This catches cases where API only gives a net "valueBalance"
          if (
            sVal === 0 &&
            uVal === 0 &&
            tx.value_balance !== undefined &&
            tx.valueBalanceSapling === undefined &&
            tx.valueBalanceOrchard === undefined
          ) {
            const vb = Number(tx.value_balance);
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
