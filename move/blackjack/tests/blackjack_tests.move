// Copyright (c) 2023, Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

#[test_only]
module blackjack::single_player_blackjack_tests {

    use std::debug;
    use sui::coin::{Coin, Self};
    use sui::sui::SUI;
    use sui::test_scenario::{Self, Scenario};
    use blackjack::single_player_blackjack::{Self as bj, HouseAdminCap, HouseData, Game, HitRequest, StandRequest};

    const ADMIN: address = @0x65391674eb4210940ea98ae451237d9335920297e7c8abaeb7e05b221ee36917;
    const PLAYER: address = @0xfff196b9e146b115301408f624903fc488f42d357a7fa6fc70f5751e3d0570fc;
    const INITIAL_HOUSE_BALANCE: u64 = 5000000000;
    const PLAYER_BET: u64 = 200000000;
    const HOUSE_BET: u64 =  200000000;



    #[test]
    fun test_initialize_house_data() {
        let mut scenario = test_scenario::begin(ADMIN);

        scenario.initialize_house_data_for_test(ADMIN, INITIAL_HOUSE_BALANCE);

        scenario.next_tx(ADMIN);
        {
            // validate that the house data is created
            let house_data = scenario.take_shared<HouseData>();
            let house_data_balance = house_data.balance();
            assert!(house_data_balance == INITIAL_HOUSE_BALANCE, 1);
            assert!(house_data.public_key() == vector<u8>[], 2);
            assert!(house_data.house() == ADMIN, 3);
            test_scenario::return_shared<HouseData>(house_data);

            // and that the adminHouseCap was burnt
            let adminOwnedObjects: vector<ID> = scenario.ids_for_sender<HouseAdminCap>();
            assert!(adminOwnedObjects.length() == 0, 2);
        };

        scenario.end();
    }

    #[test]
    fun test_top_up_house_data() {
        let mut scenario = test_scenario::begin(ADMIN);

        scenario.initialize_house_data_for_test(ADMIN, INITIAL_HOUSE_BALANCE);

        scenario.next_tx(ADMIN);
        {
            let coin = coin::mint_for_testing<SUI>(50000, scenario.ctx());
            transfer::public_transfer(coin, ADMIN);
        };

        scenario.next_tx(ADMIN);
        {
            let mut house_data = scenario.take_shared<HouseData>();
            let fund_coin = scenario.take_from_sender<Coin<SUI>>();
            house_data.top_up(fund_coin, scenario.ctx());
            test_scenario::return_shared(house_data);
        };

        scenario.next_tx(ADMIN);
        {
            let house_data = scenario.take_shared<HouseData>();
            assert!(house_data.balance() == INITIAL_HOUSE_BALANCE + 50000, 1);
            test_scenario::return_shared(house_data);
        };

        scenario.end();
    }

    #[test]
    fun test_withdraw_from_house_data() {
        let mut scenario = test_scenario::begin(ADMIN);

        scenario.initialize_house_data_for_test(ADMIN, INITIAL_HOUSE_BALANCE);

        scenario.next_tx(ADMIN);
        {
            let mut house_data = scenario.take_shared<HouseData>();
            house_data.withdraw(scenario.ctx());
            test_scenario::return_shared(house_data);
        };

        scenario.next_tx(ADMIN);
        {
            let house_data = scenario.take_shared<HouseData>();
            assert!(house_data.balance() == 0, 1);
            test_scenario::return_shared(house_data);
        };

        scenario.end();
    }

    #[test]
    #[expected_failure(abort_code = bj::EInsufficientBalance)]
    fun test_initialize_house_data_with_insifficient_balance() {
        let mut scenario = test_scenario::begin(ADMIN);

        scenario.initialize_house_data_for_test(ADMIN, 0);

        scenario.end();
    }

    #[test]
    fun test_place_bet_and_create_game() {
        let mut scenario = test_scenario::begin(PLAYER);

        scenario.initialize_house_data_for_test(ADMIN, INITIAL_HOUSE_BALANCE);
        scenario.initialize_game_for_test(PLAYER, PLAYER_BET);

        scenario.next_tx(PLAYER);
        {
            let game = scenario.take_shared<Game>();
            assert!(game.player() == PLAYER, 2);
            assert!(game.player_cards() == vector[], 3);
            assert!(game.player_sum() == 0, 4);
            assert!(game.dealer_cards() == vector[], 5);
            assert!(game.dealer_sum() == 0, 6);
            assert!(game.status() == 0, 7);
            assert!(game.total_stake() == HOUSE_BET + PLAYER_BET, 8);
            test_scenario::return_shared(game);
        };

        scenario.end();
    }

    #[test]
    #[expected_failure(abort_code = bj::EInsufficientHouseBalance)]
    fun test_place_bet_and_create_game_insufficient_house_balance() {
        let mut scenario = test_scenario::begin(ADMIN);

        scenario.initialize_house_data_for_test(ADMIN, HOUSE_BET - 1);
        scenario.initialize_game_for_test(PLAYER, PLAYER_BET);

        scenario.end();
    }

    #[test]
    #[expected_failure(abort_code = bj::EInvalidPlayerBetAmount)]
    fun test_place_bet_and_create_game_insufficient_balance() {
        let mut scenario = test_scenario::begin(ADMIN);

        scenario.initialize_house_data_for_test(ADMIN, INITIAL_HOUSE_BALANCE);
        scenario.initialize_game_for_test(PLAYER, PLAYER_BET - 1);

        scenario.end();
    }

    #[test]
    fun test_first_deal() {
        let mut scenario = test_scenario::begin(PLAYER);

        scenario.initialize_house_data_for_test(ADMIN, INITIAL_HOUSE_BALANCE);
        scenario.initialize_game_for_test(PLAYER, PLAYER_BET);
        scenario.do_first_deal_for_test(ADMIN, false);

        scenario.next_tx(ADMIN);
        {
            let game = scenario.take_shared<Game>();
            assert!(game.player_sum() > 0, 1);
            assert!(game.dealer_sum() > 0, 2);
            assert!(game.player_cards().length() == 2, 3);
            assert!(game.dealer_cards().length() == 1, 4);
            test_scenario::return_shared(game);
        };

        scenario.end();
    }


    #[test]
    #[expected_failure(abort_code = bj::EDealAlreadyHappened)]
    public fun test_first_deal_twice() {
        let mut scenario = test_scenario::begin(ADMIN);

        scenario.initialize_house_data_for_test(ADMIN, INITIAL_HOUSE_BALANCE);
        scenario.initialize_game_for_test(PLAYER, PLAYER_BET);
        scenario.do_first_deal_for_test(ADMIN, false);
        scenario.do_first_deal_for_test(ADMIN, false);

        scenario.end();
    }

    #[test]
    fun test_hit() {
        let mut scenario = test_scenario::begin(PLAYER);

        initialize_house_data_for_test(&mut scenario, ADMIN, INITIAL_HOUSE_BALANCE);
        initialize_game_for_test(&mut scenario, PLAYER, PLAYER_BET);
        scenario.do_first_deal_for_test(ADMIN, false);

        let mut _player_sum_before: u8 = 0;
        let mut _player_cards_before: vector<u8> = vector<u8>[];
        let mut _dealer_sum_before: u8 = 0;
        let mut _dealer_cards_before: vector<u8> = vector<u8>[];

        scenario.next_tx(PLAYER);
        {
            let game = scenario.take_shared<Game>();
            _player_sum_before = game.player_sum();
            _player_cards_before = game.player_cards();
            _dealer_sum_before = game.dealer_sum();
            _dealer_cards_before = game.dealer_cards();
            test_scenario::return_shared(game);
        };

        scenario.do_hit_for_test(PLAYER, ADMIN);
        scenario.hit_for_test(ADMIN);

        scenario.next_tx(ADMIN);
        {
            let game = scenario.take_shared<Game>();
            let owned_hit_requests_by_admin = scenario.ids_for_sender<HitRequest>();
            let player_cards_length_before = _player_cards_before.length();
            let player_cards_length_after = game.player_cards().length();
            let dealer_cards_length_before = _dealer_cards_before.length();
            let dealer_cards_length_after = game.dealer_cards().length();

            assert!(owned_hit_requests_by_admin.length() == 0, 1);
            assert!(game.player_sum() > _player_sum_before, 1);
            assert!(player_cards_length_after == player_cards_length_before + 1, 2);
            assert!(game.dealer_sum() == _dealer_sum_before, 3);
            assert!(dealer_cards_length_after == dealer_cards_length_before, 4);
            test_scenario::return_shared(game);
        };

        scenario.end();
    }

    #[test]
    fun test_stand() {
        let mut scenario = test_scenario::begin(PLAYER);

        scenario.initialize_house_data_for_test(ADMIN, INITIAL_HOUSE_BALANCE);
        scenario.initialize_game_for_test(PLAYER, PLAYER_BET);
        scenario.do_first_deal_for_test(ADMIN, false);

        let mut _player_sum_before: u8 = 0;
        let mut _player_cards_before: vector<u8> = vector<u8>[];
        let mut _dealer_sum_before: u8 = 0;
        let mut _dealer_cards_before: vector<u8> = vector<u8>[];

        scenario.next_tx(PLAYER);
        {
            let game = scenario.take_shared<Game>();
            _player_sum_before = game.player_sum();
            _player_cards_before = game.player_cards();
            _dealer_sum_before = game.dealer_sum();
            _dealer_cards_before = game.dealer_cards();
            test_scenario::return_shared(game);
        };

        scenario.do_stand_for_test(PLAYER, ADMIN);
        scenario.stand_for_test(ADMIN);

        scenario.next_tx(ADMIN);
        {
            let game = scenario.take_shared<Game>();
            let owned_stand_requests_by_admin = scenario.ids_for_sender<StandRequest>();
            let player_cards_length_before = _player_cards_before.length();
            let player_cards_length_after = game.player_cards().length();
            let dealer_cards_length_before = _dealer_cards_before.length();
            let dealer_cards_length_after = game.dealer_cards().length();

            assert!(owned_stand_requests_by_admin.length() == 0, 1);
            assert!(game.player_sum() == _player_sum_before, 1);
            assert!(player_cards_length_after == player_cards_length_before, 2);
            assert!(game.dealer_sum() > _dealer_sum_before, 3);
            assert!(dealer_cards_length_after > dealer_cards_length_before, 4);
            test_scenario::return_shared(game);
        };

        scenario.end();
    }

    #[test]
    fun test_do_hit() {
        let mut scenario = test_scenario::begin(PLAYER);

        scenario.initialize_house_data_for_test(PLAYER, INITIAL_HOUSE_BALANCE);
        scenario.initialize_game_for_test(PLAYER, PLAYER_BET);
        scenario.do_first_deal_for_test(PLAYER, false);
        scenario.do_hit_for_test(PLAYER, ADMIN);

        scenario.next_tx(ADMIN);
        {
            let hit_request = scenario.take_from_sender<HitRequest>();
            let game = scenario.take_shared<Game>();

            assert!(hit_request.hit_request_game_id() == object::id(&game), 1);
            assert!(hit_request.hit_request_current_player_sum() == game.player_sum(), 2);

            scenario.return_to_sender(hit_request);
            test_scenario::return_shared(game);
        };

        scenario.end();
    }

    #[test]
    #[expected_failure(abort_code = bj::EGameHasFinished)]
    fun test_do_hit_in_finished_game() {
        let mut scenario = test_scenario::begin(PLAYER);

        scenario.initialize_house_data_for_test(ADMIN, INITIAL_HOUSE_BALANCE);
        scenario.initialize_game_for_test(PLAYER, PLAYER_BET);
        scenario.do_first_deal_for_test(ADMIN, false);
        scenario.player_won_post_handling_for_test(ADMIN);
        scenario.do_hit_for_test(PLAYER, ADMIN);

        scenario.end();
    }

    #[test]
    #[expected_failure(abort_code = bj::EUnauthorizedPlayer)]
    fun test_do_hit_unauthorized() {
        let mut scenario = test_scenario::begin(PLAYER);
        let player2 = @0xBBBB;

        scenario.initialize_house_data_for_test(ADMIN, INITIAL_HOUSE_BALANCE);
        scenario.initialize_game_for_test(PLAYER, PLAYER_BET);
        scenario.do_first_deal_for_test(ADMIN, false);
        scenario.do_hit_for_test(player2, ADMIN);

        scenario.end();
    }

    #[test]
    #[expected_failure(abort_code = bj::EInvalidSumOfHitRequest)]
    fun test_do_hit_with_invalid_player_sum() {
        let mut scenario = test_scenario::begin(PLAYER);

        scenario.initialize_house_data_for_test(ADMIN, INITIAL_HOUSE_BALANCE);
        scenario.initialize_game_for_test(PLAYER, PLAYER_BET);
        scenario.do_first_deal_for_test(ADMIN, false);

        scenario.next_tx(PLAYER);
        {
            let mut game = scenario.take_shared<Game>();
            let current_player_sum = game.player_sum();
            let hit_request = game.do_hit(
                current_player_sum + 1,
                scenario.ctx(),
            );
            transfer::public_transfer(
                hit_request,
                ADMIN,
            );
            test_scenario::return_shared(game);
        };

        scenario.end();
    }

    #[test]
    fun test_to_stand() {
        let mut scenario = test_scenario::begin(PLAYER);

        scenario.initialize_house_data_for_test(PLAYER, INITIAL_HOUSE_BALANCE);
        scenario.initialize_game_for_test(PLAYER, PLAYER_BET);
        scenario.do_first_deal_for_test(PLAYER, false);
        scenario.do_stand_for_test(PLAYER, ADMIN);

        scenario.next_tx(ADMIN);
        {
            let stand_request = scenario.take_from_sender<StandRequest>();
            let game = scenario.take_shared<Game>();

            assert!(stand_request.stand_request_game_id() == object::id(&game), 1);
            assert!(stand_request.stand_request_current_player_sum() == game.player_sum(), 2);

            scenario.return_to_sender(stand_request);
            test_scenario::return_shared(game);
        };

        scenario.end();
    }

    #[test]
    #[expected_failure(abort_code = bj::EGameHasFinished)]
    fun test_do_stand_in_finished_game() {
        let mut scenario = test_scenario::begin(PLAYER);

        scenario.initialize_house_data_for_test(ADMIN, INITIAL_HOUSE_BALANCE);
        scenario.initialize_game_for_test(PLAYER, PLAYER_BET);
        scenario.do_first_deal_for_test(ADMIN, false);
        scenario.player_won_post_handling_for_test(ADMIN);
        scenario.do_stand_for_test(PLAYER, ADMIN);
        scenario.end();
    }

    #[test]
    #[expected_failure(abort_code = bj::EUnauthorizedPlayer)]
    fun test_do_stand_unauthorized() {
        let mut scenario = test_scenario::begin(PLAYER);
        let player2 = @0xBBBB;

        scenario.initialize_house_data_for_test(ADMIN, INITIAL_HOUSE_BALANCE);
        scenario.initialize_game_for_test(PLAYER, PLAYER_BET);
        scenario.do_first_deal_for_test(ADMIN, false);
        scenario.do_stand_for_test(player2, ADMIN);

        scenario.end();
    }

    #[test]
    #[expected_failure(abort_code = bj::EInvalidSumOfStandRequest)]
    fun test_do_stand_with_invalid_player_sum() {
        let mut scenario = test_scenario::begin(PLAYER);

        scenario.initialize_house_data_for_test(ADMIN, INITIAL_HOUSE_BALANCE);
        scenario.initialize_game_for_test(PLAYER, PLAYER_BET);
        scenario.do_first_deal_for_test(ADMIN, false);

        scenario.next_tx(PLAYER);
        {
            let mut game = scenario.take_shared<Game>();
            let current_player_sum = game.player_sum();
            let stand_request = game.do_stand(
                current_player_sum + 1,
                scenario.ctx(),
            );
            transfer::public_transfer(
                stand_request,
                ADMIN,
            );
            test_scenario::return_shared(game);
        };

        scenario.end();
    }

    #[test]
    fun test_player_won_post_handling() {
        let mut scenario = test_scenario::begin(PLAYER);
        scenario.initialize_house_data_for_test(ADMIN, INITIAL_HOUSE_BALANCE);
        scenario.initialize_game_for_test(PLAYER, PLAYER_BET);
        scenario.do_first_deal_for_test(ADMIN, false);
        scenario.player_won_post_handling_for_test(ADMIN);

        scenario.next_tx(PLAYER);
        {
            let game = scenario.take_shared<Game>();
            let house_data = scenario.take_shared<HouseData>();
            assert!(game.status() == 1, 1);
            assert!(house_data.balance() == INITIAL_HOUSE_BALANCE - HOUSE_BET, 2);
            test_scenario::return_shared(game);
            test_scenario::return_shared(house_data);
        };

        scenario.end();
    }

    #[test]
    fun test_house_won_post_handling() {
        let mut scenario = test_scenario::begin(PLAYER);
        scenario.initialize_house_data_for_test(ADMIN, INITIAL_HOUSE_BALANCE);
        scenario.initialize_game_for_test(PLAYER, PLAYER_BET);
        scenario.do_first_deal_for_test(ADMIN, false);
        scenario.house_won_post_handling_for_test(ADMIN);

        scenario.next_tx(PLAYER);
        {
            let game = scenario.take_shared<Game>();
            let house_data = scenario.take_shared<HouseData>();
            assert!(game.status() == 2, 1);
            assert!(house_data.balance() == INITIAL_HOUSE_BALANCE + PLAYER_BET, 2);
            test_scenario::return_shared(game);
            test_scenario::return_shared(house_data);
        };

        scenario.end();
    }

    #[test]
    fun test_tie_post_handling() {
        let mut scenario = test_scenario::begin(PLAYER);
        scenario.initialize_house_data_for_test(ADMIN, INITIAL_HOUSE_BALANCE);
        scenario.initialize_game_for_test(PLAYER, PLAYER_BET);
        scenario.do_first_deal_for_test(ADMIN, false);
        scenario.tie_post_handling_for_test(ADMIN);

        scenario.next_tx(PLAYER);
        {
            let game = scenario.take_shared<Game>();
            let house_data = scenario.take_shared<HouseData>();
            let game_stake = HOUSE_BET + PLAYER_BET;
            assert!(game.status() == 3, 1);
            assert!(house_data.balance() == INITIAL_HOUSE_BALANCE - HOUSE_BET + game_stake/2, 2);
            test_scenario::return_shared(game);
            test_scenario::return_shared(house_data);
        };

        scenario.end();
    }

    // Test a whole flow where player stands at 21 and dealer < 21. Player wins.
    #[test]
    fun test_player_stand_at_21_and_win() {
        let mut scenario = test_scenario::begin(PLAYER);

        scenario.initialize_house_data_for_test(ADMIN, INITIAL_HOUSE_BALANCE);
        scenario.initialize_game_for_test(PLAYER, PLAYER_BET);
        scenario.do_first_deal_for_test(ADMIN, false);
        //give player 21
        scenario.pop_card_for_test(PLAYER, false/*is_dealer*/, false);
        scenario.pop_card_for_test(PLAYER, false/*is_dealer*/, false);
        scenario.draw_card_for_test(PLAYER, false/*is_dealer*/, 5, false);
        scenario.draw_card_for_test(PLAYER, false/*is_dealer*/, 6, false);
        scenario.draw_card_for_test(PLAYER, false/*is_dealer*/, 7, false);

        scenario.do_stand_for_test(PLAYER, ADMIN);
        scenario.stand_for_test(ADMIN);

        //check player stand
        scenario.next_tx(ADMIN);
        {
            let game = scenario.take_shared<Game>();
            let owned_stand_requests_by_admin = scenario.ids_for_sender<StandRequest>();
            assert!(owned_stand_requests_by_admin.length() == 0, 1);
            test_scenario::return_shared(game);
        };
        //check player wins
        scenario.next_tx(ADMIN);
        {
            let house_data = scenario.take_shared<HouseData>();
            let game = scenario.take_shared<Game>();
            assert!(game.status() == 1, 2);
            assert!(house_data.balance() == INITIAL_HOUSE_BALANCE - HOUSE_BET, 3);

            test_scenario::return_shared(house_data);
            test_scenario::return_shared(game);
        };
        scenario.end();
    }

    // Test a whole flow where player has 21 but dealer has bj. Dealer wins.
    #[test]
    fun test_player_stand_at_21_dealer_bj_and_win() {
        let mut scenario = test_scenario::begin(PLAYER);

        scenario.initialize_house_data_for_test(ADMIN, INITIAL_HOUSE_BALANCE);
        scenario.initialize_game_for_test(PLAYER, PLAYER_BET);
        scenario.do_first_deal_for_test(ADMIN, false);
        //give player 21
        scenario.pop_card_for_test(PLAYER, false/*is_dealer*/, false);
        scenario.pop_card_for_test(PLAYER, false/*is_dealer*/, false);
        scenario.draw_card_for_test(PLAYER, false/*is_dealer*/, 5, false);
        scenario.draw_card_for_test(PLAYER, false/*is_dealer*/, 6, false);
        scenario.draw_card_for_test(PLAYER, false/*is_dealer*/, 7, false);
        //give dealer bj
        scenario.pop_card_for_test(ADMIN, true/*is_dealer*/, false);
        scenario.draw_card_for_test(ADMIN, true/*is_dealer*/, 0, false);
        scenario.draw_card_for_test(ADMIN, true/*is_dealer*/, 9, false);

        scenario.do_stand_for_test(PLAYER, ADMIN);
        scenario.stand_for_test(ADMIN);

        //check dealer wins
        scenario.next_tx(ADMIN);
        {
            let house_data = scenario.take_shared<HouseData>();
            let game = scenario.take_shared<Game>();
            assert!(game.status() == 2, 1);
            assert!(house_data.balance() == INITIAL_HOUSE_BALANCE + HOUSE_BET, 2);

            test_scenario::return_shared(house_data);
            test_scenario::return_shared(game);
        };
        scenario.end();
    }

    // Test a whole flow where both player and dealer have 21. It's a tie.
    #[test]
    fun test_player_dealer_both_have_21_tie() {
        let mut scenario = test_scenario::begin(PLAYER);

        scenario.initialize_house_data_for_test(ADMIN, INITIAL_HOUSE_BALANCE);
        scenario.initialize_game_for_test(PLAYER, PLAYER_BET);
        scenario.do_first_deal_for_test(ADMIN, false);
        //give player 21
        scenario.pop_card_for_test(PLAYER, false/*is_dealer*/, false);
        scenario.pop_card_for_test(PLAYER, false/*is_dealer*/, false);
        scenario.draw_card_for_test(PLAYER, false/*is_dealer*/, 5, false);
        scenario.draw_card_for_test(PLAYER, false/*is_dealer*/, 6, false);
        scenario.draw_card_for_test(PLAYER, false/*is_dealer*/, 7, false);
        //give dealer 21
        scenario.pop_card_for_test(ADMIN, true/*is_dealer*/, false);
        scenario.draw_card_for_test(ADMIN, true/*is_dealer*/, 5, false);
        scenario.draw_card_for_test(ADMIN, true/*is_dealer*/, 6, false);
        scenario.draw_card_for_test(ADMIN, true/*is_dealer*/, 7, false);

        scenario.do_stand_for_test(PLAYER, ADMIN);
        scenario.stand_for_test(ADMIN);

        //check for tie
        scenario.next_tx(ADMIN);
        {
            let house_data = scenario.take_shared<HouseData>();
            let game = scenario.take_shared<Game>();
            assert!(game.status() == 3, 1);
            assert!(house_data.balance() == INITIAL_HOUSE_BALANCE, 2);

            test_scenario::return_shared(house_data);
            test_scenario::return_shared(game);
        };
        scenario.end();
    }

    // Test a whole flow where the user exceeds total sum of 21.
    #[test]
    fun test_player_exceeds_21() {
        let mut scenario = test_scenario::begin(PLAYER);

        scenario.initialize_house_data_for_test(ADMIN, INITIAL_HOUSE_BALANCE);
        scenario.initialize_game_for_test(PLAYER, PLAYER_BET);
        scenario.do_first_deal_for_test(ADMIN, false);
        scenario.draw_card_for_test(PLAYER, false/*is_dealer*/, 6, false);
        scenario.do_hit_for_test(PLAYER, ADMIN);
        scenario.hit_for_test(ADMIN);

        scenario.next_tx(ADMIN);
        {
            let house_data = scenario.take_shared<HouseData>();
            let game = scenario.take_shared<Game>();
            assert!(house_data.balance() == INITIAL_HOUSE_BALANCE + PLAYER_BET, 1);
            assert!(game.status() == 2, 2);
            test_scenario::return_shared(house_data);
            test_scenario::return_shared(game);
        };

        scenario.end();
    }

    //  --- Helper functions ---

    use fun initialize_house_data_for_test as Scenario.initialize_house_data_for_test;

    fun initialize_house_data_for_test(
        scenario: &mut Scenario,
        admin: address,
        balance: u64,
    ) {
        scenario.next_tx(admin);
        {
            bj::get_and_transfer_house_admin_cap_for_testing(scenario.ctx());
        };

        scenario.next_tx(admin);
        {
            let house_cap = scenario.take_from_sender<HouseAdminCap>();
            let coin = coin::mint_for_testing<SUI>(balance, scenario.ctx());
            house_cap.initialize_house_data(
                coin,
                vector<u8>[], // Empty public key for testing
                scenario.ctx(),
            );
        }
    }

    use fun initialize_game_for_test as Scenario.initialize_game_for_test;

    fun initialize_game_for_test(
        scenario: &mut Scenario,
        player: address,
        balance: u64,
    ) {
        scenario.next_tx(player);
        {
            let coin = coin::mint_for_testing<SUI>(balance, scenario.ctx());
            let mut house_data = scenario.take_shared<HouseData>();
            bj::place_bet_and_create_game(
                coin,
                &mut house_data,
                scenario.ctx(),
            );
            test_scenario::return_shared(house_data);
        };
    }

    use fun do_first_deal_for_test as Scenario.do_first_deal_for_test;

    fun do_first_deal_for_test(
        scenario: &mut Scenario,
        admin: address,
        log_points: bool,
    ) {
        // Create Random object using system address
        scenario.next_tx(@0x0);
        {
            sui::random::create_for_testing(scenario.ctx());
        };

        scenario.next_tx(admin);
        {
            let mut game = scenario.take_shared<Game>();
            let random = scenario.take_shared<sui::random::Random>();
            game.first_deal(
                &random,
                scenario.ctx(),
            );
            test_scenario::return_shared(random);
            test_scenario::return_shared(game);
        };

        if (log_points) {
            scenario.next_tx(admin);
            {
                let game = scenario.take_shared<Game>();
                debug::print(&b"player points after first deal:".to_string());
                debug::print(&game.player_sum());
                debug::print(&b"dealer points after first deal:".to_string());
                debug::print(&game.dealer_sum());
                test_scenario::return_shared(game);
            };
        }
    }

    use fun do_hit_for_test as Scenario.do_hit_for_test;

    fun do_hit_for_test(
        scenario: &mut Scenario,
        player: address,
        admin: address,
    ) {
        scenario.next_tx(player);
        {
            let mut game = scenario.take_shared<Game>();
            let current_player_sum = game.player_sum();
            let hit_request = game.do_hit(
                current_player_sum,
                scenario.ctx(),
            );
            transfer::public_transfer(
                hit_request,
                admin,
            );
            test_scenario::return_shared(game);
        };
    }

    use fun do_stand_for_test as Scenario.do_stand_for_test;

    fun do_stand_for_test(
        scenario: &mut Scenario,
        player: address,
        admin: address,
    ) {
        let effects = scenario.next_tx(player);
        {
            let mut game = scenario.take_shared<Game>();
            let current_player_sum = game.player_sum();
            let stand_request = game.do_stand(
                current_player_sum,
                scenario.ctx(),
            );
            transfer::public_transfer(
                stand_request,
                admin,
            );
            test_scenario::return_shared(game);
        };
        effects;
    }

    use fun hit_for_test as Scenario.hit_for_test;

    fun hit_for_test(
        scenario: &mut Scenario,
        admin: address,
    ) {
        // Create Random object using system address
        scenario.next_tx(@0x0);
        {
            sui::random::create_for_testing(scenario.ctx());
        };

        scenario.next_tx(admin);
        {
            let mut game = scenario.take_shared<Game>();
            let mut house_data = scenario.take_shared<HouseData>();
            let hit_request = scenario.take_from_sender<HitRequest>();
            let random = scenario.take_shared<sui::random::Random>();
            game.hit(
                &mut house_data,
                hit_request,
                &random,
                scenario.ctx(),
            );
            test_scenario::return_shared(random);
            test_scenario::return_shared(game);
            test_scenario::return_shared(house_data);
        };
    }

    use fun stand_for_test as Scenario.stand_for_test;

    fun stand_for_test(
        scenario: &mut Scenario,
        admin: address,
    ) {
        // Create Random object using system address
        scenario.next_tx(@0x0);
        {
            sui::random::create_for_testing(scenario.ctx());
        };

        scenario.next_tx(admin);
        {
            let mut game = scenario.take_shared<Game>();
            let mut house_data = scenario.take_shared<HouseData>();
            let stand_request = scenario.take_from_sender<StandRequest>();
            let random = scenario.take_shared<sui::random::Random>();
            game.stand(
                &mut house_data,
                stand_request,
                &random,
                scenario.ctx(),
            );
            test_scenario::return_shared(random);
            test_scenario::return_shared(game);
            test_scenario::return_shared(house_data);
        };
    }

    use fun draw_card_for_test as Scenario.draw_card_for_test;

    //card idx is based on index table in get_card_sum function
    //e.g. card with idx 6 has a value of 7
    //card is drawn for either the dealer or the player
    fun draw_card_for_test(
        scenario: &mut Scenario,
        player: address, //player or dealer
        is_dealer: bool,
        card_idx: u8,
        log_points: bool,
    ) {
        scenario.next_tx(player);
        {
            let mut game = scenario.take_shared<Game>();
            game.draw_card_for_testing(
                is_dealer,
                card_idx,
            );
            test_scenario::return_shared(game);
        };

        if (log_points) {
            scenario.next_tx(player);
            {
                let game = scenario.take_shared<Game>();
                if (!is_dealer) {
                    debug::print(&b"player points after card draw:".to_string());
                    debug::print(&game.player_sum());
                }
                else {
                    debug::print(&b"dealer points after card draw:".to_string());
                    debug::print(&game.dealer_sum());
                };
                test_scenario::return_shared(game);
            };
        }
    }

    use fun pop_card_for_test as Scenario.pop_card_for_test;

    fun pop_card_for_test(
        scenario: &mut Scenario,
        player: address, //player or dealer
        is_dealer: bool,
        log_points: bool,
    ) {
        scenario.next_tx(player);
        {
            let mut game = scenario.take_shared<Game>();
            game.pop_card_for_testing(is_dealer);
            test_scenario::return_shared(game);
        };

        if (log_points) {
            scenario.next_tx(player);
            {
                let game = scenario.take_shared<Game>();
                if (!is_dealer) {
                    debug::print(&b"player points after card pop:".to_string());
                    debug::print(&game.player_sum());
                } else {
                    debug::print(&b"dealer points after card pop:".to_string());
                    debug::print(&game.dealer_sum());
                };
                test_scenario::return_shared(game);
            };
        }
    }


    use fun player_won_post_handling_for_test as Scenario.player_won_post_handling_for_test;

    fun player_won_post_handling_for_test(
        scenario: &mut Scenario,
        admin: address,
    ) {
        scenario.next_tx(admin);
        {
            let mut game = scenario.take_shared<Game>();
            game.player_won_post_handling_for_test(scenario.ctx());
            test_scenario::return_shared(game);
        };
    }

    use fun house_won_post_handling_for_test as Scenario.house_won_post_handling_for_test;

    fun house_won_post_handling_for_test(
        scenario: &mut Scenario,
        admin: address,
    ) {
        scenario.next_tx(admin);
        {
            let mut game = scenario.take_shared<Game>();
            let mut house_data = scenario.take_shared<HouseData>();
            game.house_won_post_handling_for_test(&mut house_data, scenario.ctx());
            test_scenario::return_shared(game);
            test_scenario::return_shared(house_data);
        };
    }

    use fun tie_post_handling_for_test as Scenario.tie_post_handling_for_test;

    fun tie_post_handling_for_test(
        scenario: &mut Scenario,
        admin: address,
    ) {
        scenario.next_tx(admin);
        {
            let mut game = scenario.take_shared<Game>();
            let mut house_data = scenario.take_shared<HouseData>();
            game.tie_post_handling_for_test(&mut house_data, scenario.ctx());
            test_scenario::return_shared(game);
            test_scenario::return_shared(house_data);
        };
    }
}
