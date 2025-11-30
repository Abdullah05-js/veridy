"use client";

import { useState, useEffect } from "react";
import { GridContainer } from "@/components/layout/grid-container";
import { CategoryFilter } from "@/components/marketplace/category-filter";
import { FileCard } from "@/components/marketplace/file-card";
import { Listing } from "@/lib/types";
import { DataCategory } from "@/constants/categories";
import { getActiveListings } from "@/lib/marketplace";
import { useNetworkStore } from "@/lib/store";
import { Loader2 } from "lucide-react";

export default function MarketplacePage() {
  const [selectedCategory, setSelectedCategory] = useState<DataCategory | "all">("all");
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { network } = useNetworkStore();

  useEffect(() => {
    async function fetchListings() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getActiveListings(0, 100, network);
        setListings(data);
      } catch (err) {
        console.error("Failed to fetch listings:", err);
        setError("Failed to load listings. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchListings();
  }, [network]);

  const filteredListings = selectedCategory === "all"
    ? listings
    : listings.filter((l) => l.category === selectedCategory);

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      <CategoryFilter
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      {isLoading ? (
        <div className="flex-grow flex items-center justify-center border-r border-neutral-800 border-b">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-high-viz-yellow" />
            <p className="text-muted-foreground uppercase tracking-widest text-sm">
              Loading marketplace...
            </p>
          </div>
        </div>
      ) : error ? (
        <div className="flex-grow flex items-center justify-center border-r border-neutral-800 border-b">
          <div className="text-center">
            <p className="text-red-500 mb-2">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-high-viz-yellow hover:underline uppercase text-sm"
            >
              Retry
            </button>
          </div>
        </div>
      ) : filteredListings.length === 0 ? (
        <div className="flex-grow flex items-center justify-center border-r border-neutral-800 border-b">
          <div className="text-center">
            <p className="text-muted-foreground text-lg mb-2">No listings found</p>
            <p className="text-sm text-neutral-600">
              {selectedCategory === "all"
                ? "Be the first to create a listing!"
                : "No listings in this category yet."}
            </p>
          </div>
        </div>
      ) : (
        <GridContainer className="grow border-r border-neutral-800 border-b">
          {filteredListings.map((listing) => (
            <FileCard key={listing.id} listing={listing} />
          ))}
        </GridContainer>
      )}
    </div>
  );
}
