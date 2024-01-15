// Copyright (c) 2023, Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

#[test_only]
module blackjack::single_player_blackjack_tests {

    use std::vector;
    use std::debug;
    use std::string::utf8;
    use sui::object::{ID};
    use sui::coin;
    use sui::sui::SUI;
    use sui::test_scenario::{Self, Scenario, TransactionEffects};
    use blackjack::single_player_blackjack::{Self as bj, HouseAdminCap, HouseData, Game};
    use blackjack::counter_nft::{Self, Counter};

    const ADMIN: address = @0x65391674eb4210940ea98ae451237d9335920297e7c8abaeb7e05b221ee36917;
    const PLAYER: address = @0x403eb2b0512ee18c24d96878f8beabf54734798c22f06e8c8569eecd31a17909;
    const INITIAL_HOUSE_BALANCE: u64 = 5000000000;
    const PLAYER_BET: u64 = 300000000;
    const HOUSE_BET: u64 =  200000000;
    // The house BLS signature, generated with a TS script
    // For admin address 0x65391674eb4210940ea98ae451237d9335920297e7c8abaeb7e05b221ee36917
    // and counter 0
    // and randomness [1, 2, 3, 4, 5, 6]
    
    const FIRST_DEAL_HOUSE_BLS_SIG: vector<u8> = vector<u8> [
        165,182,96,175,46,248,108,245,240,176,
        255,231,13,224,212,204,246,105,127,139,
        171,176,130,230,84,133,204,95,124,226,
        128,81,195,153,188,233,187,101,240,152,
        83,150,244,112,97,223,93,27,21,113,195,
        86,124,219,254,20,42,151,107,82,222,38,
        12,138,60,163,158,251,189,97,158,224,107,
        140,164,104,205,11,184,202,154,38,81,203,
        127,152,118,191,2,208,31,29,84,89,79,16
    ];

    const HOUSE_BLS_SIG: vector<u8> = vector<u8> [
        133,76,229,199,93,8,247,209,25,83,252,
        113,123,4,71,233,21,6,83,125,33,136,235,
        121,208,184,207,191,198,63,119,227,117,70,
        86,229,241,253,85,63,189,199,108,168,30,9,
        198,199,23,44,179,227,122,251,169,160,136,
        22,102,216,24,178,225,117,18,132,211,150,
        20,197,78,112,150,225,29,158,93,98,115,91,
        103,164,24,241,100,187,14,209,227,246,121,
        110,184,115,69,226
    ];

    const HOUSE_PUBLIC_KEY: vector<u8> = vector<u8> [
        185, 195,  27,  41,  48, 111, 208,  32,  77,
        189, 168,  94,  72, 179, 194, 183,  67, 237,
        230, 179, 239, 181, 149, 238,   0, 100, 248,
        74, 194, 109, 159,   4, 225,  77, 194, 108,
        113,  19, 186, 231,  98, 188,   9, 246,  82,
        32, 114,  74
    ];

    const USER_RANDOMNESS: vector<u8> = vector<u8> [
        53, 100, 101, 52, 56, 53, 55, 57, 54, 54, 98, 100, 101,
        99, 99, 99, 97, 101, 55, 51, 53, 57, 99, 100, 50, 102,
        101, 56, 51, 101, 55, 98, 98, 57, 54, 48, 100, 52, 99,
        49, 54, 50, 51, 49, 55, 50, 52, 49, 55, 52, 50, 99, 52,
        50, 99, 48, 54, 99, 57, 99, 53, 50, 50, 53, 83, 184, 22,
        30, 225, 28, 25, 224, 104, 236, 53, 110, 47, 81, 201, 153,
        94, 254, 152, 6, 33, 40, 0, 250, 87, 217, 217, 211, 55, 140,
        63, 115, 2, 0, 0, 0, 0, 0, 0, 0
    ];

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
    #[expected_failure(abort_code = bj::EInsufficientBalance)]
    fun test_place_bet_and_create_game_insufficient_balance() {
        let scenario_val = test_scenario::begin(ADMIN);
        let scenario = &mut scenario_val;

        initialize_house_data_for_test(scenario, ADMIN, INITIAL_HOUSE_BALANCE);
        initialize_game_for_test(scenario, PLAYER, PLAYER_BET - 200000000);

        test_scenario::end(scenario_val);
    }

    #[test]
    fun test_first_deal() {
        let scenario_val = test_scenario::begin(PLAYER);
        let scenario = &mut scenario_val;

        initialize_house_data_for_test(scenario, ADMIN, INITIAL_HOUSE_BALANCE);
        initialize_game_for_test(scenario, PLAYER, PLAYER_BET);
        do_first_deal_for_test(scenario, ADMIN, false);

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
    #[expected_failure(abort_code = bj::EDealAlreadyHappened)]
    public fun test_first_deal_twice() {
        let scenario_val = test_scenario::begin(ADMIN);
        let scenario = &mut scenario_val;

        initialize_house_data_for_test(scenario, ADMIN, INITIAL_HOUSE_BALANCE);
        initialize_game_for_test(scenario, PLAYER, PLAYER_BET);
        do_first_deal_for_test(scenario, ADMIN, false);
        do_first_deal_for_test(scenario, ADMIN, false);

        test_scenario::end(scenario_val);
    }

    #[test]
    fun test_hit() {
        let scenario_val = test_scenario::begin(PLAYER);
        let scenario = &mut scenario_val;

        initialize_house_data_for_test(scenario, ADMIN, INITIAL_HOUSE_BALANCE);
        initialize_game_for_test(scenario, PLAYER, PLAYER_BET);
        do_first_deal_for_test(scenario, ADMIN, false);

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

        hit_for_test(scenario, ADMIN);

        test_scenario::next_tx(scenario, ADMIN);
        {
            let game = test_scenario::take_shared<Game>(scenario);
            let player_cards_length_before = vector::length(&_player_cards_before);
            let player_cards_length_after = vector::length(&bj::player_cards(&game));
            let dealer_cards_length_before = vector::length(&_dealer_cards_before);
            let dealer_cards_length_after = vector::length(&bj::dealer_cards(&game));

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
        do_first_deal_for_test(scenario, ADMIN, false);

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

        stand_for_test(scenario, ADMIN);

        test_scenario::next_tx(scenario, ADMIN);
        {
            let game = test_scenario::take_shared<Game>(scenario);
            let player_cards_length_before = vector::length(&_player_cards_before);
            let player_cards_length_after = vector::length(&bj::player_cards(&game));
            let dealer_cards_length_before = vector::length(&_dealer_cards_before);
            let dealer_cards_length_after = vector::length(&bj::dealer_cards(&game));

            assert!(bj::player_sum(&game) == _player_sum_before, 1);
            assert!(player_cards_length_after == player_cards_length_before, 2);
            assert!(bj::dealer_sum(&game) > _dealer_sum_before, 3);
            assert!(dealer_cards_length_after > dealer_cards_length_before, 4);
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
        do_first_deal_for_test(scenario, ADMIN, false);
        player_won_post_handling_for_test(scenario, ADMIN);
        do_hit_for_test(scenario, PLAYER);

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
        do_first_deal_for_test(scenario, ADMIN, false);
        do_hit_for_test(scenario, player2);

        test_scenario::end(scenario_val);
    }

    #[test]
    #[expected_failure(abort_code = bj::EGameHasFinished)]
    fun test_do_stand_in_finished_game() {
        let scenario_val = test_scenario::begin(PLAYER);
        let scenario = &mut scenario_val;

        initialize_house_data_for_test(scenario, ADMIN, INITIAL_HOUSE_BALANCE);
        initialize_game_for_test(scenario, PLAYER, PLAYER_BET);
        do_first_deal_for_test(scenario, ADMIN, false);
        player_won_post_handling_for_test(scenario, ADMIN);
        do_stand_for_test(scenario, PLAYER);
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
        do_first_deal_for_test(scenario, ADMIN, false);
        do_stand_for_test(scenario, player2);

        test_scenario::end(scenario_val);
    }

    #[test]
    fun test_player_won_post_handling() {
        let scenario_val = test_scenario::begin(PLAYER);
        let scenario = &mut scenario_val;
        initialize_house_data_for_test(scenario, ADMIN, INITIAL_HOUSE_BALANCE);
        initialize_game_for_test(scenario, PLAYER, PLAYER_BET);
        do_first_deal_for_test(scenario, ADMIN, false);
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
        do_first_deal_for_test(scenario, ADMIN, false);
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
        do_first_deal_for_test(scenario, ADMIN, false);
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

    // Test a whole flow where the user exceeds 21
    #[test]
    fun test_player_exceeds_21() {
        let scenario_val = test_scenario::begin(PLAYER);
        let scenario = &mut scenario_val;

        initialize_house_data_for_test(scenario, ADMIN, INITIAL_HOUSE_BALANCE);
        initialize_game_for_test(scenario, PLAYER, PLAYER_BET);
        do_first_deal_for_test(scenario, ADMIN, false);
        draw_card_seven_for_player_for_test(scenario, PLAYER, false);
        hit_for_test(scenario, ADMIN);

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
                USER_RANDOMNESS,
                &mut counter,
                coin,
                &mut house_data,
                test_scenario::ctx(scenario),
            );
            test_scenario::return_to_sender(scenario, counter);
            test_scenario::return_shared(house_data);
        };
    }

    fun do_first_deal_for_test(
        scenario: &mut Scenario,
        admin: address,
        log_points: bool,
    ) {
        test_scenario::next_tx(scenario, admin);
        {
            let game = test_scenario::take_shared<Game>(scenario);
            let house_data = test_scenario::take_shared<HouseData>(scenario);
            bj::first_deal(
                &mut game,
                FIRST_DEAL_HOUSE_BLS_SIG,
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
    ): TransactionEffects {
        let effects = test_scenario::next_tx(scenario, player);
        {
            let game = test_scenario::take_shared<Game>(scenario);
            let current_hand_sum = bj::player_sum(&game);
            bj::do_hit(
                &mut game,
                current_hand_sum,
                test_scenario::ctx(scenario),
            );
            test_scenario::return_shared(game);
        };
        effects
    }

    fun do_stand_for_test(
        scenario: &mut Scenario,
        player: address,
    ) {
        let effects = test_scenario::next_tx(scenario, player);
        {
            let game = test_scenario::take_shared<Game>(scenario);
            let current_hand_sum = bj::player_sum(&game);
            bj::do_stand(
                &mut game,
                current_hand_sum,
                test_scenario::ctx(scenario),
            );
            test_scenario::return_shared(game);
        };
        effects;
    }

    fun hit_for_test(
        scenario: &mut Scenario,
        admin: address,
    ) {
        test_scenario::next_tx(scenario, admin);
        {
            let game = test_scenario::take_shared<Game>(scenario);
            let house_data = test_scenario::take_shared<HouseData>(scenario);
            bj::hit(
                &mut game,
                HOUSE_BLS_SIG,
                &mut house_data,
                test_scenario::ctx(scenario),
            );
            test_scenario::return_shared(game);
            test_scenario::return_shared(house_data);
        };
    }

    fun stand_for_test(
        scenario: &mut Scenario,
        admin: address,
    ) {
        test_scenario::next_tx(scenario, admin);
        {
            let game = test_scenario::take_shared<Game>(scenario);
            let house_data = test_scenario::take_shared<HouseData>(scenario);
            bj::stand(
                &mut game,
                HOUSE_BLS_SIG,
                &mut house_data,
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
