# Collaborative DAO Smart Contract Implementation

## Overview

This is the main smart contract for the Collaborative Price Prediction DAO, implementing team-based price predictions on the Stellar blockchain using KALE tokens and Reflector oracle feeds.

## Contract Structure

### CollaborativeDao Contract

- **File**: `src/lib.rs`
- **Purpose**: Main contract implementing team formation, staking, predictions, and rewards

### Key Functions

#### Team Management

- `form_team(team_name, members)` - Create a new team with specified members
- `get_team(team_name)` - Retrieve team information
- `get_user_team(user)` - Get which team a user belongs to

#### Staking System

- `stake_kale(team_name, user, stake_percentage)` - Stake KALE tokens (0-100% of balance)
- `get_user_stake(user)` - Get user's total staked amount

#### Prediction System

- `make_prediction(prediction_id, team_name, asset, prediction, stake_amount, stake_percentage, predictor)` - Submit price predictions
- `get_prediction(prediction_id)` - Retrieve prediction details
- `resolve_prediction(prediction_id)` - Resolve prediction using Reflector oracle
- `distribute_rewards(prediction_id)` - Distribute rewards to correct predictors

#### Configuration

- `initialize(admin, kale_token, reflector_oracle)` - Initialize contract with token and oracle addresses
- `get_config()` - Get current configuration

### Data Structures

#### Team

```rust
pub struct Team {
    pub name: String,           // Team identifier
    pub members: Vec<Address>,  // Team member addresses
    pub total_stake: i128,      // Total KALE staked by team
}
```

#### Prediction

```rust
pub struct Prediction {
    pub team_name: String,      // Associated team
    pub asset: String,          // Asset symbol (e.g., "EUR/USD")
    pub prediction: bool,       // true = price will rise, false = fall
    pub stake_amount: i128,     // Amount staked on this prediction
    pub stake_percentage: u32,  // Percentage of balance staked (0-100)
    pub predictor: Address,     // User who made the prediction
    pub timestamp: u64,         // When prediction was made
    pub resolved: bool,         // Whether prediction has been resolved
    pub outcome: Option<bool>,  // Actual outcome (Some(true/false) when resolved)
}
```

### Error Handling

The contract implements comprehensive error handling with the following error types:

- `LowBalance` - Insufficient KALE for staking
- `Unauthorized` - User not authorized for action
- `TeamNotFound` - Team doesn't exist
- `InvalidStakePercentage` - Stake percentage > 100
- `PredictionExists` - Prediction ID already used
- `PredictionNotFound` - Prediction doesn't exist
- `OracleDataUnavailable` - Cannot fetch price from Reflector
- `AlreadyResolved` - Prediction already resolved

### Storage Keys

Persistent storage uses the following key structure:

- `Teams(String)` - Team data indexed by name
- `Predictions(String)` - Prediction data indexed by ID
- `UserStakes(Address)` - User stake amounts
- `UserTeams(Address)` - User team membership tracking
- `KaleToken` - KALE token contract address
- `ReflectorOracle` - Reflector oracle contract address
- `Admin` - Contract admin address
- `PredictionCounter` - Counter for unique prediction IDs
- `TeamCounter` - Counter for unique team IDs

## Reflector Integration

### ReflectorClient

- **File**: `src/reflector.rs`
- **Purpose**: Interface with Reflector oracle for price data

#### Key Methods

- `get_last_price(asset_symbol)` - Get current price for asset
- `get_price(asset_symbol, timestamp)` - Get historical price
- `get_decimals()` - Get oracle decimal precision

### Price Resolution Logic

1. When `resolve_prediction` is called:
   - Fetch current price from Reflector
   - Fetch historical price at prediction timestamp
   - Compare prices to determine if prediction was correct
   - Update prediction with resolution outcome

## Testing

### Test Coverage

The contract includes comprehensive unit tests covering:

- Team formation and membership tracking
- Prediction creation and validation
- Error handling scenarios
- Stake validation
- Configuration management
- Multiple prediction workflows

### Running Tests

```bash
cd contracts/dao
cargo test
```

### Test Environment

Tests use `Env::default()` with `mock_all_auths()` to simulate contract interactions without requiring actual blockchain deployment.

## Deployment

### Build Script

Use the provided `build.sh` script to compile the contract:

```bash
cd contracts/dao
./build.sh
```

This script:

1. Builds the contract for WASM target
2. Optimizes the WASM file (if Stellar CLI is available)
3. Outputs the deployable contract

### Deployment Steps

1. Build the contract: `./build.sh`
2. Deploy to Stellar Testnet using Stellar CLI
3. Initialize with KALE token and Reflector oracle addresses
4. Fund the contract with initial KALE tokens for rewards

## Integration with Frontend

The contract is designed to work seamlessly with the Next.js frontend:

- All functions return structured data suitable for TypeScript interfaces
- Error types map to frontend error handling
- Team and prediction data structures match frontend requirements
- Authentication is handled via Stellar wallet signatures

## Security Considerations

1. **Authentication**: All state-changing functions require proper `require_auth()`
2. **Input Validation**: Stake percentages, team membership, and prediction data are validated
3. **Error Handling**: Comprehensive error types prevent invalid state transitions
4. **Access Control**: Team membership is strictly enforced for staking and predictions
5. **Oracle Security**: Relies on Reflector's decentralized oracle network for price integrity

## Future Enhancements

1. **Advanced Oracle Integration**: Full Reflector contract calls instead of mock data
2. **Multi-Asset Support**: Support for more asset types beyond simple symbols
3. **Complex Reward Logic**: Team-based reward distribution algorithms
4. **Governance Features**: DAO voting on parameters and upgrades
5. **Time-locked Predictions**: Predictions with specific resolution timeframes
6. **Prediction Pools**: Multiple teams competing on the same asset predictions

This implementation provides a solid foundation for the Collaborative Price Prediction DAO MVP while maintaining extensibility for future features.
