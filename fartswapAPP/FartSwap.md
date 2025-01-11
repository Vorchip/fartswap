# FartSwap - Decentralized Exchange (DEX) Application

## Overview
FartSwap is a decentralized exchange (DEX) built on the Solana blockchain, utilizing Next.js, TypeScript, and Tailwind CSS. The application integrates with both the Raydium SDK and Jupiter API to provide efficient token swapping capabilities.

## Technical Stack
- **Frontend Framework**: Next.js with TypeScript
- **Styling**: Tailwind CSS
- **Blockchain**: Solana
- **Key Integrations**: 
  - Raydium SDK for DEX operations
  - Jupiter API for token list management
  - Solana Web3.js for blockchain interactions

## Core Features

### 1. Token Swapping
- Seamless token-to-token exchanges
- Real-time price updates
- Slippage protection
- Transaction confirmation handling

### 2. Token Management
#### Default Tokens
- SOL (Solana)
- FARTSWAP (Native token)
- FARTCOIN
- GOAT
- USDC
- USDT

#### Token Integration
- Dynamic token fetching from Jupiter API
- Fallback mechanisms for token metadata
- Custom token logos with CDN hosting
- Comprehensive token information display

### 3. User Interface Components
#### SwapInterface
- Main swap functionality
- Token balance display
- Price impact calculations
- Swap execution

#### TokenSelector
- Searchable token list
- Popular tokens section
- Other tokens section
- Token metadata display (symbol, name, logo)

#### Header
- Navigation components
- Wallet connection
- Network status

## Architecture

### Component Structure
1. **SwapInterface.tsx**
   - Core swap logic
   - Token state management
   - Balance updates
   - Price calculations

2. **TokenSelector.tsx**
   - Token list management
   - Search functionality
   - Token categorization
   - Selection handling

3. **Header.tsx**
   - Navigation
   - Wallet integration
   - User interface elements

### Services
1. **raydium.ts**
   - Raydium SDK integration
   - Swap operations
   - Liquidity management
   - Price calculations

## Token Integration Details

### Default Token Configuration
```typescript
const DEFAULT_TOKEN_MINTS = [
  'So11111111111111111111111111111111111111112', // SOL
  '9FLoRqzWDPpDbxfuHKEesaSnmmRBUJPagsebrWRLpump', // FARTSWAP
  '9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump', // FARTCOIN
  'CzLSujWBLFsSjncfkh59rUFqvafWcY5tzedWJSuypump', // GOAT
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'  // USDT
]
```

### Token Logo Sources
- FARTSWAP: Local asset (/CircleFartSwapLogo.png)
- FARTCOIN & GOAT: IPFS hosted via Pinata
- Standard tokens (SOL, USDC, USDT): Official sources

## API Integration

### Jupiter API
- Used for token list management
- Provides token metadata
- Fallback mechanisms implemented

### Raydium SDK
- Core swap functionality
- Liquidity pool interactions
- Price calculations
- Transaction building

## Error Handling
- Comprehensive error catching
- User-friendly error messages
- Fallback mechanisms for failed API calls
- Token loading state management

## Future Enhancements
1. Additional token pair support
2. Enhanced price charts
3. Improved transaction history
4. Advanced trading features
5. Mobile optimization
6. Additional wallet integrations

## Development Guidelines
1. Maintain type safety with TypeScript
2. Follow React best practices
3. Implement proper error handling
4. Ensure responsive design
5. Maintain code documentation
6. Regular testing of swap functionality

## Security Considerations
1. Secure wallet connections
2. Transaction verification
3. Slippage protection
4. API error handling
5. Data validation