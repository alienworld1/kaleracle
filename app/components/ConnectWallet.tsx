'use client';

import React, { useState, useEffect } from 'react';
import { isConnected, requestAccess } from '@stellar/freighter-api';
import freighterApi from '@stellar/freighter-api';
import Button from './Button';
import { useWallet } from '../ClientLayout';

interface ConnectWalletProps {
  onWalletConnected?: (publicKey: string) => void;
  onWalletDisconnected?: () => void;
}

const ConnectWallet: React.FC<ConnectWalletProps> = ({
  onWalletConnected,
  onWalletDisconnected,
}) => {
  const {
    isWalletConnected,
    publicKey,
    setWalletConnected,
    hasManuallyDisconnected,
    setManuallyDisconnected,
  } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Function to check if Freighter is really available
  const checkFreighterAvailability = (): boolean => {
    // Check multiple ways Freighter might be available
    try {
      // The most reliable way is to check if the functions we need exist
      return (
        typeof isConnected === 'function' &&
        typeof requestAccess === 'function' &&
        typeof freighterApi?.getAddress === 'function'
      );
    } catch {
      return false;
    }
  };

  // Alternative: Try to detect Freighter by attempting isConnected()
  const testFreighterConnection = async (): Promise<boolean> => {
    try {
      await isConnected();
      return true;
    } catch (error) {
      console.log('Freighter test failed:', error);
      return false;
    }
  };

  // Check wallet connection on component mount
  useEffect(() => {
    const checkConnectionOnMount = async () => {
      console.log('ConnectWallet checkConnectionOnMount:', {
        hasManuallyDisconnected,
        isWalletConnected,
        publicKey: publicKey ? `${publicKey.slice(0, 6)}...` : 'none',
      });

      // Skip auto-connection if user has manually disconnected
      if (hasManuallyDisconnected) {
        console.log('Skipping auto-connection - user manually disconnected');
        return;
      }

      try {
        const connected = await isConnected();
        console.log('Freighter isConnected result:', connected);
        if (connected) {
          const result = await freighterApi.getAddress();
          console.log(
            'Auto-connecting wallet with address:',
            result.address.slice(0, 6) + '...',
          );
          setWalletConnected(true, result.address);
          onWalletConnected?.(result.address);
        }
      } catch (err) {
        console.error('Error checking wallet connection:', err);
      }
    };

    checkConnectionOnMount();
  }, [hasManuallyDisconnected, setWalletConnected]); // Removed onWalletConnected from dependencies

  const connectWallet = async () => {
    setIsLoading(true);
    setError('');
    setManuallyDisconnected(false); // Reset the flag when user manually connects

    try {
      // Test if Freighter is working by trying isConnected first
      const freighterWorks = await testFreighterConnection();
      if (!freighterWorks) {
        throw new Error(
          'Freighter wallet extension is not responding. Please make sure it is installed and enabled.',
        );
      }

      // Request access to the wallet
      await requestAccess();

      // Get the public key
      const result = await freighterApi.getAddress();

      setWalletConnected(true, result.address);
      onWalletConnected?.(result.address);
    } catch (err: unknown) {
      console.error('Error connecting wallet:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';

      // More specific error handling
      if (
        errorMessage.includes('not responding') ||
        errorMessage.includes('not installed')
      ) {
        setError(
          'Freighter wallet extension not detected. Please install it and refresh the page.',
        );
      } else if (
        errorMessage.includes('rejected') ||
        errorMessage.includes('denied') ||
        errorMessage.includes('User rejected')
      ) {
        setError(
          'Connection request was rejected. Please try again and approve the connection.',
        );
      } else if (errorMessage.toLowerCase().includes('network')) {
        setError(
          'Please make sure you are connected to Stellar Testnet in Freighter.',
        );
      } else {
        setError(`Connection failed: ${errorMessage}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectWallet = async () => {
    console.log('Disconnecting wallet - setting manual disconnect flag');
    setManuallyDisconnected(true); // Set flag to prevent auto-reconnection
    setWalletConnected(false, '');
    setError('');

    // Notify parent components that wallet was disconnected
    onWalletDisconnected?.();
  };
  const formatPublicKey = (key: string) => {
    if (key.length <= 12) return key;
    return `${key.slice(0, 6)}...${key.slice(-6)}`;
  };

  if (isWalletConnected && publicKey) {
    return (
      <div className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-lg p-4 max-w-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-300 mb-1">Connected Wallet</p>
            <p className="text-white font-mono text-sm">
              {formatPublicKey(publicKey)}
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={disconnectWallet}
            className="ml-3"
          >
            Disconnect
          </Button>
        </div>
        <div className="mt-2 flex items-center">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
          <span className="text-xs text-green-400">
            Connected to Stellar Testnet
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-sm">
      <Button
        variant="primary"
        onClick={connectWallet}
        loading={isLoading}
        className="w-full"
      >
        {isLoading ? 'Connecting...' : 'Connect Wallet'}
      </Button>

      {/* Debug info button - remove in production */}
      <Button
        variant="glass"
        size="sm"
        onClick={() => {
          console.log('=== Freighter Debug Info ===');
          console.log('window.freighter:', window.freighter);
          console.log('freighterApi:', freighterApi);
          console.log('isConnected function:', typeof isConnected);
          console.log('requestAccess function:', typeof requestAccess);
          console.log(
            'checkFreighterAvailability():',
            checkFreighterAvailability(),
          );
          console.log('User Agent:', navigator.userAgent);

          // Try to detect browser extension
          const extensions = Object.keys(window).filter(
            key =>
              key.toLowerCase().includes('freighter') ||
              key.toLowerCase().includes('stellar'),
          );
          console.log('Potential extension keys:', extensions);

          alert('Debug info logged to console. Press F12 to view.');
        }}
        className="w-full mt-2"
      >
        Debug Freighter Detection
      </Button>

      {error && (
        <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
          {(error.includes('install') || error.includes('not available')) && (
            <div className="mt-2">
              <a
                href="https://freighter.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-red-300 hover:text-red-200 text-sm underline mr-4"
              >
                Download Freighter
              </a>
              <button
                onClick={() => window.location.reload()}
                className="text-red-300 hover:text-red-200 text-sm underline"
              >
                Refresh Page
              </button>
            </div>
          )}
        </div>
      )}

      <div className="mt-3 text-xs text-gray-400">
        <p>Connect your Freighter wallet to interact with Kaleracle DAO</p>
        <p className="mt-1">• Make sure you&apos;re on Stellar Testnet</p>
        <p>• Ensure you have KALE tokens for staking</p>
      </div>
    </div>
  );
};

// Extend Window interface for TypeScript
declare global {
  interface Window {
    freighter?: {
      isConnected: () => Promise<boolean>;
      requestAccess: () => Promise<void>;
      getAddress: () => Promise<{ address: string }>;
    };
  }
}

export default ConnectWallet;
