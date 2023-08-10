// Copyright (c) 2023, Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

#[test_only]
module blackjack::single_player_blackjack_tests {
    use blackjack::single_player_blackjack::{balance, Game};

    use std::vector;
    use std::debug::print as print;
    use sui::coin;

    // use std::string::utf8;
    // use std::option;
    // use sui::tx_context;

    use sui::sui::SUI;
    use sui::balance;
    use sui::test_scenario as ts;
    use sui::hash::{blake2b256};

    use blackjack::single_player_blackjack as bj;


    #[test]
    fun test_create_game() {
        let user = @0xCAFE;

        let house = @0xFAAA;
        let test = ts::begin(user);

        let scenario = &mut test;

        ts::next_tx(scenario, user);
        {
            let coin = coin::mint_for_testing<SUI>(200000001, ts::ctx(scenario));

            let randomness = get_randomness_for_test();
            let houseData =
                bj::get_house_data_for_testing(ts::ctx(scenario),
                    balance::create_for_testing<SUI>(200000001));

            bj::place_bet_and_create_game(randomness, coin, &mut houseData, ts::ctx(scenario));

            bj::destroy_for_testing(houseData);
        };

        ts::next_tx(scenario, house) ;
        {
            let game = ts::take_shared<Game>(scenario);

            let play_randomness: vector<u8> = bj::player_randomness(&game);

            assert! (vector::length(&play_randomness) > 0, 666);

            print(&play_randomness);
            let cards = vector[];

            let card1 = bj::get_next_random_card(&mut game);
            vector::push_back(&mut cards, card1);

            print(&bj::get_latest_hash(&game));
            print(&card1);
            print(&1111111);

            let card2 = bj::get_next_random_card(&mut game);
            vector::push_back(&mut cards, card2);

            print(&bj::get_latest_hash(&game));
            print(&card2);
            print(&2222222);

            printString(cards);
            print(&cards);

            ts::return_shared(game);
        };


        ts::end(test);
    }

    public fun printString(str: vector<u8>) {
        std::debug::print(&std::ascii::string(str))
    }

    fun get_randomness_for_test() : vector<u8>{
        let rvec = vector[];
        vector::push_back(&mut rvec, 50);
        vector::push_back(&mut rvec, 29);
        vector::push_back(&mut rvec, 30);
        vector::push_back(&mut rvec, 4);

        rvec
    }



}
