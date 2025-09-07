import { NextRequest, NextResponse } from 'next/server';
import {
  Keypair,
  TransactionBuilder,
  Contract,
  nativeToScVal,
  rpc,
} from '@stellar/stellar-sdk';

const STELLAR_RPC_URL = 'https://soroban-testnet.stellar.org';
const STELLAR_NETWORK_PASSPHRASE = 'Test SDF Network ; September 2015';
const REFLECTOR_CONTRACT_ID = process.env.PUBLIC_REFLECTOR_CONTRACT_ID || '';

interface OraclePriceResponse {
  asset: string;
  price: number;
  timestamp: number;
  source: string;
  success: boolean;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { asset } = await request.json();

    if (!asset) {
      return NextResponse.json(
        { error: 'Asset parameter is required' },
        { status: 400 },
      );
    }

    console.log(`Fetching oracle price for: ${asset}`);

    // Initialize Reflector client simulation
    if (REFLECTOR_CONTRACT_ID) {
      try {
        const server = new rpc.Server(STELLAR_RPC_URL);
        const sourceKeypair = Keypair.random();
        const simulationAccount = {
          accountId: () => sourceKeypair.publicKey(),
          sequenceNumber: () => '0',
          incrementSequenceNumber: () => {},
        };

        const reflectorContract = new Contract(REFLECTOR_CONTRACT_ID);

        // For EUR/USD, use EUR symbol as ReflectorAsset::Other(Symbol::new("EUR"))
        const assetParam =
          asset === 'EUR/USD' || asset === 'EUR'
            ? nativeToScVal('EUR', { type: 'symbol' })
            : nativeToScVal(asset, { type: 'symbol' });

        const operation = reflectorContract.call('lastprice', assetParam);

        const transaction = new TransactionBuilder(simulationAccount as any, {
          fee: '100000',
          networkPassphrase: STELLAR_NETWORK_PASSPHRASE,
        })
          .addOperation(operation)
          .setTimeout(30)
          .build();

        const result = await server.simulateTransaction(transaction);
        console.log(`Oracle simulation result for ${asset}:`, result);

        // Try to parse oracle response
        if ('result' in result && result.result && 'retval' in result.result) {
          const contractValue = result.result.retval as any;

          if (
            contractValue._switch?.name === 'scvI128' &&
            contractValue._value
          ) {
            const oraclePrice = parseInt(contractValue._value) / 1e14; // Convert from Reflector decimals

            const response: OraclePriceResponse = {
              asset,
              price: oraclePrice,
              timestamp: Date.now(),
              source: 'Reflector Oracle',
              success: true,
            };

            console.log(`Oracle price for ${asset}: $${oraclePrice}`);
            return NextResponse.json(response);
          }
        }
      } catch (oracleError) {
        console.log('Oracle call failed:', oracleError);
      }
    }

    // Fallback to realistic mock data
    const mockPrices: { [key: string]: number } = {
      EUR: 1.0856,
      'EUR/USD': 1.0856,
      USD: 1.0,
      BTC: 43250.75,
      'BTC/USD': 43250.75,
      ETH: 2635.4,
      'ETH/USD': 2635.4,
      XLM: 0.1245,
      'XLM/USD': 0.1245,
    };

    const basePrice = mockPrices[asset] || mockPrices['EUR/USD'];
    // Add realistic price variation (±0.5%)
    const variation = (Math.random() - 0.5) * 0.01;
    const currentPrice = basePrice * (1 + variation);

    const response: OraclePriceResponse = {
      asset,
      price: currentPrice,
      timestamp: Date.now(),
      source: 'Mock Oracle (Reflector Simulation)',
      success: true,
    };

    console.log(`Mock oracle price for ${asset}: $${currentPrice}`);
    return NextResponse.json(response);
  } catch (error) {
    console.error('Oracle price fetch error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch oracle price',
        asset: '',
        price: 0,
        timestamp: Date.now(),
        source: 'Error',
        success: false,
      },
      { status: 500 },
    );
  }
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to fetch oracle prices.' },
    { status: 405 },
  );
}
