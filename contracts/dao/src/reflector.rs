use soroban_sdk::{Address, Env, String, contracttype};

/// Price data structure from Reflector oracle
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PriceData {
    /// The price in contract's base asset and decimals (scaled by 10^14)
    pub price: i128,
    /// The timestamp of the price in seconds
    pub timestamp: u64,
}

/// Reflector client wrapper for easy integration with DAO contract
/// Simplified implementation for MVP
pub struct ReflectorClient {
    pub address: Address,
}

impl ReflectorClient {
    pub fn new(_env: &Env, address: &Address) -> Self {
        Self {
            address: address.clone(),
        }
    }

    /// Fetch the last price for an asset from Reflector oracle
    /// For MVP, this returns mock data for testing
    pub fn get_last_price(&self, _env: &Env, _asset_symbol: String) -> Option<PriceData> {
        // For MVP testing, return mock price data
        // In production, this would make actual contract calls to Reflector
        Some(PriceData {
            price: 1_000_000_000_000_000i128, // $1.00 in 14 decimal places
            timestamp: 1640995200, // Mock timestamp
        })
    }
    
    /// Get price at specific timestamp
    /// For MVP, returns mock historical price
    pub fn get_price(&self, _env: &Env, _asset_symbol: String, timestamp: u64) -> Option<PriceData> {
        // Mock historical price (slightly lower than current)
        Some(PriceData {
            price: 950_000_000_000_000i128, // $0.95 in 14 decimal places
            timestamp,
        })
    }
    
    /// Get oracle decimals for proper price scaling
    pub fn get_decimals(&self, _env: &Env) -> u32 {
        14 // Standard Reflector decimals
    }
}
