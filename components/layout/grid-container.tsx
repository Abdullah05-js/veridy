import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface GridContainerProps {
  children: ReactNode;
  className?: string;
}

export function GridContainer({ children, className }: GridContainerProps) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-l border-neutral-800", className)}>
      {children}
    </div>
  );
}

