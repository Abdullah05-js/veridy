/**
 * Legacy contracts.ts - now a wrapper around marketplace.ts
 * Kept for backward compatibility
 */

import {
  createListing as createMarketplaceListing,
  purchaseListing as purchaseMarketplaceListing,
  acceptPurchase as acceptMarketplacePurchase,
  cancelPurchase as cancelMarketplacePurchase,
  getActiveListings as getMarketplaceListings,
  getListingsBySeller,
  getPendingPurchasesForSeller,
  getPurchasesByBuyer,
} from "./marketplace";

import { Listing, Order } from "./types";

// Re-export from marketplace for compatibility
// Note: createListing now returns { txHash, listingId } instead of just txHash
export { 
  createMarketplaceListing as createListing,
  purchaseMarketplaceListing as purchaseFile,
  acceptMarketplacePurchase as approvePurchase,
  cancelMarketplacePurchase as rejectPurchase,
};

// Get all listings
export const getListings = async (
  category?: string
): Promise<Listing[]> => {
  const listings = await getMarketplaceListings();
  if (category) {
    return listings.filter(l => l.category === category);
  }
  return listings;
};

// Get user listings (seller)
export const getUserListings = async (
  address: string
): Promise<Listing[]> => {
  return getListingsBySeller(address);
};

// Get pending orders for seller
export const getPendingOrders = async (
  sellerAddress: string
): Promise<Order[]> => {
  return getPendingPurchasesForSeller(sellerAddress);
};

// Get buyer's purchase history
export const getBuyerOrders = async (
  buyerAddress: string
): Promise<Order[]> => {
  return getPurchasesByBuyer(buyerAddress);
};

// Check if user has approved purchase
export const isPurchaseApproved = async (
  orderId: string
): Promise<boolean> => {
  // This would need to fetch the specific purchase and check status
  // For now, return false as a placeholder
  return false;
};
