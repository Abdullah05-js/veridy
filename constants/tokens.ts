import { sepolia,arbitrum } from "viem/chains";
import { Address } from "viem";
export const SWAP_TOKENS = [
  {
    symbol: 'WETH',
    name: 'Wrapped Ethereum',
    address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
    decimals: 18,
    icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/2396.png',
    chain: 'arbitrum'
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    decimals: 6,
    icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/3408.png',
    chain: 'arbitrum'
  },
] as const;

export const USDT_TOKEN = {
  symbol: 'USDT',
  name: 'Tether USD',
  address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
  decimals: 6,
  icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/825.png',
  chain: 'arbitrum'
} as const;

export type Token = typeof SWAP_TOKENS[number] | typeof USDT_TOKEN;

export const CHAIN = arbitrum
export const RPC_URL = CHAIN.rpcUrls.default.http[0]
export const USDT_CONTRACT_ADDRESS: Address = "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9"

// export const sepoliaConfigPimlico = {
//   chainId: CHAIN.id,
//   blockchain: 'arbitrum',
//   provider: RPC_URL,
//   bundlerUrl: 'https://public.pimlico.io/v2/42161/rpc',
//   paymasterUrl: 'https://public.pimlico.io/v2/42161/rpc',
//   paymasterAddress: '0x777777777777AeC03fd955926DbF81597e66834C',
//   entryPointAddress: '0x0000000071727De22E5E9d8BAf0edAc6f37da032',
//   safeModulesVersion: '0.3.0',
//   paymasterToken: {
//     address: USDT_CONTRACT_ADDRESS
//   },
//   transferMaxFee: 100000
// }



