// Copyright (c) 2023, Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

#[test_only]
module blackjack::single_player_blackjack_tests {

    use std::vector;
    use sui::object::{ID};
    use sui::balance;
    use sui::coin;
    use sui::sui::SUI;
    use sui::test_scenario;
    use blackjack::single_player_blackjack::{Self as bj, HouseAdminCap, HouseData, Game};
    use blackjack::counter_nft::{Self, Counter};

    #[test]
    fun test_initialize_house_data() {
        let admin = @0xAAAA;
        let balance = 100000000000;
        let scenario_val = test_scenario::begin(admin);
        let scenario = &mut scenario_val;
        
        test_scenario::next_tx(scenario, admin);
        {
            bj::get_and_transfer_house_admin_cap_for_testing(test_scenario::ctx(scenario));
        };

        test_scenario::next_tx(scenario, admin);
        {
            let houseCap = test_scenario::take_from_sender<HouseAdminCap>(scenario);
            let coin = coin::mint_for_testing<SUI>(balance, test_scenario::ctx(scenario));
            let public_key = vector[
                1, 2, 3, 4, 5, 6, 7, 8,
                9, 10, 11, 12, 13, 14, 15, 16,
                17, 18, 19, 20, 21, 22, 23, 24,
                25, 26, 27, 28, 29, 30, 31, 32
            ];
            bj::initialize_house_data(
                houseCap,
                coin,
                public_key,
                test_scenario::ctx(scenario),
            );
        };

        test_scenario::next_tx(scenario, admin);
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

        test_scenario::next_tx(scenario, player);
        {
            counter_nft::mint_and_transfer(test_scenario::ctx(scenario));
        };

        test_scenario::next_tx(scenario, player);
        {
            let randomness = get_randomness_for_test();
            let counter = test_scenario::take_from_sender<Counter>(scenario);
            let coin = coin::mint_for_testing<SUI>(200000001, test_scenario::ctx(scenario));
            let houseData =
                bj::get_house_data_for_testing(
                    test_scenario::ctx(scenario),
                    balance::create_for_testing<SUI>(1000000001)
                );
            bj::place_bet_and_create_game(
                randomness,
                &mut counter,
                coin,
                &mut houseData,
                test_scenario::ctx(scenario),
            );
            test_scenario::return_to_sender(scenario, counter);
            bj::destroy_for_testing(houseData);
        };

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

    // #[test]
    // fun test_create_game() {
    //     let user = @0xCAFE;
    //     let _house = @0xFAAA;

    //     let scenario_val = test_scenario::begin(user);
    //     let scenario = &mut scenario_val;

    //     test_scenario::next_tx(scenario, user);
    //     {
    //         counter_nft::mint_and_transfer(test_scenario::ctx(scenario));
    //     };


    //     test_scenario::next_tx(scenario, user);
    //     {
    //         let coin = coin::mint_for_testing<SUI>(200000001, test_scenario::ctx(scenario));

    //         let randomness = get_randomness_for_test();
    //         let counter = test_scenario::take_from_sender<Counter>(scenario);
    //         let houseData =
    //             bj::get_house_data_for_testing(test_scenario::ctx(scenario),
    //                 balance::create_for_testing<SUI>(200000001));

    //         bj::place_bet_and_create_game(
    //             randomness,
    //             &mut counter,
    //             coin,
    //             &mut houseData,
    //             test_scenario::ctx(scenario)
    //         );

    //         test_scenario::return_to_sender(scenario, counter);
    //         bj::destroy_for_testing(houseData);
    //     };

    // test_scenario::next_tx(scenario, house) ;
    // {
    //     let game = test_scenario::take_shared<Game>(scenario);

    //     let play_randomness: vector<u8> = bj::player_randomness(&game);
    //     bj::set_init_hash_for_testing(&mut game, play_randomness);
    //     assert! (vector::length(&play_randomness) > 0, 666);

    //     print(&111);
    //     print(&play_randomness);

    //     let cards = vector[];

    //     let card1 = bj::get_next_random_card(&mut game);
    //     vector::push_back(&mut cards, card1);

    //     print(&bj::get_latest_hash(&game));
    //     print(&card1);
    //     print(&1111111);

    //     let card2 = bj::get_next_random_card(&mut game);
    //     vector::push_back(&mut cards, card2);

    //     print(&bj::get_latest_hash(&game));
    //     print(&card2);
    //     print(&2222222);
    //     test_scenario::return_shared(game);
    // };


    //     test_scenario::end(scenario_val);
    // }


    fun get_randomness_for_test() : vector<u8>{
        let rvec = vector[];
        vector::push_back(&mut rvec, 50);
        vector::push_back(&mut rvec, 60);
        vector::push_back(&mut rvec, 40);
        vector::push_back(&mut rvec, 30);
        vector::push_back(&mut rvec, 30);
        vector::push_back(&mut rvec, 30);

        rvec
    }



}
