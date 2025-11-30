"use client";

import { useState } from "react";
import { Listing } from "@/lib/types";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "lucide-react"; // Using lucide badge icon as fallback if not custom badge
import { DATA_CATEGORIES } from "@/constants/categories";
import { PurchaseModal } from "./purchase-modal";

interface FileCardProps {
  listing: Listing;
}

export function FileCard({ listing }: FileCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const category = DATA_CATEGORIES.find((c) => c.id === listing.category);

  return (
    <>
      <Card className="h-full flex flex-col justify-between border-r-0 border-b border-neutral-800 group">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
             <div className="text-xs font-medium text-high-viz-yellow mb-2 uppercase tracking-widest border border-high-viz-yellow px-2 py-0.5 w-fit">
              {category?.label || listing.category}
            </div>
            <div className="text-xs text-muted-foreground font-mono">
                {(listing.fileSize / 1024).toFixed(1)} KB
            </div>
          </div>
          <CardTitle className="text-xl truncate">{listing.title}</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow">
          <p className="text-sm text-muted-foreground line-clamp-3 font-mono">
            {listing.description}
          </p>
          <div className="mt-4 pt-4 border-t border-neutral-800 flex justify-between items-center">
            <span className="text-xs text-muted-foreground uppercase">Seller</span>
            <span className="text-xs font-mono truncate w-24 text-right">{listing.seller}</span>
          </div>
        </CardContent>
        <CardFooter className="pt-0 pb-6 px-6">
          <Button 
            className="w-full opacity-0 group-hover:opacity-100 transition-opacity" 
            variant="primary"
            onClick={() => setIsModalOpen(true)}
          >
            BUY FOR {listing.price} USDT
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

