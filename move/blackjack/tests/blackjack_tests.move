// Copyright (c) 2023, Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

#[test_only]
module blackjack::single_player_blackjack_tests {
    use blackjack::single_player_blackjack::balance;

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
        let test = ts::begin(user);
        ts::next_tx(&mut test, user);

        let coin = coin::mint_for_testing<SUI>(200000001, ts::ctx(&mut test));

        let randomness = get_randomness_for_test();
        let houseData =
            bj::get_house_data_for_testing(ts::ctx(&mut test),
                balance::create_for_testing<SUI>(200000001));

        bj::place_bet_and_create_game(randomness, coin, &mut houseData, ts::ctx(&mut test));

        bj::destroy_for_testing(houseData);
        ts::end(test);
    }

    // #[test]
    // #[expected_failure(abort_code = accessories::accessories::ENotAuthorized)]
    // fun test_buy_accessory_fail_not_authorized() {
    //     let ctx = tx_context::dummy();
    //     let store = accs::create_app(&mut ctx);
    //     let owner_cap = accs::test_accs_store_owner_cap(&mut ctx);
    //
    //     accs::add_listing(&owner_cap, &mut store, utf8(b"astro hat"), utf8(b"head"), 10000000, option::none(), &mut ctx);
    //     let payment = coin::mint_for_testing<SUI>(10000000, &mut ctx);
    //     let _acc = accs::buy(&mut store, utf8(b"astro hat"), &mut payment, &mut ctx);



    // accs::add_listing(&accs_store_owner_cap, &mut accessories_app, utf8(b"astro hat"), utf8(b"head"), 10000000, option::none(), ts::ctx(&mut test));
    // accs::add_listing(&accs_store_owner_cap, &mut accessories_app, utf8(b"astro suit"), utf8(b"body"), 10000000, option::none(), ts::ctx(&mut test));
    // accs::add_listing(&accs_store_owner_cap, &mut accessories_app, utf8(b"astro boots"), utf8(b"legs"), 500000, option::none(), ts::ctx(&mut test));
    //
    //
    // let astro_hat = accs::buy(&mut accessories_app, utf8(b"astro hat"), &mut coin, ts::ctx(&mut test));
    //
    // assert!(acc::name(&astro_hat) == utf8(b"astro hat"), 0);
    // assert!(acc::type(&astro_hat) == utf8(b"head"), 0);
    //
    // acc::test_burn(astro_hat);
    // accs::test_destroy_accs_store_owner_cap(accs_store_owner_cap);
    // accs::close_app(accessories_app);
    //
    //     abort 1337
    // }

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
