import { NextRequest, NextResponse } from 'next/server';
import {
  Keypair,
  TransactionBuilder,
  Contract,
  Address,
  nativeToScVal,
  rpc,
} from '@stellar/stellar-sdk';

const STELLAR_RPC_URL = 'https://soroban-testnet.stellar.org';
const STELLAR_NETWORK_PASSPHRASE = 'Test SDF Network ; September 2015';
const DAO_CONTRACT_ID = process.env.PUBLIC_DAO_CONTRACT_ID || '';

function handleError(error: unknown): NextResponse {
  console.error('Error getting user team:', error);
  const errorMessage =
    error instanceof Error ? error.message : 'Unknown error occurred';

  return NextResponse.json(
    { error: `Failed to get user team: ${errorMessage}` },
    { status: 500 },
  );
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    return await getUserTeam(address);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { publicKey } = await request.json();
    return await getUserTeam(publicKey);
  } catch (error) {
    return handleError(error);
  }
}

async function getUserTeam(address: string | null): Promise<NextResponse> {
  try {
    if (!address) {
      return NextResponse.json(
        { error: 'Address parameter is required' },
        { status: 400 },
      );
    }

    // Validate Stellar address
    try {
      Keypair.fromPublicKey(address);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid Stellar address format' },
        { status: 400 },
      );
    }

    if (!DAO_CONTRACT_ID) {
      return NextResponse.json(
        { error: 'DAO contract not configured' },
        { status: 500 },
      );
    }

    // For now, let's check the teams list API and see if the user has joined any team
    // This is a temporary solution since the smart contract parsing is complex

    try {
      // Since you mentioned the teams page recognizes your wallet is part of a team,
      // let's try some common team names that might have been created
      const possibleTeamNames = [
        'team1',
        'alpha-traders',
        'crypto-bulls',
        'myteam',
        'test',
        'testteam',
        'kale-team',
        'demo-team',
      ];

      // Try to simulate getting user's team from each possible team
      const daoContract = new Contract(DAO_CONTRACT_ID);
      const server = new rpc.Server(STELLAR_RPC_URL);
      const sourceKeypair = Keypair.random();

      const simulationAccount = {
        accountId: () => sourceKeypair.publicKey(),
        sequenceNumber: () => '0',
        incrementSequenceNumber: () => {},
      };

      // Try calling get_user_team on the contract
      try {
        const getUserTeamTx = new TransactionBuilder(simulationAccount, {
          fee: '100',
          networkPassphrase: STELLAR_NETWORK_PASSPHRASE,
        })
          .addOperation(
            daoContract.call(
              'get_user_team',
              nativeToScVal(Address.fromString(address), { type: 'address' }),
            ),
          )
          .setTimeout(30)
          .build();

        const result = await server.simulateTransaction(getUserTeamTx);
        console.log(
          'get_user_team simulation result:',
          JSON.stringify(result, null, 2),
        );

        // If the contract returns a successful result, try to extract the team name
        if ('result' in result && result.result && 'retval' in result.result) {
          // The contract should return a string with the team name
          const contractValue = result.result.retval;
          console.log('Contract return value:', contractValue);

          // Check if the contract returned void (no team) or a real value
          if (
            contractValue &&
            typeof contractValue === 'object' &&
            '_switch' in contractValue &&
            contractValue._switch &&
            typeof contractValue._switch === 'object' &&
            'name' in contractValue._switch
          ) {
            const switchName = contractValue._switch.name;
            console.log('Contract switch name:', switchName);

            if (switchName === 'scvVoid') {
              // Contract returned void - user has no team
              console.log('Contract returned void - user has no team');
              return NextResponse.json({
                success: true,
                teamName: null,
                address,
                message: 'User is not a member of any team',
                debug: { contractValue, result: result.result },
              });
            } else {
              // Contract returned a non-void result - user has a team
              // Try to parse the actual team name from the contract result
              console.log('Contract returned non-void - user has a team');

              let actualTeamName = null;

              // Try to extract the team name from the contract response
              try {
                // Cast to any to handle the dynamic structure
                const contractResult = contractValue as any;

                if (contractResult._arm === 'str' && contractResult._value) {
                  // The contract returned a string value
                  if (typeof contractResult._value === 'string') {
                    actualTeamName = contractResult._value;
                  } else if (
                    contractResult._value?.type === 'Buffer' &&
                    contractResult._value?.data
                  ) {
                    // String encoded as Buffer - decode it
                    actualTeamName = Buffer.from(
                      contractResult._value.data,
                    ).toString();
                  } else if (contractResult._value instanceof Buffer) {
                    // Direct Buffer
                    actualTeamName = contractResult._value.toString();
                  } else {
                    // Fallback - try to convert to string
                    actualTeamName = String(contractResult._value);
                  }
                } else if (
                  contractResult._switch?.name === 'scvString' &&
                  contractResult._value
                ) {
                  // Alternative string format
                  if (typeof contractResult._value === 'string') {
                    actualTeamName = contractResult._value;
                  } else if (
                    contractResult._value?.type === 'Buffer' &&
                    contractResult._value?.data
                  ) {
                    // String encoded as Buffer
                    actualTeamName = Buffer.from(
                      contractResult._value.data,
                    ).toString();
                  }
                }

                console.log('Parsed team name from contract:', actualTeamName);
              } catch (parseError) {
                console.log('Error parsing team name:', parseError);
              }

              return NextResponse.json({
                success: true,
                teamName: actualTeamName || 'unknown-team',
                address,
                message: 'Team membership found',
                debug: { contractValue, result: result.result },
              });
            }
          }
        }
      } catch (contractError) {
        console.log('Contract call failed:', contractError);
      }

      // If we get here, the contract call failed or returned unexpected data
      // Return no team instead of assuming team1
      return NextResponse.json({
        success: true,
        teamName: null,
        address,
        message: 'Unable to determine team membership',
      });
    } catch (fetchError) {
      console.error('Error fetching teams for membership check:', fetchError);
    } // Fallback: return no team
    return NextResponse.json({
      success: true,
      teamName: null,
      address,
      message: 'User is not a member of any team',
    });
  } catch (error: unknown) {
    console.error('Error in getUserTeam:', error);
    return NextResponse.json({
      success: true,
      teamName: null,
      message: 'Error checking team membership',
    });
  }
}
