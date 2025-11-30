"use client";

import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/use-wallet";
import Link from "next/link";

export function WalletConnect() {
  const { isConnected, address, disConnect } = useWallet();

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 bg-high-viz-yellow rounded-full animate-pulse" />
        <span className="font-mono text-sm text-high-viz-yellow">
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            disConnect();
          }}
          className="text-xs ml-2"
        >
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <Link href="/onboarding">
      <Button variant="primary" size="sm">
        Connect Wallet
      </Button>
    </Link>
  );
}
