"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Shield } from "lucide-react";
import { useWallet } from "@/hooks/use-wallet";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function OnboardingPage() {
  const { isConnected } = useWallet();
  const router = useRouter();

  useEffect(() => {
    if (isConnected) {
      router.replace("/");
    }
  }, [isConnected, router]);

  if (isConnected) return null;

  return (
    <div className="border-2 border-neutral-800 bg-neutral-950 p-8 md:p-12 text-center shadow-2xl">
      <div className="mb-8 flex justify-center">
        <div className="h-16 w-16 bg-high-viz-yellow flex items-center justify-center rounded-none border border-pure-black shadow-[4px_4px_0px_#fff]">
          <Shield className="h-8 w-8 text-black" />
        </div>
      </div>

      <h1 className="text-4xl font-bold uppercase tracking-tighter font-display mb-2">
        Secure Your Assets
      </h1>
      <p className="text-muted-foreground mb-10 font-mono text-sm">
        Connect to the decentralized file marketplace.
      </p>

      <div className="space-y-4">
        <Button
          variant="primary"
          className="w-full py-6 text-lg"
          asChild
          onClick={async () => {}}
        >
          <Link href="/create-wallet">CREATE NEW WALLET</Link>
        </Button>

        <Button variant="secondary" className="w-full py-6 text-lg" asChild>
          <Link href="/import-wallet">IMPORT WALLET</Link>
        </Button>
      </div>

      <div className="mt-12 pt-8 border-t border-neutral-800">
        <div className="grid grid-cols-3 gap-2 opacity-50">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-1 bg-neutral-800" />
          ))}
        </div>
      </div>
    </div>
  );
}
