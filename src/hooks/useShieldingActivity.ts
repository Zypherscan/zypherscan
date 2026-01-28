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
        // Fetch current height and recent shielded transactions
        const [stats, transactions] = await Promise.all([
          getNetworkStatus(),
          getRecentShieldedTransactions(100),
        ]);

        if (!stats || !stats.height) {
          setActivity((prev) => ({ ...prev, loading: false }));
          return;
        }

        if (!transactions || transactions.length === 0) {
          setActivity((prev) => ({
            ...prev,
            loading: false,
            hasActivity: false,
            blockHeight: stats.height,
          }));
          return;
        }

        // Find the latest block height from transactions
        let maxHeight = 0;
        for (const tx of transactions) {
          const h =
            typeof tx.block_height === "number"
              ? tx.block_height
              : (tx as any).blockHeight || (tx as any).height || 0;
          if (h > maxHeight) maxHeight = h;
        }

        // Filter for transactions in the LATEST block only
        // This matches what the banner displays ("Network Activity #XXXXX")
        const latestBlockTxs = transactions.filter((tx) => {
          const h =
            typeof tx.block_height === "number"
              ? tx.block_height
              : (tx as any).blockHeight || (tx as any).height || 0;
          return h === maxHeight;
        });

        // The /tx/shielded endpoint doesn't include ZEC values, only action counts
        // We MUST fetch detailed transaction data to get actual valueBalance
        let shieldedAmount = 0;
        let unshieldedAmount = 0;

        if (latestBlockTxs.length > 0) {
          // Fetch details for transactions in the latest block
          const detailsPromises = latestBlockTxs
            .slice(0, 20)
            .map((tx) => getTransaction(tx.txid));
          const details = await Promise.all(detailsPromises);

          for (const tx of details) {
            if (!tx) continue;

            // Extract value balances (in zatoshis, need to convert to ZEC)
            // Positive = funds leaving shielded pool (unshielding)
            // Negative = funds entering shielded pool (shielding)

            // Sapling pool
            const saplingRaw = Number(
              tx.valueBalanceSapling ??
                tx.value_balance_sapling ??
                tx.saplingValueBalance ??
                0,
            );
            const saplingZec = saplingRaw / 100000000;

            if (saplingZec < 0) {
              shieldedAmount += Math.abs(saplingZec);
            } else if (saplingZec > 0) {
              unshieldedAmount += saplingZec;
            }

            // Orchard pool
            const orchardRaw = Number(
              tx.valueBalanceOrchard ??
                tx.value_balance_orchard ??
                tx.orchardValueBalance ??
                0,
            );
            const orchardZec = orchardRaw / 100000000;

            if (orchardZec < 0) {
              shieldedAmount += Math.abs(orchardZec);
            } else if (orchardZec > 0) {
              unshieldedAmount += orchardZec;
            }

            // Generic fallback if specific pools not available
            if (saplingRaw === 0 && orchardRaw === 0) {
              const vbRaw = Number(tx.value_balance ?? tx.valueBalance ?? 0);
              const vbZec = vbRaw / 100000000;
              if (vbZec < 0) {
                shieldedAmount += Math.abs(vbZec);
              } else if (vbZec > 0) {
                unshieldedAmount += vbZec;
              }
            }
          }
        }

        setActivity({
          shieldedAmount,
          unshieldedAmount,
          hasActivity: latestBlockTxs.length > 0,
          loading: false,
          blockHeight: maxHeight || stats.height,
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
