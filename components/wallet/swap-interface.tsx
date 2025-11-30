"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowDown, Settings, Loader2 } from "lucide-react";
import { SWAP_TOKENS, USDT_TOKEN } from "@/constants/tokens";
import { executeSwap, getMockQuote, getCurrentMockPrice, USE_MOCK_SWAP } from "@/lib/swap";
import Image from "next/image";
import { formatUnits, parseUnits } from "viem";
import { useToast } from "@/hooks/use-toast";

export function SwapInterface({ balance }: { balance: string | number }) {
  const [fromToken, setFromToken] = useState<(typeof SWAP_TOKENS)[number]>(SWAP_TOKENS[0]);
  const [amount, setAmount] = useState("");
  const [isSwapping, setIsSwapping] = useState(false);
  const [lastSwapResult, setLastSwapResult] = useState<string | null>(null);
  const [currentRate, setCurrentRate] = useState<number>(0);
  const { toast } = useToast();

  // Update rate periodically for realistic price display (mock mode only)
  useEffect(() => {
    if (!USE_MOCK_SWAP) return;
    
    const updateRate = () => {
      const rate = getCurrentMockPrice(fromToken.symbol);
      setCurrentRate(rate);
    };
    
    updateRate();
    const interval = setInterval(updateRate, 10000); // Update every 10 seconds (synced with price update)
    
    return () => clearInterval(interval);
  }, [fromToken.symbol]);

  // Calculate estimated output based on current rate (mock mode)
  const estimatedOutput = useMemo(() => {
    if (!USE_MOCK_SWAP || !amount || parseFloat(amount) <= 0) return null;
    
    try {
      const amountBigInt = parseUnits(amount, fromToken.decimals);
      const { outputAmount } = getMockQuote(fromToken.address, amountBigInt);
      return formatUnits(outputAmount, USDT_TOKEN.decimals);
    } catch {
      return null;
    }
  }, [amount, fromToken, currentRate]);

  const handleSwap = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setIsSwapping(true);
    setLastSwapResult(null);
    
    try {
      const formattedAmount = parseUnits(amount, fromToken.decimals);
      const result = await executeSwap(
        fromToken.address,
        USDT_TOKEN.address,
        formattedAmount
      );
      
      const outputFormatted = formatUnits(result.outputAmount, USDT_TOKEN.decimals);
      setLastSwapResult(outputFormatted);
      
      toast.success(
        `Swapped ${amount} ${fromToken.symbol} to ${parseFloat(outputFormatted).toFixed(4)} USDT!`,
        {
          description: (
            <a 
              href={`https://arbiscan.io/tx/${result.hash}`} 
              target="_blank" 
              rel="noreferrer" 
              className="underline"
            >
              View on Arbiscan
            </a>
          )
        }
      );
      setAmount("");
    } catch (error) {
      toast.error("Swap failed. Please try again.");
      console.error(error);
    } finally {
      setIsSwapping(false);
    }
  };

  // Determine what to show in output field
  const outputDisplay = useMemo(() => {
    if (lastSwapResult) return parseFloat(lastSwapResult).toFixed(4);
    if (USE_MOCK_SWAP && estimatedOutput) return `~${parseFloat(estimatedOutput).toFixed(4)}`;
    return "—";
  }, [lastSwapResult, estimatedOutput]);

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
              Balance: --
            </span>
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                type="number"
                placeholder="0.0"
                className="bg-transparent border-none text-2xl h-auto p-0 focus-visible:ring-0 focus-visible:border-none placeholder:text-neutral-700"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setLastSwapResult(null); // Clear last result when typing
                }}
                disabled={isSwapping}
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
                  setLastSwapResult(null);
                }
              }}
              disabled={isSwapping}
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
            disabled={isSwapping}
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
              Balance: {typeof balance === 'number' ? balance.toFixed(2) : balance}
            </span>
          </div>
          <div className="flex gap-4">
            <div className="flex-1 flex items-center">
              <div className={`text-2xl font-mono py-1 ${lastSwapResult ? 'text-high-viz-yellow' : 'text-neutral-400'}`}>
                {outputDisplay}
              </div>
            </div>
            <div className="w-[140px] h-10 flex items-center px-3 gap-2 border border-neutral-700 bg-neutral-900 text-sm opacity-50 cursor-not-allowed">
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

        {/* Rate Info */}
        {USE_MOCK_SWAP && currentRate > 0 && (
          <div className="flex justify-between text-xs text-muted-foreground px-1 font-mono">
            <span>Rate</span>
            <span className="tabular-nums">
              1 {fromToken.symbol} ≈ ${currentRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        )}

        <Button
          variant="primary"
          size="lg"
          className="w-full mt-4"
          onClick={handleSwap}
          disabled={!amount || parseFloat(amount) <= 0 || isSwapping}
        >
          {isSwapping ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              SWAPPING...
            </span>
          ) : "SWAP TO USDT"}
        </Button>
      </div>
    </div>
  );
}
