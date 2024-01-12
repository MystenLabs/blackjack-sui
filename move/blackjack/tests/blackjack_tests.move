// Copyright (c) 2023, Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

#[test_only]
module blackjack::single_player_blackjack_tests {

    use std::vector;
    // use std::debug;
    use sui::object::{ID};
    use sui::balance;
    use sui::coin;
    use sui::sui::SUI;
    use sui::test_scenario::{Self, Scenario, TransactionEffects};
    use blackjack::single_player_blackjack::{Self as bj, HouseAdminCap, HouseData, Game};
    use blackjack::counter_nft::{Self, Counter};

    const ADMIN: address = @0x65391674eb4210940ea98ae451237d9335920297e7c8abaeb7e05b221ee36917;
    const PLAYER: address = @0xAAAA;

    // The house BLS signature, generated with a TS script
    // For admin address 0x65391674eb4210940ea98ae451237d9335920297e7c8abaeb7e05b221ee36917
    // and counter 0
    // and randomness [1, 2, 3, 4, 5, 6]
    const HOUSE_BLS_SIG: vector<u8> = vector<u8> [
        149,  82, 223,  38,  39, 229,  73,  47,  31, 115, 127, 159,
        89, 240, 195, 172, 251, 135, 187,  98, 174, 246, 169, 195,
        107,  92, 248, 186, 138, 121, 116, 228, 233, 218, 158, 106,
        126, 227,  52,  61,  36, 208,  54, 144, 158, 177,  65,  86,
        20,  41, 182,  93, 224, 143, 123, 210,  61,  89,  10, 178,
        46, 152, 198, 102, 185,  36,  56, 182, 155, 189, 251, 178,
        235,  29,  86, 163,   7,  56,  31, 245, 154, 172,  29, 100,
        123, 177,  92, 246, 251, 120, 205,  40, 179, 196, 237,  70
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
        1, 2, 3, 4, 5, 6
    ];

    #[test]
    fun test_initialize_house_data() {
        let balance = 100000000000;
        let scenario_val = test_scenario::begin(ADMIN);
        let scenario = &mut scenario_val;

        initialize_house_data_for_test(scenario, ADMIN,);

        test_scenario::next_tx(scenario, ADMIN);
        {
            // validate that the house data is created
            let houseData = test_scenario::take_shared<HouseData>(scenario);
            let houseDataBalance = bj::balance(&houseData);
            assert!(houseDataBalance == balance, 1);
            test_scenario::return_shared<HouseData>(houseData);

            // and that the adminHouseCap was burnt
            let adminOwnedObjects: vector<ID> = test_scenario::ids_for_sender<HouseAdminCap>(scenario);
            assert!(vector::length(&adminOwnedObjects) == 0, 2);
        };

        test_scenario::end(scenario_val);
    }

    #[test]
    fun test_place_bet_and_create_game() {
        let player = @0xAAAA;

        let scenario_val = test_scenario::begin(player);
        let scenario = &mut scenario_val;

        initialize_house_data_for_test(scenario, ADMIN,);
        initialize_game_for_test(scenario, PLAYER);

        test_scenario::next_tx(scenario, player);
        {
            let game = test_scenario::take_shared<Game>(scenario);
            assert!(bj::player(&game) == player, 2);
            assert!(bj::player_cards(&game) == vector[], 3);
            assert!(bj::player_sum(&game) == 0, 4);
            assert!(bj::dealer_cards(&game) == vector[], 5);
            assert!(bj::dealer_sum(&game) == 0, 6);
            assert!(bj::status(&game) == 0, 7);
            assert!(bj::total_stake(&game) == 200000000 + 200000001, 8);
            test_scenario::return_shared(game);
        };

        test_scenario::end(scenario_val);
    }

    #[test]
    fun test_first_deal() {
        let scenario_val = test_scenario::begin(PLAYER);
        let scenario = &mut scenario_val;

        initialize_house_data_for_test(scenario, ADMIN);
        initialize_game_for_test(scenario, PLAYER);
        do_first_deal_for_test(scenario, ADMIN);

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

        initialize_house_data_for_test(scenario, ADMIN);
        initialize_game_for_test(scenario, PLAYER);
        do_first_deal_for_test(scenario, ADMIN);
        do_first_deal_for_test(scenario, ADMIN);

        test_scenario::end(scenario_val);
    }

    #[test]
    fun test_hit() {
        let scenario_val = test_scenario::begin(PLAYER);
        let scenario = &mut scenario_val;

        initialize_house_data_for_test(scenario, ADMIN,);
        initialize_game_for_test(scenario, PLAYER);
        do_first_deal_for_test(scenario, ADMIN);

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

        initialize_house_data_for_test(scenario, ADMIN,);
        initialize_game_for_test(scenario, PLAYER);
        do_first_deal_for_test(scenario, ADMIN);

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
    fun test_do_hit() {
        let scenario_val = test_scenario::begin(PLAYER);
        let scenario = &mut scenario_val;

        initialize_house_data_for_test(scenario, ADMIN,);
        initialize_game_for_test(scenario, PLAYER);
        do_first_deal_for_test(scenario, ADMIN);
        let _effects = do_hit_for_test(scenario, PLAYER);
        
        test_scenario::next_tx(scenario, PLAYER);
        {
            // TODO
            // How can we test here that the event was emitted ?
            // Are we even supposed to be testing this case ?
            // In theory, I would expect this to work:
            // assert!(test_scenario::num_user_events(&_effects) == 1, 1);
            // But the num_user_events is equal to 0
        };

        test_scenario::end(scenario_val);
    }

    #[test]
    #[expected_failure(abort_code = bj::EUnauthorizedPlayer)]
    fun test_do_hit_unauthorized() {
        let scenario_val = test_scenario::begin(PLAYER);
        let scenario = &mut scenario_val;
        let player2 = @0xBBBB;

        initialize_house_data_for_test(scenario, ADMIN,);
        initialize_game_for_test(scenario, PLAYER);
        do_first_deal_for_test(scenario, ADMIN);
        do_hit_for_test(scenario, player2);

        test_scenario::end(scenario_val);
    }

    #[test]
    fun test_do_stand() {
        let scenario_val = test_scenario::begin(PLAYER);
        let scenario = &mut scenario_val;

        initialize_house_data_for_test(scenario, ADMIN,);
        initialize_game_for_test(scenario, PLAYER);
        do_first_deal_for_test(scenario, ADMIN);
        do_hit_for_test(scenario, PLAYER);

        test_scenario::next_tx(scenario, PLAYER);
        {
            // TODO
            // How can we test here that the event was emitted ?
            // Are we even supposed to be testing this case ?
            // In theory, I would expect this to work:
            // assert!(test_scenario::num_user_events(&_effects) == 1, 1);
            // But the num_user_events is equal to 0
        };

        test_scenario::end(scenario_val);
    }

    #[test]
    #[expected_failure(abort_code = bj::EUnauthorizedPlayer)]
    fun test_do_stand_unauthorized() {
        let scenario_val = test_scenario::begin(PLAYER);
        let scenario = &mut scenario_val;
        let player2 = @0xBBBB;

        initialize_house_data_for_test(scenario, ADMIN,);
        initialize_game_for_test(scenario, PLAYER);
        do_first_deal_for_test(scenario, ADMIN);
        do_stand_for_test(scenario, player2);

        test_scenario::end(scenario_val);
    }

    // Helper functions
    fun initialize_house_data_for_test(
        scenario: &mut Scenario,
        admin: address,
    ) {
        test_scenario::next_tx(scenario, admin);
        {
            bj::get_and_transfer_house_admin_cap_for_testing(test_scenario::ctx(scenario));
        };

        test_scenario::next_tx(scenario, admin);
        {
            let houseCap = test_scenario::take_from_sender<HouseAdminCap>(scenario);
            let coin = coin::mint_for_testing<SUI>(100000000000, test_scenario::ctx(scenario));
            bj::initialize_house_data(
                houseCap,
                coin,
                HOUSE_PUBLIC_KEY,
                test_scenario::ctx(scenario),
            );
        }
    }

    fun initialize_game_for_test(
        scenario: &mut Scenario,
        player: address
    ) {
        test_scenario::next_tx(scenario, player);
        {
            counter_nft::mint_and_transfer(test_scenario::ctx(scenario));
        };

        test_scenario::next_tx(scenario, player);
        {
            let counter = test_scenario::take_from_sender<Counter>(scenario);
            let coin = coin::mint_for_testing<SUI>(200000001, test_scenario::ctx(scenario));
            let houseData = bj::get_house_data_for_testing(
                test_scenario::ctx(scenario),
                balance::create_for_testing<SUI>(1000000001)
            );
            bj::place_bet_and_create_game(
                USER_RANDOMNESS,
                &mut counter,
                coin,
                &mut houseData,
                test_scenario::ctx(scenario),
            );
            test_scenario::return_to_sender(scenario, counter);
            bj::destroy_for_testing(houseData);
        };
    }

    fun do_first_deal_for_test(
        scenario: &mut Scenario,
        admin: address,
    ) {
        test_scenario::next_tx(scenario, admin);
        {
            let game = test_scenario::take_shared<Game>(scenario);
            let house_data = test_scenario::take_shared<HouseData>(scenario);
            // debug::print(&game);
            // debug::print(&bj::public_key(&house_data));
            bj::first_deal(
                &mut game,
                HOUSE_BLS_SIG,
                &mut house_data,
                test_scenario::ctx(scenario),
            );
            test_scenario::return_shared(game);
            test_scenario::return_shared(house_data);
        };
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



}
