"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { transferUSDT } from "@/lib/wdk";
import { USDT_TOKEN } from "@/constants/tokens";
import Image from "next/image";
import { parseUnits, isAddress } from "viem";
import { useToast } from "@/hooks/use-toast";

interface TransferInterfaceProps {
  balance: string | number;
  onTransferComplete?: () => void;
}

export function TransferInterface({
  balance,
  onTransferComplete,
}: TransferInterfaceProps) {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);
  const { toast } = useToast();

  const isValidAddress = recipient ? isAddress(recipient) : false;
  const hasValidAmount = amount && parseFloat(amount) > 0;
  const hasInsufficientBalance =
    hasValidAmount && typeof balance === "number"
      ? parseFloat(amount) > balance
      : typeof balance === "string" && balance !== "..."
      ? parseFloat(amount) > parseFloat(balance)
      : false;

  const handleTransfer = async () => {
    if (!recipient || !isValidAddress) {
      toast.error("Please enter a valid Ethereum address");
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (hasInsufficientBalance) {
      toast.error("Insufficient balance");
      return;
    }

    setIsTransferring(true);
    setLastTxHash(null);

    try {
      const formattedAmount = parseUnits(amount, USDT_TOKEN.decimals);
      const result = await transferUSDT(recipient, formattedAmount);

      setLastTxHash(result.hash);
      toast.success(
        <div>
          Sent {amount} USDT successfully!
          <a
            href={`https://arbiscan.io/tx/${result.hash}`}
            target="_blank"
            rel="noreferrer"
            className="underline ml-2"
          >
            View on Arbiscan
          </a>
        </div>
      );

      // Clear form
      setRecipient("");
      setAmount("");

      // Trigger refresh
      onTransferComplete?.();
    } catch (error) {
      toast.error("Transfer failed. Please try again.");
      console.error(error);
    } finally {
      setIsTransferring(false);
    }
  };

  const handleMaxAmount = () => {
    if (typeof balance === "number") {
      setAmount(balance.toString());
    } else if (typeof balance === "string" && balance !== "...") {
      setAmount(balance);
    }
  };

  return (
    <div className="border border-neutral-800 bg-neutral-950 p-6 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold uppercase tracking-tight font-display">
          Send USDT
        </h2>
        <div className="p-2 bg-neutral-900 border border-neutral-800">
          <Send className="h-5 w-5 text-high-viz-yellow" />
        </div>
      </div>

      <div className="space-y-4">
        {/* Recipient Address */}
        <div className="bg-neutral-900/50 p-4 border border-neutral-800">
          <div className="flex justify-between mb-2">
            <label className="text-xs font-medium uppercase text-muted-foreground">
              Recipient Address
            </label>
            {recipient && (
              <span className="text-xs font-mono">
                {isValidAddress ? (
                  <span className="text-green-500 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Valid
                  </span>
                ) : (
                  <span className="text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Invalid
                  </span>
                )}
              </span>
            )}
          </div>
          <Input
            type="text"
            placeholder="0x..."
            className="bg-transparent border-none text-base h-auto p-0 focus-visible:ring-0 focus-visible:border-none placeholder:text-neutral-700 font-mono"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value.trim())}
            disabled={isTransferring}
          />
        </div>

        {/* Amount */}
        <div className="bg-neutral-900/50 p-4 border border-neutral-800">
          <div className="flex justify-between mb-2">
            <label className="text-xs font-medium uppercase text-muted-foreground">
              Amount
            </label>
            <button
              onClick={handleMaxAmount}
              className="text-xs font-mono text-muted-foreground hover:text-high-viz-yellow transition-colors"
              disabled={isTransferring}
            >
              Max: {typeof balance === "number" ? balance.toFixed(2) : balance}{" "}
              USDT
            </button>
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                type="number"
                placeholder="0.00"
                className="bg-transparent border-none text-2xl h-auto p-0 focus-visible:ring-0 focus-visible:border-none placeholder:text-neutral-700"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={isTransferring}
              />
            </div>
            <div className="w-[120px] h-10 flex items-center px-3 gap-2 border border-neutral-700 bg-neutral-900 text-sm">
              <Image
                src={USDT_TOKEN.icon}
                width={24}
                height={24}
                alt={USDT_TOKEN.symbol}
              />
              {USDT_TOKEN.symbol}
            </div>
          </div>
          {hasInsufficientBalance && (
            <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Insufficient balance
            </p>
          )}
        </div>

        {/* Transfer Summary */}
        {hasValidAmount && isValidAddress && (
          <div className="flex justify-between text-xs text-muted-foreground px-1 font-mono border-t border-neutral-800 pt-4">
            <span>Sending</span>
            <span className="text-white">
              {amount} USDT → {recipient.slice(0, 6)}...{recipient.slice(-4)}
            </span>
          </div>
        )}

        {/* Success Message */}
        {lastTxHash && (
          <div className="bg-green-500/10 border border-green-500/30 p-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
            <div className="text-sm">
              <span className="text-green-500 font-medium">
                Transfer successful!
              </span>
              <a
                href={`https://arbiscan.io/tx/${lastTxHash}`}
                target="_blank"
                rel="noreferrer"
                className="ml-2 text-muted-foreground hover:text-white underline font-mono text-xs"
              >
                View tx
              </a>
            </div>
          </div>
        )}

        <Button
          variant="primary"
          size="lg"
          className="w-full mt-4"
          onClick={handleTransfer}
          disabled={
            !isValidAddress ||
            !hasValidAmount ||
            hasInsufficientBalance ||
            isTransferring
          }
        >
          {isTransferring ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              SENDING...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              SEND USDT
            </span>
          )}
        </Button>

        {/* Network info */}
        <div className="text-center text-xs text-muted-foreground pt-2">
          Transfers are on Arbitrum One network
        </div>
      </div>
    </div>
  );
}
