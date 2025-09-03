#![cfg(test)]

use super::*;
use soroban_sdk::{
    vec, Env, String, 
    testutils::Address as TestAddress, 
    Address
};

/// Helper function to initialize contract with basic setup
fn setup_contract() -> (Env, Address, CollaborativeDaoClient<'static>) {
    let env = Env::default();
    env.mock_all_auths();
    
    // Register contract using the new API
    let contract_id = env.register(CollaborativeDao, ());
    let client = CollaborativeDaoClient::new(&env, &contract_id);
    
    // Create mock addresses
    let admin = Address::generate(&env);
    let kale_token = Address::generate(&env);
    let reflector_oracle = Address::generate(&env);
    
    // Initialize contract
    client.initialize(&admin, &kale_token, &reflector_oracle);
    
    (env, contract_id, client)
}

#[test]
fn test_form_team_success() {
    let (env, _contract_id, client) = setup_contract();
    
    let team_name = String::from_str(&env, "TestTeam");
    let user1 = Address::generate(&env);
    let user2 = Address::generate(&env);
    let members = vec![&env, user1.clone(), user2.clone()];
    
    // Form team
    client.form_team(&team_name, &members);
    
    // Verify team was created
    let team = client.get_team(&team_name).unwrap();
    assert_eq!(team.name, team_name);
    assert_eq!(team.members.len(), 2);
    assert_eq!(team.total_stake, 0);
    
    // Verify user team membership tracking
    let user1_team = client.get_user_team(&user1);
    assert_eq!(user1_team, Some(team_name.clone()));
    
    let user2_team = client.get_user_team(&user2);
    assert_eq!(user2_team, Some(team_name));
}

#[test]
fn test_make_prediction_success() {
    let (env, _contract_id, client) = setup_contract();
    
    // Setup team
    let team_name = String::from_str(&env, "TestTeam");
    let user1 = Address::generate(&env);
    let members = vec![&env, user1.clone()];
    client.form_team(&team_name, &members);
    
    // Make prediction
    let prediction_id = String::from_str(&env, "pred1");
    let asset = String::from_str(&env, "EUR/USD");
    
    client.make_prediction(
        &prediction_id,
        &team_name,
        &asset,
        &true, // prediction: price will rise
        &1000, // stake amount
        &50,   // stake percentage
        &user1,
    );
    
    // Verify prediction was created
    let prediction = client.get_prediction(&prediction_id).unwrap();
    assert_eq!(prediction.team_name, team_name);
    assert_eq!(prediction.asset, asset);
    assert_eq!(prediction.prediction, true);
    assert_eq!(prediction.stake_amount, 1000);
    assert_eq!(prediction.stake_percentage, 50);
    assert_eq!(prediction.resolved, false);
    assert!(prediction.outcome.is_none());
}

#[test]
fn test_prediction_duplicate_fails() {
    let (env, _contract_id, client) = setup_contract();
    
    // Setup team
    let team_name = String::from_str(&env, "TestTeam");
    let user1 = Address::generate(&env);
    let members = vec![&env, user1.clone()];
    client.form_team(&team_name, &members);
    
    let prediction_id = String::from_str(&env, "pred1");
    let asset = String::from_str(&env, "EUR/USD");
    
    // First prediction should succeed
    client.make_prediction(
        &prediction_id,
        &team_name,
        &asset,
        &true,
        &1000,
        &50,
        &user1,
    );
    
    // Second prediction with same ID should fail
    let result = client.try_make_prediction(
        &prediction_id,
        &team_name,
        &asset,
        &false,
        &2000,
        &75,
        &user1,
    );
    
    assert_eq!(result, Err(Ok(Error::PredictionExists)));
}

#[test]
fn test_stake_validation() {
    let (env, _contract_id, client) = setup_contract();
    
    let team_name = String::from_str(&env, "TestTeam");
    let user1 = Address::generate(&env);
    let user2 = Address::generate(&env); // Not a team member
    let members = vec![&env, user1.clone()];
    
    client.form_team(&team_name, &members);
    
    // Test invalid stake percentage
    let result = client.try_stake_kale(&team_name, &user1, &150);
    assert_eq!(result, Err(Ok(Error::InvalidStakePercentage)));
    
    // Test unauthorized user
    let result = client.try_stake_kale(&team_name, &user2, &50);
    assert_eq!(result, Err(Ok(Error::Unauthorized)));
}

#[test]
fn test_error_cases() {
    let (env, _contract_id, client) = setup_contract();
    
    let user1 = Address::generate(&env);
    let team_name = String::from_str(&env, "NonExistentTeam");
    
    // Test getting non-existent team
    let team = client.get_team(&team_name);
    assert!(team.is_none());
    
    // Test getting non-existent prediction
    let prediction_id = String::from_str(&env, "nonexistent");
    let prediction = client.get_prediction(&prediction_id);
    assert!(prediction.is_none());
    
    // Test user with no team
    let user_team = client.get_user_team(&user1);
    assert!(user_team.is_none());
    
    // Test user with no stake
    let user_stake = client.get_user_stake(&user1);
    assert_eq!(user_stake, 0);
}

#[test]
fn test_configuration() {
    let (env, _contract_id, client) = setup_contract();
    
    // Test getting configuration
    let (stored_kale, stored_reflector) = client.get_config();
    assert!(stored_kale.is_some());
    assert!(stored_reflector.is_some());
}

#[test]
fn test_team_membership_tracking() {
    let (env, _contract_id, client) = setup_contract();
    
    let team_name1 = String::from_str(&env, "Team1");
    let team_name2 = String::from_str(&env, "Team2");
    let user1 = Address::generate(&env);
    let user2 = Address::generate(&env);
    let user3 = Address::generate(&env);
    
    // Create teams with different members
    client.form_team(&team_name1, &vec![&env, user1.clone(), user2.clone()]);
    client.form_team(&team_name2, &vec![&env, user2.clone(), user3.clone()]);
    
    // Verify team memberships
    assert_eq!(client.get_user_team(&user1), Some(team_name1.clone()));
    assert_eq!(client.get_user_team(&user2), Some(team_name2.clone())); // Latest team
    assert_eq!(client.get_user_team(&user3), Some(team_name2));
}

#[test] 
fn test_multiple_predictions_workflow() {
    let (env, _contract_id, client) = setup_contract();
    
    // Setup team
    let team_name = String::from_str(&env, "TestTeam");
    let user1 = Address::generate(&env);
    let user2 = Address::generate(&env);
    let members = vec![&env, user1.clone(), user2.clone()];
    client.form_team(&team_name, &members);
    
    // Create multiple predictions
    let predictions = [
        ("pred1", "EUR/USD", true, 1000),
        ("pred2", "BTC/USD", false, 2000),
        ("pred3", "ETH/USD", true, 1500),
    ];
    
    for (id, asset, prediction, amount) in predictions.iter() {
        let prediction_id = String::from_str(&env, id);
        let asset_str = String::from_str(&env, asset);
        
        client.make_prediction(
            &prediction_id,
            &team_name,
            &asset_str,
            prediction,
            &(*amount as i128),
            &50,
            &user1,
        );
        
        // Verify each prediction
        let stored_prediction = client.get_prediction(&prediction_id).unwrap();
        assert_eq!(stored_prediction.asset, asset_str);
        assert_eq!(stored_prediction.prediction, *prediction);
        assert_eq!(stored_prediction.stake_amount, *amount as i128);
    }
}

#[test]
fn test_contract_initialization() {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register(CollaborativeDao, ());
    let client = CollaborativeDaoClient::new(&env, &contract_id);
    
    let admin = Address::generate(&env);
    let kale_token = Address::generate(&env);
    let reflector_oracle = Address::generate(&env);
    
    // Test initialization
    client.initialize(&admin, &kale_token, &reflector_oracle);
    
    // Verify configuration was stored
    let (stored_kale, stored_reflector) = client.get_config();
    assert_eq!(stored_kale, Some(kale_token));
    assert_eq!(stored_reflector, Some(reflector_oracle));
}
