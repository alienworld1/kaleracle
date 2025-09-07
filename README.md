# Kaleracle - Collaborative Price Prediction DAO

A decentralized application (dApp) for collaborative price predictions on the Stellar blockchain, integrating KALE's proof-of-teamwork mechanics with Reflector's oracle feeds.

## 🌟 Project Overview

Kaleracle enables users to form teams, stake KALE tokens, and make collaborative price predictions on financial assets like EUR/USD. The platform leverages:

- **KALE Token Integration**: Team-based staking with adjustable percentages (0-100%)
- **Reflector Oracle**: Real-time price feeds for accurate prediction resolution
- **Stellar Soroban**: Smart contracts deployed on Testnet for low-fee interactions
- **Collaborative Mining**: KALE's proof-of-teamwork with hash verification
- **Mobile-First UI**: Glassmorphism design with cyberpunk aesthetics

### Key Features

- 🤝 **Team Formation**: Create and join prediction teams
- 💰 **Flexible Staking**: Adjust KALE stake percentage (0-100%)
- 📊 **Price Predictions**: Predict asset price movements (rise/fall)
- 🔮 **Oracle Resolution**: Automated resolution using Reflector price feeds
- 🏆 **Reward Distribution**: KALE rewards for accurate team predictions
- 📱 **Responsive Design**: Optimized for mobile and desktop

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Freighter Wallet browser extension
- KALE tokens on Stellar Testnet

### Installation

1. Clone the repository:

```bash
git clone https://github.com/alienworl1/kaleracle.git
cd kaleracle
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:
4. Update `.env` with:

```env
PUBLIC_STELLAR_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
PUBLIC_STELLAR_RPC_URL="https://soroban-testnet.stellar.org"
PUBLIC_KALE_CONTRACT_ID="YOUR_KALE_CONTRACT_ID"
PUBLIC_REFLECTOR_CONTRACT_ID="CCYOZJCOPG34LLQQ7N24YXBM7LL62R7ONMZ3G6WZAAYPB5OYKOMJRN63"
PUBLIC_DAO_CONTRACT_ID="YOUR_DEPLOYED_DAO_CONTRACT_ID"
```

4. Run the development server:

```bash
npm run dev
```

5. Open [https://localhost:3000](https://localhost:3000) in your browser

## 📋 Usage Guide

### 1. Connect Your Wallet

- Install the [Freighter Wallet](https://freighter.app/) browser extension
- Create or import a Stellar Testnet account
- Fund your account via [Friendbot](https://friendbot.stellar.org)
- Click "Connect Wallet" in the Kaleracle interface

### 2. Form or Join a Team

1. Navigate to the "Teams" page
2. Click "Create Team" to form a new team
3. Invite team members by their Stellar public keys
4. Or join an existing team by entering the team name

### 3. Stake KALE Tokens

1. Go to the "DAO" page
2. Select your team from the dropdown
3. Choose your stake percentage (0-100% of KALE balance)
4. Confirm the staking transaction in Freighter

### 4. Make Price Predictions

1. Select an asset pair (e.g., EUR/USD)
2. Predict if the price will rise ↗ or fall ↘
3. Set your prediction timeframe
4. Submit the prediction (requires team consensus)

### 5. View Results

- Monitor your team's predictions in the dashboard
- Track price movements with integrated Recharts
- Collect KALE rewards for accurate predictions
- View team leaderboards and statistics

## 🌐 Stellar Testnet Details

### Network Configuration

- **Network**: Stellar Testnet
- **RPC URL**: `https://soroban-testnet.stellar.org`
- **Network Passphrase**: `Test SDF Network ; September 2015`
- **Explorer**: [Stellar Laboratory](https://laboratory.stellar.org/)

### Smart Contracts

- **DAO Contract**: Manages teams, predictions, and rewards
- **Reflector Oracle**: Provides real-time EUR/USD price feeds
- **KALE Token**: Used for staking and reward distribution

### Getting Testnet Tokens

1. Visit [Friendbot](https://friendbot.stellar.org)
2. Enter your Stellar public key
3. Receive 10,000 XLM for testing
4. Acquire KALE tokens through the official KALE distribution

## 🛠 Development

### Smart Contract Development

The Soroban smart contracts are located in `contracts/dao/`:

```bash
cd contracts/dao
cargo build --target wasm32v1-none --release
stellar contract optimize --wasm target/wasm32v1-none/release/dao.wasm
stellar contract deploy --wasm dao.optimized.wasm --source-account alice --network testnet
```

### Frontend Development

The Next.js application uses:

- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Stellar SDK** for blockchain interactions
- **Recharts** for price visualizations

### Testing

Run the test suite:

```bash
npm test
```

Test smart contracts:

```bash
cd contracts/dao
cargo test
```

## 📁 Project Structure

```
kaleracle/
├── app/                    # Next.js application
│   ├── components/         # Reusable UI components
│   ├── dao/               # DAO interface page
│   ├── teams/             # Team management page
│   └── api/               # API routes
├── contracts/             # Soroban smart contracts
│   └── dao/              # Main DAO contract
├── public/               # Static assets
└── README.md            # This file
```

## 🎥 Demo Video

[🎬 Watch the Demo](https://your-demo-video-link.com)
