'use client';

import React, { useState } from 'react';
import Button from './Button';
import Input from './Input';

interface PredictionFormData {
  teamName: string;
  stakePercentage: number;
  prediction: boolean | null;
  asset: string;
}

interface PredictionFormErrors {
  teamName?: string;
  stakePercentage?: string;
  prediction?: string;
  asset?: string;
}

interface PredictionFormProps {
  onSubmit: (data: PredictionFormData) => Promise<void>;
  isConnected: boolean;
  maxStakePercentage?: number;
  availableAssets?: string[];
}

const PredictionForm: React.FC<PredictionFormProps> = ({
  onSubmit,
  isConnected,
  maxStakePercentage = 100,
  availableAssets = ['EUR/USD', 'BTC/USD', 'ETH/USD', 'XLM/USD'],
}) => {
  const [formData, setFormData] = useState<PredictionFormData>({
    teamName: '',
    stakePercentage: 0,
    prediction: null,
    asset: availableAssets[0],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<PredictionFormErrors>({});

  const validateForm = (): boolean => {
    const newErrors: PredictionFormErrors = {};

    if (!formData.teamName.trim()) {
      newErrors.teamName = 'Team name is required';
    }

    if (
      formData.stakePercentage <= 0 ||
      formData.stakePercentage > maxStakePercentage
    ) {
      newErrors.stakePercentage = `Stake percentage must be between 1 and ${maxStakePercentage}`;
    }

    if (formData.prediction === null) {
      newErrors.prediction = 'Please select a prediction';
    }

    if (!formData.asset) {
      newErrors.asset = 'Please select an asset';
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

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      // Reset form on successful submission
      setFormData({
        teamName: '',
        stakePercentage: 0,
        prediction: null,
        asset: availableAssets[0],
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
        {/* Team Name */}
        <Input
          label="Team Name"
          type="text"
          value={formData.teamName}
          onChange={e => handleInputChange('teamName', e.target.value)}
          placeholder="Enter team name"
          error={errors.teamName}
          variant="glass"
        />

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
              onClick={() => handleInputChange('prediction', true)}
              className={`p-4 rounded-lg border transition-all duration-300 ${
                formData.prediction === true
                  ? 'bg-green-500/20 border-green-500 text-green-400'
                  : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
              }`}
            >
              <div className="text-2xl mb-1">📈</div>
              <div className="font-medium">Price Will Rise</div>
            </button>
            <button
              type="button"
              onClick={() => handleInputChange('prediction', false)}
              className={`p-4 rounded-lg border transition-all duration-300 ${
                formData.prediction === false
                  ? 'bg-red-500/20 border-red-500 text-red-400'
                  : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
              }`}
            >
              <div className="text-2xl mb-1">📉</div>
              <div className="font-medium">Price Will Fall</div>
            </button>
          </div>
          {errors.prediction && (
            <p className="mt-1 text-sm text-red-400">{errors.prediction}</p>
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
          disabled={!isConnected}
          className="w-full"
        >
          {isConnected
            ? isSubmitting
              ? 'Submitting Prediction...'
              : 'Submit Prediction'
            : 'Connect Wallet to Continue'}
        </Button>

        {!isConnected && (
          <p className="text-center text-sm text-gray-400">
            Please connect your Freighter wallet to submit predictions
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
