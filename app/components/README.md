# Kaleracle Components

This directory contains reusable UI components for the Kaleracle Collaborative Price Prediction DAO application.

## Components Overview

### 🔴 Button (`Button.tsx`)

A versatile button component with multiple variants and states.

**Features:**

- Three variants: `primary`, `secondary`, `glass`
- Three sizes: `sm`, `md`, `lg`
- Loading state with spinner animation
- Glassmorphism effects with Tailwind
- Hover animations and focus states

**Usage:**

```tsx
import { Button } from '@/components';

<Button variant="primary" size="md" loading={isLoading}>
  Submit Prediction
</Button>;
```

### 📝 Input (`Input.tsx`)

Type-safe form input component with validation and styling.

**Features:**

- TypeScript support for different input types
- Error states with custom messages
- Helper text support
- Glass effect variant
- Number input with visual indicators

**Usage:**

```tsx
import { Input } from '@/components';

<Input
  label="Stake Amount"
  type="number"
  error={errors.stakeAmount}
  helperText="Enter amount in KALE tokens"
  variant="glass"
/>;
```

### 🔗 ConnectWallet (`ConnectWallet.tsx`)

Freighter wallet integration component for Stellar blockchain.

**Features:**

- Auto-detection of existing connections
- Freighter wallet integration
- Public key display with formatting
- Error handling for various failure states
- Installation links for missing extension

**Usage:**

```tsx
import { ConnectWallet } from '@/components';

<ConnectWallet
  onWalletConnected={publicKey => console.log('Connected:', publicKey)}
  onWalletDisconnected={() => console.log('Disconnected')}
/>;
```

### 🎯 PredictionForm (`PredictionForm.tsx`)

Comprehensive form for submitting price predictions.

**Features:**

- Team name input with validation
- Asset selection dropdown
- Prediction direction buttons (Bull/Bear)
- Stake percentage slider with visual feedback
- Form validation and error handling
- TypeScript interfaces for data safety

**Usage:**

```tsx
import { PredictionForm } from '@/components';

<PredictionForm
  onSubmit={handlePredictionSubmit}
  isConnected={isWalletConnected}
  maxStakePercentage={100}
  availableAssets={['EUR/USD', 'BTC/USD', 'ETH/USD']}
/>;
```

### 📊 Dashboard (`Dashboard.tsx`)

Interactive price chart dashboard using Recharts.

**Features:**

- Real-time price visualization
- Multiple asset support
- Responsive area charts
- Custom tooltips with price formatting
- Price change indicators
- Oracle data source display
- Glassmorphism design

**Usage:**

```tsx
import { Dashboard } from '@/components';

<Dashboard asset="EUR/USD" timeframe="24H" />;
```

## Styling System

All components use:

- **Tailwind CSS** for styling
- **Glassmorphism** effects with backdrop blur
- **Consistent color scheme** using red (#ff3366) as primary
- **Responsive design** principles
- **Dark theme** with transparent elements

## Dependencies

```json
{
  "@stellar/freighter-api": "Stellar wallet integration",
  "@stellar/stellar-sdk": "Stellar blockchain SDK",
  "recharts": "Chart visualization library",
  "react": "UI framework",
  "tailwindcss": "Utility-first CSS framework"
}
```

## Environment Variables

The components expect the following environment variables:

```env
CONTRACT_ID="your_stellar_contract_id_here"
```

## Demo Page

Visit `/demo` to see all components in action with interactive examples.

## Integration with Smart Contract

The components are designed to integrate with the Collaborative DAO smart contract deployed on Stellar Testnet. They handle:

- **KALE token** staking and transfers
- **Team formation** and management
- **Price predictions** submission
- **Reflector oracle** price data display

## Development

1. All components are TypeScript-enabled
2. Use proper prop interfaces for type safety
3. Follow the existing glassmorphism design patterns
4. Include proper error handling
5. Test with the demo page before integration

## Future Enhancements

- [ ] Real Reflector oracle integration
- [ ] Advanced chart timeframes
- [ ] Team management components
- [ ] Reward distribution displays
- [ ] Mobile-optimized layouts
- [ ] Accessibility improvements
