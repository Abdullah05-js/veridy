import { CHAIN, RPC_URL } from "@/constants/tokens";
import { TokenTransfer, WalletData } from "./types";
import WDK from '@tetherto/wdk'
import WalletManagerEvm, { WalletAccountEvm } from '@tetherto/wdk-wallet-evm'
import { createPublicClient, http, createWalletClient, PublicClient, WalletClient } from 'viem'
import { mnemonicToAccount } from "viem/accounts";

class WDKService {
  private static instance: WDKService;
  public wdk: WDK | null = null;
  public publicClient: PublicClient;
  public walletClient: WalletClient | null = null;
  private seed: string | null = null;

  private constructor() {
    this.publicClient = createPublicClient({
      chain: CHAIN,
      transport: http(RPC_URL)
    });
  }

  public static getInstance(): WDKService {
    if (!WDKService.instance) {
      WDKService.instance = new WDKService();
    }
    return WDKService.instance;
  }

  public initialize(seedPhrase: string) {
    try {
      this.seed = seedPhrase;
      
      // Initialize Viem Wallet Client
      const account = mnemonicToAccount(seedPhrase);
      this.walletClient = createWalletClient({
        account,
        chain: CHAIN,
        transport: http(RPC_URL)
      });

      // Initialize WDK
      this.wdk = new WDK(seedPhrase);
      this.wdk.registerWallet('ethereum', WalletManagerEvm, {
        provider: RPC_URL
      });

      return this;
    } catch (error) {
      console.error("Failed to initialize WDK:", error);
      throw error;
    }
  }

  public getWDK(): WDK {
    if (!this.wdk) {
      throw new Error("WDK not initialized");
    }
    return this.wdk;
  }

  public getWalletClient(): WalletClient {
    if (!this.walletClient) {
      throw new Error("Wallet Client not initialized");
    }
    return this.walletClient;
  }

  public getSwapAccount(): WalletAccountEvm {
    if (!this.seed) {
      throw new Error("WDK not initialized with seed");
    }
    return new WalletAccountEvm(this.seed, "0'/0/0", {
      provider: RPC_URL
    });
  }
}

export const wdkService = WDKService.getInstance();

// Create new wallet
export const createWallet = async (): Promise<WalletData> => {
  try {
    const seed = WDK.getRandomSeedPhrase();
    wdkService.initialize(seed);
    
    const wdk = wdkService.getWDK();
    const account = await wdk.getAccount("ethereum", 0);
    const address = await account.getAddress();

    return {
      address: address,
      seed,
    };
  } catch (error) {
    throw new Error((error as Error).message);
  }
};

// Import wallet from seed
export const importWallet = async (seedPhrase: string): Promise<WalletData> => {
  try {
    wdkService.initialize(seedPhrase);
    
    const wdk = wdkService.getWDK();
    const account = await wdk.getAccount("ethereum", 0);
    const address = await account.getAddress();

    return {
      address: address,
      seed: seedPhrase,
    };
  } catch (error) {
    throw new Error((error as Error).message);
  }
};

export async function getBalanceUSDT(address: string) {
  try {
    const res = await fetch(`/api/usdt-balance?address=${address}&chain=arbitrum`);
    const data = await res.json();
    return data.tokenBalance.amount;
  } catch (error) {
    throw new Error((error as Error).message);
  }
}

export async function getUsdtTransfers(address: string, chain = "arbitrum", token = "usdt"): Promise<TokenTransfer[]> {
  try {
    const res = await fetch(`/api/usdt-transfers?address=${address}&chain=${chain}&token=${token}`);
    const data = await res.json();
    return data.transfers;
  } catch (error) {
    throw new Error((error as Error).message);
  }
}
