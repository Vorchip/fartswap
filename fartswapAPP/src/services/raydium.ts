import { Connection, PublicKey, Transaction, Keypair, VersionedTransaction } from '@solana/web3.js';
import { getAssociatedTokenAddress } from '@solana/spl-token';
import { useWallet } from '@solana/wallet-adapter-react';
import BN from 'bn.js';
import {
  ApiPoolInfoV4,
  ComputeBudgetConfig,
  Currency,
  CurrencyAmount,
  LiquidityPoolKeys,
  Percent,
  ReturnTypeFetchMultipleInfo,
  Token,
  TokenAmount,
  jsonInfo2PoolKeys,
  ReplaceType,
  Raydium,
} from '@raydium-io/raydium-sdk-v2';
import TradeV2 from '@raydium-io/raydium-sdk-v2/src/raydium/tradeV2/trade';

import { getRpcEndpoint } from '@/config/rpc';

// Raydium V2 Program IDs
const RAYDIUM_PROGRAM_IDS = {
  LIQUIDITY_PROGRAM_ID_V4: new PublicKey('675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8'),
  LIQUIDITY_PROGRAM_ID_V5: new PublicKey('5quBtoiQqxF9Jv6KYKctB59NT3gtJD2Y65kdnB1Uev3h')
};

const TOKEN_PROGRAM_ID = new PublicKey('Gg6F31r9h9deFMKobJ2oF9wp9ggzT6bY8rF2WbZiA3U');
const TOKEN_2022_PROGRAM_ID = new PublicKey('Fg6PaFpoGXkYsHrN3tvLcp6CyhyNKNfHpn887nnsHsvn');

export interface TokenInfo {
  symbol: string;
  name: string;
  mint: string;
  decimals: number;
  logoURI?: string;
}

export interface SwapParams {
  fromToken: TokenInfo;
  toToken: TokenInfo;
  amount: number;
  slippage: number;
}

export class RaydiumService {
  public connection: Connection;
  private poolsUrl = 'https://api.raydium.io/v2/sdk/liquidity/mainnet.json';
  private allPoolKeys: LiquidityPoolKeys[] | null = null;
  private poolInfos: ReturnTypeFetchMultipleInfo | null = null;
  private raydium: Raydium | null = null;

  constructor() {
    const endpoint = getRpcEndpoint();
    this.connection = new Connection(endpoint, 'confirmed');
  }

  public async loadRaydium(
    ownerKeypair: Keypair,
    signAllTransactions?: <T extends Transaction | VersionedTransaction>(transactions: T[]) => Promise<T[]>
  ) {
    this.raydium = await Raydium.load({
      connection: this.connection,
      owner: ownerKeypair,
      signAllTransactions: async <T extends Transaction | VersionedTransaction>(transactions: T[]): Promise<T[]> => {
        if (!signAllTransactions) {
          throw new Error('Wallet not connected');
        }
        return await signAllTransactions(transactions);
      },
    });
  }

  private async fetchPoolKeys(): Promise<LiquidityPoolKeys[]> {
    try {
      const response = await fetch(this.poolsUrl);
      const json = await response.json();
      const poolKeys = Object.values(json.official)
        .map((item: unknown) => {
          try {
            const poolInfo = jsonInfo2PoolKeys(item as ApiPoolInfoV4);
            return {
              ...poolInfo,
              nonce: 0,
              configId: new PublicKey("11111111111111111111111111111111")
            } as unknown as LiquidityPoolKeys;
          } catch (error) {
            console.error('Error converting pool info:', error);
            return null;
          }
        })
        .filter((item): item is LiquidityPoolKeys => item !== null);
      return poolKeys;
    } catch (error) {
      console.error('Error fetching pool keys:', error);
      throw new Error('Failed to fetch liquidity pools');
    }
  }

  private createToken(tokenInfo: TokenInfo): Token {
    return new Token({
      mint: new PublicKey(tokenInfo.mint),
      decimals: tokenInfo.decimals,
      symbol: tokenInfo.symbol,
      name: tokenInfo.name
    });
  }

  async getTokenBalance(tokenMint: string, walletAddress: string): Promise<number> {
    try {
      const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(
        new PublicKey(walletAddress),
        { mint: new PublicKey(tokenMint) }
      );
      if (tokenAccounts.value.length === 0) return 0;
      return tokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount;
    } catch (error) {
      console.error('Error getting token balance:', error);
      return 0;
    }
  }

  public async fetchPoolInfo(poolId: string) {
    if (!this.raydium) {
      throw new Error('Raydium instance not loaded');
    }
    return await this.raydium.api.fetchPoolKeysById({ id: poolId });
  }

  async swap(params: SwapParams, wallet: { 
    publicKey: PublicKey; 
    signTransaction: (tx: Transaction) => Promise<Transaction>; 
    sendTransaction: (tx: Transaction) => Promise<string> 
  }) {
    try {
      if (!this.raydium) {
        throw new Error('Raydium instance not loaded');
      }

      if (!this.allPoolKeys) {
        this.allPoolKeys = await this.fetchPoolKeys();
      }

      const { fromToken, toToken, amount, slippage } = params;
      const tokenFrom = this.createToken(fromToken);
      const tokenTo = this.createToken(toToken);
      const amountIn = new TokenAmount(tokenFrom, new BN(Math.floor(amount * (10 ** fromToken.decimals))));

      // Find direct pool
      const pool = this.allPoolKeys.find(
        pool => 
          (pool.baseMint.equals(new PublicKey(fromToken.mint)) && pool.quoteMint.equals(new PublicKey(toToken.mint))) ||
          (pool.baseMint.equals(new PublicKey(toToken.mint)) && pool.quoteMint.equals(new PublicKey(fromToken.mint)))
      );

      if (!pool) {
        throw new Error('No liquidity pool found for this token pair');
      }

      // Get token accounts
      const [fromTokenAccount, toTokenAccount] = await Promise.all([
        getAssociatedTokenAddress(new PublicKey(fromToken.mint), wallet.publicKey),
        getAssociatedTokenAddress(new PublicKey(toToken.mint), wallet.publicKey)
      ]);

      // Create trade instance
      const trade = await Liquidity.computeAmountOut({
        poolKeys: pool,
        poolInfo: await Liquidity.fetchInfo({ connection: this.connection, poolKeys: pool }),
        amountIn,
        currencyOut: tokenTo,
        slippage: new Percent(slippage * 100, 10000), // Convert slippage to basis points
      });

      if (!trade) {
        throw new Error('Failed to create trade instance');
      }

      // Create transaction
      const { innerTransactions } = await this.raydium.api.makeSwapInstructionSimple({
        poolKeys: pool,
        userKeys: {
          tokenAccountIn: fromTokenAccount,
          tokenAccountOut: toTokenAccount,
          owner: wallet.publicKey,
        },
        amountIn: trade.amountIn,
        amountOutMin: trade.minAmountOut,
        fixedSide: 'in'
      });

      // Build and send transaction
      const transaction = new Transaction();
      for (const ix of innerTransactions[0].instructions) {
        transaction.add(ix);
      }

      const { blockhash } = await this.connection.getLatestBlockhash('confirmed');
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = wallet.publicKey;

      const signedTx = await wallet.signTransaction(transaction);
      const txid = await wallet.sendTransaction(signedTx);
      await this.connection.confirmTransaction(txid, 'confirmed');
      
      return txid;
    } catch (error: any) {
      console.error('Swap error:', error);
      throw new Error(error?.message || 'Failed to execute swap');
    }
  }

  async getPrice(params: Omit<SwapParams, 'slippage'>) {
    try {
      if (!this.raydium) {
        throw new Error('Raydium instance not loaded');
      }

      if (!this.allPoolKeys) {
        this.allPoolKeys = await this.fetchPoolKeys();
      }

      const { fromToken, toToken, amount } = params;
      const tokenFrom = this.createToken(fromToken);
      const tokenTo = this.createToken(toToken);
      const amountIn = new TokenAmount(tokenFrom, new BN(Math.floor(amount * (10 ** fromToken.decimals))));

      // Find direct pool
      const pool = this.allPoolKeys.find(
        pool => 
          (pool.baseMint.equals(new PublicKey(fromToken.mint)) && pool.quoteMint.equals(new PublicKey(toToken.mint))) ||
          (pool.baseMint.equals(new PublicKey(toToken.mint)) && pool.quoteMint.equals(new PublicKey(fromToken.mint)))
      );

      if (!pool) {
        throw new Error('No liquidity pool found for this token pair');
      }

      // Calculate trade amounts and prices
      const tradeInfo = await Liquidity.computeAmountOut({
        poolKeys: pool,
        poolInfo: await Liquidity.fetchInfo({ connection: this.connection, poolKeys: pool }),
        amountIn,
        currencyOut: tokenTo,
        slippage: new Percent(100, 10000), // 1% default slippage for price calculation
      });

      if (!tradeInfo) {
        throw new Error('Failed to calculate trade info');
      }

      return {
        amountIn: amountIn.toExact(),
        amountOut: tradeInfo.amountOut.toExact(),
        minAmountOut: tradeInfo.minAmountOut.toExact(),
        priceImpact: tradeInfo.priceImpact.toSignificant(2),
        executionPrice: `1 ${tokenFrom.symbol} = ${tradeInfo.executionPrice.toSignificant(6)} ${tokenTo.symbol}`
      };
    } catch (error: any) {
      console.error('Price calculation error:', error);
      throw new Error(error?.message || 'Failed to calculate price');
    }
  }
}
