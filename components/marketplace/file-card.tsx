"use client";

import { useState } from "react";
import { Listing } from "@/lib/types";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DATA_CATEGORIES } from "@/constants/categories";
import { PurchaseModal } from "./purchase-modal";
import { Lock, ExternalLink } from "lucide-react";
import { getIPFSUrl } from "@/lib/ipfs";

interface FileCardProps {
  listing: Listing;
}

export function FileCard({ listing }: FileCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const category = DATA_CATEGORIES.find((c) => c.id === listing.category);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <>
      <Card className="h-full flex flex-col justify-between border-r-0 border-b border-neutral-800 group">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
             <div className="text-xs font-medium text-high-viz-yellow mb-2 uppercase tracking-widest border border-high-viz-yellow px-2 py-0.5 w-fit">
              {category?.label || listing.category}
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-3 h-3 text-green-500" title="Encrypted" />
              <div className="text-xs text-muted-foreground font-mono">
                {formatFileSize(listing.fileSize)}
              </div>
            </div>
          </div>
          <CardTitle className="text-xl truncate">{listing.title}</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow">
          <p className="text-sm text-muted-foreground line-clamp-3 font-mono">
            {listing.description}
          </p>
          <div className="mt-4 pt-4 border-t border-neutral-800 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground uppercase">Seller</span>
              <span className="text-xs font-mono truncate">{formatAddress(listing.seller)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground uppercase">Type</span>
              <span className="text-xs font-mono uppercase">{listing.fileType}</span>
            </div>
            {listing.ipfsCid && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground uppercase">IPFS</span>
                <a 
                  href={getIPFSUrl(listing.ipfsCid)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs font-mono text-high-viz-yellow hover:underline flex items-center gap-1"
                >
                  {listing.ipfsCid.slice(0, 8)}...
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="pt-0 pb-6 px-6">
          <Button 
            className="w-full opacity-0 group-hover:opacity-100 transition-opacity" 
            variant="primary"
            onClick={() => setIsModalOpen(true)}
            disabled={listing.sold}
          >
            {listing.sold ? "SOLD" : `BUY FOR ${listing.price} USDT`}
          </Button>
        </CardFooter>
      </Card>
      
      <PurchaseModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        listing={listing} 
      />
    </>
  );
}
