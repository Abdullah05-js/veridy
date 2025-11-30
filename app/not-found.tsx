import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
      <h1 className="text-9xl font-bold text-high-viz-yellow font-display tracking-tighter">404</h1>
      <h2 className="text-2xl uppercase tracking-widest mb-8 font-bold">Page Not Found</h2>
      <p className="text-muted-foreground mb-8 max-w-md font-mono text-sm">
        The page you are looking for does not exist or has been moved.
      </p>
      <Button variant="primary" asChild>
        <Link href="/">RETURN HOME</Link>
      </Button>
    </div>
  );
}

