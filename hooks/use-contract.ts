import { useCallback } from "react";
import { useWallet } from "./use-wallet";
import { useNetworkStore, useSymmetricKeysStore } from "@/lib/store";
import {
  createListing as createMarketplaceListing,
  purchaseListing as purchaseMarketplaceListing,
  acceptPurchase as acceptMarketplacePurchase,
  cancelPurchase as cancelMarketplacePurchase,
  getActiveListings,
  getListing,
  getListingsBySeller,
  getPendingPurchasesForSeller,
  getPurchasesByBuyer,
  getCompletedPurchasesByBuyer,
  approveUSDT,
  getUSDTAllowance,
} from "@/lib/marketplace";
import {
  generateSymmetricKey,
  encryptFile,
  hashFile,
  encryptSymmetricKey,
  toBytes32,
  bufferToHex,
} from "@/lib/crypto";
import { uploadToIPFS } from "@/lib/ipfs";
import { toast } from "@/components/ui/toast";

export function useContract() {
  const { seed, ecdhKeyPair, ensureECDHKeyPair, address } = useWallet();
  const { network } = useNetworkStore();
  const { setKey: storeSymmetricKey, getKey: getSymmetricKey } = useSymmetricKeysStore();

  /**
   * Create a new listing with file encryption and IPFS upload
   */
  const createListing = useCallback(async (
    file: File,
    title: string,
    description: string,
    fileType: string,
    priceUSDT: string,
    onProgress?: (step: string, progress: number) => void
  ) => {
    if (!seed) throw new Error("Wallet not connected");

    // Step 1: Generate ECDH keypair
    onProgress?.("Generating encryption keys...", 10);
    const keyPair = await ensureECDHKeyPair();

    // Step 2: Generate symmetric key
    onProgress?.("Creating encryption key...", 20);
    const symmetricKey = await generateSymmetricKey();

    // Step 3: Hash original file
    onProgress?.("Computing file hash...", 30);
    const contentHash = await hashFile(file);

    // Step 4: Encrypt file
    onProgress?.("Encrypting file...", 45);
    const encryptedFile = await encryptFile(file, symmetricKey);

    // Step 5: Upload to IPFS
    onProgress?.("Uploading to IPFS...", 60);
    const ipfsCid = await uploadToIPFS(encryptedFile);

    // Step 6: Create listing on-chain
    onProgress?.("Creating listing on blockchain...", 80);
    const { txHash, listingId } = await createMarketplaceListing(
      seed,
      keyPair.publicKey,
      contentHash,
      ipfsCid,
      title,
      description,
      fileType,
      file.size,
      priceUSDT,
      network
    );

    // Store symmetric key with listing ID for later (when accepting purchases)
    storeSymmetricKey(listingId, bufferToHex(symmetricKey));

    onProgress?.("Complete!", 100);
    return { txHash, listingId };
  }, [seed, ensureECDHKeyPair, network, storeSymmetricKey]);

  /**
   * Purchase a listing
   */
  const purchaseListing = useCallback(async (
    listingId: string,
    priceRaw: bigint,
    onProgress?: (step: string) => void
  ) => {
    if (!seed || !address) throw new Error("Wallet not connected");

    // Generate buyer's ECDH keypair
    onProgress?.("Generating encryption keys...");
    const keyPair = await ensureECDHKeyPair();

    // Check and approve USDT if needed
    onProgress?.("Checking USDT allowance...");
    const allowance = await getUSDTAllowance(address, network);
    
    if (allowance < priceRaw) {
      onProgress?.("Approving USDT spending...");
      await approveUSDT(seed, priceRaw, network);
    }

    // Purchase the listing
    onProgress?.("Processing purchase...");
    const txHash = await purchaseMarketplaceListing(
      seed,
      listingId,
      keyPair.publicKey,
      network
    );

    return txHash;
  }, [seed, address, ensureECDHKeyPair, network]);

  /**
   * Accept a purchase (seller)
   */
  const acceptPurchase = useCallback(async (
    purchaseId: string,
    listingId: string,
    buyerPublicKey: string,
    onProgress?: (step: string) => void
  ) => {
    if (!seed || !ecdhKeyPair) throw new Error("Wallet not ready");

    // Get stored symmetric key
    const symmetricKeyHex = getSymmetricKey(listingId);
    if (!symmetricKeyHex) {
      throw new Error("Symmetric key not found for this listing");
    }

    // Compute encK
    onProgress?.("Computing encrypted key...");
    const symmetricKey = new Uint8Array(
      symmetricKeyHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
    );
    
    const encKHex = await encryptSymmetricKey(
      symmetricKey,
      ecdhKeyPair.privateKey,
      buyerPublicKey
    );

    // Submit to blockchain
    onProgress?.("Submitting to blockchain...");
    const txHash = await acceptMarketplacePurchase(
      seed,
      purchaseId,
      toBytes32(encKHex),
      network
    );

    return txHash;
  }, [seed, ecdhKeyPair, network, getSymmetricKey]);

  /**
   * Cancel a purchase (buyer)
   */
  const cancelPurchase = useCallback(async (purchaseId: string) => {
    if (!seed) throw new Error("Wallet not connected");
    return cancelMarketplacePurchase(seed, purchaseId, network);
  }, [seed, network]);

  return {
    // Write functions
    createListing,
    purchaseListing,
    acceptPurchase,
    cancelPurchase,
    
    // Read functions (direct re-exports)
    getActiveListings: () => getActiveListings(0, 100, network),
    getListing: (id: string) => getListing(id, network),
    getListingsBySeller: (seller: string) => getListingsBySeller(seller, network),
    getPendingPurchasesForSeller: (seller: string) => getPendingPurchasesForSeller(seller, network),
    getPurchasesByBuyer: (buyer: string) => getPurchasesByBuyer(buyer, network),
    getCompletedPurchasesByBuyer: (buyer: string) => getCompletedPurchasesByBuyer(buyer, network),
  };
}
