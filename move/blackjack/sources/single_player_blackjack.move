module blackjack::single_player_blackjack {

    use std::vector;

    use sui::bls12381::bls12381_min_pk_verify;
    use sui::tx_context::{Self, TxContext};
    use sui::balance::{Self, Balance};
    use sui::object::{Self, ID, UID};
    use sui::coin::{Self, Coin};
    use sui::bcs::{Self};
    use sui::hash::{blake2b256};
    use sui::event::{Self};
    use sui::sui::SUI;
    use sui::transfer;


    // Consts
    const EPOCHS_CANCEL_AFTER: u64 = 7;
    const STAKE: u64 = 200000000;

    // Game statuses
    const IN_PROGRESS: u8 = 0;
    const PLAYER_WON_STATUS: u8 = 1;
    const HOUSE_WON_STATUS: u8 = 2;
    const TIE_STATUS: u8 = 3;


    // Errors
    const EInvalidBlsSig: u64 = 10;
    const ECallerNotHouse: u64 = 12;
    const ECanNotCancel: u64 = 13;
    const EInvalidGuess: u64 = 14;
    const EInsufficientBalance: u64 = 15;
    const EGameHasAlreadyBeenCanceled: u64 = 16;
    const EInsufficientHouseBalance: u64 = 17;
    const ECoinBalanceNotEnough: u64 = 18;
    const EGameHasFinished: u64 = 19;
    const EUnauthorizedPlayer: u64 = 20;
    const EDealAlreadyHappened: u64 = 21;


    // Structs

    struct GameCreatedEvent has copy, drop {
        game_id: ID,
    }

    struct GameOutcomeEvent has copy, drop {
        game_id: ID,
        game_status: u8,
        winner_address: address,
        message: vector<u8>,
    }

    struct HitRequested has copy, drop {
        game_id: ID,
        current_player_hand_sum: u8
    }

    struct HitDone has copy, drop {
        game_id: ID,
        current_player_hand_sum: u8,
        player_cards: vector<u8>
    }

    struct StandRequested has copy, drop {
        game_id: ID,
        final_player_hand_sum: u8
    }

    struct HouseAdminCap has key {
        id: UID
    }

    // Configuration and Treasury object for the house.
    struct HouseData has key {
        id: UID,
        balance: Balance<SUI>,
        house: address,
        public_key: vector<u8>
    }

    struct Game has key {
        id: UID,
        user_randomness: vector<u8>,
        latest_hash: vector<u8>,
        total_stake: Balance<SUI>,
        player: address,
        player_cards: vector<u8>,
        player_sum: u8,
        dealer_cards: vector<u8>,
        dealer_sum: u8,
        status: u8
    }


    fun init(ctx: &mut TxContext) {
        let house_cap = HouseAdminCap {
            id: object::new(ctx)
        };

        transfer::transfer(house_cap, tx_context::sender(ctx))
    }


    /// Initializer function that should only be called once and by the creator of the contract.
    /// Initializes the house data object. This object is involed in all games created by the same instance of this package.
    /// @param house_cap: The HouseCap object
    /// @param coin: The coin object that will be used to initialize the house balance. Acts as a treasury
    /// @param public_key: The public key of the house
    public entry fun initialize_house_data(house_cap: HouseAdminCap,
                                           coin: Coin<SUI>,
                                           public_key: vector<u8>,
                                           ctx: &mut TxContext) {
        assert!(coin::value(&coin) > 0, EInsufficientBalance);

        let house_data = HouseData {
            id: object::new(ctx),
            balance: coin::into_balance(coin),
            house: tx_context::sender(ctx),
            public_key
        };

        let HouseAdminCap { id } = house_cap;
        object::delete(id);

        transfer::share_object(house_data);
    }


    /// Function used to create a new game. The player must provide a random vector of bytes.
    /// Stake is taken from the player's coin and added to the game's stake. The house's stake is also added to the game's stake.
    /// @param user_randomness: A vector of randomly produced bytes that will be used to calculate the result of the VRF
    /// @param user_bet: The coin object that will be used to take the player's stake
    /// @param house_data: The HouseData object
    public entry fun place_bet_and_create_game(user_randomness: vector<u8>,
                                               user_bet: Coin<SUI>,
                                               house_data: &mut HouseData,
                                               ctx: &mut TxContext) {
        // Ensure that the house has enough balance to play for this game
        assert!(balance(house_data) >= STAKE, EInsufficientHouseBalance);

        // get the user coin and convert it into a balance
        assert!(coin::value(&user_bet) >= STAKE, EInsufficientBalance);
        let stake = coin::into_balance(user_bet);

        // get the house balance
        let house_stake = balance::split(&mut house_data.balance, STAKE);
        balance::join(&mut stake, house_stake);

        let new_game = Game {
            id: object::new(ctx),
            user_randomness,
            latest_hash: vector[],
            total_stake: stake,
            player: tx_context::sender(ctx),
            player_cards: vector[],
            player_sum: 0,
            dealer_cards: vector[],
            dealer_sum: 0,
            status: IN_PROGRESS
        };

        event::emit(GameCreatedEvent {
            game_id: object::id(&new_game)
        });

        transfer::share_object(new_game);
    }

    /// Function that is invoked by the house (Dealer) to deal cards.
    /// If an incorrect bls sig is passed the function will abort.
    ///
    /// @param game: The Game object
    /// @param bls_sig: The bls signature of the game id and the player's randomn bytes and the counter appended together
    /// @param house_data: The HouseData object
    public fun first_deal(game: &mut Game,
                          bls_sig: vector<u8>,
                          house_data: &mut HouseData,
                          ctx: &mut TxContext
    ) {
        // Step 1: Check the bls signature, if its invalid, house loses
        let is_sig_valid = bls12381_min_pk_verify(&bls_sig, &house_data.public_key, &player_randomness(game));
        assert!(is_sig_valid, EInvalidBlsSig);

        //Check that deal hasn't already happened.
        assert!(game.player_sum == 0, EDealAlreadyHappened);

        //Hash the signature before using it
        game.latest_hash = blake2b256(&bls_sig);

        //Deal cards to player
        let card1 = get_next_random_card( game);
        vector::push_back(&mut game.player_cards, card1);

        let card2 = get_next_random_card( game);
        vector::push_back(&mut game.player_cards, card2);

        game.player_sum = get_card_sum(&game.player_cards);

        //Deal cards to dealer
        let card3 = get_next_random_card( game);
        vector::push_back(&mut game.dealer_cards, card3);
        game.dealer_sum = get_card_sum(&game.dealer_cards);


        if (game.player_sum == 21) {
            player_won_post_handling(game, b"BlackJack!!!", ctx);
        };
    }

    /// Function to be called by user who wants to ask for a hit.
    /// @param game: The Game object
    public fun do_hit(game: &mut Game, current_hand_sum: u8, ctx: &mut TxContext) {
        assert!(game.status == IN_PROGRESS, EGameHasFinished);
        assert!(tx_context::sender(ctx) == game.player, EUnauthorizedPlayer);

        event::emit(HitRequested {
            game_id: object::uid_to_inner(&game.id),
            current_player_hand_sum: current_hand_sum
        });
    }

    /// Function to be called by user who wants to stand.
    /// @param game: The Game object
    public fun do_stand(game: &mut Game, player_hand_sum: u8, ctx: &mut TxContext) {
        assert!(game.status == IN_PROGRESS, EGameHasFinished);
        assert!(tx_context::sender(ctx) == game.player, EUnauthorizedPlayer);

        event::emit(StandRequested {
            game_id: object::uid_to_inner(&game.id),
            final_player_hand_sum: player_hand_sum
        });
    }


    /// Function that is invoked when the player selects hit, so the dealer deals another card.
    /// We use the player's randomness to generate the next card.
    /// Dealer (house) signs the game id, the randomness and the game counter appended together.
    /// If an incorrect bls sig is passed the function will abort.
    ///
    /// Function checks if the latest draw has caused the player to bust and deals with proper handling after that.
    ///
    public fun hit(game: &mut Game,
                   bls_sig: vector<u8>,
                   house_data: &mut HouseData,
                   ctx: &mut TxContext) {
        // Step 1: Check the bls signature, if its invalid, house loses
        let is_sig_valid = bls12381_min_pk_verify(&bls_sig, &house_data.public_key, &game.user_randomness);
        assert!(is_sig_valid, EInvalidBlsSig);

        assert!(game.status == IN_PROGRESS, EGameHasFinished);

        //Hash the signature before using it
        game.latest_hash = blake2b256(&bls_sig);

        let card = get_next_random_card(game);
        vector::push_back(&mut game.player_cards, card);
        game.player_sum = get_card_sum(&game.player_cards);

        if (game.player_sum > 21) {
            house_won_post_handling(game, house_data, ctx);
        };

        event::emit(HitDone {
            game_id: object::uid_to_inner(&game.id),
            current_player_hand_sum: game.player_sum,
            player_cards: game.player_cards
        });
    }


    /// Function that is invoked when the player has finished asking for cards.
    /// Now its the dealer's turn to start drawing cards.
    /// We use the player's randomness to generate the next card.
    /// Dealer (house) signs the game id, the randomness and the game counter appended together.
    /// If an incorrect bls sig is passed the function will abort.
    ///
    /// Dealer should keep drawing cards until the sum of the cards is greater than 17.
    ///
    public fun stand(game: &mut Game,
                     bls_sig: vector<u8>,
                     house_data: &mut HouseData,
                     ctx: &mut TxContext) {
        // Step 1: Check the bls signature, if its invalid, house loses
        let is_sig_valid = bls12381_min_pk_verify(&bls_sig, &house_data.public_key, &game.user_randomness);
        assert!(is_sig_valid, EInvalidBlsSig);

        assert!(game.status == IN_PROGRESS, EGameHasFinished);

        //Hash the signature before using it
        game.latest_hash = blake2b256(&bls_sig);

        let card = get_next_random_card( game);
        vector::push_back(&mut game.dealer_cards, card);
        game.dealer_sum = get_card_sum(&game.dealer_cards);

        while (game.dealer_sum < 17) {
            let card = get_next_random_card( game);
            vector::push_back(&mut game.dealer_cards, card);
            game.dealer_sum = get_card_sum(&game.dealer_cards);
        };

        if (game.dealer_sum > 21) {
            player_won_post_handling(game, b"Dealer Busted!", ctx);
        }
        else {
            if (game.dealer_sum > game.player_sum) {
                // House won
                house_won_post_handling(game, house_data, ctx);
            }
            else if (game.player_sum > game.dealer_sum) {
                // Player won
                player_won_post_handling(game, b"Player won!", ctx);
            }
            else {
                // Tie
                tie_post_handling(game, house_data, ctx);
            }
        }
    }


    /// HELPER FUNCTIONS

    /// Internal function that is used to do actions after the house has won.
    fun house_won_post_handling(game: &mut Game, house_data: &mut HouseData, ctx: &mut TxContext) {
        game.status = HOUSE_WON_STATUS;

        let outcome = GameOutcomeEvent {
            game_id: object::uid_to_inner(&game.id),
            game_status: game.status,
            winner_address: house_data.house,
            message: b"Player busted",
        };
        event::emit(outcome);

        //House won, so house gets the total stake
        let total_stake = balance::value(&game.total_stake);
        let coin = coin::take(&mut game.total_stake, total_stake, ctx);
        balance::join(&mut house_data.balance, coin::into_balance(coin));
    }

    /// Internal function that is used to do actions after the player has won.
    fun player_won_post_handling(game: &mut Game, aMessage: vector<u8>, ctx: &mut TxContext) {
        game.status = PLAYER_WON_STATUS;

        let outcome = GameOutcomeEvent {
            game_id: object::uid_to_inner(&game.id),
            game_status: game.status,
            winner_address: game.player,
            message: aMessage,
        };
        event::emit(outcome);

        //House won, so player gets the total stake
        let player_rewards = balance::value(&game.total_stake);
        let coin = coin::take(&mut game.total_stake, player_rewards, ctx);
        transfer::public_transfer(coin, game.player);
    }

    /// Internal function that is used to do actions after a tie.
    fun tie_post_handling(game: &mut Game, house_data: &mut HouseData, ctx: &mut TxContext) {
        game.status = TIE_STATUS;

        let outcome = GameOutcomeEvent {
            game_id: object::uid_to_inner(&game.id),
            game_status: game.status,
            winner_address: @0x0,
            message: b"Tie",
        };
        event::emit(outcome);

        //In case of a tie, every party gets back their stake, that is the half of the total stake
        let total_stake_value = balance::value(&game.total_stake);
        let half_stake = total_stake_value / 2;

        //player get back their stake
        let player_coin = coin::take(&mut game.total_stake, half_stake, ctx);
        transfer::public_transfer(player_coin, game.player);

        //house gets back their stake
        let house_coin = coin::take(&mut game.total_stake, half_stake, ctx);
        balance::join(&mut house_data.balance, coin::into_balance(house_coin));
    }


    /// Returns next Card from the hashed byte array after re-hashing it
    ///
    /// @param hashed_byte_array: The hashed byte array
    /// @return: The next random card
    /// --------------------------------
    public fun get_next_random_card(game: &mut Game): u8 {

        // re-hash for taking next random number
        game.latest_hash = blake2b256(&game.latest_hash);

        let bcs = bcs::new(game.latest_hash);
        let value = bcs::peel_u128(&mut bcs);

        let randomCard = ((value % 52) as u8);
        randomCard
    }

    /// Function get_card_sum
    ///
    /// Calculates the total value of a player's cards
    /// @param cards: A vector of card indices in the space [0-51] eg [5,48,12,7]
    ///
    /// We consider the following mapping between Move Contract and FrontEnd:
    ///
    /// index= 0,  suit: "Clubs", name-on-card: "A",  value: 1
    /// index= 1,  suit: "Clubs", name-on-card: "2",  value: 2
    /// index= 2,  suit: "Clubs", name-on-card: "3",  value: 3
    /// index= 3,  suit: "Clubs", name-on-card: "4",  value: 4
    /// index= 4,  suit: "Clubs", name-on-card: "5",  value: 5
    /// index= 5,  suit: "Clubs", name-on-card: "6",  value: 6
    /// index= 6,  suit: "Clubs", name-on-card: "7",  value: 7
    /// index= 7,  suit: "Clubs", name-on-card: "8",  value: 8
    /// index= 8,  suit: "Clubs", name-on-card: "9",  value: 9
    /// index= 9,  suit: "Clubs", name-on-card: "10", value: 10
    /// index= 10, suit: "Clubs", name-on-card: "J",  value: 10
    /// index= 11, suit: "Clubs", name-on-card: "Q",  value: 10
    /// index= 12, suit: "Clubs", name-on-card: "K",  value: 10
    ///
    /// index= 13, suit: "Diamonds", name-on-card: "A",  value: 1
    /// index= 14, suit: "Diamonds", name-on-card: "2",  value: 2
    /// index= 15, suit: "Diamonds", name-on-card: "3",  value: 3
    /// index= 16, suit: "Diamonds", name-on-card: "4",  value: 4
    /// index= 17, suit: "Diamonds", name-on-card: "5",  value: 5
    /// index= 18, suit: "Diamonds", name-on-card: "6",  value: 6
    /// index= 19, suit: "Diamonds", name-on-card: "7",  value: 7
    /// index= 20, suit: "Diamonds", name-on-card: "8",  value: 8
    /// index= 21, suit: "Diamonds", name-on-card: "9",  value: 9
    /// index= 22, suit: "Diamonds", name-on-card: "10", value: 10
    /// index= 23, suit: "Diamonds", name-on-card: "J",  value: 10
    /// index= 24, suit: "Diamonds", name-on-card: "Q",  value: 10
    /// index= 25, suit: "Diamonds", name-on-card: "K",  value: 10
    ///
    /// index= 26, suit: "Hearts", name-on-card:"A",  value: 1
    /// index= 27, suit: "Hearts", name-on-card:"2",  value: 2
    /// index= 28, suit: "Hearts", name-on-card:"3",  value: 3
    /// index= 29, suit: "Hearts", name-on-card:"4",  value: 4
    /// index= 30, suit: "Hearts", name-on-card:"5",  value: 5
    /// index= 31, suit: "Hearts", name-on-card:"6",  value: 6
    /// index= 32, suit: "Hearts", name-on-card:"7",  value: 7
    /// index= 33, suit: "Hearts", name-on-card:"8",  value: 8
    /// index= 34, suit: "Hearts", name-on-card:"9",  value: 9
    /// index= 35, suit: "Hearts", name-on-card:"10", value: 10
    /// index= 36, suit: "Hearts", name-on-card:"J",  value: 10
    /// index= 37, suit: "Hearts", name-on-card:"Q",  value: 10
    /// index= 38, suit: "Hearts", name-on-card:"K",  value: 10
    ///
    /// index= 39, suit: "Spades", name-on-card: "A",  value: 1
    /// index= 40, suit: "Spades", name-on-card: "2",  value: 2
    /// index= 41, suit: "Spades", name-on-card: "3",  value: 3
    /// index= 42, suit: "Spades", name-on-card: "4",  value: 4
    /// index= 43, suit: "Spades", name-on-card: "5",  value: 5
    /// index= 44, suit: "Spades", name-on-card: "6",  value: 6
    /// index= 45, suit: "Spades", name-on-card: "7",  value: 7
    /// index= 46, suit: "Spades", name-on-card: "8",  value: 8
    /// index= 47, suit: "Spades", name-on-card: "9",  value: 9
    /// index= 48, suit: "Spades", name-on-card: "10", value: 10
    /// index= 49, suit: "Spades", name-on-card: "J",  value: 10
    /// index= 50, suit: "Spades", name-on-card: "Q",  value: 10
    /// index= 51, suit: "Spades", name-on-card: "K",  value: 10
    ///

    fun get_card_sum(cards: &vector<u8>): u8 {
        let sum: u8 = 0;
        let i: u8 = 0;
        let n: u8 = (vector::length(cards) as u8);
        let has_ace = false;

        while (i < n) {
            let cardIndex = *vector::borrow(cards, (i as u64));

            let value = (cardIndex % 13) + 1 ;  // this constraints index to the space [1-13]
            // 1 = Ace
            // 2 = 2
            // 3 = 3
            //...
            // 10 = 10
            // 11 = J (value 10)
            // 12 = Q (value 10)
            // 13 = K (value 10)

            if (value == 1) {
                has_ace = true;
            };

            if (value > 10) {
                value = 10;
            };

            sum = sum + value;

            i = i + 1;
        };

        //We need to take care of the Aces case where value = 1 or 11 depending on the sum
        if (has_ace && sum + 10 <= 21) {
            sum = sum + 10;
        };

        sum
    }


    // --------------- Accessors ---------------

    /// Returns the player's randomn bytes input
    /// @param game: A Game object
    public fun player_randomness(game: &Game): vector<u8> {
        game.user_randomness
    }

    /// Returns the latest stored hash
    /// @param game: A Game object
    public fun get_latest_hash(game: &Game): vector<u8> {
        game.latest_hash
    }


    /// Returns the balance of the house
    /// @param house_data: The HouseData object
    public fun balance(house_data: &HouseData): u64 {
        balance::value(&house_data.balance)
    }

    /// Returns the address of the house
    /// @param house_data: The HouseData object
    public fun house(house_data: &HouseData): address {
        house_data.house
    }

    /// Returns the public key of the house
    /// @param house_data: The HouseData object
    public fun public_key(house_data: &HouseData): vector<u8> {
        house_data.public_key
    }


    //For Testing

    #[test_only]
    public fun get_house_admin_cap_for_testing(ctx: &mut TxContext): HouseAdminCap {
        let house_cap = HouseAdminCap {
            id: object::new(ctx)
        };

        house_cap
    }

    #[test_only]
    public fun get_house_data_for_testing(ctx: &mut TxContext, initBal: Balance<SUI>): HouseData {
        let demoKey = vector[];
        vector::push_back(&mut demoKey, 10);
        vector::push_back(&mut demoKey, 11);
        vector::push_back(&mut demoKey, 12);
        vector::push_back(&mut demoKey, 13);
        vector::push_back(&mut demoKey, 14);
        vector::push_back(&mut demoKey, 15);

        let house_data = HouseData {
            id: object::new(ctx),
            balance: initBal,
            house: tx_context::sender(ctx),
            public_key: demoKey
        };
        house_data
    }

    #[test_only]
    public fun destroy_for_testing(houseData: HouseData) {
        let HouseData
        {
            id,
            balance : b,
            house : _,
            public_key : _,
        } = houseData;

        object::delete(id);
        balance::destroy_for_testing(b);
    }
}