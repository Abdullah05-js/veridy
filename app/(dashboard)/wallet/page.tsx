"use client";

import { SwapInterface } from "@/components/wallet/swap-interface";
import { Copy, ArrowUpRight, ArrowDownLeft, Loader2 } from "lucide-react";
import { useWallet } from "@/hooks/use-wallet";
import { useEffect, useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { getBalanceUSDT, getUsdtTransfers, wdkService } from "@/lib/wdk";
import { TokenTransfer } from "@/lib/types";

export default function WalletPage() {
  const { address, isConnected } = useWallet();
  const { toast } = useToast();
  const [balance, setBalance] = useState<string | number | null>(null);
  const [transfers, setTransfers] = useState<TokenTransfer[] | null>(null);

  const fetchStats = useCallback(async (currentAddress: string) => {
    try {
      const [balanceData, transfersData] = await Promise.all([
        getBalanceUSDT(currentAddress),
        getUsdtTransfers(currentAddress),
      ]);

      setBalance(balanceData || "0");
      setTransfers(transfersData || []);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
      // Don't show toast on every poll error to avoid spamming
    }
  }, []);

  // Initial fetch and polling
  useEffect(() => {
    if (!address) return;

    // Immediate fetch
    fetchStats(address);

    const timer = setInterval(() => {
      fetchStats(address);
    }, 4000);

    return () => clearInterval(timer);
  }, [address, fetchStats]);

  if (!address) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
        <div className="text-muted-foreground font-mono text-sm">
          Initializing wallet...
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Top Section: Balance */}
      <div className="border-b border-neutral-800 bg-neutral-950 p-8 md:p-12">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <h1 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
            Total Balance
          </h1>
          <div className="flex justify-center items-center min-h-[6rem] md:min-h-[8rem]">
            {balance === null ? (
              <div className="animate-pulse flex flex-col items-center gap-4 w-full max-w-xs">
                <div className="h-16 md:h-24 bg-neutral-900 rounded w-full"></div>
              </div>
            ) : (
              <div className="text-6xl md:text-8xl font-bold font-display text-high-viz-yellow tracking-tighter">
                ${balance}
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-2 text-muted-foreground font-mono text-sm">
            <span>{address}</span>
            <Copy
              className="w-3 h-3 cursor-pointer hover:text-white transition-colors"
              onClick={() => {
                navigator.clipboard.writeText(address!);
                toast.success("Address copied to clipboard");
              }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 grow border-b border-neutral-800">
        {/* Left: Swap Interface */}
        <div className="p-8 lg:border-r border-neutral-800 flex items-start justify-center">
          <div className="w-full max-w-md">
            <SwapInterface balance={balance === null ? "..." : balance} />
          </div>
        </div>

        {/* Right: Assets & History */}
        <div className="flex flex-col">
          {/* Assets */}
          <div className="border-b border-neutral-800 p-8">
            <h3 className="text-xl font-bold uppercase mb-6 font-display">
              Your Assets
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 border border-neutral-800 bg-neutral-900/50 hover:bg-neutral-900 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-xl">₮</span>
                  <div>
                    <div className="font-bold">USDT</div>
                    <div className="text-xs text-muted-foreground">
                      Tether USD
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  {balance === null ? (
                    <div className="h-4 w-16 bg-neutral-800 animate-pulse rounded"></div>
                  ) : (
                    <div className="text-xs text-muted-foreground">
                      ${balance}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="p-8 grow bg-neutral-950">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold uppercase font-display">
                Recent Activity
              </h3>
            </div>

            <div className="space-y-0">
              {transfers === null ? (
                // Loading Skeletons
                Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center py-4 border-b border-neutral-800 last:border-0 animate-pulse"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-neutral-900 rounded-none"></div>
                      <div className="space-y-2">
                        <div className="h-3 w-20 bg-neutral-900 rounded"></div>
                        <div className="h-2 w-32 bg-neutral-900 rounded"></div>
                      </div>
                    </div>
                    <div className="h-3 w-16 bg-neutral-900 rounded"></div>
                  </div>
                ))
              ) : transfers.length === 0 ? (
                <div className="text-muted-foreground text-sm py-8 text-center italic">
                  No recent transactions
                </div>
              ) : (
                transfers.map((tx, index) => {
                  const isIncoming =
                    tx.to.toLowerCase() === address!.toLowerCase(); // your wallet
                  const timeAgo = new Date(
                    tx.timestamp * 1000
                  ).toLocaleString();

                  return (
                    <div
                      key={index}
                      className="flex justify-between items-center py-4 border-b border-neutral-800 last:border-0 hover:bg-neutral-900/30 transition-colors px-2 -mx-2"
                    >
                      {/* Left section */}
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-neutral-900 border border-neutral-800">
                          {isIncoming ? (
                            <ArrowDownLeft className="w-4 h-4 text-green-500" />
                          ) : (
                            <ArrowUpRight className="w-4 h-4 text-red-500" />
                          )}
                        </div>

                        <div>
                          <div className="font-bold text-sm uppercase">
                            {isIncoming ? "Received" : "Sent"}
                          </div>

                          <div className="text-xs text-muted-foreground font-mono">
                            {tx.from.slice(0, 6)}...{tx.from.slice(-4)} •{" "}
                            {timeAgo}
                          </div>
                        </div>
                      </div>

                      {/* Amount */}
                      <div
                        className={`font-mono text-sm ${
                          isIncoming ? "text-green-500" : "text-red-500"
                        }`}
                      >
                        {isIncoming ? "+" : "-"} {tx.amount} USDT
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
