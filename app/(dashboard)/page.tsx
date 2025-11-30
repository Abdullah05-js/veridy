"use client";

import { useState } from "react";
import { GridContainer } from "@/components/layout/grid-container";
import { CategoryFilter } from "@/components/marketplace/category-filter";
import { FileCard } from "@/components/marketplace/file-card";
import { Listing } from "@/lib/types";
import { DataCategory } from "@/constants/categories";

// Mock Data
const MOCK_LISTINGS: Listing[] = [
  {
    id: "1",
    arweaveTxId: "tx1",
    title: "Neural Network Dataset",
    category: "datasets",
    description: "High quality labeled dataset for object detection.",
    price: "50",
    seller: "0x71C...9A21",
    fileSize: 1024 * 1024 * 50, // 50MB
    createdAt: Date.now(),
  },
  {
    id: "2",
    arweaveTxId: "tx2",
    title: "Abstract 3D Asset Pack",
    category: "3d-models",
    description: "Collection of 20 abstract 3D models in GLB format.",
    price: "25",
    seller: "0x32B...1C92",
    fileSize: 1024 * 1024 * 150, // 150MB
    createdAt: Date.now(),
  },
  {
    id: "3",
    arweaveTxId: "tx3",
    title: "Cyberpunk Ambience",
    category: "audio",
    description: "1 hour of looped cyberpunk city ambience.",
    price: "10",
    seller: "0x99A...2D11",
    fileSize: 1024 * 1024 * 80, // 80MB
    createdAt: Date.now(),
  },
  {
    id: "4",
    arweaveTxId: "tx4",
    title: "Premium UI Kit",
    category: "images",
    description: "Figma UI kit for finance applications.",
    price: "15",
    seller: "0x11B...4D22",
    fileSize: 1024 * 1024 * 10, // 10MB
    createdAt: Date.now(),
  },
];

export default function MarketplacePage() {
  const [selectedCategory, setSelectedCategory] = useState<DataCategory | "all">("all");

  const filteredListings = selectedCategory === "all"
    ? MOCK_LISTINGS
    : MOCK_LISTINGS.filter((l) => l.category === selectedCategory);

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      <CategoryFilter 
        selectedCategory={selectedCategory} 
        onSelectCategory={setSelectedCategory} 
      />
      
      <GridContainer className="grow border-r border-neutral-800 border-b">
        {filteredListings.map((listing) => (
          <FileCard key={listing.id} listing={listing} />
        ))}
        {/* Fill empty cells if needed for visual grid, but simpler to just map */}
      </GridContainer>
    </div>
  );
}

