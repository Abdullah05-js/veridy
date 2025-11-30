"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { createWallet } from "@/lib/wdk";
import { toast } from "@/components/ui/toast";
import { ArrowLeft, Copy, Check, RefreshCw } from "lucide-react";
import Link from "next/link";

import { useWalletStore } from "@/lib/store";
import { useWallet } from "@/hooks/use-wallet";

export default function CreateWalletPage() {
  const router = useRouter();
  const { setWallet } = useWalletStore();
  const [isLoading, setIsLoading] = useState(false);
  const [seedPhrase, setSeedPhrase] = useState<string[] | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);
  const { isConnected } = useWallet();

  useEffect(() => {
    if (isConnected) {
      router.replace("/");
    }
  }, [isConnected, router]);

  if (isConnected) return null;

  const handleCreate = async () => {
    setIsLoading(true);
    try {
      const newWallet = await createWallet(); // Initialize wallet state
      setSeedPhrase(newWallet.seed.split(" "));
      setWallet(newWallet);
      toast.success("Wallet generated successfully!");
    } catch (error) {
      toast.error("Failed to generate wallet");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (seedPhrase) {
      navigator.clipboard.writeText(seedPhrase.join(" "));
      setIsCopied(true);
      toast.success("Seed phrase copied to clipboard");
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleContinue = () => {
    if (!hasSaved) {
      toast.error("Please confirm you have saved your seed phrase");
      return;
    }
    router.push("/");
  };

  if (seedPhrase) {
    return (
      <div className="border-2 border-neutral-800 bg-neutral-950 p-8 md:p-12 shadow-2xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold uppercase tracking-tighter font-display text-high-viz-yellow">
            Save Your Secret Key
          </h1>
          <p className="text-muted-foreground font-mono text-xs mt-1">
            Write down these 12 words. This is the only way to recover your
            wallet.
          </p>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-6">
          {seedPhrase.map((word, index) => (
            <div
              key={index}
              className="border border-neutral-800 bg-neutral-900 p-2 text-center"
            >
              <span className="text-[10px] text-muted-foreground block mb-1">
                {index + 1}
              </span>
              <span className="font-mono text-sm">{word}</span>
            </div>
          ))}
        </div>

        <div className="flex justify-center mb-8">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleCopy}
            className="gap-2"
          >
            {isCopied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            {isCopied ? "COPIED" : "COPY TO CLIPBOARD"}
          </Button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2 bg-neutral-900/50 p-4 border border-neutral-800">
            <input
              type="checkbox"
              id="saved-confirm"
              className="h-4 w-4 border-neutral-700 bg-neutral-950 rounded-none accent-high-viz-yellow"
              checked={hasSaved}
              onChange={(e) => setHasSaved(e.target.checked)}
            />
            <label
              htmlFor="saved-confirm"
              className="text-xs text-muted-foreground cursor-pointer select-none"
            >
              I have saved my seed phrase in a secure location.
            </label>
          </div>

          <Button
            variant="primary"
            className="w-full py-6"
            onClick={handleContinue}
            disabled={!hasSaved}
          >
            CONTINUE TO DASHBOARD
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="border-2 border-neutral-800 bg-neutral-950 p-8 md:p-12 shadow-2xl text-center">
      <div className="mb-6 text-left">
        <Link
          href="/onboarding"
          className="text-muted-foreground hover:text-white inline-flex items-center gap-2 text-sm uppercase tracking-widest mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <h1 className="text-3xl font-bold uppercase tracking-tighter font-display">
          Create New Wallet
        </h1>
        <p className="text-muted-foreground font-mono text-xs mt-1">
          Generate a new secure wallet for the Veridy marketplace.
        </p>
      </div>

      <div className="py-12 flex flex-col items-center justify-center space-y-8">
        <div className="h-20 w-20 rounded-full border-2 border-neutral-800 flex items-center justify-center bg-neutral-900 relative">
          <div className="absolute inset-0 border-2 border-dashed border-neutral-700 rounded-full animate-spin-slow" />
          <RefreshCw
            className={
              isLoading
                ? "animate-spin text-high-viz-yellow"
                : "text-muted-foreground"
            }
          />
        </div>

        <Button
          variant="primary"
          className="w-full py-6"
          onClick={handleCreate}
          disabled={isLoading}
        >
          {isLoading ? "GENERATING..." : "GENERATE WALLET"}
        </Button>
      </div>
    </div>
  );
}
