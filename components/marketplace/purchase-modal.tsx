"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Listing } from "@/lib/types";
import { purchaseFile } from "@/lib/contracts";
import { toast } from "@/components/ui/toast";
import { Loader2 } from "lucide-react";

interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: Listing;
}

export function PurchaseModal({ isOpen, onClose, listing }: PurchaseModalProps) {
  const [isPurchasing, setIsPurchasing] = useState(false);

  const handlePurchase = async () => {
    setIsPurchasing(true);
    try {
      await purchaseFile(listing.id, listing.price);
      toast.success("Purchase request sent! Waiting for seller approval.");
      onClose();
    } catch (error) {
      toast.error("Purchase failed. Please try again.");
      console.error(error);
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>CONFIRM PURCHASE</DialogTitle>
          <DialogDescription>
            Funds will be held in escrow until the seller approves.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="flex justify-between border-b border-neutral-800 pb-2">
            <span className="text-muted-foreground">File</span>
            <span className="font-medium">{listing.title}</span>
          </div>
          <div className="flex justify-between border-b border-neutral-800 pb-2">
             <span className="text-muted-foreground">Size</span>
             <span className="font-mono">{(listing.fileSize / 1024).toFixed(2)} KB</span>
          </div>
          <div className="flex justify-between border-b border-neutral-800 pb-2">
            <span className="text-muted-foreground">Price</span>
            <span className="font-mono text-high-viz-yellow text-lg">{listing.price} USDT</span>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="secondary" onClick={onClose} disabled={isPurchasing}>
            CANCEL
          </Button>
          <Button variant="primary" onClick={handlePurchase} disabled={isPurchasing}>
            {isPurchasing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                PROCESSING...
              </>
            ) : (
              "CONFIRM PURCHASE"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

