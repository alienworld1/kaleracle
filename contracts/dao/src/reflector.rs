use soroban_sdk::{Address, Env, String, Symbol, contracttype};

/// Price data structure from Reflector oracle
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PriceData {
    /// The price in contract's base asset and decimals (scaled by 10^14)
    pub price: i128,
    /// The timestamp of the price in seconds
    pub timestamp: u64,
}

/// Reflector Asset representation for EUR/USD queries
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum ReflectorAsset {
    /// Stellar native asset (XLM)
    Stellar(Address),
    /// Contract asset
    Contract(Address),
    /// Other asset identified by symbol (e.g., EUR, USD, BTC)
    Other(Symbol),
}

/// Reflector client wrapper for easy integration with DAO contract
/// Updated to use proper Reflector interface for EUR/USD queries
/// 
/// MVP Implementation Note: Currently returns mock data to prevent 
/// UnreachableCodeReached errors during contract execution. In production,
/// this would make actual contract calls to Reflector oracle.
#[allow(dead_code)]
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
    /// Uses ReflectorAsset::Other(Symbol::new("EUR")) for EUR/USD pair
    /// For MVP, returns mock data to prevent contract call errors
    pub fn get_last_price(&self, env: &Env, asset_symbol: String) -> Option<PriceData> {
        // Convert asset symbol to ReflectorAsset format
        let eur_str = String::from_str(env, "EUR");
        let usd_str = String::from_str(env, "USD");
        let eur_usd_str = String::from_str(env, "EUR/USD");
        let btc_str = String::from_str(env, "BTC");

        // For MVP, we'll simulate the ReflectorAsset creation but return mock data
        // to avoid UnreachableCodeReached errors during contract execution
        let _reflector_asset = if asset_symbol == eur_str {
            ReflectorAsset::Other(Symbol::new(env, "EUR"))
        } else if asset_symbol == usd_str {
            ReflectorAsset::Other(Symbol::new(env, "USD"))
        } else if asset_symbol == btc_str {
            ReflectorAsset::Other(Symbol::new(env, "BTC"))
        } else {
            ReflectorAsset::Other(Symbol::new(env, "OTHER"))
        };

        // TODO: In production, make actual Reflector contract call:
        // let result = env.invoke_contract(
        //     &self.address,
        //     &Symbol::new(env, "lastprice"),
        //     (reflector_asset,).into_val(env)
        // );

        // For MVP testing, return realistic mock data to prevent execution errors
        if asset_symbol == eur_str || asset_symbol == eur_usd_str {
            Some(PriceData {
                price: 1_085_600_000_000_000i128, // 1.0856 EUR/USD in 14 decimals
                timestamp: env.ledger().timestamp(),
            })
        } else if asset_symbol == usd_str {
            Some(PriceData {
                price: 1_000_000_000_000_000i128, // 1.0000 USD baseline
                timestamp: env.ledger().timestamp(),
            })
        } else if asset_symbol == btc_str {
            Some(PriceData {
                price: 43_250_750_000_000_000_000i128, // ~43,250.75 BTC/USD
                timestamp: env.ledger().timestamp(),
            })
        } else {
            Some(PriceData {
                price: 1_000_000_000_000_000i128, // Default 1.0 price
                timestamp: env.ledger().timestamp(),
            })
        }
    }
    
    /// Get price at specific timestamp
    /// For MVP, returns mock historical price with realistic variation
    pub fn get_price(&self, env: &Env, asset_symbol: String, _timestamp: u64) -> Option<PriceData> {
        // Get current price and apply small historical variation
        if let Some(current_data) = self.get_last_price(env, asset_symbol) {
            // Simulate historical price being slightly different (0.1-0.5% variation)
            let variation_factor = 9950i128; // 99.5% of current price
            let historical_price = (current_data.price * variation_factor) / 10000i128;
            
            Some(PriceData {
                price: historical_price,
                timestamp: _timestamp,
            })
        } else {
            None
        }
    }
    
    /// Get oracle decimals for proper price scaling
    #[allow(dead_code)]
    pub fn get_decimals(&self, _env: &Env) -> u32 {
        14 // Standard Reflector decimals (10^14)
    }

    /// Convert price from Reflector format to human-readable decimal
    #[allow(dead_code)]
    pub fn price_to_decimal(&self, price: i128) -> f64 {
        (price as f64) / 1e14
    }
}
