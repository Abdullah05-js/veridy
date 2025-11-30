"use client";

import { useCallback, useEffect } from "react";
import { useWalletStore } from "@/lib/store";
import { toast } from "@/components/ui/toast";
import { useRouter } from "next/navigation";
import { wdkService } from "@/lib/wdk";
import { generateECDHKeyPair } from "@/lib/crypto";

export function useWallet() {
  const { wallet, setWallet, setECDHKeyPair, disConnect: disconnect } = useWalletStore();
  const router = useRouter();

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
      disconnect();
      router.replace("/onboarding");
    } catch (error) {
      console.error(error);
      toast.error("Failed to disconnect wallet");
    }
  }, [wallet, disconnect, router]);

  // Initialize ECDH keypair if not exists
  const ensureECDHKeyPair = useCallback(async () => {
    if (!wallet) {
      throw new Error("No wallet connected");
    }

    if (wallet.ecdhKeyPair) {
      return wallet.ecdhKeyPair;
    }

    // Generate new ECDH keypair
    const keyPair = await generateECDHKeyPair();
    setECDHKeyPair(keyPair);
    return keyPair;
  }, [wallet, setECDHKeyPair]);

  return {
    isConnected: !!wallet,
    address: wallet?.address || null,
    seed: wallet?.seed || null,
    ecdhKeyPair: wallet?.ecdhKeyPair || null,
    ensureECDHKeyPair,
    disConnect,
  };
}
