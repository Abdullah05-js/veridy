"use client";

import { useState } from "react";
import { Order, PurchaseStatus } from "@/lib/types";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { acceptPurchase, cancelPurchase } from "@/lib/marketplace";
import { toast } from "@/components/ui/toast";
import { Loader2, Check, X, Clock, Download, Lock, ExternalLink } from "lucide-react";
import { useWallet } from "@/hooks/use-wallet";
import { useNetworkStore, useSymmetricKeysStore } from "@/lib/store";
import { encryptSymmetricKey, toBytes32, hexToBuffer, bufferToHex } from "@/lib/crypto";
import { getIPFSUrl, downloadFromIPFS } from "@/lib/ipfs";

interface OrderCardProps {
  order: Order;
  mode: "selling" | "buying";
  onStatusChange?: () => void;
}

export function OrderCard({ order, mode, onStatusChange }: OrderCardProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentAction, setCurrentAction] = useState<string | null>(null);
  
  const { seed, ecdhKeyPair } = useWallet();
  const { network } = useNetworkStore();
  const { getKey: getSymmetricKey } = useSymmetricKeysStore();

  const handleApprove = async () => {
    if (!seed || !ecdhKeyPair) {
      toast.error("Wallet not ready");
      return;
    }

    setIsProcessing(true);
    setCurrentAction("Computing encrypted key...");
    
    try {
      // Get the symmetric key for this listing
      // Note: In a real app, you'd need a better way to map listingId to symmetricKey
      // This could be stored when creating the listing
      const symmetricKeyHex = getSymmetricKey(order.listingId);
      
      if (!symmetricKeyHex) {
        toast.error("Symmetric key not found. Please ensure you created this listing from this device.");
        return;
      }

      const symmetricKey = new Uint8Array(hexToBuffer(symmetricKeyHex));

      // Compute encK = ECDH(seller_private, buyer_public) XOR K
      setCurrentAction("Computing shared secret...");
      const encKHex = await encryptSymmetricKey(
        symmetricKey,
        ecdhKeyPair.privateKey,
        order.buyerPublicKey
      );

      // Format as bytes32
      const encKBytes32 = toBytes32(encKHex);

      // Accept the purchase on-chain
      setCurrentAction("Submitting to blockchain...");
      await acceptPurchase(seed, order.id, encKBytes32, network);

      toast.success("Purchase approved! Funds released to your wallet.");
      onStatusChange?.();
    } catch (error) {
      console.error("Approve error:", error);
      toast.error((error as Error).message || "Failed to approve purchase");
    } finally {
      setIsProcessing(false);
      setCurrentAction(null);
    }
  };

  const handleReject = async () => {
    if (!confirm("Are you sure you want to reject this order? The buyer will be refunded.")) return;
    
    // Note: The smart contract doesn't have a reject function for sellers
    // Sellers can only accept. Buyers can cancel.
    toast.info("Buyers can cancel their own purchases. As a seller, you can choose not to accept.");
  };

  const handleCancel = async () => {
    if (!seed) {
      toast.error("Wallet not ready");
      return;
    }

    if (!confirm("Are you sure you want to cancel this purchase? You will be refunded.")) return;
    
    setIsProcessing(true);
    setCurrentAction("Cancelling purchase...");
    
    try {
      await cancelPurchase(seed, order.id, network);
      toast.success("Purchase cancelled. USDT refunded.");
      onStatusChange?.();
    } catch (error) {
      console.error("Cancel error:", error);
      toast.error((error as Error).message || "Failed to cancel purchase");
    } finally {
      setIsProcessing(false);
      setCurrentAction(null);
    }
  };

  const handleDownload = async () => {
    if (!order.listing?.ipfsCid) {
      toast.error("IPFS CID not found");
      return;
    }

    setIsProcessing(true);
    setCurrentAction("Downloading encrypted file...");
    
    try {
      // Download encrypted file from IPFS
      const blob = await downloadFromIPFS(order.listing.ipfsCid);
      
      // Note: Decryption would happen here using:
      // 1. buyer's private key (from wallet)
      // 2. seller's public key (from listing)
      // 3. encK (from order)
      // For now, we download the encrypted file and show info
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${order.listing.title}_encrypted.bin`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Encrypted file downloaded. Use the decryption tool to unlock.");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download file");
    } finally {
      setIsProcessing(false);
      setCurrentAction(null);
    }
  };

  const getStatusBadge = () => {
    if (order.status === 'PENDING') {
      return (
        <div className="text-xs font-bold px-2 py-1 uppercase tracking-wider border border-yellow-500 text-yellow-500">
          PENDING
        </div>
      );
    } else if (order.status === 'APPROVED') {
      return (
        <div className="text-xs font-bold px-2 py-1 uppercase tracking-wider border border-green-500 text-green-500">
          APPROVED
        </div>
      );
    } else {
      return (
        <div className="text-xs font-bold px-2 py-1 uppercase tracking-wider border border-red-500 text-red-500">
          CANCELLED
        </div>
      );
    }
  };

  return (
    <Card className="border-neutral-800 hover:border-neutral-700 bg-neutral-950 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start mb-2">
          {getStatusBadge()}
          <span className="text-xs text-muted-foreground font-mono">
            {new Date(order.createdAt).toLocaleDateString()}
          </span>
        </div>
        <CardTitle className="text-lg">
          {order.listing?.title || `Purchase #${order.id}`}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {mode === "selling" ? (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Buyer</span>
            <span className="font-mono truncate w-32 text-right">
              {order.buyer.slice(0, 6)}...{order.buyer.slice(-4)}
            </span>
          </div>
        ) : (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Seller</span>
            <span className="font-mono truncate w-32 text-right">
              {order.listing?.seller 
                ? `${order.listing.seller.slice(0, 6)}...${order.listing.seller.slice(-4)}`
                : "Unknown"}
            </span>
          </div>
        )}
        
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Listing ID</span>
          <span className="font-mono">{order.listingId}</span>
        </div>
        
        {order.listing?.ipfsCid && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">IPFS</span>
            <a 
              href={getIPFSUrl(order.listing.ipfsCid)}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-high-viz-yellow hover:underline flex items-center gap-1"
            >
              {order.listing.ipfsCid.slice(0, 8)}...
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
        
        <div className="flex justify-between text-sm border-t border-neutral-800 pt-3 mt-3">
          <span className="font-medium uppercase">Amount</span>
          <span className="font-mono text-high-viz-yellow">{order.amount} USDT</span>
        </div>

        {/* Encryption Info */}
        {order.status === 'APPROVED' && order.encK && order.encK !== "0x0000000000000000000000000000000000000000000000000000000000000000" && (
          <div className="flex items-center gap-2 text-xs text-green-500 pt-2">
            <Lock className="w-3 h-3" />
            <span>Decryption key available</span>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="gap-2 pt-0">
        {mode === "selling" ? (
          // Seller view
          order.status === 'PENDING' ? (
            <>
              <Button 
                variant="secondary" 
                className="flex-1 border-neutral-700 hover:bg-red-900/20 hover:border-red-500 hover:text-red-500"
                onClick={handleReject}
                disabled={isProcessing}
              >
                <X className="w-4 h-4 mr-1" />
                REJECT
              </Button>
              <Button 
                variant="primary" 
                className="flex-1"
                onClick={handleApprove}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    {currentAction || "PROCESSING..."}
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-1" />
                    APPROVE
                  </>
                )}
              </Button>
            </>
          ) : (
            <div className="w-full py-2 text-center text-sm text-muted-foreground uppercase tracking-widest">
              {order.status === 'APPROVED' ? "Transaction Completed" : "Transaction Cancelled"}
            </div>
          )
        ) : (
          // Buyer view
          order.status === 'PENDING' ? (
            <Button 
              variant="secondary" 
              className="w-full border-neutral-700 hover:bg-red-900/20 hover:border-red-500 hover:text-red-500"
              onClick={handleCancel}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  {currentAction || "PROCESSING..."}
                </>
              ) : (
                <>
                  <X className="w-4 h-4 mr-1" />
                  CANCEL & REFUND
                </>
              )}
            </Button>
          ) : order.status === 'APPROVED' ? (
            <Button 
              variant="primary" 
              className="w-full"
              onClick={handleDownload}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  {currentAction || "DOWNLOADING..."}
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-1" />
                  DOWNLOAD FILE
                </>
              )}
            </Button>
          ) : (
            <div className="w-full py-2 text-center text-sm text-muted-foreground uppercase tracking-widest">
              Purchase Cancelled - Refunded
            </div>
          )
        )}
      </CardFooter>
    </Card>
  );
}
