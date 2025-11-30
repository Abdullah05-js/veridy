import { 
  createListing as createListingLib,
  purchaseFile as purchaseFileLib,
  approvePurchase as approvePurchaseLib
} from "@/lib/contracts";

export function useContract() {
  const createListing = async (...args: Parameters<typeof createListingLib>) => {
    return await createListingLib(...args);
  };

  const purchaseFile = async (...args: Parameters<typeof purchaseFileLib>) => {
    return await purchaseFileLib(...args);
  };

  const approvePurchase = async (...args: Parameters<typeof approvePurchaseLib>) => {
    return await approvePurchaseLib(...args);
  };

  return { createListing, purchaseFile, approvePurchase };
}

