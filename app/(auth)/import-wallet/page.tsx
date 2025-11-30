"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { importWallet } from "@/lib/wdk";
import { toast } from "@/components/ui/toast";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { useWalletStore } from "@/lib/store";
import { useWallet } from "@/hooks/use-wallet";

export default function ImportWalletPage() {
  const router = useRouter();
  const { setWallet } = useWalletStore();
  const [seedPhrase, setSeedPhrase] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { isConnected } = useWallet();

   useEffect(() => {
    if (isConnected) {
      router.replace("/");
    }
  }, [isConnected, router]);

  if (isConnected) return null;


  const handleImport = async () => {
    if (!seedPhrase) {
      toast.error("Please enter your seed phrase");
      return;
    }

    setIsLoading(true);
    try {
      const wallet = await importWallet(seedPhrase);
      setWallet(wallet);
      toast.success("Wallet imported successfully!");
      router.push("/");
    } catch (error) {
      toast.error("Failed to import wallet");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="border-2 border-neutral-800 bg-neutral-950 p-8 md:p-12 shadow-2xl">
      <div className="mb-6">
        <Link
          href="/onboarding"
          className="text-muted-foreground hover:text-white inline-flex items-center gap-2 text-sm uppercase tracking-widest mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <h1 className="text-3xl font-bold uppercase tracking-tighter font-display">
          Import Wallet
        </h1>
        <p className="text-muted-foreground font-mono text-xs mt-1">
          Enter your 12/24 word seed phrase.
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Seed Phrase
          </label>
          <textarea
            className="w-full h-40 p-4 rounded-none border border-neutral-800 bg-neutral-900 text-white font-mono text-sm focus:outline-none focus:border-high-viz-yellow resize-none"
            placeholder="word1 word2 word3 ..."
            value={seedPhrase}
            onChange={(e) => setSeedPhrase(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <Button
          variant="primary"
          className="w-full py-6"
          onClick={handleImport}
          disabled={isLoading}
        >
          {isLoading ? "IMPORTING..." : "IMPORT WALLET"}
        </Button>
      </div>
    </div>
  );
}
