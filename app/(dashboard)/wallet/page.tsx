"use client";

import { SwapInterface } from "@/components/wallet/swap-interface";
import { Button } from "@/components/ui/button";
import { Copy, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { useWallet } from "@/hooks/use-wallet";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { getBalanceUSDT, getUsdtTransfers } from "@/lib/wdk";
import { TokenTransfer } from "@/lib/types";

export default function WalletPage() {
  const { address } = useWallet();
  const { toast } = useToast();
  const [Balance, setBalance] = useState<string | number>("loading...");
  const [Transferms, setTransferms] = useState<TokenTransfer[]>([]);
  
  useEffect(() => {
    if (!address) return;

    const timer = setInterval(async () => {
      try {
        const balance = await getBalanceUSDT(address);
        if (!balance) {
          return;
        }
        setBalance(balance);
      } catch (error) {
        toast.error((error as Error).message);
      }
    }, 4000);

    return () => clearInterval(timer);
  }, [address]);

  useEffect(() => {
    if (!address) return;

    const timer = setInterval(async () => {
      try {
        const transfers = await getUsdtTransfers(address);
        if (!transfers) {
          return;
        }
        setTransferms(transfers);
      } catch (error) {
        toast.error((error as Error).message);
      }
    }, 4000);

    return () => clearInterval(timer);
  }, [address]);

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Top Section: Balance */}
      <div className="border-b border-neutral-800 bg-neutral-950 p-8 md:p-12">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <h1 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
            Total Balance
          </h1>
          <div className="text-6xl md:text-8xl font-bold font-display text-high-viz-yellow tracking-tighter">
            ${Balance}
          </div>
          <div className="flex items-center justify-center gap-2 text-muted-foreground font-mono text-sm">
            <span>{address}</span>
            <Copy
              className="w-3 h-3 cursor-pointer hover:text-white"
              onClick={() => navigator.clipboard.writeText(address!)}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 grow border-b border-neutral-800">
        {/* Left: Swap Interface */}
        <div className="p-8 lg:border-r border-neutral-800 flex items-start justify-center">
          <div className="w-full max-w-md">
            <SwapInterface balance={Balance} />
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
              <div className="flex justify-between items-center p-4 border border-neutral-800 bg-neutral-900/50">
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
                  <div className="text-xs text-muted-foreground">
                    ${Balance}
                  </div>
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
              {Transferms.map((tx, index) => {
                const isIncoming =
                  tx.to.toLowerCase() === address!.toLowerCase(); // your wallet
                const timeAgo = new Date(tx.timestamp * 1000).toLocaleString();

                return (
                  <div
                    key={index}
                    className="flex justify-between items-center py-4 border-b border-neutral-800 last:border-0"
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
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
