'use client';

import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { Connection } from '@solana/web3.js';
import { useMemo } from 'react';
import { getRpcEndpoint } from './rpc';
import ClientOnly from '@/components/ClientOnly';

require('@solana/wallet-adapter-react-ui/styles.css');

export function WalletContextProvider({ children }: { children: React.ReactNode }) {
  const endpoint = useMemo(() => getRpcEndpoint(), []);
  const connection = useMemo(() => new Connection(endpoint, 'confirmed'), [endpoint]);
  
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    []
  );

  return (
    <ClientOnly>
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>{children}</WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </ClientOnly>
  );
}
