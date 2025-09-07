import { NextRequest, NextResponse } from 'next/server';
import {
  Keypair,
  TransactionBuilder,
  Contract,
  Address,
  nativeToScVal,
  rpc,
  Horizon,
} from '@stellar/stellar-sdk';

const STELLAR_RPC_URL = 'https://soroban-testnet.stellar.org';
const STELLAR_NETWORK_PASSPHRASE = 'Test SDF Network ; September 2015';
const DAO_CONTRACT_ID = process.env.PUBLIC_DAO_CONTRACT_ID || '';

interface CreateTeamRequest {
  publicKey: string;
  teamName: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: CreateTeamRequest = await request.json();

    // Validate input
    if (!body.publicKey || !body.teamName) {
      return NextResponse.json(
        { error: 'Missing required fields: publicKey or teamName' },
        { status: 400 },
      );
    }

    // Validate team name
    const teamName = body.teamName.trim();
    if (teamName.length < 2 || teamName.length > 32) {
      return NextResponse.json(
        { error: 'Team name must be between 2 and 32 characters' },
        { status: 400 },
      );
    }

    // Validate Stellar public key
    try {
      Keypair.fromPublicKey(body.publicKey);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid Stellar public key format' },
        { status: 400 },
      );
    }

    if (!DAO_CONTRACT_ID) {
      return NextResponse.json(
        { error: 'DAO contract not configured' },
        { status: 500 },
      );
    }

    // Initialize servers
    const sorobanServer = new rpc.Server(STELLAR_RPC_URL);
    const horizonServer = new Horizon.Server(
      'https://horizon-testnet.stellar.org',
    );

    // Load user account
    let account;
    try {
      account = await horizonServer.loadAccount(body.publicKey);
    } catch (error: any) {
      return NextResponse.json(
        {
          error: `Account not found: ${error.message}. Please ensure your wallet is funded on Stellar Testnet.`,
        },
        { status: 400 },
      );
    }

    // Create contract instance
    const daoContract = new Contract(DAO_CONTRACT_ID);

    // Check if team already exists
    const server = new rpc.Server(STELLAR_RPC_URL);
    const sourceKeypair = Keypair.random();

    const simulationAccount = {
      accountId: () => sourceKeypair.publicKey(),
      sequenceNumber: () => '0',
      incrementSequenceNumber: () => {},
    };

    try {
      const getTeamTx = new TransactionBuilder(simulationAccount as any, {
        fee: '100',
        networkPassphrase: STELLAR_NETWORK_PASSPHRASE,
      })
        .addOperation(
          daoContract.call(
            'get_team',
            nativeToScVal(teamName, { type: 'string' }),
          ),
        )
        .setTimeout(30)
        .build();

      const teamResult = await server.simulateTransaction(getTeamTx);
      console.log('Team existence check result:', teamResult);

      // Check if the contract returns a non-void result (team exists)
      if (
        'result' in teamResult &&
        teamResult.result &&
        'retval' in teamResult.result &&
        teamResult.result.retval &&
        typeof teamResult.result.retval === 'object' &&
        '_switch' in teamResult.result.retval &&
        teamResult.result.retval._switch &&
        typeof teamResult.result.retval._switch === 'object' &&
        'name' in teamResult.result.retval._switch &&
        teamResult.result.retval._switch.name !== 'scvVoid'
      ) {
        console.log('Team already exists:', teamName);
        return NextResponse.json(
          {
            error: `Team "${teamName}" already exists. Please choose a different name or join the existing team.`,
          },
          { status: 400 },
        );
      } else {
        console.log('Team does not exist, can create:', teamName);
      }
    } catch (error) {
      console.log('Error checking team existence:', error);
      // If there's an error, assume team doesn't exist and continue with creation
    }

    // Check if user is already in a team
    try {
      const getUserTeamTx = new TransactionBuilder(simulationAccount as any, {
        fee: '100',
        networkPassphrase: STELLAR_NETWORK_PASSPHRASE,
      })
        .addOperation(
          daoContract.call(
            'get_user_team',
            nativeToScVal(Address.fromString(body.publicKey), {
              type: 'address',
            }),
          ),
        )
        .setTimeout(30)
        .build();

      const userTeamResult = await server.simulateTransaction(getUserTeamTx);
      console.log('User team check result:', userTeamResult);

      // Check if the contract returns a non-void result (user has a team)
      if (
        'result' in userTeamResult &&
        userTeamResult.result &&
        'retval' in userTeamResult.result &&
        userTeamResult.result.retval &&
        typeof userTeamResult.result.retval === 'object' &&
        '_switch' in userTeamResult.result.retval &&
        userTeamResult.result.retval._switch &&
        typeof userTeamResult.result.retval._switch === 'object' &&
        'name' in userTeamResult.result.retval._switch &&
        userTeamResult.result.retval._switch.name !== 'scvVoid'
      ) {
        console.log('User already has a team');
        return NextResponse.json(
          {
            error:
              'You are already a member of a team. Each wallet can only join one team.',
          },
          { status: 400 },
        );
      } else {
        console.log('User has no team, can create new team');
      }
    } catch (error) {
      console.log('Error checking user team:', error);
      // If there's an error, assume user has no team and continue
    }

    // Create team formation transaction
    const transactionBuilder = new TransactionBuilder(account, {
      fee: '1000000',
      networkPassphrase: STELLAR_NETWORK_PASSPHRASE,
    });

    const operation = daoContract.call(
      'form_team',
      nativeToScVal(teamName, { type: 'string' }),
      nativeToScVal([Address.fromString(body.publicKey)], { type: 'vec' }),
    );

    const transaction = transactionBuilder
      .addOperation(operation)
      .setTimeout(300)
      .build();

    // Prepare transaction
    const preparedTransaction =
      await sorobanServer.prepareTransaction(transaction);
    const xdrString = preparedTransaction.toXDR();

    console.log('Team creation transaction prepared:', {
      teamName,
      creator: body.publicKey,
      contractId: DAO_CONTRACT_ID,
    });

    return NextResponse.json({
      xdr: xdrString,
      networkPassphrase: STELLAR_NETWORK_PASSPHRASE,
      teamName,
      message: `Team "${teamName}" creation transaction prepared`,
    });
  } catch (error: unknown) {
    console.error('Error preparing team creation:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';

    return NextResponse.json(
      { error: `Team creation failed: ${errorMessage}` },
      { status: 500 },
    );
  }
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to create teams.' },
    { status: 405 },
  );
}
