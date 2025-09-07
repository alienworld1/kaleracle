'use client';

import React, { useState } from 'react';
import Button from './Button';
import Input from './Input';

interface PredictionFormDataSubmit {
  teamName: string;
  asset: string;
  direction: 'up' | 'down';
  stakePercentage: number;
}

interface PredictionFormData {
  asset: string;
  direction: 'up' | 'down';
  stakePercentage: number;
}

interface PredictionFormErrors {
  asset?: string;
  direction?: string;
  stakePercentage?: string;
}

interface PredictionFormProps {
  onSubmit: (data: PredictionFormDataSubmit) => Promise<void>;
  isConnected: boolean;
  userTeam: string | null;
  maxStakePercentage?: number;
  availableAssets?: string[];
}

const PredictionForm: React.FC<PredictionFormProps> = ({
  onSubmit,
  isConnected,
  userTeam,
  maxStakePercentage = 100,
  availableAssets = ['EUR/USD', 'BTC/USD', 'ETH/USD', 'XLM/USD'],
}) => {
  const [formData, setFormData] = useState<PredictionFormData>({
    asset: availableAssets[0],
    direction: 'up',
    stakePercentage: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<PredictionFormErrors>({});

  const validateForm = (): boolean => {
    const newErrors: PredictionFormErrors = {};

    if (!userTeam) {
      // This should be handled by the parent component
      return false;
    }

    if (
      formData.stakePercentage <= 0 ||
      formData.stakePercentage > maxStakePercentage
    ) {
      newErrors.stakePercentage = `Stake percentage must be between 1 and ${maxStakePercentage}`;
    }

    if (!formData.asset) {
      newErrors.asset = 'Please select an asset';
    }

    if (!formData.direction) {
      newErrors.direction = 'Please select a prediction direction';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    if (!userTeam) {
      alert(
        'You must be part of a team to make predictions. Please join or create a team first.',
      );
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        teamName: userTeam,
        asset: formData.asset,
        direction: formData.direction,
        stakePercentage: formData.stakePercentage,
      });
      // Reset form on successful submission
      setFormData({
        asset: availableAssets[0],
        direction: 'up',
        stakePercentage: 0,
      });
      setErrors({});
    } catch (error) {
      console.error('Error submitting prediction:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (
    field: keyof PredictionFormData,
    value: string | number | boolean | null,
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="bg-gray-800/80 backdrop-blur-xl border border-white/10 rounded-xl p-6 max-w-md mx-auto">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-white mb-2">
          Make a Prediction
        </h3>
        <p className="text-gray-400 text-sm">
          Join or create a team and stake KALE tokens on your price prediction
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Team Info Display */}
        {userTeam ? (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
            <h4 className="text-green-400 font-medium mb-1">Your Team</h4>
            <p className="text-white text-lg">{userTeam}</p>
          </div>
        ) : (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <h4 className="text-red-400 font-medium mb-1">No Team</h4>
            <p className="text-gray-300 text-sm">
              You must join or create a team before making predictions.
            </p>
          </div>
        )}

        {/* Asset Selection */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Asset Pair
          </label>
          <select
            value={formData.asset}
            onChange={e => handleInputChange('asset', e.target.value)}
            className="w-full bg-white/10 backdrop-blur-xl border border-white/15 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
          >
            {availableAssets.map(asset => (
              <option
                key={asset}
                value={asset}
                className="bg-gray-800 text-white"
              >
                {asset}
              </option>
            ))}
          </select>
          {errors.asset && (
            <p className="mt-1 text-sm text-red-400">{errors.asset}</p>
          )}
        </div>

        {/* Prediction Direction */}
        <div>
          <label className="block text-sm font-medium text-white mb-3">
            Price Prediction
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleInputChange('direction', 'up')}
              className={`p-4 rounded-lg border transition-all duration-300 ${
                formData.direction === 'up'
                  ? 'bg-green-500/20 border-green-500 text-green-400'
                  : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
              }`}
            >
              <div className="text-2xl mb-1">📈</div>
              <div className="font-medium">Price Will Rise</div>
            </button>
            <button
              type="button"
              onClick={() => handleInputChange('direction', 'down')}
              className={`p-4 rounded-lg border transition-all duration-300 ${
                formData.direction === 'down'
                  ? 'bg-red-500/20 border-red-500 text-red-400'
                  : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
              }`}
            >
              <div className="text-2xl mb-1">📉</div>
              <div className="font-medium">Price Will Fall</div>
            </button>
          </div>
          {errors.direction && (
            <p className="mt-1 text-sm text-red-400">{errors.direction}</p>
          )}
        </div>

        {/* Stake Percentage */}
        <div>
          <Input
            label={`Stake Percentage (0-${maxStakePercentage}%)`}
            type="number"
            min="1"
            max={maxStakePercentage}
            value={formData.stakePercentage}
            onChange={e =>
              handleInputChange(
                'stakePercentage',
                parseInt(e.target.value) || 0,
              )
            }
            placeholder="Enter stake percentage"
            error={errors.stakePercentage}
            helperText="Percentage of your KALE balance to stake on this prediction"
            variant="glass"
          />

          {/* Stake Percentage Slider */}
          <div className="mt-3">
            <input
              type="range"
              min="0"
              max={maxStakePercentage}
              value={formData.stakePercentage}
              onChange={e =>
                handleInputChange('stakePercentage', parseInt(e.target.value))
              }
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, #ff3366 0%, #ff3366 ${(formData.stakePercentage / maxStakePercentage) * 100}%, rgba(255,255,255,0.1) ${(formData.stakePercentage / maxStakePercentage) * 100}%, rgba(255,255,255,0.1) 100%)`,
              }}
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>0%</span>
              <span>{formData.stakePercentage}%</span>
              <span>{maxStakePercentage}%</span>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={isSubmitting}
          disabled={!isConnected || !userTeam}
          className="w-full"
        >
          {!isConnected
            ? 'Connect Wallet to Continue'
            : !userTeam
              ? 'Join a Team to Continue'
              : isSubmitting
                ? 'Submitting Prediction...'
                : 'Submit Prediction'}
        </Button>

        {!isConnected && (
          <p className="text-center text-sm text-gray-400">
            Please connect your Freighter wallet to submit predictions
          </p>
        )}

        {isConnected && !userTeam && (
          <p className="text-center text-sm text-gray-400">
            You must join or create a team before making predictions
          </p>
        )}
      </form>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #ff3366;
          cursor: pointer;
          box-shadow: 0 0 10px rgba(255, 51, 102, 0.5);
        }

        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #ff3366;
          cursor: pointer;
          border: none;
          box-shadow: 0 0 10px rgba(255, 51, 102, 0.5);
        }
      `}</style>
    </div>
  );
};

export default PredictionForm;
