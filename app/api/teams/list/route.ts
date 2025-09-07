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
const DAO_CONTRACT_ID = process.env.PUBLIC_DAO_CONTRACT_ID || '';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    if (!DAO_CONTRACT_ID) {
      return NextResponse.json(
        { error: 'DAO contract not configured' },
        { status: 500 },
      );
    }

    // For now, return mock teams since getting all teams from contract requires
    // iterating through all possible team names or maintaining a separate index
    // In a production contract, you'd have a get_all_teams function

    const mockTeams = [
      {
        name: 'team1',
        members: ['GCJY...'],
        totalStake: '100M KALE',
        memberCount: 3,
        isUserMember: false,
      },
      {
        name: 'alpha-traders',
        members: ['GDXY...', 'GEFS...'],
        totalStake: '250M KALE',
        memberCount: 2,
        isUserMember: false,
      },
      {
        name: 'crypto-bulls',
        members: ['GBCD...', 'GHIJ...', 'GKLM...', 'GNOP...'],
        totalStake: '500M KALE',
        memberCount: 4,
        isUserMember: false,
      },
    ];

    return NextResponse.json({
      success: true,
      teams: mockTeams,
      note: 'Team listing from contract coming soon - currently showing example teams',
    });
  } catch (error: unknown) {
    console.error('Error listing teams:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';

    return NextResponse.json(
      { error: `Failed to list teams: ${errorMessage}` },
      { status: 500 },
    );
  }
}
