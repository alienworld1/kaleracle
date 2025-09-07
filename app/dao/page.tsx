'use client';

import React, { useState, useEffect } from 'react';
import { signTransaction } from '@stellar/freighter-api';
import { TransactionBuilder, Networks } from '@stellar/stellar-sdk';
import PredictionForm from '../components/PredictionForm';
import Dashboard from '../components/Dashboard';
import Button from '../components/Button';
import { useWallet } from '../ClientLayout';

// Toast notification component
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

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface PredictionFormData {
  teamName: string;
  asset: string;
  direction: 'up' | 'down';
  stakePercentage: number;
}

interface PredictionResult {
  predictionId: string;
  outcome: boolean;
  currentPrice: number;
  historicalPrice: number;
  rewardsDistributed: boolean;
  message: string;
  transactionHash?: string;
}

export default function DaoPage() {
  const { isWalletConnected, publicKey } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [predictions, setPredictions] = useState<PredictionResult[]>([]);
  const [userTeam, setUserTeam] = useState<string | null>(null);
  const [toastIdCounter, setToastIdCounter] = useState(0);

  // Toast management
  const addToast = (message: string, type: 'success' | 'error' | 'info') => {
    // Prevent duplicate messages
    const isDuplicate = toasts.some(toast => toast.message === message);
    if (isDuplicate) return;

    const id = Date.now() + toastIdCounter;
    setToastIdCounter(prev => prev + 1);
    setToasts(prev => [...prev, { id, message, type }]);

    // Auto-remove toast after 4 seconds
    setTimeout(() => removeToast(id), 4000);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Load user's team when wallet is connected
  useEffect(() => {
    const loadUserTeam = async () => {
      if (!isWalletConnected || !publicKey) {
        setUserTeam(null);
        return;
      }

      try {
        console.log('Loading team for address:', publicKey);
        const teamResponse = await fetch(
          `/api/teams/user-team?address=${publicKey}`,
          {
            method: 'GET',
          },
        );

        if (teamResponse.ok) {
          const teamData = await teamResponse.json();
          console.log('Team API response:', teamData);
          setUserTeam(teamData.teamName);
          console.log('User team loaded:', teamData.teamName);
        } else {
          console.error('Failed to load user team:', teamResponse.status);
          const errorText = await teamResponse.text();
          console.error('Error response:', errorText);
          setUserTeam(null);
        }
      } catch (error) {
        console.error('Error loading user team:', error);
        setUserTeam(null);
      }
    };

    loadUserTeam();
  }, [isWalletConnected, publicKey]);

  // Handle prediction form submission
  const handlePredictionSubmit = async (formData: PredictionFormData) => {
    if (!publicKey) {
      addToast('Please connect your wallet first', 'error');
      return;
    }

    if (!formData.direction) {
      addToast('Please select a prediction direction', 'error');
      return;
    }

    setIsLoading(true);

    try {
      addToast('Preparing transaction...', 'info');

      // Step 1: Prepare transaction via API
      const response = await fetch('/api/prepare-transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          publicKey: publicKey,
          teamName: formData.teamName,
          stakePercentage: formData.stakePercentage,
          prediction: {
            asset: formData.asset,
            direction: formData.direction === 'up',
          },
        }),
      });

      const prepareResult = await response.json();

      if (!response.ok) {
        throw new Error(prepareResult.error || 'Failed to prepare transaction');
      }

      // Step 2: Sign transaction with Freighter
      const signedXdr = await signTransaction(prepareResult.xdr, {
        networkPassphrase: prepareResult.networkPassphrase,
      });

      // Step 3: Submit transaction to Stellar network
      addToast('Submitting to Stellar network...', 'info');

      let transactionHash: string;
      try {
        const { rpc, TransactionBuilder } = await import(
          '@stellar/stellar-sdk'
        );
        const server = new rpc.Server('https://soroban-testnet.stellar.org');

        // Parse the signed transaction XDR
        const transaction = TransactionBuilder.fromXDR(
          signedXdr.signedTxXdr,
          'Test SDF Network ; September 2015',
        );

        // Submit to Stellar network
        const submitResult = await server.sendTransaction(transaction);

        transactionHash = submitResult.hash;
        console.log('Real transaction submitted:', {
          predictionId: prepareResult.predictionId,
          hash: transactionHash,
          status: submitResult.status,
        });

        if (submitResult.status === 'PENDING') {
          addToast(
            `Transaction submitted successfully! Hash: ${transactionHash.slice(0, 8)}...`,
            'success',
          );
        } else if (submitResult.status === 'DUPLICATE') {
          addToast(
            `Transaction already exists! Hash: ${transactionHash.slice(0, 8)}...`,
            'info',
          );
        } else {
          throw new Error(
            `Transaction failed with status: ${submitResult.status}`,
          );
        }
      } catch (submitError) {
        console.error('Transaction submission failed:', submitError);
        addToast(
          `Transaction submission failed: ${submitError instanceof Error ? submitError.message : 'Unknown error'}`,
          'error',
        );
        // Don't use mock hash if submission fails - let the user know it failed
        return;
      }

      // Step 4: Resolve prediction after a short delay (simulate time passage)
      setTimeout(async () => {
        try {
          const resolveResponse = await fetch(
            `/api/resolve?predictionId=${prepareResult.predictionId}`,
          );
          const resolveResult = await resolveResponse.json();

          if (resolveResponse.ok) {
            const predictionResult: PredictionResult = {
              ...resolveResult,
              transactionHash: transactionHash,
            };

            setPredictions(prev => [predictionResult, ...prev]);
            addToast(
              resolveResult.message,
              resolveResult.outcome ? 'success' : 'info',
            );
          } else {
            addToast(
              'Failed to resolve prediction: ' + resolveResult.error,
              'error',
            );
          }
        } catch (error) {
          console.error('Error resolving prediction:', error);
          addToast('Error resolving prediction', 'error');
        }
      }, 2000);
    } catch (error: any) {
      console.error('Error in prediction flow:', error);

      if (error.message?.includes('User rejected')) {
        addToast('Transaction cancelled by user', 'error');
      } else if (error.message?.includes('Freighter')) {
        addToast(
          'Freighter wallet error. Please check your connection.',
          'error',
        );
      } else {
        addToast(`Error: ${error.message}`, 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Manual resolve function for testing
  const handleManualResolve = async (predictionId: string) => {
    try {
      addToast('Resolving prediction...', 'info');

      const response = await fetch(`/api/resolve?predictionId=${predictionId}`);
      const result = await response.json();

      if (response.ok) {
        const existingIndex = predictions.findIndex(
          p => p.predictionId === predictionId,
        );
        if (existingIndex >= 0) {
          const updated = [...predictions];
          updated[existingIndex] = { ...updated[existingIndex], ...result };
          setPredictions(updated);
        } else {
          setPredictions(prev => [result, ...prev]);
        }

        addToast(result.message, result.outcome ? 'success' : 'info');
      } else {
        addToast('Failed to resolve: ' + result.error, 'error');
      }
    } catch (error) {
      console.error('Error resolving prediction:', error);
      addToast('Error resolving prediction', 'error');
    }
  };

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
              <h1 className="text-2xl font-bold text-white">Kaleracle DAO</h1>
              <p className="text-gray-400 text-sm">
                Collaborative Price Predictions
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {publicKey && (
                <div className="flex items-center space-x-4">
                  {/* Team Status */}
                  <div className="text-right">
                    {userTeam ? (
                      <div>
                        <p className="text-xs text-gray-300">Team</p>
                        <p className="text-white font-medium">{userTeam}</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs text-red-300">No Team</p>
                        <a
                          href="/teams"
                          className="text-red-400 hover:text-red-300 text-sm underline"
                        >
                          Join or Create Team
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Wallet Info */}
                  <div className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-lg px-4 py-2">
                    <p className="text-xs text-gray-300 mb-1">
                      Connected Wallet
                    </p>
                    <p className="text-white font-mono text-sm">
                      {publicKey.slice(0, 6)}...
                      {publicKey.slice(-6)}
                    </p>
                  </div>
                </div>
              )}

              {/* Teams Link */}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => (window.location.href = '/teams')}
                className="text-sm"
              >
                Manage Teams
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column: Prediction Form */}
          <div className="space-y-6">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                Make Prediction
              </h2>
              {!publicKey ? (
                <div className="text-center py-8">
                  <p className="text-gray-400 mb-4">
                    Connect your wallet to start making predictions
                  </p>
                  <Button
                    variant="primary"
                    onClick={() => window.location.reload()}
                  >
                    Refresh to Connect
                  </Button>
                </div>
              ) : (
                <PredictionForm
                  onSubmit={handlePredictionSubmit}
                  isConnected={isWalletConnected}
                  userTeam={userTeam}
                />
              )}
            </div>

            {/* Transaction History */}
            {predictions.length > 0 && (
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Recent Predictions
                </h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {predictions.map((prediction, index) => (
                    <div
                      key={`${prediction.predictionId}_${index}`}
                      className="bg-white/5 border border-white/10 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-mono text-gray-300">
                          {prediction.predictionId.slice(0, 20)}...
                        </span>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            prediction.outcome
                              ? 'bg-green-500/20 text-green-300'
                              : 'bg-red-500/20 text-red-300'
                          }`}
                        >
                          {prediction.outcome ? 'Correct' : 'Incorrect'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 mb-2">
                        {prediction.message}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Price: {prediction.currentPrice.toFixed(4)}</span>
                        {prediction.transactionHash && (
                          <a
                            href={`https://stellar.expert/explorer/testnet/tx/${prediction.transactionHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-red-400 hover:text-red-300 underline"
                          >
                            View on Stellar Explorer
                          </a>
                        )}
                      </div>
                      <div className="mt-2">
                        <Button
                          variant="glass"
                          size="sm"
                          onClick={() =>
                            handleManualResolve(prediction.predictionId)
                          }
                          className="w-full"
                        >
                          Re-resolve
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Dashboard */}
          <div className="space-y-6">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                Price Dashboard
              </h2>
              <Dashboard />
            </div>

            {/* Instructions */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                How it Works
              </h3>
              <div className="space-y-3 text-sm text-gray-300">
                <div className="flex items-start gap-3">
                  <span className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    1
                  </span>
                  <p>Connect your Freighter wallet to Stellar Testnet</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    2
                  </span>
                  <p>Join a team and stake KALE tokens on price predictions</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    3
                  </span>
                  <p>
                    Transactions are signed with Freighter and submitted to
                    Stellar
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    4
                  </span>
                  <p>Predictions are resolved using Reflector oracle data</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    5
                  </span>
                  <p>Rewards are distributed to winning teams</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
