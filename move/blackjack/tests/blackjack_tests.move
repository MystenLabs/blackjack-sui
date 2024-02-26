// Copyright (c) 2023, Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

#[test_only]
module blackjack::single_player_blackjack_tests {

    use std::vector;
    use std::debug;
    use std::string::utf8;
    use sui::object::{ID};
    use sui::coin::{Coin, Self};
    use sui::sui::SUI;
    use sui::object;
    use sui::transfer;
    use sui::test_scenario::{Self, Scenario};
    use sui::bls12381::bls12381_min_pk_verify;
    use blackjack::single_player_blackjack::{Self as bj, HouseAdminCap, HouseData, Game, HitRequest, StandRequest};
    use blackjack::counter_nft::{Self, Counter};

    const ADMIN: address = @0x65391674eb4210940ea98ae451237d9335920297e7c8abaeb7e05b221ee36917;
    const PLAYER: address = @0xfff196b9e146b115301408f624903fc488f42d357a7fa6fc70f5751e3d0570fc;
    const INITIAL_HOUSE_BALANCE: u64 = 5000000000;
    const PLAYER_BET: u64 = 200000000;
    const HOUSE_BET: u64 =  200000000;
    
    const HOUSE_PUBLIC_KEY: vector<u8> = vector<u8> [
        185, 195,  27,  41,  48, 111, 208,  32,  77,
        189, 168,  94,  72, 179, 194, 183,  67, 237,
        230, 179, 239, 181, 149, 238,   0, 100, 248,
        74, 194, 109, 159,   4, 225,  77, 194, 108,
        113,  19, 186, 231,  98, 188,   9, 246,  82,
        32, 114,  74
    ];

    const GAME_RANDOMNESS: vector<u8> = vector<u8> [
        49, 54, 54, 100, 57, 55, 51, 51, 52, 48, 57, 55, 57, 99,
        101, 101, 101, 54, 56, 97, 101, 55, 57, 97, 57, 48, 98,
        98, 56, 100, 55, 52, 203, 238, 99, 168, 234, 77, 171, 131,
        149, 30, 131, 196, 89, 118, 163, 234, 52, 79, 168, 132,
        153, 253, 170, 108, 219, 244, 73, 224, 168, 245, 135, 100,
        0, 0, 0, 0, 0, 0, 0, 0
    ];

    const BLS_SIG_0: vector<u8> = vector<u8> [
        169,  88, 140, 191, 205,  35, 255, 181, 115, 187, 198,  50,
        217, 127,  22, 249, 255, 162, 240, 175, 121, 135,  45, 171,
        185, 195, 190,  95, 206, 115, 147, 173, 237, 202, 155, 184,
        49, 143, 135, 156,  51, 101,  52,  10, 202, 169,  54, 137,
        0, 155,  35, 203,  50, 193, 171, 198, 219, 160, 237, 171,
        251, 144,  91,  30,  20, 227, 235, 176, 241, 228, 193, 149,
        134,  51, 233,  74, 151,  97,  71,  93, 216, 191,  12, 174,
        212, 203, 120,  70,  86,  57, 230, 150,  21,  60,  24,  49
    ];

    const BLS_SIG_1: vector<u8> = vector<u8> [
        175,  38, 188, 119, 128, 205, 237, 223, 127,  57,  99,  63,
        10,  25, 156, 246,  20, 189, 174, 252,   0,  30, 175, 193,
        149, 241, 198, 106, 239, 127,  60,  59, 217, 147,  18, 172,
        154, 241, 201,  38,  20,  84,  93,  18, 251,  77,   5, 245,
        12, 133,  20,  16,  72, 177,  54, 165, 219, 227,  14, 116,
        56, 251, 179, 156, 215, 195, 134,  65, 209,  47, 210,  54,
        161, 155, 248,  11, 230, 251, 156,  70, 102, 103,   8,  29,
        122, 156,  40, 121, 198, 220, 116,  73, 114,  66,  74, 217
    ];

    #[test]
    fun test_bls_signature_for_first_deal() {
        let messageVector = GAME_RANDOMNESS;
        vector::append(&mut messageVector, vector<u8> [0]);
        let bls_sig = BLS_SIG_0;
        let house_public_key = HOUSE_PUBLIC_KEY;
        let is_sig_valid = bls12381_min_pk_verify(
            &bls_sig,
            &house_public_key,
            &messageVector
        );
        assert!(is_sig_valid, 1);
    }

    #[test]
    fun test_initialize_house_data() {
        let scenario_val = test_scenario::begin(ADMIN);
        let scenario = &mut scenario_val;

        initialize_house_data_for_test(scenario, ADMIN, INITIAL_HOUSE_BALANCE);

        test_scenario::next_tx(scenario, ADMIN);
        {
            // validate that the house data is created
            let house_data = test_scenario::take_shared<HouseData>(scenario);
            let house_data_balance = bj::balance(&house_data);
            assert!(house_data_balance == INITIAL_HOUSE_BALANCE, 1);
            assert!(bj::public_key(&house_data) == HOUSE_PUBLIC_KEY, 2);
            assert!(bj::house(&house_data) == ADMIN, 3);
            test_scenario::return_shared<HouseData>(house_data);

            // and that the adminHouseCap was burnt
            let adminOwnedObjects: vector<ID> = test_scenario::ids_for_sender<HouseAdminCap>(scenario);
            assert!(vector::length(&adminOwnedObjects) == 0, 2);
        };

        test_scenario::end(scenario_val);
    }

    #[test]
    fun test_top_up_house_data() {
        let scenario_val = test_scenario::begin(ADMIN);
        let scenario = &mut scenario_val;

        initialize_house_data_for_test(scenario, ADMIN, INITIAL_HOUSE_BALANCE);

        test_scenario::next_tx(scenario, ADMIN);
        {
            let coin = coin::mint_for_testing<SUI>(50000, test_scenario::ctx(scenario));
            transfer::public_transfer(coin, ADMIN);
        };

        test_scenario::next_tx(scenario, ADMIN);
        {
            let house_data = test_scenario::take_shared<HouseData>(scenario);
            let fund_coin = test_scenario::take_from_sender<Coin<SUI>>(scenario);
            bj::top_up(&mut house_data, fund_coin, test_scenario::ctx(scenario));
            test_scenario::return_shared(house_data);
        };

        test_scenario::next_tx(scenario, ADMIN);
        {
            let house_data = test_scenario::take_shared<HouseData>(scenario);
            assert!(bj::balance(&house_data) == INITIAL_HOUSE_BALANCE + 50000, 1);
            test_scenario::return_shared(house_data);
        };

        test_scenario::end(scenario_val);
    }

    #[test]
    fun test_withdraw_from_house_data() {
        let scenario_val = test_scenario::begin(ADMIN);
        let scenario = &mut scenario_val;

        initialize_house_data_for_test(scenario, ADMIN, INITIAL_HOUSE_BALANCE);

        test_scenario::next_tx(scenario, ADMIN);
        {
            let house_data = test_scenario::take_shared<HouseData>(scenario);
            bj::withdraw(&mut house_data, test_scenario::ctx(scenario));
            test_scenario::return_shared(house_data);
        };

        test_scenario::next_tx(scenario, ADMIN);
        {
            let house_data = test_scenario::take_shared<HouseData>(scenario);
            assert!(bj::balance(&house_data) == 0, 1);
            test_scenario::return_shared(house_data);
        };

        test_scenario::end(scenario_val);
    }

    #[test]
    #[expected_failure(abort_code = bj::EInsufficientBalance)]
    fun test_initialize_house_data_with_insifficient_balance() {
        let scenario_val = test_scenario::begin(ADMIN);
        let scenario = &mut scenario_val;

        initialize_house_data_for_test(scenario, ADMIN, 0);

        test_scenario::end(scenario_val);
    }

    #[test]
    fun test_place_bet_and_create_game() {
        let scenario_val = test_scenario::begin(PLAYER);
        let scenario = &mut scenario_val;

        initialize_house_data_for_test(scenario, ADMIN, INITIAL_HOUSE_BALANCE);
        initialize_game_for_test(scenario, PLAYER, PLAYER_BET);

        test_scenario::next_tx(scenario, PLAYER);
        {
            let game = test_scenario::take_shared<Game>(scenario);
            assert!(bj::player(&game) == PLAYER, 2);
            assert!(bj::player_cards(&game) == vector[], 3);
            assert!(bj::player_sum(&game) == 0, 4);
            assert!(bj::dealer_cards(&game) == vector[], 5);
            assert!(bj::dealer_sum(&game) == 0, 6);
            assert!(bj::status(&game) == 0, 7);
            assert!(bj::total_stake(&game) == HOUSE_BET + PLAYER_BET, 8);
            test_scenario::return_shared(game);
        };

        test_scenario::end(scenario_val);
    }

    #[test]
    #[expected_failure(abort_code = bj::EInsufficientHouseBalance)]
    fun test_place_bet_and_create_game_insufficient_house_balance() {
        let scenario_val = test_scenario::begin(ADMIN);
        let scenario = &mut scenario_val;

        initialize_house_data_for_test(scenario, ADMIN, HOUSE_BET - 1);
        initialize_game_for_test(scenario, PLAYER, PLAYER_BET);

        test_scenario::end(scenario_val);
    }

    #[test]
    #[expected_failure(abort_code = bj::EInvalidPlayerBetAmount)]
    fun test_place_bet_and_create_game_insufficient_balance() {
        let scenario_val = test_scenario::begin(ADMIN);
        let scenario = &mut scenario_val;

        initialize_house_data_for_test(scenario, ADMIN, INITIAL_HOUSE_BALANCE);
        initialize_game_for_test(scenario, PLAYER, PLAYER_BET - 1);

        test_scenario::end(scenario_val);
    }

    #[test]
    fun test_first_deal() {
        let scenario_val = test_scenario::begin(PLAYER);
        let scenario = &mut scenario_val;

        initialize_house_data_for_test(scenario, ADMIN, INITIAL_HOUSE_BALANCE);
        initialize_game_for_test(scenario, PLAYER, PLAYER_BET);
        do_first_deal_for_test(scenario, ADMIN, BLS_SIG_0, false);

        test_scenario::next_tx(scenario, ADMIN);
        {
            let game = test_scenario::take_shared<Game>(scenario);
            assert!(bj::player_sum(&game) > 0, 1);
            assert!(bj::dealer_sum(&game) > 0, 2);
            assert!(vector::length(&bj::player_cards(&game)) == 2, 3);
            assert!(vector::length(&bj::dealer_cards(&game)) == 1, 4);
            test_scenario::return_shared(game);
        };

        test_scenario::end(scenario_val);
    }

     #[test]
     #[expected_failure(abort_code = bj::EInvalidBlsSig)]
    fun test_first_deal_with_invalid_bls_sig() {
        let scenario_val = test_scenario::begin(PLAYER);
        let scenario = &mut scenario_val;

        initialize_house_data_for_test(scenario, ADMIN, INITIAL_HOUSE_BALANCE);
        initialize_game_for_test(scenario, PLAYER, PLAYER_BET);
        do_first_deal_for_test(scenario, ADMIN, BLS_SIG_1, false);

        test_scenario::end(scenario_val);
    }

    #[test]
    #[expected_failure(abort_code = bj::EDealAlreadyHappened)]
    public fun test_first_deal_twice() {
        let scenario_val = test_scenario::begin(ADMIN);
        let scenario = &mut scenario_val;

        initialize_house_data_for_test(scenario, ADMIN, INITIAL_HOUSE_BALANCE);
        initialize_game_for_test(scenario, PLAYER, PLAYER_BET);
        do_first_deal_for_test(scenario, ADMIN, BLS_SIG_0, false);
        do_first_deal_for_test(scenario, ADMIN, BLS_SIG_1, false);

        test_scenario::end(scenario_val);
    }

    #[test]
    fun test_hit() {
        let scenario_val = test_scenario::begin(PLAYER);
        let scenario = &mut scenario_val;

        initialize_house_data_for_test(scenario, ADMIN, INITIAL_HOUSE_BALANCE);
        initialize_game_for_test(scenario, PLAYER, PLAYER_BET);
        do_first_deal_for_test(scenario, ADMIN, BLS_SIG_0, false);

        let _player_sum_before: u8 = 0;
        let _player_cards_before: vector<u8> = vector<u8>[];
        let _dealer_sum_before: u8 = 0;
        let _dealer_cards_before: vector<u8> = vector<u8>[];

        test_scenario::next_tx(scenario, PLAYER);
        {
            let game = test_scenario::take_shared<Game>(scenario);
            _player_sum_before = bj::player_sum(&game);
            _player_cards_before = bj::player_cards(&game);
            _dealer_sum_before = bj::dealer_sum(&game);
            _dealer_cards_before = bj::dealer_cards(&game);
            test_scenario::return_shared(game);
        };

        do_hit_for_test(scenario, PLAYER, ADMIN);
        hit_for_test(scenario, ADMIN, BLS_SIG_1);

        test_scenario::next_tx(scenario, ADMIN);
        {
            let game = test_scenario::take_shared<Game>(scenario);
            let owned_hit_requests_by_admin = test_scenario::ids_for_sender<HitRequest>(scenario);
            let player_cards_length_before = vector::length(&_player_cards_before);
            let player_cards_length_after = vector::length(&bj::player_cards(&game));
            let dealer_cards_length_before = vector::length(&_dealer_cards_before);
            let dealer_cards_length_after = vector::length(&bj::dealer_cards(&game));

            assert!(vector::length(&owned_hit_requests_by_admin) == 0, 1);
            assert!(bj::player_sum(&game) > _player_sum_before, 1);
            assert!(player_cards_length_after == player_cards_length_before + 1, 2);
            assert!(bj::dealer_sum(&game) == _dealer_sum_before, 3);
            assert!(dealer_cards_length_after == dealer_cards_length_before, 4);
            test_scenario::return_shared(game);
        };

        test_scenario::end(scenario_val);
    }

    #[test]
    fun test_stand() {
        let scenario_val = test_scenario::begin(PLAYER);
        let scenario = &mut scenario_val;

        initialize_house_data_for_test(scenario, ADMIN, INITIAL_HOUSE_BALANCE);
        initialize_game_for_test(scenario, PLAYER, PLAYER_BET);
        do_first_deal_for_test(scenario, ADMIN, BLS_SIG_0, false);

        let _player_sum_before: u8 = 0;
        let _player_cards_before: vector<u8> = vector<u8>[];
        let _dealer_sum_before: u8 = 0;
        let _dealer_cards_before: vector<u8> = vector<u8>[];

        test_scenario::next_tx(scenario, PLAYER);
        {
            let game = test_scenario::take_shared<Game>(scenario);
            _player_sum_before = bj::player_sum(&game);
            _player_cards_before = bj::player_cards(&game);
            _dealer_sum_before = bj::dealer_sum(&game);
            _dealer_cards_before = bj::dealer_cards(&game);
            test_scenario::return_shared(game);
        };

        do_stand_for_test(scenario, PLAYER, ADMIN);
        stand_for_test(scenario, ADMIN, BLS_SIG_1);

        test_scenario::next_tx(scenario, ADMIN);
        {
            let game = test_scenario::take_shared<Game>(scenario);
            let owned_stand_requests_by_admin = test_scenario::ids_for_sender<StandRequest>(scenario);
            let player_cards_length_before = vector::length(&_player_cards_before);
            let player_cards_length_after = vector::length(&bj::player_cards(&game));
            let dealer_cards_length_before = vector::length(&_dealer_cards_before);
            let dealer_cards_length_after = vector::length(&bj::dealer_cards(&game));

            assert!(vector::length(&owned_stand_requests_by_admin) == 0, 1);
            assert!(bj::player_sum(&game) == _player_sum_before, 1);
            assert!(player_cards_length_after == player_cards_length_before, 2);
            assert!(bj::dealer_sum(&game) > _dealer_sum_before, 3);
            assert!(dealer_cards_length_after > dealer_cards_length_before, 4);
            test_scenario::return_shared(game);
        };

        test_scenario::end(scenario_val);
    }

    #[test]
    fun test_do_hit() {
        let scenario_val = test_scenario::begin(PLAYER);
        let scenario = &mut scenario_val;

        initialize_house_data_for_test(scenario, PLAYER, INITIAL_HOUSE_BALANCE);
        initialize_game_for_test(scenario, PLAYER, PLAYER_BET);
        do_first_deal_for_test(scenario, PLAYER, BLS_SIG_0, false);
        do_hit_for_test(scenario, PLAYER, ADMIN);

        test_scenario::next_tx(scenario, ADMIN);
        {
            let hit_request = test_scenario::take_from_sender<HitRequest>(scenario);
            let game = test_scenario::take_shared<Game>(scenario);

            assert!(bj::hit_request_game_id(&hit_request) == object::id(&game), 1);
            assert!(bj::hit_request_current_player_sum(&hit_request) == bj::player_sum(&game), 2);

            test_scenario::return_to_sender(scenario, hit_request);
            test_scenario::return_shared(game);
        };

        test_scenario::end(scenario_val);
    }

    #[test]
    #[expected_failure(abort_code = bj::EGameHasFinished)]
    fun test_do_hit_in_finished_game() {
        let scenario_val = test_scenario::begin(PLAYER);
        let scenario = &mut scenario_val;

        initialize_house_data_for_test(scenario, ADMIN, INITIAL_HOUSE_BALANCE);
        initialize_game_for_test(scenario, PLAYER, PLAYER_BET);
        do_first_deal_for_test(scenario, ADMIN, BLS_SIG_0, false);
        player_won_post_handling_for_test(scenario, ADMIN);
        do_hit_for_test(scenario, PLAYER, ADMIN);

        test_scenario::end(scenario_val);
    }

    #[test]
    #[expected_failure(abort_code = bj::EUnauthorizedPlayer)]
    fun test_do_hit_unauthorized() {
        let scenario_val = test_scenario::begin(PLAYER);
        let scenario = &mut scenario_val;
        let player2 = @0xBBBB;

        initialize_house_data_for_test(scenario, ADMIN, INITIAL_HOUSE_BALANCE);
        initialize_game_for_test(scenario, PLAYER, PLAYER_BET);
        do_first_deal_for_test(scenario, ADMIN, BLS_SIG_0, false);
        do_hit_for_test(scenario, player2, ADMIN);

        test_scenario::end(scenario_val);
    }

    #[test]
    #[expected_failure(abort_code = bj::EInvalidSumOfHitRequest)]
    fun test_do_hit_with_invalid_player_sum() {
        let scenario_val = test_scenario::begin(PLAYER);
        let scenario = &mut scenario_val;

        initialize_house_data_for_test(scenario, ADMIN, INITIAL_HOUSE_BALANCE);
        initialize_game_for_test(scenario, PLAYER, PLAYER_BET);
        do_first_deal_for_test(scenario, ADMIN, BLS_SIG_0, false);
        
        test_scenario::next_tx(scenario, PLAYER);
        {
            let game = test_scenario::take_shared<Game>(scenario);
            let current_player_sum = bj::player_sum(&game);
            let hit_request = bj::do_hit(
                &mut game,
                current_player_sum + 1,
                test_scenario::ctx(scenario),
            );
            transfer::public_transfer(
                hit_request,
                ADMIN,
            );
            test_scenario::return_shared(game);
        };

        test_scenario::end(scenario_val);
    }

    #[test]
    fun test_to_stand() {
        let scenario_val = test_scenario::begin(PLAYER);
        let scenario = &mut scenario_val;

        initialize_house_data_for_test(scenario, PLAYER, INITIAL_HOUSE_BALANCE);
        initialize_game_for_test(scenario, PLAYER, PLAYER_BET);
        do_first_deal_for_test(scenario, PLAYER, BLS_SIG_0, false);
        do_stand_for_test(scenario, PLAYER, ADMIN);

        test_scenario::next_tx(scenario, ADMIN);
        {
            let stand_request = test_scenario::take_from_sender<StandRequest>(scenario);
            let game = test_scenario::take_shared<Game>(scenario);

            assert!(bj::stand_request_game_id(&stand_request) == object::id(&game), 1);
            assert!(bj::stand_request_current_player_sum(&stand_request) == bj::player_sum(&game), 2);

            test_scenario::return_to_sender(scenario, stand_request);
            test_scenario::return_shared(game);
        };

        test_scenario::end(scenario_val);
    }

    #[test]
    #[expected_failure(abort_code = bj::EGameHasFinished)]
    fun test_do_stand_in_finished_game() {
        let scenario_val = test_scenario::begin(PLAYER);
        let scenario = &mut scenario_val;

        initialize_house_data_for_test(scenario, ADMIN, INITIAL_HOUSE_BALANCE);
        initialize_game_for_test(scenario, PLAYER, PLAYER_BET);
        do_first_deal_for_test(scenario, ADMIN, BLS_SIG_0, false);
        player_won_post_handling_for_test(scenario, ADMIN);
        do_stand_for_test(scenario, PLAYER, ADMIN);
        test_scenario::end(scenario_val);
    }

    #[test]
    #[expected_failure(abort_code = bj::EUnauthorizedPlayer)]
    fun test_do_stand_unauthorized() {
        let scenario_val = test_scenario::begin(PLAYER);
        let scenario = &mut scenario_val;
        let player2 = @0xBBBB;

        initialize_house_data_for_test(scenario, ADMIN, INITIAL_HOUSE_BALANCE);
        initialize_game_for_test(scenario, PLAYER, PLAYER_BET);
        do_first_deal_for_test(scenario, ADMIN, BLS_SIG_0, false);
        do_stand_for_test(scenario, player2, ADMIN);

        test_scenario::end(scenario_val);
    }

    #[test]
    #[expected_failure(abort_code = bj::EInvalidSumOfStandRequest)]
    fun test_do_stand_with_invalid_player_sum() {
        let scenario_val = test_scenario::begin(PLAYER);
        let scenario = &mut scenario_val;

        initialize_house_data_for_test(scenario, ADMIN, INITIAL_HOUSE_BALANCE);
        initialize_game_for_test(scenario, PLAYER, PLAYER_BET);
        do_first_deal_for_test(scenario, ADMIN, BLS_SIG_0, false);
        
        test_scenario::next_tx(scenario, PLAYER);
        {
            let game = test_scenario::take_shared<Game>(scenario);
            let current_player_sum = bj::player_sum(&game);
            let stand_request = bj::do_stand(
                &mut game,
                current_player_sum + 1,
                test_scenario::ctx(scenario),
            );
            transfer::public_transfer(
                stand_request,
                ADMIN,
            );
            test_scenario::return_shared(game);
        };

        test_scenario::end(scenario_val);
    }

    #[test]
    fun test_player_won_post_handling() {
        let scenario_val = test_scenario::begin(PLAYER);
        let scenario = &mut scenario_val;
        initialize_house_data_for_test(scenario, ADMIN, INITIAL_HOUSE_BALANCE);
        initialize_game_for_test(scenario, PLAYER, PLAYER_BET);
        do_first_deal_for_test(scenario, ADMIN, BLS_SIG_0, false);
        player_won_post_handling_for_test(scenario, ADMIN);

        test_scenario::next_tx(scenario, PLAYER);
        {
            let game = test_scenario::take_shared<Game>(scenario);
            let house_data = test_scenario::take_shared<HouseData>(scenario);
            assert!(bj::status(&game) == 1, 1);
            assert!(bj::balance(&house_data) == INITIAL_HOUSE_BALANCE - HOUSE_BET, 2);
            test_scenario::return_shared(game);
            test_scenario::return_shared(house_data);
        };

        test_scenario::end(scenario_val);
    }

    #[test]
    fun test_house_won_post_handling() {
        let scenario_val = test_scenario::begin(PLAYER);
        let scenario = &mut scenario_val;
        initialize_house_data_for_test(scenario, ADMIN, INITIAL_HOUSE_BALANCE);
        initialize_game_for_test(scenario, PLAYER, PLAYER_BET);
        do_first_deal_for_test(scenario, ADMIN, BLS_SIG_0, false);
        house_won_post_handling_for_test(scenario, ADMIN);

        test_scenario::next_tx(scenario, PLAYER);
        {
            let game = test_scenario::take_shared<Game>(scenario);
            let house_data = test_scenario::take_shared<HouseData>(scenario);
            assert!(bj::status(&game) == 2, 1);
            assert!(bj::balance(&house_data) == INITIAL_HOUSE_BALANCE + PLAYER_BET, 2);
            test_scenario::return_shared(game);
            test_scenario::return_shared(house_data);
        };

        test_scenario::end(scenario_val);
    }

    #[test]
    fun test_tie_post_handling() {
        let scenario_val = test_scenario::begin(PLAYER);
        let scenario = &mut scenario_val;
        initialize_house_data_for_test(scenario, ADMIN, INITIAL_HOUSE_BALANCE);
        initialize_game_for_test(scenario, PLAYER, PLAYER_BET);
        do_first_deal_for_test(scenario, ADMIN, BLS_SIG_0, false);
        tie_post_handling_for_test(scenario, ADMIN);

        test_scenario::next_tx(scenario, PLAYER);
        {
            let game = test_scenario::take_shared<Game>(scenario);
            let house_data = test_scenario::take_shared<HouseData>(scenario);
            let game_stake = HOUSE_BET + PLAYER_BET;
            assert!(bj::status(&game) == 3, 1);
            assert!(bj::balance(&house_data) == INITIAL_HOUSE_BALANCE - HOUSE_BET + game_stake/2, 2);
            test_scenario::return_shared(game);
            test_scenario::return_shared(house_data);
        };

        test_scenario::end(scenario_val);
    }

    // Test a whole flow where the user exceeds total sum of 21.
    #[test]
    fun test_player_exceeds_21() {
        let scenario_val = test_scenario::begin(PLAYER);
        let scenario = &mut scenario_val;

        initialize_house_data_for_test(scenario, ADMIN, INITIAL_HOUSE_BALANCE);
        initialize_game_for_test(scenario, PLAYER, PLAYER_BET);
        do_first_deal_for_test(scenario, ADMIN, BLS_SIG_0, false);
        draw_card_seven_for_player_for_test(scenario, PLAYER, false);
        do_hit_for_test(scenario, PLAYER, ADMIN);
        hit_for_test(scenario, ADMIN, BLS_SIG_1);

        test_scenario::next_tx(scenario, ADMIN);
        {
            let house_data = test_scenario::take_shared<HouseData>(scenario);
            let game = test_scenario::take_shared<Game>(scenario);
            assert!(bj::balance(&house_data) == INITIAL_HOUSE_BALANCE + PLAYER_BET, 1);
            assert!(bj::status(&game) == 2, 2);
            test_scenario::return_shared(house_data);
            test_scenario::return_shared(game);
        };

        test_scenario::end(scenario_val);
    }

    //  --- Helper functions ---

    fun initialize_house_data_for_test(
        scenario: &mut Scenario,
        admin: address,
        balance: u64,
    ) {
        test_scenario::next_tx(scenario, admin);
        {
            bj::get_and_transfer_house_admin_cap_for_testing(test_scenario::ctx(scenario));
        };

        test_scenario::next_tx(scenario, admin);
        {
            let house_cap = test_scenario::take_from_sender<HouseAdminCap>(scenario);
            let coin = coin::mint_for_testing<SUI>(balance, test_scenario::ctx(scenario));
            bj::initialize_house_data(
                house_cap,
                coin,
                HOUSE_PUBLIC_KEY,
                test_scenario::ctx(scenario),
            );
        }
    }

    fun initialize_game_for_test(
        scenario: &mut Scenario,
        player: address,
        balance: u64,
    ) {
        test_scenario::next_tx(scenario, player);
        {
            counter_nft::mint_and_transfer(test_scenario::ctx(scenario));
        };

        test_scenario::next_tx(scenario, player);
        {
            let counter = test_scenario::take_from_sender<Counter>(scenario);
            let coin = coin::mint_for_testing<SUI>(balance, test_scenario::ctx(scenario));
            let house_data = test_scenario::take_shared<HouseData>(scenario);
            bj::place_bet_and_create_game(
                // Just a placeholder for the user_randomness.
                // Will be replaced with a hard-coded value in the testing flow
                // By the `bj::set_game_randomness_for_testing` function.
                vector<u8>[],
                &mut counter,
                coin,
                &mut house_data,
                test_scenario::ctx(scenario),
            );
            test_scenario::return_to_sender(scenario, counter);
            test_scenario::return_shared(house_data);
        };

        test_scenario::next_tx(scenario, player);
        {
            let game = test_scenario::take_shared<Game>(scenario);
            bj::set_game_randomness_for_testing(
                GAME_RANDOMNESS,
                &mut game,
                test_scenario::ctx(scenario),
            );
            test_scenario::return_shared(game);
        };
    }

    fun do_first_deal_for_test(
        scenario: &mut Scenario,
        admin: address,
        bls_sig: vector<u8>,
        log_points: bool,
    ) {
        test_scenario::next_tx(scenario, admin);
        {
            let game = test_scenario::take_shared<Game>(scenario);
            let house_data = test_scenario::take_shared<HouseData>(scenario);
            bj::first_deal(
                &mut game,
                bls_sig,
                &mut house_data,
                test_scenario::ctx(scenario),
            );
            test_scenario::return_shared(game);
            test_scenario::return_shared(house_data);
        };

        if (log_points) {
            test_scenario::next_tx(scenario, admin);
            {
                let game = test_scenario::take_shared<Game>(scenario);
                debug::print(&utf8(b"player points after first deal:"));
                debug::print(&bj::player_sum(&game));
                test_scenario::return_shared(game);
            };
        }
    }

    fun do_hit_for_test(
        scenario: &mut Scenario,
        player: address,
        admin: address,
    ) {
        test_scenario::next_tx(scenario, player);
        {
            let game = test_scenario::take_shared<Game>(scenario);
            let current_player_sum = bj::player_sum(&game);
            let hit_request = bj::do_hit(
                &mut game,
                current_player_sum,
                test_scenario::ctx(scenario),
            );
            transfer::public_transfer(
                hit_request,
                admin,
            );
            test_scenario::return_shared(game);
        };
    }

    fun do_stand_for_test(
        scenario: &mut Scenario,
        player: address,
        admin: address,
    ) {
        let effects = test_scenario::next_tx(scenario, player);
        {
            let game = test_scenario::take_shared<Game>(scenario);
            let current_player_sum = bj::player_sum(&game);
            let stand_request = bj::do_stand(
                &mut game,
                current_player_sum,
                test_scenario::ctx(scenario),
            );
            transfer::public_transfer(
                stand_request,
                admin,
            );
            test_scenario::return_shared(game);
        };
        effects;
    }

    fun hit_for_test(
        scenario: &mut Scenario,
        admin: address,
        bls_sig: vector<u8>,
    ) {
        test_scenario::next_tx(scenario, admin);
        {
            let game = test_scenario::take_shared<Game>(scenario);
            let house_data = test_scenario::take_shared<HouseData>(scenario);
            let hit_request = test_scenario::take_from_sender<HitRequest>(scenario);
            bj::hit(
                &mut game,
                bls_sig,
                &mut house_data,
                hit_request,
                test_scenario::ctx(scenario),
            );
            test_scenario::return_shared(game);
            test_scenario::return_shared(house_data);
        };
    }

    fun stand_for_test(
        scenario: &mut Scenario,
        admin: address,
        bls_sig: vector<u8>,
    ) {
        test_scenario::next_tx(scenario, admin);
        {
            let game = test_scenario::take_shared<Game>(scenario);
            let house_data = test_scenario::take_shared<HouseData>(scenario);
            let stand_request = test_scenario::take_from_sender<StandRequest>(scenario);
            bj::stand(
                &mut game,
                bls_sig,
                &mut house_data,
                stand_request,
                test_scenario::ctx(scenario),
            );
            test_scenario::return_shared(game);
            test_scenario::return_shared(house_data);
        };
    }

    fun draw_card_seven_for_player_for_test(
        scenario: &mut Scenario,
        player: address,
        log_points: bool,
    ) {
        test_scenario::next_tx(scenario, player);
        {
            let game = test_scenario::take_shared<Game>(scenario);
            let card = 6; // calculated value for card is 7
            bj::draw_player_card_for_testing(
                &mut game,
                card,
            );
            test_scenario::return_shared(game);
        };

        if (log_points) {
            test_scenario::next_tx(scenario, player);
            {
                let game = test_scenario::take_shared<Game>(scenario);
                debug::print(&utf8(b"player points after drawing seven:"));
                debug::print(&bj::player_sum(&game));
                test_scenario::return_shared(game);
            };
        }
    }

    fun player_won_post_handling_for_test(
        scenario: &mut Scenario,
        admin: address,
    ) {
        test_scenario::next_tx(scenario, admin);
        {
            let game = test_scenario::take_shared<Game>(scenario);
            bj::player_won_post_handling_for_test(
                &mut game,
                test_scenario::ctx(scenario),
            );
            test_scenario::return_shared(game);
        };
    }

    fun house_won_post_handling_for_test(
        scenario: &mut Scenario,
        admin: address,
    ) {
        test_scenario::next_tx(scenario, admin);
        {
            let game = test_scenario::take_shared<Game>(scenario);
            let house_data = test_scenario::take_shared<HouseData>(scenario);
            bj::house_won_post_handling_for_test(
                &mut game,
                &mut house_data,
                test_scenario::ctx(scenario),
            );
            test_scenario::return_shared(game);
            test_scenario::return_shared(house_data);
        };
    }

    fun tie_post_handling_for_test(
        scenario: &mut Scenario,
        admin: address,
    ) {
        test_scenario::next_tx(scenario, admin);
        {
            let game = test_scenario::take_shared<Game>(scenario);
            let house_data = test_scenario::take_shared<HouseData>(scenario);
            bj::tie_post_handling_for_test(
                &mut game,
                &mut house_data,
                test_scenario::ctx(scenario),
            );
            test_scenario::return_shared(game);
            test_scenario::return_shared(house_data);
        };
    }
}
