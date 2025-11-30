"use client";

import { useState, useEffect } from "react";
import { Listing } from "@/lib/types";
import { getListingsBySeller, deactivateListing, reactivateListing } from "@/lib/marketplace";
import { useWallet } from "@/hooks/use-wallet";
import { useNetworkStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import { 
  Loader2, 
  Lock, 
  Eye, 
  EyeOff, 
  Package,
  CheckCircle2,
  ExternalLink 
} from "lucide-react";
import { getIPFSUrl } from "@/lib/ipfs";
import { DATA_CATEGORIES } from "@/constants/categories";
import { cn } from "@/lib/utils";

export default function MyListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  const { address, seed } = useWallet();
  const { network } = useNetworkStore();

  useEffect(() => {
    async function fetchListings() {
      if (!address) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const data = await getListingsBySeller(address, network);
        setListings(data);
      } catch (err) {
        console.error("Failed to fetch listings:", err);
        toast.error("Failed to load listings");
      } finally {
        setIsLoading(false);
      }
    }

    fetchListings();
  }, [address, network]);

  const handleToggleActive = async (listing: Listing) => {
    if (!seed) {
      toast.error("Wallet not connected");
      return;
    }

    setProcessingId(listing.id);
    try {
      if (listing.isActive) {
        await deactivateListing(seed, listing.id, network);
        toast.success("Listing deactivated");
      } else {
        await reactivateListing(seed, listing.id, network);
        toast.success("Listing reactivated");
      }
      
      // Refresh listings
      const data = await getListingsBySeller(address!, network);
      setListings(data);
    } catch (error) {
      console.error("Toggle error:", error);
      toast.error((error as Error).message || "Failed to update listing");
    } finally {
      setProcessingId(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (!address) {
    return (
      <div className="flex flex-col min-h-[calc(100vh-4rem)] items-center justify-center">
        <Package className="w-12 h-12 text-neutral-600 mb-4" />
        <p className="text-muted-foreground">Connect your wallet to view your listings</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="p-8 border-b border-neutral-800 bg-neutral-950">
        <h1 className="text-4xl font-bold uppercase tracking-tight font-display">My Listings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your data listings on the marketplace.
        </p>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-high-viz-yellow" />
            <p className="text-muted-foreground uppercase tracking-widest text-sm">
              Loading listings...
            </p>
          </div>
        </div>
      ) : listings.length === 0 ? (
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <Package className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
            <p className="text-muted-foreground text-lg mb-2">No listings yet</p>
            <p className="text-sm text-neutral-600 mb-4">
              Create your first listing to start selling data.
            </p>
            <Button variant="primary" onClick={() => window.location.href = '/create'}>
              CREATE LISTING
            </Button>
          </div>
        </div>
      ) : (
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((listing) => {
            const category = DATA_CATEGORIES.find((c) => c.id === listing.category);
            
            return (
              <Card 
                key={listing.id} 
                className={cn(
                  "border-neutral-800 bg-neutral-950 transition-colors",
                  !listing.isActive && "opacity-60"
                )}
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-xs font-medium text-high-viz-yellow uppercase tracking-widest border border-high-viz-yellow px-2 py-0.5 w-fit">
                      {category?.label || listing.category}
                    </div>
                    <div className="flex items-center gap-2">
                      {listing.sold ? (
                        <div className="flex items-center gap-1 text-xs text-green-500">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>SOLD</span>
                        </div>
                      ) : listing.isActive ? (
                        <div className="flex items-center gap-1 text-xs text-green-500">
                          <Eye className="w-3 h-3" />
                          <span>ACTIVE</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-xs text-neutral-500">
                          <EyeOff className="w-3 h-3" />
                          <span>HIDDEN</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <CardTitle className="text-lg truncate">{listing.title}</CardTitle>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {listing.description}
                  </p>
                  
                  <div className="pt-3 border-t border-neutral-800 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Type</span>
                      <div className="flex items-center gap-2">
                        <Lock className="w-3 h-3 text-green-500" />
                        <span className="font-mono uppercase">{listing.fileType}</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Size</span>
                      <span className="font-mono">{formatFileSize(listing.fileSize)}</span>
                    </div>
                    
                    {listing.ipfsCid && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">IPFS</span>
                        <a 
                          href={getIPFSUrl(listing.ipfsCid)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-high-viz-yellow hover:underline flex items-center gap-1"
                        >
                          {listing.ipfsCid.slice(0, 8)}...
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                    
                    <div className="flex justify-between text-sm pt-2 border-t border-neutral-800">
                      <span className="font-medium">Price</span>
                      <span className="font-mono text-high-viz-yellow">{listing.price} USDT</span>
                    </div>
                  </div>
                </CardContent>
                
                <CardFooter>
                  {!listing.sold && (
                    <Button 
                      variant="secondary" 
                      className="w-full"
                      onClick={() => handleToggleActive(listing)}
                      disabled={processingId === listing.id}
                    >
                      {processingId === listing.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : listing.isActive ? (
                        <>
                          <EyeOff className="w-4 h-4 mr-2" />
                          DEACTIVATE
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4 mr-2" />
                          REACTIVATE
                        </>
                      )}
                    </Button>
                  )}
                  {listing.sold && (
                    <div className="w-full py-2 text-center text-sm text-green-500 uppercase tracking-widest">
                      Sale Complete
                    </div>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

