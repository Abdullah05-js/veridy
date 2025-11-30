import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { WalletData, ECDHKeyPair } from './types';

interface WalletState {
  wallet: WalletData | null;
  setWallet: (wallet: WalletData | null) => void;
  setECDHKeyPair: (keyPair: ECDHKeyPair) => void;
  disConnect: () => void;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set) => ({
      wallet: null,
      setWallet: (wallet) => set({ wallet }),
      setECDHKeyPair: (keyPair) => set((state) => ({
        wallet: state.wallet ? { ...state.wallet, ecdhKeyPair: keyPair } : null
      })),
      disConnect: () => {
        set((state) => ({
          ...state,
          wallet: null, 
        }), false); 
      }
    }),
    {
      name: 'wallet-storage',
    }
  )
);

// Symmetric keys storage for sellers (maps listingId to symmetric key hex)
interface SymmetricKeysState {
  keys: Record<string, string>; // listingId -> symmetricKey hex
  setKey: (listingId: string, keyHex: string) => void;
  getKey: (listingId: string) => string | undefined;
  removeKey: (listingId: string) => void;
}

export const useSymmetricKeysStore = create<SymmetricKeysState>()(
  persist(
    (set, get) => ({
      keys: {},
      setKey: (listingId, keyHex) => set((state) => ({
        keys: { ...state.keys, [listingId]: keyHex }
      })),
      getKey: (listingId) => get().keys[listingId],
      removeKey: (listingId) => set((state) => {
        const { [listingId]: _, ...rest } = state.keys;
        return { keys: rest };
      }),
    }),
    {
      name: 'symmetric-keys-storage',
    }
  )
);

// Network selection store
interface NetworkState {
  network: 'arbitrum' | 'sepolia';
  setNetwork: (network: 'arbitrum' | 'sepolia') => void;
}

export const useNetworkStore = create<NetworkState>()(
  persist(
    (set) => ({
      network: 'arbitrum',
      setNetwork: (network) => set({ network }),
    }),
    {
      name: 'network-storage',
    }
  )
);
