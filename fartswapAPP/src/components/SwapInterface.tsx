'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useWallet } from '@solana/wallet-adapter-react';
import { RaydiumService, SwapParams, TokenInfo } from '@/services/raydium';
import { Transaction } from '@solana/web3.js';
import { toast } from 'react-hot-toast';
import ClientOnly from './ClientOnly';
import { TokenSelector } from './TokenSelector';

const DEFAULT_TOKEN_MINTS = [
  'So11111111111111111111111111111111111111112',
  '9FLoRqzWDPpDbxfuHKEesaSnmmRBUJPagsebrWRLpump',
];

const SwapInterface = () => {
  const { publicKey, connected, signTransaction } = useWallet();
  const [raydiumService] = useState(() => new RaydiumService());
  
  const [tokenList, setTokenList] = useState<TokenInfo[]>([]);
  const [isLoadingTokens, setIsLoadingTokens] = useState(true);
  const [fromToken, setFromToken] = useState<TokenInfo | null>(null);
  const [toToken, setToToken] = useState<TokenInfo | null>(null);
  const [amount, setAmount] = useState('');
  const [estimatedOutput, setEstimatedOutput] = useState('0');
  const [slippage, setSlippage] = useState('1');
  const [priceImpact, setPriceImpact] = useState('0');
  const [balance, setBalance] = useState('0');
  const [isSwapping, setIsSwapping] = useState(false);

  const [isFromSelectorOpen, setIsFromSelectorOpen] = useState(false);
  const [isToSelectorOpen, setIsToSelectorOpen] = useState(false);

  useEffect(() => {
    const initializeTokens = async () => {
      setIsLoadingTokens(true);
      try {
        // First fetch Jupiter's token list
        const response = await fetch('https://token.jup.ag/all');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const jupiterTokens = await response.json();
        console.log('Jupiter API Response:', jupiterTokens);
        
        if (!Array.isArray(jupiterTokens)) {
          throw new Error('Invalid token list format from Jupiter');
        }

        // Debug logs
        console.log('Total tokens fetched:', jupiterTokens.length);

        // Create a map of mint addresses to Jupiter token data
        const jupiterTokenMap = new Map(
          jupiterTokens.map(token => [token.mint, token])
        );
        
        // Create our default tokens with logos from Jupiter if available
        const defaultTokens: TokenInfo[] = [
          {
            symbol: 'SOL',
            name: 'Solana',
            mint: 'So11111111111111111111111111111111111111112',
            decimals: 9,
            logoURI: jupiterTokenMap.get('So11111111111111111111111111111111111111112')?.logoURI || 
                    'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
          },
          {
            symbol: 'FARTSWAP',
            name: 'FartSwap',
            mint: '9FLoRqzWDPpDbxfuHKEesaSnmmRBUJPagsebrWRLpump',
            decimals: 9,
            logoURI: jupiterTokenMap.get('9FLoRqzWDPpDbxfuHKEesaSnmmRBUJPagsebrWRLpump')?.logoURI || 
                    '/CircleFartSwapLogo.png', // Use local logo as fallback
          },
          {
            symbol: 'FARTCOIN',
            name: 'FartCoin',
            mint: '9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump',
            decimals: 9,
            logoURI: jupiterTokenMap.get('9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump')?.logoURI || 
                    'https://pump.mypinata.cloud/ipfs/QmQr3Fz4h1etNsF7oLGMRHiCzhB5y9a7GjyodnF7zLHK1g?img-width=256&img-dpr=2&img-onerror=redirect', // Use local logo as fallback
          },
          {
            symbol: 'GOAT',
            name: 'GOAT',
            mint: 'CzLSujWBLFsSjncfkh59rUFqvafWcY5tzedWJSuypump',
            decimals: 9,
            logoURI: jupiterTokenMap.get('CzLSujWBLFsSjncfkh59rUFqvafWcY5tzedWJSuypump')?.logoURI || 
                    'https://pump.mypinata.cloud/ipfs/QmapAq9WtNrtyaDtjZPAHHNYmpSZAQU6HywwvfSWq4dQVV?img-width=256&img-dpr=2&img-onerror=redirect', // Use local logo as fallback
          },
          {
            symbol: 'USDC',
            name: 'USD Coin',
            mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
            decimals: 6,
            logoURI: jupiterTokenMap.get('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v')?.logoURI || 
                    'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
          },
          {
            symbol: 'USDT',
            name: 'USDT',
            mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
            decimals: 6,
            logoURI: jupiterTokenMap.get('Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB')?.logoURI ||
                    'usdtlogo.svg',

          },
        ];

        // Filter out our default tokens from Jupiter's list
        const filteredJupiterTokens = jupiterTokens.filter(token => 
          !DEFAULT_TOKEN_MINTS.includes(token.mint)
        );

        // Combine the lists with our default tokens first
        const finalTokenList = [...defaultTokens, ...filteredJupiterTokens];
        setTokenList(finalTokenList);

        // Set initial tokens
        const sol = defaultTokens[0]; // SOL is always first in our default list
        const fartswap = defaultTokens[1]; // FARTSWAP is always second in our default list
        
        setFromToken(sol);
        setToToken(fartswap);

      } catch (error) {
        console.error('Failed to fetch token list:', error);
        toast.error('Failed to load token list. Please try again later.');
        
        // Use the same default tokens if API fails, but with fallback logos
        const defaultTokens: TokenInfo[] = [
          {
            symbol: 'SOL',
            name: 'Solana',
            mint: 'So11111111111111111111111111111111111111112',
            decimals: 9,
            logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
          },
          {
            symbol: 'FARTSWAP',
            name: 'FartSwap',
            mint: '9FLoRqzWDPpDbxfuHKEesaSnmmRBUJPagsebrWRLpump',
            decimals: 9,
            logoURI: '/fartswap-logo.svg',
          },
          {
            symbol: 'FARTCOIN',
            name: 'FartCoin',
            mint: '9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump',
            decimals: 9,
            logoURI: '/fartcoin-logo.svg',
          },
          {
            symbol: 'GOAT',
            name: 'GOAT',
            mint: 'CzLSujWBLFsSjncfkh59rUFqvafWcY5tzedWJSuypump',
            decimals: 9,
            logoURI: '/goat-logo.svg',
          },
          {
            symbol: 'USDC',
            name: 'USD Coin',
            mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
            decimals: 6,
            logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
          },
          {
            symbol: 'USDT',
            name: 'USDT',
            mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
            decimals: 6,
            logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.png',
          },
        ];
        
        setTokenList(defaultTokens);
        setFromToken(defaultTokens[0]);
        setToToken(defaultTokens[1]);
      } finally {
        setIsLoadingTokens(false);
      }
    };

    initializeTokens();
  }, []);

  useEffect(() => {
    if (connected && publicKey) {
      updateBalance();
    }
  }, [connected, publicKey, fromToken]);

  useEffect(() => {
    if (amount && amount !== '0') {
      updatePrice();
    } else {
      setEstimatedOutput('0');
      setPriceImpact('0');
    }
  }, [amount, fromToken, toToken, slippage]);

  const updateBalance = async () => {
    if (!publicKey || !fromToken?.mint) return;
    try {
      const balance = await raydiumService.getTokenBalance(
        fromToken.mint,
        publicKey.toString()
      );
      setBalance(balance.toString());
    } catch (error) {
      console.error('Error fetching balance:', error);
      setBalance('0');
    }
  };

  const updatePrice = async () => {
    if (!amount || isNaN(parseFloat(amount))) return;
    try {
      const params: SwapParams = {
        fromToken: fromToken as TokenInfo,
        toToken: toToken as TokenInfo,
        amount: parseFloat(amount),
        slippage: parseFloat(slippage)
      };
      const { amountOut, priceImpact: impact } = await raydiumService.getPrice(params);
      setEstimatedOutput(amountOut);
      setPriceImpact(impact);
    } catch (error) {
      console.error('Error getting price:', error);
      toast.error('Error calculating price');
    }
  };

  const handleSwap = async () => {
    if (!connected) {
      toast.error('Please connect your wallet first');
      return;
    }
    if (!publicKey || !signTransaction) {
      toast.error('Wallet connection error');
      return;
    }
    if (!fromToken || !toToken) {
      toast.error('Please select tokens');
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      setIsSwapping(true);
      const params: SwapParams = {
        fromToken: fromToken,
        toToken: toToken,
        amount: parseFloat(amount),
        slippage: parseFloat(slippage)
      };

      const signature = await raydiumService.swap(params, {
        publicKey,
        signTransaction,
        sendTransaction: async (transaction: Transaction) => {
          try {
            const signedTx = await signTransaction(transaction);
            const txid = await raydiumService.connection.sendRawTransaction(
              signedTx.serialize(),
              { skipPreflight: false, maxRetries: 3 }
            );
            await raydiumService.connection.confirmTransaction(txid, 'confirmed');
            return txid;
          } catch (error: any) {
            console.error('Transaction error:', error);
            throw new Error(error?.message || 'Failed to send transaction');
          }
        }
      });

      if (signature) {
        toast.success('Swap successful!');
        setAmount('');
        setEstimatedOutput('0');
        updateBalance();
      }
    } catch (error: any) {
      console.error('Swap failed:', error);
      toast.error(error?.message || 'Swap failed. Please try again.');
    } finally {
      setIsSwapping(false);
    }
  };

  const handleMaxClick = () => {
    setAmount(balance);
  };

  const handlePercentageClick = (percentage: number) => {
    const amount = (parseFloat(balance) * percentage) / 100;
    setAmount(amount.toString());
  };

  const TokenDisplay = ({ token, onClick }: { token: TokenInfo | null; onClick: () => void }) => {
    const [imgError, setImgError] = useState(false);
    
    if (!token) return null;
    
    return (
      <button
        onClick={onClick}
        className="flex items-center gap-2 bg-[#2C2D32] px-3 py-2 rounded-lg hover:bg-[#373A40] transition-colors"
      >
        {token.logoURI && !imgError ? (
          <img
            src={token.logoURI}
            alt={token.symbol}
            className="w-6 h-6 rounded-full"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
            {token.symbol[0]}
          </div>
        )}
        <span className="text-white">{token.symbol}</span>
      </button>
    );
  };

  return (
    <ClientOnly>
      <div className="bg-[#1A1B1E] rounded-lg p-4 w-full max-w-md mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Swap</h2>
          <span className="text-gray-400">9%</span>
        </div>

        {/* From Token Section */}
        <div className="bg-[#25262B] rounded-lg p-4 mb-2">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-400">From</span>
            <div className="flex gap-2">
              <button 
                onClick={() => handleMaxClick()}
                className="text-gray-400 px-2 py-1 rounded bg-[#2C2D32]"
              >
                Max
              </button>
              <button 
                onClick={() => handlePercentageClick(50)}
                className="text-gray-400 px-2 py-1 rounded bg-[#2C2D32]"
              >
                50%
              </button>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <TokenDisplay 
              token={fromToken} 
              onClick={() => setIsFromSelectorOpen(true)} 
            />
            <input
              type="number"
              value={amount}
              onChange={(e) => {
                const value = e.target.value;
                if (/^\d*\.?\d*$/.test(value)) {
                  setAmount(value);
                }
              }}
              className="bg-transparent text-white text-right w-1/2 focus:outline-none"
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Swap Direction Button */}
        <div className="flex justify-center -my-2 relative z-10">
          <button 
            onClick={() => {
              const temp = fromToken;
              setFromToken(toToken);
              setToToken(temp);
              setAmount('');
              setEstimatedOutput('0');
            }}
            className="bg-[#FF9500] p-2 rounded-full hover:bg-[#FF9500]/80 transition-colors"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 4L12 20M12 20L18 14M12 20L6 14" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* To Token Section */}
        <div className="bg-[#25262B] rounded-lg p-4 mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-400">To (Estimated)</span>
            <span className="text-gray-400">Slippage: {slippage}%</span>
          </div>
          <div className="flex justify-between items-center">
            <TokenDisplay 
              token={toToken} 
              onClick={() => setIsToSelectorOpen(true)} 
            />
            <span className="text-white">{estimatedOutput}</span>
          </div>
        </div>

        {/* Token Selectors */}
        <TokenSelector
          isOpen={isFromSelectorOpen}
          onClose={() => setIsFromSelectorOpen(false)}
          onSelect={setFromToken}
          tokens={tokenList}
          selectedToken={fromToken}
          isLoading={isLoadingTokens}
        />
        <TokenSelector
          isOpen={isToSelectorOpen}
          onClose={() => setIsToSelectorOpen(false)}
          onSelect={setToToken}
          tokens={tokenList}
          selectedToken={toToken}
          isLoading={isLoadingTokens}
        />

        {/* Swap Button */}
        <button 
          onClick={handleSwap}
          className={`w-full py-4 rounded-lg font-semibold ${
            !connected || isSwapping || !amount
              ? 'bg-gray-600 cursor-not-allowed'
              : 'bg-[#FF9500] hover:bg-[#FF9500]/80'
          }`}
          disabled={!connected || isSwapping || !amount}
        >
          {isSwapping ? 'Swapping...' : connected ? 'Swap' : 'Connect Wallet'}
        </button>

        {/* Price Impact & Route (can be added later) */}
        {connected && amount && (
          <div className="mt-4 text-sm text-gray-400">
            <div className="flex justify-between">
              <span>Price Impact:</span>
              <span>{priceImpact}</span>
            </div>
            <div className="flex justify-between mt-1">
              <span>Route:</span>
              <span>Raydium</span>
            </div>
          </div>
        )}
      </div>
    </ClientOnly>
  );
};

export default SwapInterface;
