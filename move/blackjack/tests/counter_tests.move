// Copyright (c) 2023, Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

#[test_only]
module blackjack::counter_tests {

    use sui::test_scenario;
    use blackjack::counter_nft::{Self, Counter};

    #[test]
    fun test_mint_and_transfer() {
        let user = @0xAAAA;

        let mut scenario = test_scenario::begin(user);

        scenario.next_tx(user);
        {
            counter_nft::mint_and_transfer(scenario.ctx());
        };

        scenario.next_tx(user);
        {
            let counter = scenario.take_from_sender<Counter>();
            assert!(counter.count() == 0, 1);
            scenario.return_to_sender(counter);
        };

        scenario.end();
    }

    #[test]
    fun test_increment() {
        let user = @0xAAAA;

        let mut scenario = test_scenario::begin(user);

        scenario.next_tx(user);
        {
            counter_nft::mint_and_transfer(scenario.ctx());
        };

        scenario.next_tx(user);
        {
            let mut counter = scenario.take_from_sender<Counter>();
            assert!(counter.count() == 0, 1);
            counter.increment_and_get();
            scenario.return_to_sender(counter);
        };

        scenario.next_tx(user);
        {
            let counter = scenario.take_from_sender<Counter>();
            assert!(counter.count() == 1, 1);
            scenario.return_to_sender(counter);
        };

        scenario.end();
    }
}
