'use client';

import React, { useState } from 'react';
import { Button, Input, PredictionForm, Dashboard } from '../components';
import { useWallet } from '../ClientLayout';

interface PredictionFormData {
  teamName: string;
  stakePercentage: number;
  prediction: boolean | null;
  asset: string;
}

export default function ComponentsDemo() {
  const { isWalletConnected } = useWallet();
  const [selectedAsset, setSelectedAsset] = useState<string>('EUR/USD');

  const handlePredictionSubmit = async (data: PredictionFormData) => {
    console.log('Prediction submitted:', data);
    setSelectedAsset(data.asset);

    // Simulate transaction submission
    await new Promise(resolve => setTimeout(resolve, 2000));

    alert(`Prediction submitted successfully for ${data.asset}!`);
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Kaleracle Components Demo
          </h1>
          <p className="text-gray-400 text-lg">
            Interactive demonstration of all Kaleracle UI components
          </p>
        </div>

        {/* Wallet Status Info */}
        <div className="bg-gray-800/80 backdrop-blur-xl border border-white/10 rounded-xl p-6 mb-8">
          <h2 className="text-2xl font-semibold text-white mb-4">
            Wallet Status
          </h2>
          <div className="flex items-center space-x-4">
            <div
              className={`w-3 h-3 rounded-full ${isWalletConnected ? 'bg-green-500' : 'bg-red-500'}`}
            ></div>
            <span
              className={`font-medium ${isWalletConnected ? 'text-green-400' : 'text-red-400'}`}
            >
              {isWalletConnected ? 'Wallet Connected' : 'Wallet Not Connected'}
            </span>
            {!isWalletConnected && (
              <span className="text-gray-400 text-sm">
                Use the Connect Wallet button in the header above
              </span>
            )}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Dashboard */}
          <div>
            <h2 className="text-2xl font-semibold text-white mb-4">
              Price Dashboard
            </h2>
            <Dashboard asset={selectedAsset} timeframe="24H" />
          </div>

          {/* Prediction Form */}
          <div>
            <h2 className="text-2xl font-semibold text-white mb-4">
              Prediction Form
            </h2>
            <PredictionForm
              onSubmit={handlePredictionSubmit}
              isConnected={isWalletConnected}
              maxStakePercentage={100}
              availableAssets={['EUR/USD', 'BTC/USD', 'ETH/USD', 'XLM/USD']}
            />
          </div>
        </div>

        {/* UI Elements Demo */}
        <div className="bg-gray-800/80 backdrop-blur-xl border border-white/10 rounded-xl p-6 mb-8">
          <h2 className="text-2xl font-semibold text-white mb-6">
            UI Elements
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Buttons */}
            <div>
              <h3 className="text-lg font-medium text-white mb-3">Buttons</h3>
              <div className="space-y-3">
                <Button variant="primary" size="md">
                  Primary Button
                </Button>
                <Button variant="secondary" size="md">
                  Secondary Button
                </Button>
                <Button variant="glass" size="md">
                  Glass Button
                </Button>
                <Button variant="primary" size="sm" loading>
                  Loading Button
                </Button>
              </div>
            </div>

            {/* Inputs */}
            <div>
              <h3 className="text-lg font-medium text-white mb-3">
                Input Fields
              </h3>
              <div className="space-y-4">
                <Input
                  label="Text Input"
                  placeholder="Enter text here"
                  variant="default"
                />
                <Input
                  label="Number Input"
                  type="number"
                  placeholder="Enter amount"
                  helperText="Enter a numeric value"
                  variant="glass"
                />
                <Input
                  label="Error State"
                  placeholder="Invalid input"
                  error="This field is required"
                  variant="default"
                />
              </div>
            </div>

            {/* Status Cards */}
            <div>
              <h3 className="text-lg font-medium text-white mb-3">Status</h3>
              <div className="space-y-3">
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-green-400 text-sm font-medium">
                      Connected
                    </span>
                  </div>
                  <p className="text-green-300 text-xs mt-1">
                    System operational
                  </p>
                </div>

                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                    <span className="text-red-400 text-sm font-medium">
                      Error
                    </span>
                  </div>
                  <p className="text-red-300 text-xs mt-1">Connection failed</p>
                </div>

                <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                    <span className="text-yellow-400 text-sm font-medium">
                      Warning
                    </span>
                  </div>
                  <p className="text-yellow-300 text-xs mt-1">
                    Check configuration
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Component Information */}
        <div className="bg-gray-800/80 backdrop-blur-xl border border-white/10 rounded-xl p-6">
          <h2 className="text-2xl font-semibold text-white mb-4">
            Component Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <h3 className="text-lg font-medium text-red-400 mb-2">
                🔴 Button Component
              </h3>
              <ul className="text-gray-300 text-sm space-y-1">
                <li>• Three variants: primary, secondary, glass</li>
                <li>• Loading states with spinner</li>
                <li>• Glassmorphism effects</li>
                <li>• Hover animations</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-medium text-red-400 mb-2">
                📝 Input Component
              </h3>
              <ul className="text-gray-300 text-sm space-y-1">
                <li>• Type-safe form inputs</li>
                <li>• Error and helper text</li>
                <li>• Glass effect variants</li>
                <li>• Focus states</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-medium text-red-400 mb-2">
                🔗 ConnectWallet
              </h3>
              <ul className="text-gray-300 text-sm space-y-1">
                <li>• Freighter wallet integration</li>
                <li>• Auto-connection detection</li>
                <li>• Public key display</li>
                <li>• Error handling</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-medium text-red-400 mb-2">
                🎯 PredictionForm
              </h3>
              <ul className="text-gray-300 text-sm space-y-1">
                <li>• Team and asset selection</li>
                <li>• Percentage slider</li>
                <li>• Prediction direction buttons</li>
                <li>• Form validation</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-medium text-red-400 mb-2">
                📊 Dashboard
              </h3>
              <ul className="text-gray-300 text-sm space-y-1">
                <li>• Real-time price charts</li>
                <li>• Recharts integration</li>
                <li>• Multi-asset support</li>
                <li>• Oracle data display</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
