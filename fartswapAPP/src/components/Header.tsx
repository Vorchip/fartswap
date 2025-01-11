'use client';

import React from 'react';
import Image from 'next/image';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
require('@solana/wallet-adapter-react-ui/styles.css');

const Header = () => {
  return (
    <header className="fixed top-0 left-0 w-full bg-background-light/80 backdrop-blur-sm z-50 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image
              src="/WhiteASCIIfartswapLogo.png"
              alt="FartSwap Logo"
              width={32}
              height={32}
              className="object-contain"
              loading="eager"
            />
          </div>
          <WalletMultiButton className="!bg-primary hover:!bg-primary-dark transition-colors" />
        </div>
      </div>
    </header>
  );
};

export default Header;
