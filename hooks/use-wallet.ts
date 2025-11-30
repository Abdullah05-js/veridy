"use client";

import { useCallback } from "react";
import { useWalletStore } from "@/lib/store";
import { toast } from "@/components/ui/toast";
import { useRouter } from "next/navigation";

export function useWallet() {
  const { wallet, setWallet, disConnect: disconnect } = useWalletStore();
  console.log(wallet);
  const router = useRouter()
 
  const disConnect = useCallback(async () => {
    try {
      if (!wallet) {
        toast.info("Wallet already disConnected");
        return;
      }
      disconnect()
      router.replace("/onboarding")

    } catch (error) {
      console.error(error);
      toast.error("Failed to connect wallet");
    }
  }, [wallet, setWallet]);




  return {
    isConnected: !!wallet,
    address: wallet?.address || null,
    disConnect
  };
}

