// Copyright (c) 2023, Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

#[test_only]
module blackjack::counter_tests {

    use sui::test_scenario;
    use blackjack::counter_nft::{Self, Counter};

    #[test]
    fun test_mint_and_transfer() {
        let user = @0xAAAA;

        let mut scenario_val = test_scenario::begin(user);
        let scenario = &mut scenario_val;

        test_scenario::next_tx(scenario, user);
        {
            counter_nft::mint_and_transfer(test_scenario::ctx(scenario));
        };

        test_scenario::next_tx(scenario, user);
        {
            let counter = test_scenario::take_from_sender<Counter>(scenario);
            assert!(counter_nft::count(&counter) == 0, 1);
            test_scenario::return_to_sender(scenario, counter);
        };

        test_scenario::end(scenario_val);
    }

    #[test]
    fun test_increment() {
        let user = @0xAAAA;

        let mut scenario_val = test_scenario::begin(user);
        let scenario = &mut scenario_val;

        test_scenario::next_tx(scenario, user);
        {
            counter_nft::mint_and_transfer(test_scenario::ctx(scenario));
        };

        test_scenario::next_tx(scenario, user);
        {
            let mut counter = test_scenario::take_from_sender<Counter>(scenario);
            assert!(counter_nft::count(&counter) == 0, 1);
            counter_nft::increment_and_get(&mut counter);
            test_scenario::return_to_sender(scenario, counter);
        };

        test_scenario::next_tx(scenario, user);
        {
            let counter = test_scenario::take_from_sender<Counter>(scenario);
            assert!(counter_nft::count(&counter) == 1, 1);
            test_scenario::return_to_sender(scenario, counter);
        };

        test_scenario::end(scenario_val);
    }
}