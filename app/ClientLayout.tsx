'use client';

import React, { useState, createContext, useContext } from 'react';
import Header from './Header';

interface WalletContextType {
  isWalletConnected: boolean;
  publicKey: string;
  setWalletConnected: (connected: boolean, publicKey?: string) => void;
  hasManuallyDisconnected: boolean;
  setManuallyDisconnected: (disconnected: boolean) => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

interface ClientLayoutProps {
  children: React.ReactNode;
}

const ClientLayout: React.FC<ClientLayoutProps> = ({ children }) => {
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [publicKey, setPublicKey] = useState<string>('');
  const [hasManuallyDisconnected, setHasManuallyDisconnected] = useState(() => {
    // Initialize from localStorage if available
    if (typeof window !== 'undefined') {
      return localStorage.getItem('walletManuallyDisconnected') === 'true';
    }
    return false;
  });

  const setWalletConnected = (connected: boolean, key?: string) => {
    setIsWalletConnected(connected);
    setPublicKey(key || '');
  };

  const setManuallyDisconnected = (disconnected: boolean) => {
    setHasManuallyDisconnected(disconnected);
    // Persist to localStorage
    if (typeof window !== 'undefined') {
      if (disconnected) {
        localStorage.setItem('walletManuallyDisconnected', 'true');
      } else {
        localStorage.removeItem('walletManuallyDisconnected');
      }
    }
  };

  const handleWalletConnected = (publicKey: string) => {
    setWalletConnected(true, publicKey);
    setManuallyDisconnected(false); // Clear the disconnection flag when connecting
  };

  const handleWalletDisconnected = () => {
    setWalletConnected(false, '');
    setManuallyDisconnected(true);
  };

  const walletContextValue: WalletContextType = {
    isWalletConnected,
    publicKey,
    setWalletConnected,
    hasManuallyDisconnected,
    setManuallyDisconnected,
  };

  return (
    <WalletContext.Provider value={walletContextValue}>
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
        <Header
          onWalletConnected={handleWalletConnected}
          onWalletDisconnected={handleWalletDisconnected}
        />
        <main className="relative">{children}</main>

        {/* Footer */}
        <footer className="border-t border-white/10 bg-black/50 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center mb-4 md:mb-0">
                <div className="w-6 h-6 bg-gradient-to-r from-red-500 to-red-600 rounded mr-2"></div>
                <span className="text-white font-medium">Kaleracle</span>
                <span className="ml-2 text-gray-400 text-sm">
                  Collaborative Price Prediction DAO
                </span>
              </div>
              <div className="flex items-center space-x-6">
                <span className="text-gray-400 text-sm">
                  Powered by <span className="text-blue-400">Stellar</span> &{' '}
                  <span className="text-purple-400">Reflector</span>
                </span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </WalletContext.Provider>
  );
};

export default ClientLayout;
