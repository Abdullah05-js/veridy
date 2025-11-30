"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowDown, Settings } from "lucide-react";
import { SWAP_TOKENS, USDT_TOKEN } from "@/constants/tokens";
import { getSwapQuote, executeSwap } from "@/lib/swap";
import { toast } from "@/components/ui/toast";
import Image from "next/image";
import { formatUnits, parseUnits } from "viem";
import { useToast } from "@/hooks/use-toast";

export function SwapInterface({ balance }: { balance: string | number }) {
  const [fromToken, setFromToken] = useState<any>(SWAP_TOKENS[0]);
  const [amount, setAmount] = useState("");
  const [quote, setQuote] = useState<string | null>(null);
  const [isSwapping, setIsSwapping] = useState(false);
  const { toast } = useToast();
  useEffect(() => {
    if (amount && parseFloat(amount) > 0) {
      const timer = setTimeout(async () => {
        const amountFormated = parseUnits(amount, fromToken.decimals);
        const q = await getSwapQuote(
          fromToken.address,
          USDT_TOKEN.address,
          amountFormated
        );
        setQuote(formatUnits(q.outputAmount, USDT_TOKEN.decimals));
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setQuote(null);
    }
  }, [amount, fromToken]);

  const handleSwap = async () => {
    if (!amount || !quote) return;

    setIsSwapping(true);
    try {
      const formatedIN = parseUnits(amount, fromToken.decimals as number);
      const hash = await executeSwap(
        fromToken.address,
        USDT_TOKEN.address,
        formatedIN
      );
      toast.success(
        `Swapped ${amount} ${fromToken} to ${quote} USDT successfully! 
        See on Arbiscan: https://arbiscan.io/tx/${hash}`
      );
      setAmount("");
      setQuote(null);
    } catch (error) {
      toast.error("Swap failed. Please try again.");
      console.error(error);
    } finally {
      setIsSwapping(false);
    }
  };

  return (
    <div className="border border-neutral-800 bg-neutral-950 p-6 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold uppercase tracking-tight font-display">
          Swap to USDT
        </h2>
        <Button variant="ghost" size="icon" className="rounded-none h-8 w-8">
          <Settings className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-4">
        {/* From Token */}
        <div className="bg-neutral-900/50 p-4 border border-neutral-800">
          <div className="flex justify-between mb-2">
            <label className="text-xs font-medium uppercase text-muted-foreground">
              From
            </label>
            <span className="text-xs font-mono text-muted-foreground">
              Balance: 12.45
            </span>
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                type="number"
                placeholder="0.0"
                className="bg-transparent border-none text-2xl h-auto p-0 focus-visible:ring-0 focus-visible:border-none placeholder:text-neutral-700"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <Select
              value={fromToken.symbol}
              onValueChange={(value) => {
                const selectedToken = SWAP_TOKENS.find(
                  (t) => t.symbol === value
                );
                if (selectedToken) {
                  setFromToken(selectedToken);
                }
              }}
            >
              <SelectTrigger className="w-[140px] bg-neutral-900 border-neutral-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SWAP_TOKENS.map((token) => (
                  <SelectItem key={token.symbol} value={token.symbol}>
                    <span className="flex items-center gap-2">
                      <Image
                        src={token.icon}
                        width={24}
                        height={24}
                        alt={token.symbol}
                      />{" "}
                      {token.symbol}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Swap Arrow */}
        <div className="flex justify-center -my-2 relative z-10">
          <Button
            size="icon"
            variant="secondary"
            className="rounded-full h-8 w-8 border-neutral-800 bg-neutral-950"
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
        </div>

        {/* To Token (Locked to USDT) */}
        <div className="bg-neutral-900/50 p-4 border border-neutral-800">
          <div className="flex justify-between mb-2">
            <label className="text-xs font-medium uppercase text-muted-foreground">
              To
            </label>
            <span className="text-xs font-mono text-muted-foreground">
              Balance: {balance}
            </span>
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="text-2xl font-mono py-1 text-neutral-400">
                {quote ? parseFloat(quote).toFixed(4) : "0.0"}
              </div>
            </div>
            <div className="w-[140px] h-10 flex items-center px-3 gap-2 border border-neutral-700 bg-neutral-900 text-sm">
              <Image
                src={USDT_TOKEN.icon}
                width={24}
                height={24}
                alt={USDT_TOKEN.symbol}
              />
              {USDT_TOKEN.symbol}
            </div>
          </div>
        </div>

        {/* Price Info */}
        {quote && (
          <div className="flex justify-between text-xs text-muted-foreground px-1 font-mono">
            <span>Rate</span>
            <span>
              1 {fromToken} ≈{" "}
              {(parseFloat(quote) / parseFloat(amount)).toFixed(2)} USDT
            </span>
          </div>
        )}

        <Button
          variant="primary"
          size="lg"
          className="w-full mt-4"
          onClick={handleSwap}
          disabled={!amount || isSwapping}
        >
          {isSwapping ? "SWAPPING..." : "SWAP TO USDT"}
        </Button>
      </div>
    </div>
  );
}
