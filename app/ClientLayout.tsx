'use client';

import React, { useState, createContext, useContext } from 'react';
import Header from './Header';

interface WalletContextType {
  isWalletConnected: boolean;
  publicKey: string;
  setWalletConnected: (connected: boolean, publicKey?: string) => void;
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

  const setWalletConnected = (connected: boolean, key?: string) => {
    setIsWalletConnected(connected);
    setPublicKey(key || '');
  };

  const handleWalletConnected = (publicKey: string) => {
    setWalletConnected(true, publicKey);
  };

  const handleWalletDisconnected = () => {
    setWalletConnected(false, '');
  };

  const walletContextValue: WalletContextType = {
    isWalletConnected,
    publicKey,
    setWalletConnected,
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
            <div className="mt-4 pt-4 border-t border-white/5">
              <p className="text-gray-500 text-xs text-center">
                Built for Stellar Hacks: KALE x Reflector hackathon. Running on
                Stellar Testnet.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </WalletContext.Provider>
  );
};

export default ClientLayout;
