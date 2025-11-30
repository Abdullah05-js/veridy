import WDK from '@tetherto/wdk'
import { Client } from 'viem';


export interface Listing {
  id: string;
  arweaveTxId: string;
  title: string;
  category: string;
  description: string;
  price: string; // USDT amount
  seller: string;
  fileSize: number;
  createdAt: number;
}

export interface Order {
  id: string;
  listingId: string;
  buyer: string;
  amount: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: number;
}

export interface WalletData {
  address: string;
  seed: string
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
