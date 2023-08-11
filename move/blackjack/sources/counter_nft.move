// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

/// This module implements a simple, non transferable counter NFT.
/// Creates a counter object that can be incremented and burned.
/// The counter NFT is non transferable, i.e. it can only be ever owned by one account.
module blackjack::counter_nft {
    use std::vector;
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer::{Self};
    use sui::bcs::{Self};

    struct Counter has key {
        id: UID,
        count: u64,
    }

    /// Creates a new counter object & transfers it to the sender.
    public entry fun mint(ctx: &mut TxContext) {
        let counter = Counter {
            id: object::new(ctx),
            count: 0
        };

        transfer::transfer(counter, tx_context::sender(ctx));
    }

    /// Internal function to increment the counter by 1.
    fun increment(self: &mut Counter) {
        self.count = self.count + 1;
    }

    /// Calculates the Counter NFT ID + count. Then it increases the count by 1 and returns the appended bytes.
    public fun increment_and_get(self: &mut Counter): vector<u8> {
        let vrf_input = object::id_bytes(self);
        let count_to_bytes = bcs::to_bytes(&count(self));
        vector::append(&mut vrf_input, count_to_bytes);
        increment(self);
        vrf_input
    }

    /// Deletes the counter object.
    public entry fun burn(self: Counter) {
        let Counter { id, count: _ } = self;
        object::delete(id);
    }

    /// Returns the current count of the counter object.
    public fun count(self: &Counter): u64 {
        self.count
    }

}
