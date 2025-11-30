"use client";

import { useState, useEffect } from "react";
import { Order, PurchaseStatus } from "@/lib/types";
import { getCompletedPurchasesByBuyer } from "@/lib/marketplace";
import { useWallet } from "@/hooks/use-wallet";
import { useNetworkStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import { 
  Loader2, 
  Download, 
  Lock, 
  CheckCircle2, 
  FileDown,
  Shield,
  ExternalLink 
} from "lucide-react";
import { downloadFromIPFS, getIPFSUrl } from "@/lib/ipfs";
import { decryptSymmetricKey, decryptFile, hexToBuffer, hashFile } from "@/lib/crypto";

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<string | null>(null);
  
  const { address, ecdhKeyPair } = useWallet();
  const { network } = useNetworkStore();

  useEffect(() => {
    async function fetchPurchases() {
      if (!address) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const data = await getCompletedPurchasesByBuyer(address, network);
        setPurchases(data);
      } catch (err) {
        console.error("Failed to fetch purchases:", err);
        toast.error("Failed to load purchases");
      } finally {
        setIsLoading(false);
      }
    }

    fetchPurchases();
  }, [address, network]);

  const handleDownloadAndDecrypt = async (order: Order) => {
    if (!order.listing?.ipfsCid || !order.encK || !ecdhKeyPair) {
      toast.error("Missing decryption data");
      return;
    }

    const zeroBytes32 = "0x0000000000000000000000000000000000000000000000000000000000000000";
    if (order.encK === zeroBytes32) {
      toast.error("Encryption key not set by seller");
      return;
    }

    setDownloadingId(order.id);
    
    try {
      // Step 1: Download encrypted file from IPFS
      setDownloadProgress("Downloading from IPFS...");
      const encryptedBlob = await downloadFromIPFS(order.listing.ipfsCid);

      // Step 2: Recover symmetric key using ECDH
      setDownloadProgress("Decrypting key...");
      const symmetricKey = await decryptSymmetricKey(
        order.encK,
        ecdhKeyPair.privateKey,
        order.listing.sellerPublicKey
      );

      // Step 3: Decrypt the file
      setDownloadProgress("Decrypting file...");
      const decryptedBlob = await decryptFile(
        encryptedBlob,
        symmetricKey,
        getMimeType(order.listing.fileType)
      );

      // Step 4: Verify content hash (optional but recommended)
      setDownloadProgress("Verifying integrity...");
      const computedHash = await hashFile(decryptedBlob);
      if (computedHash !== order.listing.contentHash) {
        console.warn("Content hash mismatch - file may be corrupted");
        // Continue anyway, but warn user
        toast.info("Warning: File hash mismatch. File may be modified.");
      }

      // Step 5: Download the decrypted file
      setDownloadProgress("Saving file...");
      const url = URL.createObjectURL(decryptedBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${order.listing.title}.${order.listing.fileType}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("File decrypted and downloaded!");
    } catch (error) {
      console.error("Decryption error:", error);
      toast.error((error as Error).message || "Failed to decrypt file");
    } finally {
      setDownloadingId(null);
      setDownloadProgress(null);
    }
  };

  // Get MIME type from file extension
  const getMimeType = (fileType: string): string => {
    const mimeTypes: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'pdf': 'application/pdf',
      'csv': 'text/csv',
      'json': 'application/json',
      'txt': 'text/plain',
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'mp4': 'video/mp4',
      'zip': 'application/zip',
    };
    return mimeTypes[fileType.toLowerCase()] || 'application/octet-stream';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (!address) {
    return (
      <div className="flex flex-col min-h-[calc(100vh-4rem)] items-center justify-center">
        <FileDown className="w-12 h-12 text-neutral-600 mb-4" />
        <p className="text-muted-foreground">Connect your wallet to view purchases</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="p-8 border-b border-neutral-800 bg-neutral-950">
        <h1 className="text-4xl font-bold uppercase tracking-tight font-display">My Purchases</h1>
        <p className="text-muted-foreground mt-2">
          Download and decrypt your purchased files.
        </p>
      </div>
      
      {/* Security Info */}
      <div className="p-4 border-b border-neutral-800 bg-neutral-900/30">
        <div className="flex items-start gap-3 max-w-2xl mx-auto">
          <Shield className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-white mb-1">End-to-End Encryption</p>
            <p>Files are decrypted locally in your browser using ECDH key exchange. Your private key never leaves your device.</p>
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-high-viz-yellow" />
            <p className="text-muted-foreground uppercase tracking-widest text-sm">
              Loading purchases...
            </p>
          </div>
        </div>
      ) : purchases.length === 0 ? (
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <FileDown className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
            <p className="text-muted-foreground text-lg mb-2">No completed purchases</p>
            <p className="text-sm text-neutral-600">
              Your approved purchases will appear here for download.
            </p>
          </div>
        </div>
      ) : (
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {purchases.map((purchase) => (
            <Card key={purchase.id} className="border-neutral-800 bg-neutral-950">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2 text-xs text-green-500">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="uppercase tracking-wider">Unlocked</span>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">
                    {new Date(purchase.acceptedAt).toLocaleDateString()}
                  </span>
                </div>
                <CardTitle className="text-lg truncate">
                  {purchase.listing?.title || `File #${purchase.listingId}`}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Type</span>
                  <div className="flex items-center gap-2">
                    <Lock className="w-3 h-3 text-green-500" />
                    <span className="font-mono uppercase">{purchase.listing?.fileType || "Unknown"}</span>
                  </div>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Size</span>
                  <span className="font-mono">
                    {purchase.listing ? formatFileSize(purchase.listing.fileSize) : "Unknown"}
                  </span>
                </div>
                
                {purchase.listing?.ipfsCid && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">IPFS</span>
                    <a 
                      href={getIPFSUrl(purchase.listing.ipfsCid)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-high-viz-yellow hover:underline flex items-center gap-1"
                    >
                      {purchase.listing.ipfsCid.slice(0, 8)}...
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
                
                <div className="flex justify-between text-sm border-t border-neutral-800 pt-3 mt-3">
                  <span className="text-muted-foreground">Paid</span>
                  <span className="font-mono text-high-viz-yellow">{purchase.amount} USDT</span>
                </div>
              </CardContent>
              
              <CardFooter>
                <Button 
                  variant="primary" 
                  className="w-full"
                  onClick={() => handleDownloadAndDecrypt(purchase)}
                  disabled={downloadingId === purchase.id}
                >
                  {downloadingId === purchase.id ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      {downloadProgress || "PROCESSING..."}
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      DOWNLOAD & DECRYPT
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

