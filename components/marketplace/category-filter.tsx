"use client";

import { cn } from "@/lib/utils";
import { DATA_CATEGORIES, DataCategory } from "@/constants/categories";
import { Button } from "@/components/ui/button";

interface CategoryFilterProps {
  selectedCategory: DataCategory | "all";
  onSelectCategory: (category: DataCategory | "all") => void;
}

export function CategoryFilter({
  selectedCategory,
  onSelectCategory,
}: CategoryFilterProps) {
  return (
    <div className="w-full border-b border-neutral-800 bg-neutral-950 overflow-x-auto scrollbar-hide">
      <div className="flex p-4 gap-2 min-w-max">
        <Button
          variant={selectedCategory === "all" ? "primary" : "secondary"}
          onClick={() => onSelectCategory("all")}
          className="rounded-none text-xs sm:text-sm"
        >
          ALL
        </Button>
        {DATA_CATEGORIES.map((category) => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? "primary" : "secondary"}
            onClick={() => onSelectCategory(category.id)}
            className="rounded-none text-xs sm:text-sm gap-2"
          >
            <span>{category.icon}</span>
            {category.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

