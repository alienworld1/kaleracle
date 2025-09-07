'use client';

import React, { useState, useEffect } from 'react';
import { signTransaction } from '@stellar/freighter-api';
import { TransactionBuilder } from '@stellar/stellar-sdk';
import Button from '../components/Button';
import Input from '../components/Input';
import { useWallet } from '../ClientLayout';

interface Team {
  name: string;
  members: string[];
  totalStake: string;
  memberCount: number;
  isUserMember: boolean;
}

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

// Toast component
const Toast: React.FC<{
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
  index: number;
}> = ({ message, type, onClose, index }) => {
  const bgColor =
    type === 'success'
      ? 'bg-green-500/20 border-green-500/30'
      : type === 'error'
        ? 'bg-red-500/20 border-red-500/30'
        : 'bg-blue-500/20 border-blue-500/30';

  const textColor =
    type === 'success'
      ? 'text-green-300'
      : type === 'error'
        ? 'text-red-300'
        : 'text-blue-300';

  return (
    <div
      className={`fixed right-4 z-50 p-4 rounded-lg border backdrop-blur-xl ${bgColor} ${textColor} max-w-md transition-all duration-300`}
      style={{ top: `${16 + index * 80}px` }}
    >
      <div className="flex justify-between items-start">
        <p className="text-sm">{message}</p>
        <button
          onClick={onClose}
          className="ml-2 text-lg leading-none opacity-70 hover:opacity-100"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default function TeamsPage() {
  const { isWalletConnected, publicKey } = useWallet();
  const [teams, setTeams] = useState<Team[]>([]);
  const [userTeam, setUserTeam] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [toastIdCounter, setToastIdCounter] = useState(0);

  // Form states
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [joinTeamName, setJoinTeamName] = useState('');

  // Toast management
  const addToast = (message: string, type: 'success' | 'error' | 'info') => {
    const isDuplicate = toasts.some(toast => toast.message === message);
    if (isDuplicate) return;

    const id = Date.now() + toastIdCounter;
    setToastIdCounter(prev => prev + 1);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 4000);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Check wallet connection and load user's team
  useEffect(() => {
    const initialize = async () => {
      if (!isWalletConnected || !publicKey) {
        setUserTeam('');
        return;
      }

      try {
        await loadUserTeam(publicKey);
      } catch (error) {
        console.error('Error initializing teams page:', error);
        addToast('Error loading user team', 'error');
      }
    };

    initialize();
  }, [isWalletConnected, publicKey]);

  // Load user's current team
  const loadUserTeam = async (walletAddress: string) => {
    try {
      const response = await fetch(
        `/api/teams/user-team?address=${walletAddress}`,
      );
      if (response.ok) {
        const result = await response.json();
        setUserTeam(result.teamName || '');
      }
    } catch (error) {
      console.error('Error loading user team:', error);
    }
  };

  // Load all teams
  const loadTeams = async () => {
    try {
      const response = await fetch('/api/teams/list');
      if (response.ok) {
        const result = await response.json();
        setTeams(result.teams || []);
      }
    } catch (error) {
      console.error('Error loading teams:', error);
      addToast('Error loading teams', 'error');
    }
  };

  // Create new team
  const handleCreateTeam = async () => {
    if (!publicKey || !newTeamName.trim()) {
      addToast('Please connect wallet and enter team name', 'error');
      return;
    }

    if (userTeam) {
      addToast('You are already a member of a team', 'error');
      return;
    }

    setIsLoading(true);

    try {
      addToast('Creating team...', 'info');

      // Prepare transaction
      const response = await fetch('/api/teams/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          publicKey: publicKey,
          teamName: newTeamName.trim(),
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to prepare team creation');
      }

      // Sign transaction
      const signedXdr = await signTransaction(result.xdr, {
        networkPassphrase: result.networkPassphrase,
      });

      // Submit transaction
      const { rpc, TransactionBuilder } = await import('@stellar/stellar-sdk');
      const server = new rpc.Server('https://soroban-testnet.stellar.org');
      const transaction = TransactionBuilder.fromXDR(
        signedXdr.signedTxXdr,
        'Test SDF Network ; September 2015',
      );

      const submitResult = await server.sendTransaction(transaction);

      if (
        submitResult.status === 'PENDING' ||
        submitResult.status === 'DUPLICATE'
      ) {
        addToast(`Team "${newTeamName}" created successfully!`, 'success');
        setUserTeam(newTeamName);
        setNewTeamName('');
        setShowCreateForm(false);
        await loadTeams();
      } else {
        throw new Error(`Transaction failed: ${submitResult.status}`);
      }
    } catch (error: any) {
      console.error('Error creating team:', error);
      if (error.message?.includes('User rejected')) {
        addToast('Transaction cancelled', 'error');
      } else {
        addToast(`Failed to create team: ${error.message}`, 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Join existing team
  const handleJoinTeam = async (teamName: string) => {
    if (!publicKey) {
      addToast('Please connect your wallet', 'error');
      return;
    }

    if (userTeam) {
      addToast('You are already a member of a team', 'error');
      return;
    }

    setIsLoading(true);

    try {
      addToast(`Joining team "${teamName}"...`, 'info');

      // For now, we'll use the form_team function to add user to existing team
      // In a more advanced version, you'd have a separate join_team function
      const response = await fetch('/api/teams/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          publicKey: publicKey,
          teamName: teamName,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to join team');
      }

      // Sign and submit transaction similar to create team
      const signedXdr = await signTransaction(result.xdr, {
        networkPassphrase: result.networkPassphrase,
      });

      const { rpc, TransactionBuilder } = await import('@stellar/stellar-sdk');
      const server = new rpc.Server('https://soroban-testnet.stellar.org');
      const transaction = TransactionBuilder.fromXDR(
        signedXdr.signedTxXdr,
        'Test SDF Network ; September 2015',
      );

      const submitResult = await server.sendTransaction(transaction);

      if (
        submitResult.status === 'PENDING' ||
        submitResult.status === 'DUPLICATE'
      ) {
        addToast(`Successfully joined team "${teamName}"!`, 'success');
        setUserTeam(teamName);
        await loadTeams();
      } else {
        throw new Error(`Transaction failed: ${submitResult.status}`);
      }
    } catch (error: any) {
      console.error('Error joining team:', error);
      if (error.message?.includes('User rejected')) {
        addToast('Transaction cancelled', 'error');
      } else {
        addToast(`Failed to join team: ${error.message}`, 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Load teams when wallet is connected
  useEffect(() => {
    if (isWalletConnected && publicKey) {
      loadTeams();
    }
  }, [isWalletConnected, publicKey]);

  if (!isWalletConnected || !publicKey) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Connect Your Wallet
          </h2>
          <p className="text-gray-400 mb-6">
            Please connect your Freighter wallet to manage teams
          </p>
          <Button variant="primary" onClick={() => window.location.reload()}>
            Refresh to Connect
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      {/* Toast notifications */}
      {toasts.map((toast, index) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          index={index}
          onClose={() => removeToast(toast.id)}
        />
      ))}

      {/* Header */}
      <div className="bg-black/50 backdrop-blur-xl border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Team Management</h1>
              <p className="text-gray-400 text-sm">
                Create or join teams to make predictions
              </p>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="/dao"
                className="text-red-400 hover:text-red-300 transition-colors"
              >
                ← Back to DAO
              </a>
              <div className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-lg px-4 py-2">
                <p className="text-xs text-gray-300 mb-1">Connected Wallet</p>
                <p className="text-white font-mono text-sm">
                  {publicKey.slice(0, 6)}...{publicKey.slice(-6)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Current Team Status */}
        <div className="mb-8">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              Your Team Status
            </h2>
            {userTeam ? (
              <div className="flex items-center gap-4">
                <div className="bg-green-500/20 border border-green-500/30 rounded-lg px-4 py-2">
                  <span className="text-green-300 font-semibold">
                    {userTeam}
                  </span>
                </div>
                <p className="text-gray-400">You are a member of this team</p>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-400 mb-4">
                  You are not a member of any team yet
                </p>
                <p className="text-sm text-gray-500">
                  Join an existing team or create a new one to start making
                  predictions
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column: Team Actions */}
          <div className="space-y-6">
            {!userTeam && (
              <>
                {/* Create Team */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Create New Team
                  </h3>
                  {!showCreateForm ? (
                    <Button
                      variant="primary"
                      onClick={() => setShowCreateForm(true)}
                      className="w-full"
                    >
                      Create Team
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      <Input
                        type="text"
                        placeholder="Enter team name"
                        value={newTeamName}
                        onChange={e => setNewTeamName(e.target.value)}
                        className="w-full"
                      />
                      <div className="flex gap-3">
                        <Button
                          variant="primary"
                          onClick={handleCreateTeam}
                          disabled={isLoading || !newTeamName.trim()}
                          className="flex-1"
                        >
                          {isLoading ? 'Creating...' : 'Create Team'}
                        </Button>
                        <Button
                          variant="glass"
                          onClick={() => {
                            setShowCreateForm(false);
                            setNewTeamName('');
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick Join */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Join by Team Name
                  </h3>
                  <div className="space-y-4">
                    <Input
                      type="text"
                      placeholder="Enter team name to join"
                      value={joinTeamName}
                      onChange={e => setJoinTeamName(e.target.value)}
                      className="w-full"
                    />
                    <Button
                      variant="glass"
                      onClick={() => handleJoinTeam(joinTeamName)}
                      disabled={isLoading || !joinTeamName.trim()}
                      className="w-full"
                    >
                      {isLoading ? 'Joining...' : 'Join Team'}
                    </Button>
                  </div>
                </div>
              </>
            )}

            {/* Team Guidelines */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Team Guidelines
              </h3>
              <div className="space-y-3 text-sm text-gray-300">
                <div className="flex items-start gap-3">
                  <span className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    1
                  </span>
                  <p>Each wallet can only be a member of one team at a time</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    2
                  </span>
                  <p>Only team members can make predictions for their team</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    3
                  </span>
                  <p>Team membership is recorded on the Stellar blockchain</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    4
                  </span>
                  <p>Rewards are shared among winning team members</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Available Teams */}
          <div className="space-y-6">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">
                  Available Teams
                </h3>
                <Button variant="glass" size="sm" onClick={loadTeams}>
                  Refresh
                </Button>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {teams.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-400">No teams found</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Be the first to create a team!
                    </p>
                  </div>
                ) : (
                  teams.map(team => (
                    <div
                      key={team.name}
                      className={`bg-white/5 border rounded-lg p-4 transition-colors ${
                        team.isUserMember
                          ? 'border-green-500/30 bg-green-500/10'
                          : 'border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-white">
                          {team.name}
                        </h4>
                        {team.isUserMember && (
                          <span className="bg-green-500/20 text-green-300 px-2 py-1 rounded text-xs">
                            Your Team
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-400 mb-3">
                        <span>{team.memberCount} members</span>
                        <span>Total Stake: {team.totalStake}</span>
                      </div>
                      {!userTeam && !team.isUserMember && (
                        <Button
                          variant="glass"
                          size="sm"
                          onClick={() => handleJoinTeam(team.name)}
                          disabled={isLoading}
                          className="w-full"
                        >
                          Join Team
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {userTeam && (
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Ready to Predict!
                </h3>
                <p className="text-gray-400 mb-4">
                  You're all set as a member of team "{userTeam}". Now you can
                  make predictions!
                </p>
                <Button
                  variant="primary"
                  onClick={() => (window.location.href = '/dao')}
                  className="w-full"
                >
                  Go to Predictions →
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
