"use client";

import { useCallback, useEffect } from "react";
import { useWalletStore } from "@/lib/store";
import { toast } from "@/components/ui/toast";
import { useRouter } from "next/navigation";
import { wdkService } from "@/lib/wdk";

export function useWallet() {
  const { wallet, setWallet, disConnect: disconnect } = useWalletStore();
  const router = useRouter()

  // Initialize WDK service if wallet exists in store
  useEffect(() => {
    if (wallet?.seed && !wdkService.wdk) {
      try {
        wdkService.initialize(wallet.seed);
      } catch (error) {
        console.error("Failed to re-initialize wallet:", error);
        // Optionally clear invalid wallet from store
        // disconnect(); 
      }
    }
  }, [wallet]);
 
  const disConnect = useCallback(async () => {
    try {
      if (!wallet) {
        toast.info("Wallet already disconnected");
        return;
      }
      disconnect()
      router.replace("/onboarding")

    } catch (error) {
      console.error(error);
      toast.error("Failed to disconnect wallet");
    }
  }, [wallet, disconnect, router]);

  return {
    isConnected: !!wallet,
    address: wallet?.address || null,
    disConnect
  };
}

