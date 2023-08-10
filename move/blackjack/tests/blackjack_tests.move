// Copyright (c) 2023, Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

#[test_only]
module blackjack::single_player_blackjack_tests {
    use blackjack::single_player_blackjack::{balance, Game};

    use std::vector;
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

            assert (vector::length(&play_randomness) > 0, 55);

            ts::return_shared(game);
        };


        ts::end(test);
    }

    #[test]
    fun test_accessory_price() {
        let user = @0x1;
        let test = ts::begin(user);
        ts::next_tx(&mut test, user);


        ts::end(test);
    }

    public fun get_randomness_for_test() : vector<u8>{
        let rvec = vector[];
        vector::push_back(&mut rvec, 125);
        vector::push_back(&mut rvec, 126);
        vector::push_back(&mut rvec, 201);
        vector::push_back(&mut rvec, 202);
        vector::push_back(&mut rvec, 203);
        vector::push_back(&mut rvec, 204);
        vector::push_back(&mut rvec, 205);
        vector::push_back(&mut rvec, 206);

        let rehashed_byte_array = blake2b256(&rvec);

        rehashed_byte_array
    }



}
