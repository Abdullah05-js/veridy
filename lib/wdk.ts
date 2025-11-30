import { sepoliaConfigPimlico, CHAIN } from "@/constants/tokens";
import { TokenTransfer, WalletData } from "./types";
import WDK from '@tetherto/wdk'
import WalletManagerEvm from '@tetherto/wdk-wallet-evm'
import { createPublicClient, http, createWalletClient, PublicClient, WalletClient, formatEther, parseEther, formatUnits } from 'viem'
import { InitProviders } from "./types";
import { mnemonicToAccount } from "viem/accounts";
import veloraProtocolEvm from '@tetherto/wdk-protocol-swap-velora-evm'
import { WalletAccountEvm } from '@tetherto/wdk-wallet-evm'


export let walletClient: WalletClient
export let publicClient: PublicClient
export let swapProtocol: veloraProtocolEvm

const initializedWDK = (seedPhrase: string): InitProviders => {
  try {

    if (!publicClient) {

      publicClient = createPublicClient({
        chain: CHAIN,
        transport: http(process.env.SEPOLIA_RPC_URL)
      })

      const account = mnemonicToAccount(seedPhrase)
      walletClient = createWalletClient({
        account,
        chain: CHAIN,
        transport: http(process.env.SEPOLIA_RPC_URL)
      })

    }
    const wallet = (new WDK(seedPhrase)).registerWallet('ethereum', WalletManagerEvm, sepoliaConfigPimlico)
    const account = new WalletAccountEvm(seedPhrase, "0'/0/0", {
      provider: 'https://ethereum-rpc.publicnode.com'
    })

    // Create swap service
    swapProtocol = new veloraProtocolEvm(account)

    return {
      wallet,
      viem: publicClient
    }
  } catch (error) {
    throw new Error((error as Error).message)
  }
}


// Create new wallet
export const createWallet = async (): Promise<WalletData> => {
  try {

    const seed = WDK.getRandomSeedPhrase()
    const wallet = initializedWDK(seed).wallet
    const account = await wallet.getAccount("ethereum", 0)
    const address = await account.getAddress()

    return {
      address: address,
      seed,
    };
  } catch (error) {
    throw new Error((error as Error).message)
  }
};

// Import wallet from seed
export const importWallet = async (seedPhrase: string): Promise<WalletData> => {
  try {
    const wallet = initializedWDK(seedPhrase).wallet
    const account = await wallet.getAccount("ethereum", 0)
    const address = await account.getAddress()
    return {
      address: address,
      seed: seedPhrase,
    };
  } catch (error) {
    throw new Error((error as Error).message)
  }
};

export async function getBalanceUSDT(address: string) {
  try {
    const res = await fetch(`/api/usdt-balance?address=${address}&chain=arbitrum`);
    const data = await res.json();
    return data.tokenBalance.amount;
  } catch (error) {
    throw new Error((error as Error).message)
  }
}

export async function getUsdtTransfers(address: string, chain = "arbitrum", token = "usdt"): Promise<TokenTransfer[]> {
  try {
    const res = await fetch(`/api/usdt-transfers?address=${address}&chain=${chain}&token=${token}`);
    const data = await res.json()
    return data.transfers
  } catch (error) {
    throw new Error((error as Error).message)
  }
}