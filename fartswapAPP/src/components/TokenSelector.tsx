import React, { useState, useEffect } from 'react';
import { TokenInfo } from '@/services/raydium';
import { PublicKey } from '@solana/web3.js';

interface TokenSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (token: TokenInfo) => void;
  tokens: TokenInfo[];
  selectedToken: TokenInfo | null;
  isLoading?: boolean;
}

const DEFAULT_TOKEN_MINTS = [
  '9FLoRqzWDPpDbxfuHKEesaSnmmRBUJPagsebrWRLpump', // FARTSWAP
  'So11111111111111111111111111111111111111112',   // SOL
  '9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump', // FARTCOIN
  'CzLSujWBLFsSjncfkh59rUFqvafWcY5tzedWJSuypump', // GOAT
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'  // USDT
];

export const TokenSelector: React.FC<TokenSelectorProps> = ({
  isOpen,
  onClose,
  onSelect,
  tokens,
  selectedToken,
  isLoading = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredTokens, setFilteredTokens] = useState<TokenInfo[]>([]);
  const [defaultTokens, setDefaultTokens] = useState<TokenInfo[]>([]);
  const [otherTokens, setOtherTokens] = useState<TokenInfo[]>([]);
  const [customAddress, setCustomAddress] = useState('');
  const [importError, setImportError] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    if (tokens.length > 0) {
      // Separate default tokens from other tokens
      const defaults: TokenInfo[] = [];
      const others: TokenInfo[] = [];

      tokens.forEach(token => {
        if (DEFAULT_TOKEN_MINTS.includes(token.mint)) {
          console.log('Found default token:', token);
          defaults.push(token);
        } else {
          others.push(token);
        }
      });

      console.log('All tokens:', tokens.length);
      console.log('Default tokens:', defaults.length);
      console.log('Default token mints:', DEFAULT_TOKEN_MINTS);

      setDefaultTokens(defaults);
      setOtherTokens(others);
      setFilteredTokens(tokens);
    }
  }, [tokens]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    const lowercaseQuery = query.toLowerCase();
    
    const filtered = tokens.filter(token => 
      token.symbol.toLowerCase().includes(lowercaseQuery) ||
      token.name.toLowerCase().includes(lowercaseQuery) ||
      token.mint.toLowerCase().includes(lowercaseQuery)
    );

    setFilteredTokens(filtered);
  };

  const handleImportToken = async () => {
    setImportError('');
    setIsImporting(true);

    try {
      // Validate the address is a valid Solana public key
      new PublicKey(customAddress);

      // Fetch token list from Jupiter to see if the token exists
      const response = await fetch('https://token.jup.ag/all');
      const data = await response.json();
      const token = data.tokens.find((t: TokenInfo) => t.mint === customAddress);

      if (token) {
        onSelect(token);
        onClose();
      } else {
        setImportError('Token not found in Jupiter list. Please verify the address.');
      }
    } catch (error) {
      setImportError('Invalid token address. Please check the address and try again.');
    } finally {
      setIsImporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-[#1A1B1E] rounded-lg p-4 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Select a Token</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <input
          type="text"
          placeholder="Search by name or paste address"
          className="w-full bg-[#2C2D32] text-white p-3 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-[#FF9500]"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
        />

        {isLoading ? (
          <div className="text-center py-4">
            <span className="text-gray-400">Loading tokens...</span>
          </div>
        ) : (
          <>
            {defaultTokens.length > 0 && !searchQuery && (
              <div className="mb-4">
                <h3 className="text-gray-400 text-sm mb-2">Popular Tokens</h3>
                {defaultTokens.map((token) => (
                  <TokenOption
                    key={token.mint}
                    token={token}
                    onClick={() => {
                      onSelect(token);
                      onClose();
                    }}
                    isSelected={selectedToken?.mint === token.mint}
                  />
                ))}
              </div>
            )}

            {searchQuery && filteredTokens.length > 0 && (
              <div>
                {filteredTokens.map((token) => (
                  <TokenOption
                    key={token.mint}
                    token={token}
                    onClick={() => {
                      onSelect(token);
                      onClose();
                    }}
                    isSelected={selectedToken?.mint === token.mint}
                  />
                ))}
              </div>
            )}

            {searchQuery && filteredTokens.length === 0 && (
              <div className="text-center py-4">
                <span className="text-gray-400">No tokens found</span>
              </div>
            )}

            <div className="mt-4">
              <input
                type="text"
                placeholder="Paste token address"
                className="w-full bg-[#2C2D32] text-white p-3 rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-[#FF9500]"
                value={customAddress}
                onChange={(e) => {
                  setCustomAddress(e.target.value);
                  setImportError('');
                }}
              />
              {importError && (
                <p className="text-red-500 text-sm mb-2">{importError}</p>
              )}
              <button
                onClick={handleImportToken}
                disabled={!customAddress || isImporting}
                className={`w-full bg-[#2C2D32] text-white p-3 rounded-lg ${
                  !customAddress || isImporting
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-[#373A40] transition-colors'
                }`}
              >
                {isImporting ? 'Importing...' : 'Import Token'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

interface TokenOptionProps {
  token: TokenInfo;
  onClick: () => void;
  isSelected: boolean;
}

const TokenOption: React.FC<TokenOptionProps> = ({ token, onClick, isSelected }) => {
  const [imgError, setImgError] = useState(false);

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-3 rounded-lg hover:bg-[#2C2D32] transition-colors ${
        isSelected ? 'bg-[#2C2D32]' : ''
      }`}
    >
      {token.logoURI && !imgError ? (
        <img
          src={token.logoURI}
          alt={token.symbol}
          className="w-8 h-8 rounded-full"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
          {token.symbol[0]}
        </div>
      )}
      <div className="flex flex-col items-start">
        <span className="text-white font-medium">{token.symbol}</span>
        <span className="text-gray-400 text-sm">{token.name}</span>
      </div>
    </button>
  );
};
