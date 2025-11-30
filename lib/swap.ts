import { SwapQuote } from "./types";
import { SWAP_TOKENS, USDT_TOKEN } from "@/constants/tokens";
// import { swapProtocol } from "./wdk";
import { formatUnits } from "viem";
import { WalletAccountEvm } from "@tetherto/wdk-wallet-evm";
import veloraProtocolEvm from "@tetherto/wdk-protocol-swap-velora-evm";
import { useWalletStore } from "./store";

const account = new WalletAccountEvm(JSON.parse(localStorage.getItem("wallet-storage")!).state.wallet.seed, "0'/0/0", {
  provider: 'https://arb1.arbitrum.io/rpc'
})

const swapProtocol = new veloraProtocolEvm(account)

// Get supported tokens for swap
// Get token balance
export const getTokenBalance = async (
  tokenAddress: string,
  walletAddress: string
): Promise<string> => {
  console.log("Getting token balance...", { tokenAddress, walletAddress });
  return "100.00";
};


// Get swap quote (estimated output)
export const getSwapQuote = async (
  fromToken: string,
  toToken: string,
  amount: bigint
): Promise<SwapQuote> => {
  try {
    console.log("Getting swap quote...", { fromToken, toToken, amount });

    const quote = await swapProtocol.quoteSwap({
      tokenIn: fromToken,
      tokenOut: toToken,
      tokenInAmount: amount
    })

    return {
      outputAmount: quote.tokenOutAmount,
    };
  } catch (error) {
    throw new Error((error as Error).message)
  }
};

// Execute token swap
export const executeSwap = async (
  fromToken: string,
  toToken: string,
  amount: bigint
): Promise<string> => {
  try {
    const result = await swapProtocol.swap({
      tokenIn: fromToken,
      tokenOut: toToken,
      tokenInAmount: amount,
    });

    return result.hash;
  } catch (error) {
    throw new Error((error as Error).message);
  }
};

// Get real-time exchange rate
export const getExchangeRate = async (
  fromToken: string,
  toToken: string
): Promise<string> => {
  console.log("Getting exchange rate...", { fromToken, toToken });
  return "1.0";
};

