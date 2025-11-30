import WDK from '@tetherto/wdk'
import { Client } from 'viem';

// Smart Contract Types - matching the Veridy Marketplace contract

export enum PurchaseStatus {
  None = 0,      // Not a valid purchase
  Escrowed = 1,  // Buyer paid, waiting for seller to accept
  Accepted = 2,  // Seller accepted, buyer can decrypt the file
  Cancelled = 3  // Buyer cancelled or auto-refunded
}

export interface DataListing {
  seller: string;           // Seller's wallet address
  sellerPublicKey: string;  // Seller's ECDH public key (hex)
  contentHash: string;      // SHA-256 hash of the original unencrypted file
  ipfsCid: string;          // IPFS CID of the encrypted file
  title: string;            // Listing title
  description: string;      // Listing description
  fileType: string;         // File type (e.g., "csv", "json", "image/png")
  fileSizeBytes: bigint;    // Original file size in bytes
  price: bigint;            // Price in USDT (6 decimals, e.g., 1000000 = 1 USDT)
  isActive: boolean;        // Whether listing is available for purchase
  sold: boolean;            // Whether listing has been sold
  createdAt: bigint;        // Unix timestamp of creation
}

export interface Purchase {
  buyer: string;            // Buyer's wallet address
  listingId: bigint;        // ID of the listing being purchased
  buyerPublicKey: string;   // Buyer's ECDH public key (hex)
  encK: string;             // Encrypted symmetric key (bytes32 hex, set when seller accepts)
  amount: bigint;           // USDT amount in escrow (6 decimals)
  createdAt: bigint;        // Unix timestamp of purchase creation
  acceptedAt: bigint;       // Unix timestamp when seller accepted (0 if pending)
  status: PurchaseStatus;   // Purchase status
}

// Frontend-friendly versions with parsed values
export interface Listing {
  id: string;
  seller: string;
  sellerPublicKey: string;
  contentHash: string;
  ipfsCid: string;
  title: string;
  description: string;
  category: string;         // Derived from fileType or metadata
  fileType: string;
  fileSize: number;
  price: string;            // Human readable price in USDT
  priceRaw: bigint;         // Raw price in USDT (6 decimals)
  isActive: boolean;
  sold: boolean;
  createdAt: number;
}

export interface Order {
  id: string;
  listingId: string;
  listing?: Listing;        // Optional listing details
  buyer: string;
  buyerPublicKey: string;
  encK: string;
  amount: string;           // Human readable amount in USDT
  amountRaw: bigint;        // Raw amount in USDT (6 decimals)
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  purchaseStatus: PurchaseStatus;
  createdAt: number;
  acceptedAt: number;
}

// ECDH Keypair for encryption
export interface ECDHKeyPair {
  publicKey: string;        // Hex encoded public key
  privateKey: string;       // Hex encoded private key
}

export interface WalletData {
  address: string;
  seed: string;
  ecdhKeyPair?: ECDHKeyPair; // ECDH keypair for marketplace encryption
}

export interface SwapQuote {
  outputAmount: bigint;
}

export interface InitProviders {
  wallet: WDK
  viem: Client
}

export interface TokenTransfer {
  blockchain: string;
  blockNumber: number;
  transactionHash: string;
  transferIndex: number;
  token: string;
  amount: string;       // API returns string for big numbers
  timestamp: number;
  transactionIndex: number;
  logIndex: number;
  from: string;
  to: string;
}

// Helper to convert contract DataListing to frontend Listing
export function parseContractListing(id: bigint, data: DataListing): Listing {
  const fileType = data.fileType.toLowerCase();
  let category = 'other';

  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].some(ext => fileType.includes(ext))) {
    category = 'images';
  } else if (['mp4', 'mov', 'avi', 'webm', 'mkv'].some(ext => fileType.includes(ext))) {
    category = 'videos';
  } else if (['pdf', 'doc', 'docx', 'txt', 'md'].some(ext => fileType.includes(ext))) {
    category = 'documents';
  } else if (['mp3', 'wav', 'ogg', 'flac', 'aac'].some(ext => fileType.includes(ext))) {
    category = 'audio';
  } else if (['glb', 'gltf', 'obj', 'fbx', 'stl'].some(ext => fileType.includes(ext))) {
    category = '3d-models';
  } else if (['csv', 'json', 'xml', 'parquet'].some(ext => fileType.includes(ext))) {
    category = 'datasets';
  } else if (['js', 'ts', 'py', 'rs', 'go', 'sol', 'zip', 'tar'].some(ext => fileType.includes(ext))) {
    category = 'code';
  }

  return {
    id: id.toString(),
    seller: data.seller,
    sellerPublicKey: data.sellerPublicKey,
    contentHash: data.contentHash,
    ipfsCid: data.ipfsCid,
    title: data.title,
    description: data.description,
    category,
    fileType: data.fileType,
    fileSize: Number(data.fileSizeBytes),
    price: (Number(data.price) / 1_000_000).toFixed(2),
    priceRaw: data.price,
    isActive: data.isActive,
    sold: data.sold,
    createdAt: Number(data.createdAt) * 1000,
  };
}

// Helper to convert contract Purchase to frontend Order
export function parseContractPurchase(id: bigint, data: Purchase, listing?: Listing): Order {
  let status: 'PENDING' | 'APPROVED' | 'REJECTED' = 'PENDING';
  if (data.status === PurchaseStatus.Accepted) {
    status = 'APPROVED';
  } else if (data.status === PurchaseStatus.Cancelled) {
    status = 'REJECTED';
  }

  return {
    id: id.toString(),
    listingId: data.listingId.toString(),
    listing,
    buyer: data.buyer,
    buyerPublicKey: data.buyerPublicKey,
    encK: data.encK,
    amount: (Number(data.amount) / 1_000_000).toFixed(2),
    amountRaw: data.amount,
    status,
    purchaseStatus: data.status,
    createdAt: Number(data.createdAt) * 1000,
    acceptedAt: Number(data.acceptedAt) * 1000,
  };
}
