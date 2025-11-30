/**
 * Veridy Marketplace Smart Contract Integration
 * Handles all interactions with the deployed marketplace contract
 */

import { 
  createPublicClient, 
  createWalletClient, 
  http, 
  parseUnits,
  formatUnits,
  encodeFunctionData,
  getContract,
  type Address,
  type PublicClient,
  type WalletClient,
} from 'viem';
import { arbitrum, sepolia } from 'viem/chains';
import { mnemonicToAccount } from 'viem/accounts';
import { 
  DataListing, 
  Purchase, 
  Listing, 
  Order, 
  PurchaseStatus,
  parseContractListing,
  parseContractPurchase,
} from './types';

// Contract addresses
export const MARKETPLACE_ADDRESSES = {
  arbitrum: '0xD3A17B869883EAec005620D84B38E68d3c6cF893' as Address,
  sepolia: '0x57b721a1904fb5187b93857f7f38fba80b568f34' as Address,
} as const;

// USDT Contract addresses
export const USDT_ADDRESSES = {
  arbitrum: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9' as Address,
  sepolia: '0x7169D38820dfd117C3FA1f22a697dBA58d90BA06' as Address, // Mock USDT for testing
} as const;

// Default network
export const DEFAULT_NETWORK = 'arbitrum' as const;

// Get chain config
export function getChainConfig(network: 'arbitrum' | 'sepolia' = DEFAULT_NETWORK) {
  return network === 'arbitrum' ? arbitrum : sepolia;
}

// Marketplace Contract ABI (relevant functions only)
export const MARKETPLACE_ABI = [
  // View functions
  {
    name: 'getListing',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '_listingId', type: 'uint256' }],
    outputs: [{
      name: '',
      type: 'tuple',
      components: [
        { name: 'seller', type: 'address' },
        { name: 'sellerPublicKey', type: 'bytes' },
        { name: 'contentHash', type: 'string' },
        { name: 'ipfsCid', type: 'string' },
        { name: 'title', type: 'string' },
        { name: 'description', type: 'string' },
        { name: 'fileType', type: 'string' },
        { name: 'fileSizeBytes', type: 'uint256' },
        { name: 'price', type: 'uint256' },
        { name: 'isActive', type: 'bool' },
        { name: 'sold', type: 'bool' },
        { name: 'createdAt', type: 'uint256' },
      ],
    }],
  },
  {
    name: 'getPurchase',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '_purchaseId', type: 'uint256' }],
    outputs: [{
      name: '',
      type: 'tuple',
      components: [
        { name: 'buyer', type: 'address' },
        { name: 'listingId', type: 'uint256' },
        { name: 'buyerPublicKey', type: 'bytes' },
        { name: 'encK', type: 'bytes32' },
        { name: 'amount', type: 'uint256' },
        { name: 'createdAt', type: 'uint256' },
        { name: 'acceptedAt', type: 'uint256' },
        { name: 'status', type: 'uint8' },
      ],
    }],
  },
  {
    name: 'getActiveListings',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: '_offset', type: 'uint256' },
      { name: '_limit', type: 'uint256' },
    ],
    outputs: [
      { name: 'listingIds', type: 'uint256[]' },
      {
        name: 'dataListings',
        type: 'tuple[]',
        components: [
          { name: 'seller', type: 'address' },
          { name: 'sellerPublicKey', type: 'bytes' },
          { name: 'contentHash', type: 'string' },
          { name: 'ipfsCid', type: 'string' },
          { name: 'title', type: 'string' },
          { name: 'description', type: 'string' },
          { name: 'fileType', type: 'string' },
          { name: 'fileSizeBytes', type: 'uint256' },
          { name: 'price', type: 'uint256' },
          { name: 'isActive', type: 'bool' },
          { name: 'sold', type: 'bool' },
          { name: 'createdAt', type: 'uint256' },
        ],
      },
    ],
  },
  {
    name: 'getListingsBySeller',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '_seller', type: 'address' }],
    outputs: [
      { name: 'listingIds', type: 'uint256[]' },
      {
        name: 'dataListings',
        type: 'tuple[]',
        components: [
          { name: 'seller', type: 'address' },
          { name: 'sellerPublicKey', type: 'bytes' },
          { name: 'contentHash', type: 'string' },
          { name: 'ipfsCid', type: 'string' },
          { name: 'title', type: 'string' },
          { name: 'description', type: 'string' },
          { name: 'fileType', type: 'string' },
          { name: 'fileSizeBytes', type: 'uint256' },
          { name: 'price', type: 'uint256' },
          { name: 'isActive', type: 'bool' },
          { name: 'sold', type: 'bool' },
          { name: 'createdAt', type: 'uint256' },
        ],
      },
    ],
  },
  {
    name: 'getPurchasesByBuyer',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '_buyer', type: 'address' }],
    outputs: [
      { name: 'purchaseIds', type: 'uint256[]' },
      {
        name: 'purchaseData',
        type: 'tuple[]',
        components: [
          { name: 'buyer', type: 'address' },
          { name: 'listingId', type: 'uint256' },
          { name: 'buyerPublicKey', type: 'bytes' },
          { name: 'encK', type: 'bytes32' },
          { name: 'amount', type: 'uint256' },
          { name: 'createdAt', type: 'uint256' },
          { name: 'acceptedAt', type: 'uint256' },
          { name: 'status', type: 'uint8' },
        ],
      },
    ],
  },
  {
    name: 'getPendingPurchasesForSeller',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '_seller', type: 'address' }],
    outputs: [
      { name: 'purchaseIds', type: 'uint256[]' },
      {
        name: 'purchaseData',
        type: 'tuple[]',
        components: [
          { name: 'buyer', type: 'address' },
          { name: 'listingId', type: 'uint256' },
          { name: 'buyerPublicKey', type: 'bytes' },
          { name: 'encK', type: 'bytes32' },
          { name: 'amount', type: 'uint256' },
          { name: 'createdAt', type: 'uint256' },
          { name: 'acceptedAt', type: 'uint256' },
          { name: 'status', type: 'uint8' },
        ],
      },
    ],
  },
  {
    name: 'getCompletedPurchasesByBuyer',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '_buyer', type: 'address' }],
    outputs: [
      { name: 'purchaseIds', type: 'uint256[]' },
      {
        name: 'purchaseData',
        type: 'tuple[]',
        components: [
          { name: 'buyer', type: 'address' },
          { name: 'listingId', type: 'uint256' },
          { name: 'buyerPublicKey', type: 'bytes' },
          { name: 'encK', type: 'bytes32' },
          { name: 'amount', type: 'uint256' },
          { name: 'createdAt', type: 'uint256' },
          { name: 'acceptedAt', type: 'uint256' },
          { name: 'status', type: 'uint8' },
        ],
      },
    ],
  },
  {
    name: 'hasBuyerPurchasedListing',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: '_listingId', type: 'uint256' },
      { name: '_buyer', type: 'address' },
    ],
    outputs: [
      { name: 'hasAccepted', type: 'bool' },
      { name: 'purchaseId', type: 'uint256' },
    ],
  },
  {
    name: 'getTotalListings',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'getTotalPurchases',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'usdt',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
  // Write functions
  {
    name: 'createListing',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: '_sellerPublicKey', type: 'bytes' },
      { name: '_contentHash', type: 'string' },
      { name: '_ipfsCid', type: 'string' },
      { name: '_title', type: 'string' },
      { name: '_description', type: 'string' },
      { name: '_fileType', type: 'string' },
      { name: '_fileSizeBytes', type: 'uint256' },
      { name: '_price', type: 'uint256' },
    ],
    outputs: [{ name: 'listingId', type: 'uint256' }],
  },
  {
    name: 'updateListing',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: '_listingId', type: 'uint256' },
      { name: '_title', type: 'string' },
      { name: '_description', type: 'string' },
      { name: '_price', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    name: 'deactivateListing',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: '_listingId', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'reactivateListing',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: '_listingId', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'purchaseListing',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: '_listingId', type: 'uint256' },
      { name: '_buyerPublicKey', type: 'bytes' },
    ],
    outputs: [{ name: 'purchaseId', type: 'uint256' }],
  },
  {
    name: 'acceptPurchase',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: '_purchaseId', type: 'uint256' },
      { name: '_encK', type: 'bytes32' },
    ],
    outputs: [],
  },
  {
    name: 'cancelPurchase',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: '_purchaseId', type: 'uint256' }],
    outputs: [],
  },
] as const;

// ERC20 ABI for USDT approve
export const ERC20_ABI = [
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

// Create clients
let publicClient: PublicClient | null = null;
let walletClient: WalletClient | null = null;
let currentNetwork: 'arbitrum' | 'sepolia' = DEFAULT_NETWORK;

export function getPublicClient(network: 'arbitrum' | 'sepolia' = DEFAULT_NETWORK): PublicClient {
  if (!publicClient || currentNetwork !== network) {
    const chain = getChainConfig(network);
    publicClient = createPublicClient({
      chain,
      transport: http(),
    });
    currentNetwork = network;
  }
  return publicClient;
}

export function getWalletClient(seedPhrase: string, network: 'arbitrum' | 'sepolia' = DEFAULT_NETWORK): WalletClient {
  const chain = getChainConfig(network);
  const account = mnemonicToAccount(seedPhrase);
  return createWalletClient({
    account,
    chain,
    transport: http(),
  });
}

// ============ READ FUNCTIONS ============

/**
 * Get active listings from the marketplace
 */
export async function getActiveListings(
  offset: number = 0,
  limit: number = 50,
  network: 'arbitrum' | 'sepolia' = DEFAULT_NETWORK
): Promise<Listing[]> {
  const client = getPublicClient(network);
  const contractAddress = MARKETPLACE_ADDRESSES[network];

  try {
    const result = await client.readContract({
      address: contractAddress,
      abi: MARKETPLACE_ABI,
      functionName: 'getActiveListings',
      args: [BigInt(offset), BigInt(limit)],
    }) as [bigint[], DataListing[]];

    const [listingIds, dataListings] = result;
    
    return listingIds.map((id, index) => {
      const data = dataListings[index];
      return parseContractListing(id, {
        ...data,
        sellerPublicKey: typeof data.sellerPublicKey === 'string' 
          ? data.sellerPublicKey 
          : bytesToHex(data.sellerPublicKey as unknown as Uint8Array),
      });
    });
  } catch (error) {
    console.error('Error fetching active listings:', error);
    return [];
  }
}

/**
 * Get a single listing by ID
 */
export async function getListing(
  listingId: string,
  network: 'arbitrum' | 'sepolia' = DEFAULT_NETWORK
): Promise<Listing | null> {
  const client = getPublicClient(network);
  const contractAddress = MARKETPLACE_ADDRESSES[network];

  try {
    const data = await client.readContract({
      address: contractAddress,
      abi: MARKETPLACE_ABI,
      functionName: 'getListing',
      args: [BigInt(listingId)],
    }) as DataListing;

    return parseContractListing(BigInt(listingId), {
      ...data,
      sellerPublicKey: typeof data.sellerPublicKey === 'string'
        ? data.sellerPublicKey
        : bytesToHex(data.sellerPublicKey as unknown as Uint8Array),
    });
  } catch (error) {
    console.error('Error fetching listing:', error);
    return null;
  }
}

/**
 * Get listings by seller address
 */
export async function getListingsBySeller(
  sellerAddress: string,
  network: 'arbitrum' | 'sepolia' = DEFAULT_NETWORK
): Promise<Listing[]> {
  const client = getPublicClient(network);
  const contractAddress = MARKETPLACE_ADDRESSES[network];

  try {
    const result = await client.readContract({
      address: contractAddress,
      abi: MARKETPLACE_ABI,
      functionName: 'getListingsBySeller',
      args: [sellerAddress as Address],
    }) as [bigint[], DataListing[]];

    const [listingIds, dataListings] = result;
    
    return listingIds.map((id, index) => {
      const data = dataListings[index];
      return parseContractListing(id, {
        ...data,
        sellerPublicKey: typeof data.sellerPublicKey === 'string'
          ? data.sellerPublicKey
          : bytesToHex(data.sellerPublicKey as unknown as Uint8Array),
      });
    });
  } catch (error) {
    console.error('Error fetching seller listings:', error);
    return [];
  }
}

/**
 * Get pending purchases for a seller
 */
export async function getPendingPurchasesForSeller(
  sellerAddress: string,
  network: 'arbitrum' | 'sepolia' = DEFAULT_NETWORK
): Promise<Order[]> {
  const client = getPublicClient(network);
  const contractAddress = MARKETPLACE_ADDRESSES[network];

  try {
    const result = await client.readContract({
      address: contractAddress,
      abi: MARKETPLACE_ABI,
      functionName: 'getPendingPurchasesForSeller',
      args: [sellerAddress as Address],
    }) as [bigint[], Purchase[]];

    const [purchaseIds, purchaseData] = result;
    
    // Fetch listing details for each purchase
    const orders: Order[] = [];
    for (let i = 0; i < purchaseIds.length; i++) {
      const purchase = purchaseData[i];
      const listing = await getListing(purchase.listingId.toString(), network);
      
      orders.push(parseContractPurchase(purchaseIds[i], {
        ...purchase,
        buyerPublicKey: typeof purchase.buyerPublicKey === 'string'
          ? purchase.buyerPublicKey
          : bytesToHex(purchase.buyerPublicKey as unknown as Uint8Array),
        encK: typeof purchase.encK === 'string'
          ? purchase.encK
          : bytesToHex(purchase.encK as unknown as Uint8Array),
      }, listing || undefined));
    }
    
    return orders;
  } catch (error) {
    console.error('Error fetching pending purchases:', error);
    return [];
  }
}

/**
 * Get purchases by buyer address
 */
export async function getPurchasesByBuyer(
  buyerAddress: string,
  network: 'arbitrum' | 'sepolia' = DEFAULT_NETWORK
): Promise<Order[]> {
  const client = getPublicClient(network);
  const contractAddress = MARKETPLACE_ADDRESSES[network];

  try {
    const result = await client.readContract({
      address: contractAddress,
      abi: MARKETPLACE_ABI,
      functionName: 'getPurchasesByBuyer',
      args: [buyerAddress as Address],
    }) as [bigint[], Purchase[]];

    const [purchaseIds, purchaseData] = result;
    
    const orders: Order[] = [];
    for (let i = 0; i < purchaseIds.length; i++) {
      const purchase = purchaseData[i];
      const listing = await getListing(purchase.listingId.toString(), network);
      
      orders.push(parseContractPurchase(purchaseIds[i], {
        ...purchase,
        buyerPublicKey: typeof purchase.buyerPublicKey === 'string'
          ? purchase.buyerPublicKey
          : bytesToHex(purchase.buyerPublicKey as unknown as Uint8Array),
        encK: typeof purchase.encK === 'string'
          ? purchase.encK
          : bytesToHex(purchase.encK as unknown as Uint8Array),
      }, listing || undefined));
    }
    
    return orders;
  } catch (error) {
    console.error('Error fetching buyer purchases:', error);
    return [];
  }
}

/**
 * Get completed purchases by buyer
 */
export async function getCompletedPurchasesByBuyer(
  buyerAddress: string,
  network: 'arbitrum' | 'sepolia' = DEFAULT_NETWORK
): Promise<Order[]> {
  const client = getPublicClient(network);
  const contractAddress = MARKETPLACE_ADDRESSES[network];

  try {
    const result = await client.readContract({
      address: contractAddress,
      abi: MARKETPLACE_ABI,
      functionName: 'getCompletedPurchasesByBuyer',
      args: [buyerAddress as Address],
    }) as [bigint[], Purchase[]];

    const [purchaseIds, purchaseData] = result;
    
    const orders: Order[] = [];
    for (let i = 0; i < purchaseIds.length; i++) {
      const purchase = purchaseData[i];
      const listing = await getListing(purchase.listingId.toString(), network);
      
      orders.push(parseContractPurchase(purchaseIds[i], {
        ...purchase,
        buyerPublicKey: typeof purchase.buyerPublicKey === 'string'
          ? purchase.buyerPublicKey
          : bytesToHex(purchase.buyerPublicKey as unknown as Uint8Array),
        encK: typeof purchase.encK === 'string'
          ? purchase.encK
          : bytesToHex(purchase.encK as unknown as Uint8Array),
      }, listing || undefined));
    }
    
    return orders;
  } catch (error) {
    console.error('Error fetching completed purchases:', error);
    return [];
  }
}

/**
 * Check USDT allowance
 */
export async function getUSDTAllowance(
  ownerAddress: string,
  network: 'arbitrum' | 'sepolia' = DEFAULT_NETWORK
): Promise<bigint> {
  const client = getPublicClient(network);
  const usdtAddress = USDT_ADDRESSES[network];
  const marketplaceAddress = MARKETPLACE_ADDRESSES[network];

  try {
    return await client.readContract({
      address: usdtAddress,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [ownerAddress as Address, marketplaceAddress],
    }) as bigint;
  } catch (error) {
    console.error('Error checking allowance:', error);
    return BigInt(0);
  }
}

// ============ WRITE FUNCTIONS ============

// Event ABI for ListingCreated
const LISTING_CREATED_EVENT = {
  type: 'event',
  name: 'ListingCreated',
  inputs: [
    { name: 'listingId', type: 'uint256', indexed: true },
    { name: 'seller', type: 'address', indexed: true },
    { name: 'title', type: 'string', indexed: false },
    { name: 'price', type: 'uint256', indexed: false },
    { name: 'ipfsCid', type: 'string', indexed: false },
  ],
} as const;

/**
 * Create a new listing
 * Returns: { txHash, listingId }
 */
export async function createListing(
  seedPhrase: string,
  sellerPublicKey: string,
  contentHash: string,
  ipfsCid: string,
  title: string,
  description: string,
  fileType: string,
  fileSizeBytes: number,
  priceUSDT: string,
  network: 'arbitrum' | 'sepolia' = DEFAULT_NETWORK
): Promise<{ txHash: string; listingId: string }> {
  const walletClient = getWalletClient(seedPhrase, network);
  const contractAddress = MARKETPLACE_ADDRESSES[network];
  const priceInSmallestUnit = parseUnits(priceUSDT, 6); // USDT has 6 decimals

  const account = mnemonicToAccount(seedPhrase);

  const hash = await walletClient.writeContract({
    address: contractAddress,
    abi: MARKETPLACE_ABI,
    functionName: 'createListing',
    args: [
      `0x${sellerPublicKey.replace('0x', '')}` as `0x${string}`,
      contentHash,
      ipfsCid,
      title,
      description,
      fileType,
      BigInt(fileSizeBytes),
      priceInSmallestUnit,
    ],
    account,
  });

  // Wait for transaction receipt and extract listing ID from events
  const client = getPublicClient(network);
  const receipt = await client.waitForTransactionReceipt({ hash });
  
  // Parse the ListingCreated event to get the listing ID
  let listingId = '0';
  for (const log of receipt.logs) {
    try {
      // Check if this log is from our contract
      if (log.address.toLowerCase() === contractAddress.toLowerCase()) {
        // The first topic is the event signature, the second is the indexed listingId
        if (log.topics[1]) {
          listingId = BigInt(log.topics[1]).toString();
          break;
        }
      }
    } catch (e) {
      // Continue to next log
    }
  }
  
  return { txHash: hash, listingId };
}

/**
 * Approve USDT spending for the marketplace
 */
export async function approveUSDT(
  seedPhrase: string,
  amount: bigint,
  network: 'arbitrum' | 'sepolia' = DEFAULT_NETWORK
): Promise<string> {
  const walletClient = getWalletClient(seedPhrase, network);
  const usdtAddress = USDT_ADDRESSES[network];
  const marketplaceAddress = MARKETPLACE_ADDRESSES[network];
  const account = mnemonicToAccount(seedPhrase);

  const hash = await walletClient.writeContract({
    address: usdtAddress,
    abi: ERC20_ABI,
    functionName: 'approve',
    args: [marketplaceAddress, amount],
    account,
  });

  const client = getPublicClient(network);
  await client.waitForTransactionReceipt({ hash });
  
  return hash;
}

/**
 * Purchase a listing
 */
export async function purchaseListing(
  seedPhrase: string,
  listingId: string,
  buyerPublicKey: string,
  network: 'arbitrum' | 'sepolia' = DEFAULT_NETWORK
): Promise<string> {
  const walletClient = getWalletClient(seedPhrase, network);
  const contractAddress = MARKETPLACE_ADDRESSES[network];
  const account = mnemonicToAccount(seedPhrase);

  const hash = await walletClient.writeContract({
    address: contractAddress,
    abi: MARKETPLACE_ABI,
    functionName: 'purchaseListing',
    args: [
      BigInt(listingId),
      `0x${buyerPublicKey.replace('0x', '')}` as `0x${string}`,
    ],
    account,
  });

  const client = getPublicClient(network);
  await client.waitForTransactionReceipt({ hash });
  
  return hash;
}

/**
 * Accept a purchase (seller)
 */
export async function acceptPurchase(
  seedPhrase: string,
  purchaseId: string,
  encK: string, // bytes32 hex
  network: 'arbitrum' | 'sepolia' = DEFAULT_NETWORK
): Promise<string> {
  const walletClient = getWalletClient(seedPhrase, network);
  const contractAddress = MARKETPLACE_ADDRESSES[network];
  const account = mnemonicToAccount(seedPhrase);

  // Ensure encK is properly formatted as bytes32
  const encKBytes32 = encK.startsWith('0x') ? encK : `0x${encK}`;

  const hash = await walletClient.writeContract({
    address: contractAddress,
    abi: MARKETPLACE_ABI,
    functionName: 'acceptPurchase',
    args: [BigInt(purchaseId), encKBytes32 as `0x${string}`],
    account,
  });

  const client = getPublicClient(network);
  await client.waitForTransactionReceipt({ hash });
  
  return hash;
}

/**
 * Cancel a purchase (buyer)
 */
export async function cancelPurchase(
  seedPhrase: string,
  purchaseId: string,
  network: 'arbitrum' | 'sepolia' = DEFAULT_NETWORK
): Promise<string> {
  const walletClient = getWalletClient(seedPhrase, network);
  const contractAddress = MARKETPLACE_ADDRESSES[network];
  const account = mnemonicToAccount(seedPhrase);

  const hash = await walletClient.writeContract({
    address: contractAddress,
    abi: MARKETPLACE_ABI,
    functionName: 'cancelPurchase',
    args: [BigInt(purchaseId)],
    account,
  });

  const client = getPublicClient(network);
  await client.waitForTransactionReceipt({ hash });
  
  return hash;
}

/**
 * Deactivate a listing (seller)
 */
export async function deactivateListing(
  seedPhrase: string,
  listingId: string,
  network: 'arbitrum' | 'sepolia' = DEFAULT_NETWORK
): Promise<string> {
  const walletClient = getWalletClient(seedPhrase, network);
  const contractAddress = MARKETPLACE_ADDRESSES[network];
  const account = mnemonicToAccount(seedPhrase);

  const hash = await walletClient.writeContract({
    address: contractAddress,
    abi: MARKETPLACE_ABI,
    functionName: 'deactivateListing',
    args: [BigInt(listingId)],
    account,
  });

  const client = getPublicClient(network);
  await client.waitForTransactionReceipt({ hash });
  
  return hash;
}

/**
 * Reactivate a listing (seller)
 */
export async function reactivateListing(
  seedPhrase: string,
  listingId: string,
  network: 'arbitrum' | 'sepolia' = DEFAULT_NETWORK
): Promise<string> {
  const walletClient = getWalletClient(seedPhrase, network);
  const contractAddress = MARKETPLACE_ADDRESSES[network];
  const account = mnemonicToAccount(seedPhrase);

  const hash = await walletClient.writeContract({
    address: contractAddress,
    abi: MARKETPLACE_ABI,
    functionName: 'reactivateListing',
    args: [BigInt(listingId)],
    account,
  });

  const client = getPublicClient(network);
  await client.waitForTransactionReceipt({ hash });
  
  return hash;
}

// Helper function to convert bytes to hex
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

