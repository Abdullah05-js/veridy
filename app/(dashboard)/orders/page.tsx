"use client";

import { useState, useEffect } from "react";
import { GridContainer } from "@/components/layout/grid-container";
import { OrderCard } from "@/components/orders/order-card";
import { Order } from "@/lib/types";
import { getPendingPurchasesForSeller, getPurchasesByBuyer } from "@/lib/marketplace";
import { useWallet } from "@/hooks/use-wallet";
import { useNetworkStore } from "@/lib/store";
import { Loader2, Inbox, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";

type TabType = "selling" | "buying";

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState<TabType>("selling");
  const [sellerOrders, setSellerOrders] = useState<Order[]>([]);
  const [buyerOrders, setBuyerOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { address } = useWallet();
  const { network } = useNetworkStore();

  useEffect(() => {
    async function fetchOrders() {
      if (!address) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      
      try {
        const [pending, purchases] = await Promise.all([
          getPendingPurchasesForSeller(address, network),
          getPurchasesByBuyer(address, network),
        ]);
        
        setSellerOrders(pending);
        setBuyerOrders(purchases);
      } catch (err) {
        console.error("Failed to fetch orders:", err);
        setError("Failed to load orders. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchOrders();
  }, [address, network]);

  const currentOrders = activeTab === "selling" ? sellerOrders : buyerOrders;

  const refreshOrders = async () => {
    if (!address) return;
    
    setIsLoading(true);
    try {
      const [pending, purchases] = await Promise.all([
        getPendingPurchasesForSeller(address, network),
        getPurchasesByBuyer(address, network),
      ]);
      
      setSellerOrders(pending);
      setBuyerOrders(purchases);
    } catch (err) {
      console.error("Failed to refresh orders:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!address) {
    return (
      <div className="flex flex-col min-h-[calc(100vh-4rem)] items-center justify-center">
        <Inbox className="w-12 h-12 text-neutral-600 mb-4" />
        <p className="text-muted-foreground">Connect your wallet to view orders</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="p-8 border-b border-neutral-800 bg-neutral-950">
        <h1 className="text-4xl font-bold uppercase tracking-tight font-display">Orders</h1>
        <p className="text-muted-foreground mt-2">
          Manage your purchase requests and sales.
        </p>
        
        {/* Tabs */}
        <div className="flex gap-4 mt-6">
          <button
            onClick={() => setActiveTab("selling")}
            className={cn(
              "px-4 py-2 font-medium uppercase tracking-wider text-sm border transition-colors",
              activeTab === "selling"
                ? "border-high-viz-yellow bg-high-viz-yellow text-black"
                : "border-neutral-700 text-neutral-400 hover:border-neutral-500"
            )}
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              Incoming ({sellerOrders.length})
            </div>
          </button>
          <button
            onClick={() => setActiveTab("buying")}
            className={cn(
              "px-4 py-2 font-medium uppercase tracking-wider text-sm border transition-colors",
              activeTab === "buying"
                ? "border-high-viz-yellow bg-high-viz-yellow text-black"
                : "border-neutral-700 text-neutral-400 hover:border-neutral-500"
            )}
          >
            <div className="flex items-center gap-2">
              <Inbox className="w-4 h-4" />
              My Purchases ({buyerOrders.length})
            </div>
          </button>
        </div>
      </div>
      
      {/* Content */}
      {isLoading ? (
        <div className="flex-grow flex items-center justify-center border-r border-neutral-800 border-b">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-high-viz-yellow" />
            <p className="text-muted-foreground uppercase tracking-widest text-sm">
              Loading orders...
            </p>
          </div>
        </div>
      ) : error ? (
        <div className="flex-grow flex items-center justify-center border-r border-neutral-800 border-b">
          <div className="text-center">
            <p className="text-red-500 mb-2">{error}</p>
            <button 
              onClick={refreshOrders} 
              className="text-high-viz-yellow hover:underline uppercase text-sm"
            >
              Retry
            </button>
          </div>
        </div>
      ) : currentOrders.length === 0 ? (
        <div className="flex-grow flex items-center justify-center border-r border-neutral-800 border-b">
          <div className="text-center">
            <Inbox className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
            <p className="text-muted-foreground text-lg mb-2">
              {activeTab === "selling" 
                ? "No pending purchase requests" 
                : "No purchases yet"}
            </p>
            <p className="text-sm text-neutral-600">
              {activeTab === "selling"
                ? "When someone wants to buy your files, they'll appear here."
                : "Browse the marketplace to find files to purchase."}
            </p>
          </div>
        </div>
      ) : (
        <GridContainer className="flex-grow border-r border-neutral-800 border-b">
          {currentOrders.map((order) => (
            <OrderCard 
              key={order.id} 
              order={order} 
              mode={activeTab}
              onStatusChange={refreshOrders}
            />
          ))}
        </GridContainer>
      )}
    </div>
  );
}
