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
import { purchaseListing, approveUSDT, getUSDTAllowance } from "@/lib/marketplace";
import { toast } from "@/components/ui/toast";
import { Loader2, Shield, Lock, AlertCircle } from "lucide-react";
import { useWallet } from "@/hooks/use-wallet";
import { useNetworkStore, useWalletStore } from "@/lib/store";
import { parseUnits } from "viem";

interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: Listing;
}

export function PurchaseModal({ isOpen, onClose, listing }: PurchaseModalProps) {
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const { address, seed, ensureECDHKeyPair } = useWallet();
  const { network } = useNetworkStore();
  const { wallet } = useWalletStore();

  const handlePurchase = async () => {
    if (!seed || !address) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (listing.seller.toLowerCase() === address.toLowerCase()) {
      toast.error("You cannot purchase your own listing");
      return;
    }

    setIsPurchasing(true);
    try {
      // Step 1: Generate/get ECDH keypair for buyer
      setCurrentStep("Generating encryption keys...");
      const ecdhKeyPair = await ensureECDHKeyPair();

      // Step 2: Check USDT allowance
      setCurrentStep("Checking USDT allowance...");
      const currentAllowance = await getUSDTAllowance(address, network);
      const requiredAmount = listing.priceRaw;

      // Step 3: Approve USDT if needed
      if (currentAllowance < requiredAmount) {
        setCurrentStep("Approving USDT spending...");
        await approveUSDT(seed, requiredAmount, network);
        toast.success("USDT approved for marketplace");
      }

      // Step 4: Purchase the listing
      setCurrentStep("Processing purchase...");
      const txHash = await purchaseListing(
        seed,
        listing.id,
        ecdhKeyPair.publicKey,
        network
      );

      toast.success(
        <div>
          Purchase request sent! Waiting for seller approval.
          <a
            href={`https://arbiscan.io/tx/${txHash}`}
            target="_blank"
            rel="noreferrer"
            className="underline ml-2"
          >
            View on Arbiscan
          </a>
        </div>
      );
      console.log("Purchase TX:", txHash);
      
      // Store buyer's keypair info for later decryption
      // The buyer will need their private key + seller's public key + encK to decrypt
      localStorage.setItem(`buyer_purchase_${listing.id}`, JSON.stringify({
        listingId: listing.id,
        sellerPublicKey: listing.sellerPublicKey,
        buyerPublicKey: ecdhKeyPair.publicKey,
        // Note: private key is already stored in wallet store
      }));

      onClose();
    } catch (error) {
      console.error("Purchase error:", error);
      const message = (error as Error).message;
      if (message.includes("insufficient")) {
        toast.error("Insufficient USDT balance");
      } else if (message.includes("CannotBuyOwnListing")) {
        toast.error("You cannot purchase your own listing");
      } else if (message.includes("PurchaseAlreadyExists")) {
        toast.error("You already have a pending purchase for this listing");
      } else {
        toast.error("Purchase failed. Please try again.");
      }
    } finally {
      setIsPurchasing(false);
      setCurrentStep(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
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
          {/* Security Info */}
          <div className="flex items-start gap-3 p-3 bg-neutral-900/50 border border-neutral-800 rounded">
            <Shield className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-muted-foreground">
              <p className="font-medium text-white mb-1">Secure Escrow</p>
              <p>Your USDT will be held safely until you receive access to the file. You can cancel anytime before seller approval.</p>
            </div>
          </div>

          <div className="flex justify-between border-b border-neutral-800 pb-2">
            <span className="text-muted-foreground">File</span>
            <span className="font-medium">{listing.title}</span>
          </div>
          <div className="flex justify-between border-b border-neutral-800 pb-2">
            <span className="text-muted-foreground">Type</span>
            <div className="flex items-center gap-2">
              <Lock className="w-3 h-3 text-green-500" />
              <span className="font-mono uppercase">{listing.fileType}</span>
            </div>
          </div>
          <div className="flex justify-between border-b border-neutral-800 pb-2">
             <span className="text-muted-foreground">Size</span>
             <span className="font-mono">{formatFileSize(listing.fileSize)}</span>
          </div>
          <div className="flex justify-between border-b border-neutral-800 pb-2">
            <span className="text-muted-foreground">Seller</span>
            <span className="font-mono text-xs">
              {listing.seller.slice(0, 6)}...{listing.seller.slice(-4)}
            </span>
          </div>
          <div className="flex justify-between pt-2">
            <span className="text-muted-foreground">Price</span>
            <span className="font-mono text-high-viz-yellow text-lg">{listing.price} USDT</span>
          </div>

          {/* Not Connected Warning */}
          {!address && (
            <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded">
              <AlertCircle className="w-4 h-4 text-yellow-500" />
              <span className="text-xs text-yellow-500">Please connect your wallet to purchase</span>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="secondary" onClick={onClose} disabled={isPurchasing}>
            CANCEL
          </Button>
          <Button 
            variant="primary" 
            onClick={handlePurchase} 
            disabled={isPurchasing || !address}
          >
            {isPurchasing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {currentStep || "PROCESSING..."}
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
