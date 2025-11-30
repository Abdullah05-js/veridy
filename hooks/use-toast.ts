// Re-export from components/ui/toast for consistency
import { toast } from "@/components/ui/toast";

export function useToast() {
  return { toast };
}

