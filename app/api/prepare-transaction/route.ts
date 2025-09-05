import { NextRequest, NextResponse } from 'next/server';
import {
  Keypair,
  TransactionBuilder,
  Networks,
  Contract,
  Address,
  nativeToScVal,
  rpc,
  Horizon,
  Operation,
} from '@stellar/stellar-sdk';

// Environment variables
const STELLAR_RPC_URL = 'https://soroban-testnet.stellar.org'; // Use standard testnet RPC
const STELLAR_NETWORK_PASSPHRASE =
  process.env.PUBLIC_STELLAR_NETWORK_PASSPHRASE ||
  'Test SDF Network ; September 2015';
const DAO_CONTRACT_ID = process.env.PUBLIC_DAO_CONTRACT_ID || '';
const KALE_CONTRACT_ID = process.env.PUBLIC_KALE_CONTRACT_ID || '';

interface PrepareTransactionRequest {
  publicKey: string;
  teamName: string;
  stakePercentage: number;
  prediction: {
    asset: string;
    direction: boolean; // true = up, false = down
  };
}

interface PrepareTransactionResponse {
  xdr: string;
  networkPassphrase: string;
  predictionId: string;
  operationType?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: PrepareTransactionRequest = await request.json();

    // Validate input
    if (!body.publicKey || !body.teamName || !body.prediction) {
      return NextResponse.json(
        {
          error: 'Missing required fields: publicKey, teamName, or prediction',
        },
        { status: 400 },
      );
    }

    // Validate Stellar public key format
    try {
      Keypair.fromPublicKey(body.publicKey);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid Stellar public key format' },
        { status: 400 },
      );
    }

    if (body.stakePercentage < 0 || body.stakePercentage > 100) {
      return NextResponse.json(
        { error: 'Stake percentage must be between 0 and 100' },
        { status: 400 },
      );
    }

    if (!DAO_CONTRACT_ID || !KALE_CONTRACT_ID) {
      return NextResponse.json(
        {
          error:
            'Contract addresses not configured. Please set PUBLIC_DAO_CONTRACT_ID and PUBLIC_KALE_CONTRACT_ID',
        },
        { status: 500 },
      );
    }

    // Initialize servers
    const sorobanServer = new rpc.Server(STELLAR_RPC_URL);
    const horizonServer = new Horizon.Server(
      'https://horizon-testnet.stellar.org',
    );

    // Load user account from Stellar Horizon API (more reliable for account data)
    let account;
    try {
      console.log('Fetching account for:', body.publicKey, 'from Horizon API');
      account = await horizonServer.loadAccount(body.publicKey);
      console.log('Account found successfully');
    } catch (error: any) {
      console.error('Account lookup error:', error);
      return NextResponse.json(
        {
          error: `Account not found: ${error.message}. Please ensure your wallet is funded on Stellar Testnet.`,
        },
        { status: 400 },
      );
    }

    // Create contract instances for real deployed contracts
    const daoContract = new Contract(DAO_CONTRACT_ID);
    const kaleContract = new Contract(KALE_CONTRACT_ID);

    // Get actual KALE balance from the contract
    let kaleBalance: bigint;
    try {
      // For now, assume user has sufficient KALE balance
      // In production, you would properly parse the contract balance result
      kaleBalance = BigInt(1000000000); // 1B stroops (assuming 7 decimal places)
      console.log('Using estimated KALE balance for user:', body.publicKey);
    } catch (error) {
      console.error('Error fetching KALE balance:', error);
      return NextResponse.json(
        { error: 'Failed to fetch KALE balance. Please try again.' },
        { status: 500 },
      );
    } // Calculate stake amount
    const stakeAmount =
      (kaleBalance * BigInt(body.stakePercentage)) / BigInt(100);

    if (stakeAmount <= 0) {
      return NextResponse.json(
        { error: 'Insufficient KALE balance for staking' },
        { status: 400 },
      );
    }

    // Generate unique prediction ID
    const predictionId = `${body.teamName}_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Build real transaction with contract operations
    const transactionBuilder = new TransactionBuilder(account, {
      fee: '1000000', // Higher fee for contract calls
      networkPassphrase: STELLAR_NETWORK_PASSPHRASE,
    });

    // Create real contract operations based on your deployed DAO contract
    try {
      console.log('Creating contract operations for DAO:', DAO_CONTRACT_ID);

      // First, let's check if the team exists to avoid Error #5
      const server = new rpc.Server(STELLAR_RPC_URL);
      const sourceKeypair = Keypair.random();

      // Create proper account for simulation with correct interface
      const simulationAccount = {
        accountId: () => sourceKeypair.publicKey(),
        sequenceNumber: () => '0',
        incrementSequenceNumber: function () {
          // This will be called by TransactionBuilder
        },
      };

      // Try to get the team first
      console.log('Checking if team exists:', body.teamName);

      const getTeamTx = new TransactionBuilder(simulationAccount as any, {
        fee: '100',
        networkPassphrase: STELLAR_NETWORK_PASSPHRASE,
      })
        .addOperation(
          daoContract.call(
            'get_team',
            nativeToScVal(body.teamName, { type: 'string' }),
          ),
        )
        .setTimeout(30)
        .build();

      let teamExists = false;
      try {
        const teamResult = await server.simulateTransaction(getTeamTx);
        if (!('error' in teamResult)) {
          teamExists = true;
          console.log('Team exists, proceeding with prediction');
        }
      } catch (error) {
        console.log('Team does not exist, will create it');
        teamExists = false;
      }

      let operation;
      if (teamExists) {
        // Team exists, make the prediction directly
        operation = daoContract.call(
          'make_prediction',
          nativeToScVal(predictionId, { type: 'string' }),
          nativeToScVal(body.teamName, { type: 'string' }),
          nativeToScVal(body.prediction.asset, { type: 'string' }),
          nativeToScVal(body.prediction.direction, { type: 'bool' }),
          nativeToScVal(stakeAmount.toString(), { type: 'i128' }),
          nativeToScVal(body.stakePercentage, { type: 'u32' }),
          nativeToScVal(Address.fromString(body.publicKey), {
            type: 'address',
          }),
        );
        console.log('Creating prediction operation for existing team');
      } else {
        // Team doesn't exist, create it first
        operation = daoContract.call(
          'form_team',
          nativeToScVal(body.teamName, { type: 'string' }),
          // Members array - just the current user
          nativeToScVal([Address.fromString(body.publicKey)], { type: 'vec' }),
        );
        console.log('Creating team formation operation');
      }

      const transaction = transactionBuilder
        .addOperation(operation)
        .setTimeout(300)
        .build();

      console.log('Contract operations created successfully');

      // For Soroban contract calls, we need to prepare the transaction
      const preparedTransaction =
        await sorobanServer.prepareTransaction(transaction);
      const xdrString = preparedTransaction.toXDR();

      console.log('Real contract transaction prepared:', {
        teamName: body.teamName,
        userAddress: body.publicKey,
        contractId: DAO_CONTRACT_ID,
        operation: teamExists ? 'make_prediction' : 'form_team',
        note: teamExists
          ? `Making prediction for existing team "${body.teamName}"`
          : 'Creating team first to resolve Error #5',
      });

      const response: PrepareTransactionResponse = {
        xdr: xdrString,
        networkPassphrase: STELLAR_NETWORK_PASSPHRASE,
        predictionId,
        operationType: teamExists ? 'make_prediction' : 'form_team',
      };

      return NextResponse.json(response);
    } catch (contractError: any) {
      console.error('Error creating contract operations:', contractError);
      return NextResponse.json(
        { error: `Contract operation failed: ${contractError.message}` },
        { status: 500 },
      );
    }
  } catch (error: unknown) {
    console.error('Error preparing transaction:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';

    // Handle specific Stellar SDK errors
    if (errorMessage.includes('Account not found')) {
      return NextResponse.json(
        {
          error:
            'Account not found. Please ensure your wallet is funded on Stellar Testnet.',
        },
        { status: 400 },
      );
    }

    if (errorMessage.includes('contract not found')) {
      return NextResponse.json(
        { error: 'Contract not deployed or invalid contract ID' },
        { status: 500 },
      );
    }

    if (errorMessage.includes('insufficient balance')) {
      return NextResponse.json(
        { error: 'Insufficient balance for transaction fees' },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: `Transaction preparation failed: ${errorMessage}` },
      { status: 500 },
    );
  }
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to prepare transactions.' },
    { status: 405 },
  );
}
