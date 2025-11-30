import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { WalletData } from './types';

interface WalletState {
  wallet: WalletData | null;
  setWallet: (wallet: WalletData | null) => void;
  disConnect: () => void
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set) => ({
      wallet: null,
      setWallet: (wallet) => set({ wallet }),
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

