module blackjack::single_player_blackjack {

    use std::vector;

    use sui::bls12381::bls12381_min_pk_verify;
    use sui::tx_context::{Self, TxContext};
    use sui::balance::{Self, Balance};
    use sui::object::{Self, ID, UID};
    use sui::coin::{Self, Coin};
    use sui::hash::{blake2b256};
    use sui::event::{Self};
    use sui::sui::SUI;
    use sui::transfer;


    // Consts
    const EPOCHS_CANCEL_AFTER: u64 = 7;
    const STAKE: u64 = 5000;

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

    struct Card has key, store {
        id: UID,
        suit: vector<u8>,
        name: vector<u8>,
        value: u8
    }

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
        current_player_hand_sum: u8,
        game_counter: u8
    }

    struct HitDone has copy, drop {
        game_id: ID,
        current_player_hand_sum: u8,
        game_counter: u8,
        player_cards: vector<u8>
    }

    struct StandRequested has copy, drop {
        game_id: ID,
        final_player_hand_sum: u8,
        game_counter: u8
    }

    struct HouseAdminCap has key {
        id: UID
    }

    // Configuration and Treasury object for the house.
    struct HouseData has key {
        id: UID,
        balance: Balance<SUI>,
        house: address,
        public_key: vector<u8>,
        max_stake: u64,
        min_stake: u64,
        fees: Balance<SUI>
    }

    struct Game has key {
        id: UID,
        user_randomness: vector<u8>,
        counter: u8,
        hashingCounter: u8,
        //counts how many extra times the bls sig has been hashed
        guess_placed_epoch: u64,
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
            public_key,
            max_stake: 50_000_000_000, // 50 SUI, 1 SUI = 10^9.
            min_stake: 1_000_000_000, // 1 SUI.
            fees: balance::zero()
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
            counter: 0,
            hashingCounter: 0,
            guess_placed_epoch: tx_context::epoch(ctx),
            total_stake: stake,
            player: tx_context::sender(ctx),
            player_cards: vector[],
            player_sum: 0,
            dealer_cards: vector[],
            dealer_sum: 0,
            status: IN_PROGRESS
        };

        event::emit(GameCreatedEvent{
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
                          house_data: &mut HouseData
    ) {
        // Step 1: Check the bls signature, if its invalid, house loses
        let messageVector = *&object::id_bytes(game);
        vector::append(&mut messageVector, player_randomness(game));
        vector::append(&mut messageVector, game_counter(game));
        let is_sig_valid = bls12381_min_pk_verify(&bls_sig, &house_data.public_key, &messageVector);
        assert!(is_sig_valid, EInvalidBlsSig);

        //Check that deal hasn't already happened.
        assert!(game.player_sum == 0, EDealAlreadyHappened);

        //Hash the signature before using it
        let hashed_byte_array = blake2b256(&bls_sig);

        let (card1, card2) = get_two_random_cards_from_32_array(hashed_byte_array);

        vector::push_back(&mut game.player_cards, card1);
        vector::push_back(&mut game.player_cards, card2);
        game.player_sum = get_card_sum(&game.player_cards);

        let card3 = get_next_random_card(&mut hashed_byte_array, game);
        vector::push_back(&mut game.dealer_cards, card3);
        game.dealer_sum = get_card_sum(&game.dealer_cards);

        game.counter = game.counter + 1;
    }


    /// Function to be called by user who wants to ask for a hit.
    /// @param game: The Game object
    public fun do_hit(game: &mut Game, current_hand_sum: u8, ctx: &mut TxContext) {
        assert!(game.status == IN_PROGRESS, EGameHasFinished);
        assert!(tx_context::sender(ctx) == game.player, EUnauthorizedPlayer);

        event::emit(HitRequested {
            game_id: object::uid_to_inner(&game.id),
            current_player_hand_sum: current_hand_sum,
            game_counter: game.counter
        });
    }

    /// Function to be called by user who wants to stand.
    /// @param game: The Game object
    public fun do_stand(game: &mut Game, player_hand_sum: u8, ctx: &mut TxContext) {
        assert!(game.status == IN_PROGRESS, EGameHasFinished);
        assert!(tx_context::sender(ctx) == game.player, EUnauthorizedPlayer);

        event::emit(StandRequested {
            game_id: object::uid_to_inner(&game.id),
            final_player_hand_sum: player_hand_sum,
            game_counter: game.counter
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
        let messageVector = *&object::id_bytes(game);
        vector::append(&mut messageVector, game.user_randomness);
        vector::append(&mut messageVector, game_counter(game));
        let is_sig_valid = bls12381_min_pk_verify(&bls_sig, &house_data.public_key, &messageVector);
        assert!(is_sig_valid, EInvalidBlsSig);

        assert!(game.status == IN_PROGRESS, EGameHasFinished);

        //Hash the signature before using it
        let hashed_byte_array = blake2b256(&bls_sig);

        let card = get_next_random_card(&mut hashed_byte_array, game);
        vector::push_back(&mut game.player_cards, card);
        game.player_sum = get_card_sum(&game.player_cards);

        if (game.player_sum > 21) {
            house_won_post_handling(game, house_data, ctx);
        }else {
            game.counter = game.counter + 1;
        };

        event::emit(HitDone{
            game_id: object::uid_to_inner(&game.id),
            current_player_hand_sum: game.player_sum,
            game_counter: game.counter,
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
        let messageVector = *&object::id_bytes(game);
        vector::append(&mut messageVector, game.user_randomness);
        vector::append(&mut messageVector, game_counter(game));
        let is_sig_valid = bls12381_min_pk_verify(&bls_sig, &house_data.public_key, &messageVector);
        assert!(is_sig_valid, EInvalidBlsSig);

        assert!(game.status == IN_PROGRESS, EGameHasFinished);

        //Hash the signature before using it
        let hashed_byte_array = blake2b256(&bls_sig);

        let card = get_next_random_card(&mut hashed_byte_array, game);
        vector::push_back(&mut game.dealer_cards, card);
        game.dealer_sum = get_card_sum(&game.dealer_cards);

        while (game.dealer_sum < 17) {
            let card = get_next_random_card(&mut hashed_byte_array, game);
            vector::push_back(&mut game.dealer_cards, card);
            game.dealer_sum = get_card_sum(&game.dealer_cards);
        };

        if (game.dealer_sum > game.player_sum) {
            // House won
            house_won_post_handling(game, house_data, ctx);
        }
        else if (game.player_sum > game.dealer_sum) {
            // Player won
            player_won_post_handling(game, ctx);
        }
        else {
            // Tie
            tie_post_handling(game, house_data, ctx);
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
    fun player_won_post_handling(game: &mut Game, ctx: &mut TxContext) {
        game.status = PLAYER_WON_STATUS;

        let outcome = GameOutcomeEvent {
            game_id: object::uid_to_inner(&game.id),
            game_status: game.status,
            winner_address: game.player,
            message: b"Player won!",
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

    /// Function that is invoked to retrieve two random cards for the initial deal
    /// We take the first 16 bytes of the hashed byte array and convert it to a u128
    /// Next we take the next 16 bytes of the hashed byte array and convert it to a second u128
    /// In this way we maximize utilization of the 32-length hashed byte array and avoid rehashing
    /// @param hashed_byte_array: The hashed byte array
    /// @return: A tuple of two u8 values representing the two cards
    /// ----------------------------------------
    public fun get_two_random_cards_from_32_array(hashed_byte_array: vector<u8>): (u8, u8) {
        //we convert the first 16 bytes of the hashed byte array to a u128 integer
        let (value1, value2, i) = (0u128, 0u128, 0u8);
        while (i < 16) {
            let byte = (*vector::borrow(&mut hashed_byte_array, (i as u64)) as u128);
            value1 = value1 + (byte << 8 * i);
            i = i + 1;
        };

        //...and the last 16 bytes of the hashed byte array to another u128 integer
        // This way we take advantage of all 32 bytes of the array and avoid rehashing
        while (i < 32) {
            let byte = (*vector::borrow(&mut hashed_byte_array, (i as u64)) as u128);
            value2 = value2 + (byte << 8 * (i - 16)); //this needs to be shifted by 8 * [0,1,2...], so we want i to start from 0
            i = i + 1;
        };
        let card1 = ((value1 % 52) as u8);
        let card2 = ((value2 % 52) as u8);
        (card1, card2)
    }

    /// To increase randomness, we append hashing counter at the end of previous
    /// hash and re-hash for taking next random number
    /// @param hashed_byte_array: The hashed byte array
    /// @param game: The Game object to retrieve the hashing counter
    /// @return: The next random card
    /// --------------------------------
    public fun get_next_random_card(hashed_byte_array: &mut vector<u8>, game: &mut Game): u8 {
        let counterVec = vector[];
        vector::push_back(&mut counterVec, game.hashingCounter);
        game.hashingCounter = game.hashingCounter + 1;

        //we append hashing counter at the end of previous hash
        vector::append(hashed_byte_array, counterVec);

        //...and re-hash for taking next random number
        let rehashed_byte_array = blake2b256(hashed_byte_array);

        //we convert the first 16 bytes of the hashed byte array to a u128 integer
        let (value, i) = (0u128, 0u8);
        while (i < 16) {
            let byte = (*vector::borrow(&mut rehashed_byte_array, (i as u64)) as u128);
            value = value + (byte << 8 * i);
            i = i + 1;
        };

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

            if(value == 1) {
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

    /// Returns the game counter
    /// @param game: A Game object
    public fun game_counter(game: &Game): vector<u8> {
        let simple_vec = vector[];
        vector::push_back(&mut simple_vec, game.counter);
        simple_vec
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
}