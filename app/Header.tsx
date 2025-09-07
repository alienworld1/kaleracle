'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { isConnected } from '@stellar/freighter-api';
import freighterApi from '@stellar/freighter-api';
import { ConnectWallet } from './components';

interface HeaderProps {
  onWalletConnected?: (publicKey: string) => void;
  onWalletDisconnected?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  onWalletConnected,
  onWalletDisconnected,
}) => {
  // Check wallet connection on component mount
  useEffect(() => {
    const checkWalletConnection = async () => {
      try {
        const connected = await isConnected();
        if (connected) {
          const result = await freighterApi.getAddress();
          onWalletConnected?.(result.address);
        }
      } catch (err) {
        console.error('Error checking wallet connection:', err);
      }
    };

    checkWalletConnection();
  }, [onWalletConnected]);

  const handleWalletConnected = (publicKey: string) => {
    onWalletConnected?.(publicKey);
  };

  const handleWalletDisconnected = () => {
    onWalletDisconnected?.();
  };

  return (
    <header className="sticky top-0 z-50 bg-black/90 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">K</span>
              </div>
              <h1 className="text-xl font-bold text-white">
                Kal<span className="text-red-400">eracle</span>
              </h1>
            </div>
          </div>
          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              href="/"
              className="text-gray-300 hover:text-white transition-colors duration-200"
            >
              Home
            </Link>
            <Link
              href="/dao"
              className="text-gray-300 hover:text-white transition-colors duration-200"
            >
              DAO
            </Link>
            <Link
              href="/teams"
              className="text-gray-300 hover:text-white transition-colors duration-200"
            >
              Teams
            </Link>
            <a
              href="#predictions"
              className="text-gray-300 hover:text-white transition-colors duration-200"
            >
              Predictions
            </a>
          </nav>{' '}
          {/* Wallet Connection */}
          <div className="flex items-center space-x-4">
            {/* Network Status */}
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-400 text-sm font-medium">
                Stellar
              </span>
            </div>

            {/* Connect Wallet */}
            <ConnectWallet
              onWalletConnected={handleWalletConnected}
              onWalletDisconnected={handleWalletDisconnected}
            />
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className="md:hidden mt-4 pt-4 border-t border-white/10">
          <div className="flex items-center justify-center space-x-6">
            <Link
              href="/"
              className="text-gray-300 hover:text-white transition-colors duration-200 text-sm"
            >
              Home
            </Link>
            <Link
              href="/dao"
              className="text-gray-300 hover:text-white transition-colors duration-200 text-sm"
            >
              DAO
            </Link>
            <Link
              href="/teams"
              className="text-gray-300 hover:text-white transition-colors duration-200 text-sm"
            >
              Teams
            </Link>
            <a
              href="#predictions"
              className="text-gray-300 hover:text-white transition-colors duration-200 text-sm"
            >
              Predictions
            </a>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;
