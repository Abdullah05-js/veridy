"use client";

import { useState } from "react";
import { Order } from "@/lib/types";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { approvePurchase, rejectPurchase } from "@/lib/contracts";
import { toast } from "@/components/ui/toast";
import { Loader2, Check, X, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge"; // Wait, I didn't create Badge. I'll use a div or create it.

// I'll use a simple div for badge style since I didn't create a Badge component explicitly 
// or I can check if shadcn installed it. I'll stick to divs to be safe and consistent.

interface OrderCardProps {
  order: Order;
}

export function OrderCard({ order }: OrderCardProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState(order.status);

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      await approvePurchase(order.id);
      setStatus("APPROVED");
      toast.success("Order approved! Funds released.");
    } catch (error) {
      toast.error("Failed to approve order.");
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!confirm("Are you sure you want to reject this order? The buyer will be refunded.")) return;
    
    setIsProcessing(true);
    try {
      await rejectPurchase(order.id);
      setStatus("REJECTED");
      toast.info("Order rejected. Buyer refunded.");
    } catch (error) {
      toast.error("Failed to reject order.");
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="border-neutral-800 hover:border-neutral-800 bg-neutral-950">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start mb-2">
          <div className={`text-xs font-bold px-2 py-1 uppercase tracking-wider border ${
            status === 'PENDING' ? 'border-yellow-500 text-yellow-500' :
            status === 'APPROVED' ? 'border-green-500 text-green-500' :
            'border-red-500 text-red-500'
          }`}>
            {status}
          </div>
          <span className="text-xs text-muted-foreground font-mono">
            {new Date(order.createdAt).toLocaleDateString()}
          </span>
        </div>
        <CardTitle className="text-lg">File Purchase Order</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Buyer</span>
          <span className="font-mono truncate w-32 text-right">{order.buyer}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Listing ID</span>
          <span className="font-mono">{order.listingId}</span>
        </div>
        <div className="flex justify-between text-sm border-t border-neutral-800 pt-3 mt-3">
          <span className="font-medium uppercase">Amount</span>
          <span className="font-mono text-high-viz-yellow">{order.amount} USDT</span>
        </div>
      </CardContent>
      <CardFooter className="gap-2 pt-0">
        {status === 'PENDING' ? (
          <>
            <Button 
              variant="secondary" 
              className="flex-1 border-neutral-700 hover:bg-red-900/20 hover:border-red-500 hover:text-red-500"
              onClick={handleReject}
              disabled={isProcessing}
            >
              REJECT
            </Button>
            <Button 
              variant="primary" 
              className="flex-1"
              onClick={handleApprove}
              disabled={isProcessing}
            >
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : "APPROVE"}
            </Button>
          </>
        ) : (
          <div className="w-full py-2 text-center text-sm text-muted-foreground uppercase tracking-widest">
            {status === 'APPROVED' ? "Transaction Completed" : "Transaction Cancelled"}
          </div>
        )}
      </CardFooter>
    </Card>
  );
}

