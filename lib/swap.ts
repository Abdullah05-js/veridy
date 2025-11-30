import { wdkService } from "@/lib/wdk";
import veloraProtocolEvm from "@tetherto/wdk-protocol-swap-velora-evm";

// ============================================
// SWAP MODE CONFIGURATION
// Set to `true` for mock/testing, `false` for real swaps
// ============================================
export const USE_MOCK_SWAP = true;

// Swap protocol configuration
const SWAP_CONFIG = {
  swapMaxFee: BigInt(100000) // Max fee in base units (0.1 USDT)
};

// ============================================
// MOCK PRICE STATE (stable with minimal drift)
// ============================================
const MOCK_BASE_PRICES = {
  // WETH base price ~$2998.05
  WETH: 2998.05,
  // USDC is stable 1:1
  USDC: 1.0,
};

// Store current mock prices (stable, only tiny drift)
let currentMockPrices = { ...MOCK_BASE_PRICES };
let lastPriceUpdate = 0;

// Apply very small drift to price (±0.05% max, changes slowly)
const applyMinimalDrift = (currentPrice: number, basePrice: number, maxDriftPercent: number = 0.05): number => {
  // Small random step towards or away from base
  const step = (Math.random() - 0.5) * 0.02 * (maxDriftPercent / 100) * basePrice;
  let newPrice = currentPrice + step;
  
  // Keep within bounds of base ± maxDriftPercent
  const maxPrice = basePrice * (1 + maxDriftPercent / 100);
  const minPrice = basePrice * (1 - maxDriftPercent / 100);
  newPrice = Math.max(minPrice, Math.min(maxPrice, newPrice));
  
  return newPrice;
};

// Update mock prices only every 10 seconds (very stable)
const updateMockPrices = () => {
  const now = Date.now();
  if (now - lastPriceUpdate < 10000) return; // Only update every 10 seconds
  
  lastPriceUpdate = now;
  
  // WETH drifts very slightly ±0.05%
  currentMockPrices.WETH = applyMinimalDrift(currentMockPrices.WETH, MOCK_BASE_PRICES.WETH, 0.05);
  // USDC stays essentially stable
  currentMockPrices.USDC = 1.0;
};

// Get current mock rate for a token
const getMockRate = (tokenAddress: string): number => {
  const normalizedAddress = tokenAddress.toLowerCase();
  
  // WETH on Arbitrum
  if (normalizedAddress === "0x82af49447d8a07e3bd95bd0d56f35241523fbab1") {
    return currentMockPrices.WETH;
  }
  // USDC on Arbitrum
  if (normalizedAddress === "0xaf88d065e77c8cc2239327c5edb3a432268e5831") {
    return currentMockPrices.USDC;
  }
  
  return 1;
};

// Helper to get initialized swap protocol (real mode only)
const getSwapProtocol = () => {
  try {
    const account = wdkService.getSwapAccount();
    const protocol = new veloraProtocolEvm(account, SWAP_CONFIG);
    return { protocol, account };
  } catch (error) {
    throw new Error("Wallet not connected or initialized");
  }
};

// ============================================
// MOCK QUOTE IMPLEMENTATION
// ============================================
export const getMockQuote = (
  fromToken: string,
  amount: bigint
): { outputAmount: bigint; rate: number } => {
  // Update prices (throttled internally)
  updateMockPrices();
  
  const rate = getMockRate(fromToken);
  const normalizedAddress = fromToken.toLowerCase();
  
  // Check if WETH (18 decimals) or USDC (6 decimals)
  const isWeth = normalizedAddress === "0x82af49447d8a07e3bd95bd0d56f35241523fbab1";
  
  let outputAmount: bigint;
  if (isWeth) {
    // WETH: 18 decimals → USDT: 6 decimals
    const rateScaled = BigInt(Math.floor(rate * 1000000));
    outputAmount = (amount * rateScaled) / BigInt(10 ** 18);
  } else {
    // USDC: 6 decimals → USDT: 6 decimals (1:1)
    const rateScaled = BigInt(Math.floor(rate * 1000000));
    outputAmount = (amount * rateScaled) / BigInt(1000000);
  }

  return { outputAmount, rate };
};

// ============================================
// MOCK SWAP IMPLEMENTATION
// ============================================
const mockSwap = async (
  fromToken: string,
  toToken: string,
  amount: bigint
): Promise<{ hash: string; outputAmount: bigint }> => {
  // Simulate network delay (1-2 seconds)
  await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 500));
  
  const { outputAmount, rate } = getMockQuote(fromToken, amount);

  // Generate mock transaction hash
  const mockHash = `0x${Array.from({ length: 64 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('')}`;

  console.log("[MOCK SWAP]", {
    fromToken,
    toToken,
    inputAmount: amount.toString(),
    outputAmount: outputAmount.toString(),
    rate: rate.toFixed(2),
    hash: mockHash
  });

  return {
    hash: mockHash,
    outputAmount
  };
};

// ============================================
// REAL SWAP IMPLEMENTATION
// ============================================
const realSwap = async (
  fromToken: string,
  toToken: string,
  amount: bigint
): Promise<{ hash: string; outputAmount: bigint }> => {
  const { protocol } = getSwapProtocol();

  const result = await protocol.swap({
    tokenIn: fromToken,
    tokenOut: toToken,
    tokenInAmount: amount
  });

  return {
    hash: result.hash,
    outputAmount: result.tokenOutAmount
  };
};

// ============================================
// PUBLIC API
// ============================================

// Get current mock price (for display in UI) - stable, doesn't trigger updates
export const getCurrentMockPrice = (tokenSymbol: string): number => {
  updateMockPrices(); // Throttled internally
  if (tokenSymbol === "WETH") return currentMockPrices.WETH;
  if (tokenSymbol === "USDC") return currentMockPrices.USDC;
  return 1;
};

// Get token balance
export const getTokenBalance = async (
  tokenAddress: string,
  walletAddress: string
): Promise<string> => {
  console.log("Getting token balance...", { tokenAddress, walletAddress });
  return "100.00";
};

// Execute token swap (automatically uses mock or real based on USE_MOCK_SWAP)
export const executeSwap = async (
  fromToken: string,
  toToken: string,
  amount: bigint
): Promise<{ hash: string; outputAmount: bigint }> => {
  try {
    if (USE_MOCK_SWAP) {
      console.log("[SWAP] Using MOCK mode");
      return await mockSwap(fromToken, toToken, amount);
    } else {
      console.log("[SWAP] Using REAL mode");
      return await realSwap(fromToken, toToken, amount);
    }
  } catch (error) {
    console.error("Swap error:", error);
    throw new Error((error as Error).message);
  }
};

