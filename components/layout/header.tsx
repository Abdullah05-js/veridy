"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { WalletConnect } from "@/components/wallet/wallet-connect";
import { useNetworkStore } from "@/lib/store";

export function Header() {
  const pathname = usePathname();
  const { network, setNetwork } = useNetworkStore();

  const navItems = [
    { href: "/", label: "Marketplace" },
    { href: "/create", label: "Create" },
    { href: "/my-listings", label: "My Listings" },
    { href: "/orders", label: "Orders" },
    { href: "/purchases", label: "Purchases" },
    { href: "/wallet", label: "Wallet" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-800 bg-neutral-950/95 backdrop-blur supports-backdrop-filter:bg-neutral-950/60">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold uppercase tracking-tighter font-display">
              Veridy
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-high-viz-yellow uppercase tracking-wide",
                  pathname === item.href
                    ? "text-high-viz-yellow"
                    : "text-muted-foreground"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          {/* Network Selector */}
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={() => setNetwork('arbitrum')}
              className={cn(
                "px-2 py-1 text-xs font-mono uppercase border transition-colors",
                network === 'arbitrum'
                  ? "border-high-viz-yellow bg-high-viz-yellow text-black"
                  : "border-neutral-700 text-neutral-500 hover:border-neutral-500"
              )}
            >
              Arbitrum
            </button>
            <button
              onClick={() => setNetwork('sepolia')}
              className={cn(
                "px-2 py-1 text-xs font-mono uppercase border transition-colors",
                network === 'sepolia'
                  ? "border-high-viz-yellow bg-high-viz-yellow text-black"
                  : "border-neutral-700 text-neutral-500 hover:border-neutral-500"
              )}
            >
              Sepolia
            </button>
          </div>
          <WalletConnect />
        </div>
      </div>
    </header>
  );
}
