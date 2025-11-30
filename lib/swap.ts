import { SwapQuote, Token } from "./types";
import { SWAP_TOKENS, USDT_TOKEN } from "@/constants/tokens";

// Get supported tokens for swap
export const getSupportedTokens = async (): Promise<Token[]> => {
  return [...SWAP_TOKENS, USDT_TOKEN];
};

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
  amount: string
): Promise<SwapQuote> => {
  console.log("Getting swap quote...", { fromToken, toToken, amount });
  return {
    fromToken,
    toToken,
    inputAmount: amount,
    outputAmount: (parseFloat(amount) * 0.98).toString(), // Mock
    executionPrice: "0.98",
    priceImpact: "0.1%",
  };
};

// Execute token swap
export const executeSwap = async (
  fromToken: string,
  toToken: string,
  amount: string,
  slippage: number
): Promise<string> => {
  console.log("Executing swap...", { fromToken, toToken, amount, slippage });
  return "0xMockSwapTxHash...";
};

// Get real-time exchange rate
export const getExchangeRate = async (
  fromToken: string,
  toToken: string
): Promise<string> => {
  console.log("Getting exchange rate...", { fromToken, toToken });
  return "1.0";
};

