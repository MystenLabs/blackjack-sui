#[allow(duplicate_alias)]
module blackjack::single_player_blackjack {

    // Imports
    use sui::random::{Self, Random, RandomGenerator};
    use sui::balance::{Self, Balance};
    use sui::coin::{Self, Coin};
    use sui::event::{Self};
    use sui::sui::SUI;
    use sui::object::{Self, ID, UID};
    use sui::transfer;

    // Constants
    const STAKE: u64 = 200000000;

    // Game statuses
    const IN_PROGRESS: u8 = 0;
    const PLAYER_WON_STATUS: u8 = 1;
    const HOUSE_WON_STATUS: u8 = 2;
    const TIE_STATUS: u8 = 3;


    // Errors
    const EInsufficientBalance: u64 = 11;
    const EInsufficientHouseBalance: u64 = 12;
    const EGameHasFinished: u64 = 13;
    const EUnauthorizedPlayer: u64 = 14;
    const EDealAlreadyHappened: u64 = 15;
    const EInvalidGameOfHitRequest: u64 = 16;
    const EInvalidGameOfStandRequest: u64 = 17;
    const EInvalidSumOfHitRequest: u64 = 18;
    const EInvalidSumOfStandRequest: u64 = 19;
    const EInvalidPlayerBetAmount: u64 = 20;
    const ECallerNotHouse: u64 = 21;
    const EInvalidTwentyOneSumOfHitRequest: u64 = 22;

    // Structs

    // Events
    public struct GameCreatedEvent has copy, drop {
        game_id: ID,
    }

    public struct GameOutcomeEvent has copy, drop {
        game_id: ID,
        game_status: u8,
        winner_address: address,
        message: vector<u8>,
    }

    public struct HitDoneEvent has copy, drop {
        game_id: ID,
        current_player_hand_sum: u8,
        player_cards: vector<u8>
    }

    public struct HouseAdminCap has key {
        id: UID
    }

    // Configuration and Treasury object for the house.
    public struct HouseData has key {
        id: UID,
        balance: Balance<SUI>,
        house: address,
        public_key: vector<u8>
    }

    public struct Game has key {
        id: UID,
        total_stake: Balance<SUI>,
        player: address,
        player_cards: vector<u8>,
        player_sum: u8,
        dealer_cards: vector<u8>,
        dealer_sum: u8,
        status: u8,
        counter: u8,
        used_cards: vector<u8>, // Track cards that have been dealt
    }

    public struct HitRequest has key, store {
        id: UID,
        game_id: ID,
        current_player_sum: u8,
    }

    public struct StandRequest has key, store {
        id: UID,
        game_id: ID,
        current_player_sum: u8,
    }

    // Functions
    fun init(ctx: &mut TxContext) {
        let house_cap = HouseAdminCap {
            id: object::new(ctx)
        };

        transfer::transfer(house_cap, ctx.sender())
    }


    /// Initializer function that should only be called once and by the creator of the contract.
    /// Initializes the house data object. This object is involed in all games created by the same instance of this package.
    /// @param house_cap: The HouseCap object
    /// @param coin: The coin object that will be used to initialize the house balance. Acts as a treasury
    /// @param public_key: The public key of the house
    public fun initialize_house_data(
        house_cap: HouseAdminCap,
        coin: Coin<SUI>,
        public_key: vector<u8>,
        ctx: &mut TxContext
    ) {
        assert!(coin::value(&coin) > 0, EInsufficientBalance);

        let house_data = HouseData {
            id: object::new(ctx),
            balance: coin.into_balance(),
            house: ctx.sender(),
            public_key
        };

        let HouseAdminCap { id } = house_cap;
        object::delete(id);

        transfer::share_object(house_data);
    }

    /// Function used to top up the house balance. Can be called by anyone.
    /// House can have multiple accounts so giving the treasury balance is not limited.
    /// @param house_data: The HouseData object
    /// @param coin: The coin object that will be used to top up the house balance. The entire coin is consumed
    public fun top_up(house_data: &mut HouseData, coin: Coin<SUI>, _: &mut TxContext) {
        let balance = coin.into_balance();
        house_data.balance.join(balance);
    }

    /// House can withdraw the entire balance of the house object
    /// @param house_data: The HouseData object
    public fun withdraw(house_data: &mut HouseData, ctx: &mut TxContext) {
        // only the house address can withdraw funds
        assert!(ctx.sender() == house_data.house, ECallerNotHouse);
        let total_balance = house_data.balance.value();
        let coin = coin::take(&mut house_data.balance, total_balance, ctx);
        transfer::public_transfer(coin, house_data.house);
    }

    /// Function used to create a new game.
    /// Stake is taken from the player's coin and added to the game's stake. The house's stake is also added to the game's stake.
    /// @param user_bet: The coin object that will be used to take the player's stake
    /// @param house_data: The HouseData object
    public fun place_bet_and_create_game(
        user_bet: Coin<SUI>,
        house_data: &mut HouseData,
        ctx: &mut TxContext
    ) {
        // Ensure that the house has enough balance to play for this game
        assert!(house_data.balance() >= STAKE, EInsufficientHouseBalance);

        // get the user coin and convert it into a balance
        assert!(user_bet.value() == STAKE, EInvalidPlayerBetAmount);
        let mut stake = user_bet.into_balance();

        // get the house balance
        let house_stake = house_data.balance.split(STAKE);
        stake.join(house_stake);

        let new_game = Game {
            id: object::new(ctx),
            total_stake: stake,
            player: ctx.sender(),
            player_cards: vector[],
            player_sum: 0,
            dealer_cards: vector[],
            dealer_sum: 0,
            status: IN_PROGRESS,
            counter: 0,
            used_cards: vector[], // Initialize empty used cards list
        };

        event::emit(GameCreatedEvent {
            game_id: object::id(&new_game)
        });

        transfer::share_object(new_game);
    }

    /// Function that is invoked by the house (Dealer) to deal cards.
    /// Uses on-chain randomness to generate cards.
    ///
    /// @param game: The Game object
    /// @param r: The Random object for generating randomness
    #[allow(lint(public_random))]
    public fun first_deal(
        game: &mut Game,
        r: &Random,
        ctx: &mut TxContext
    ) {
        //Check that deal hasn't already happened.
        assert!(game.player_sum == 0, EDealAlreadyHappened);

        // Create a random generator
        let mut random_generator = random::new_generator(r, ctx);

        //Deal cards to player
        let card1 = get_next_random_card(&mut random_generator, game);
        game.player_cards.push_back(card1);

        let card2 = get_next_random_card(&mut random_generator, game);
        game.player_cards.push_back(card2);

        game.player_sum = get_card_sum(&game.player_cards);

        //Deal cards to dealer
        let card3 = get_next_random_card(&mut random_generator, game);
        game.dealer_cards.push_back(card3);
        game.dealer_sum = get_card_sum(&game.dealer_cards);

        if (game.player_sum == 21) {
            game.player_won_post_handling(b"BlackJack!!!", ctx);
        } else {
            game.counter = game.counter + 1;
        }
    }

    /// Function that is invoked when the player selects hit, so the dealer deals another card.
    /// Uses on-chain randomness to generate the next card.
    ///
    /// Function checks if the latest draw has caused the player to bust and deals with proper handling after that.
    ///
    /// @param r: The Random object for generating randomness
    #[allow(lint(public_random))]
    public fun hit(
        game: &mut Game,
        house_data: &mut HouseData,
        hit_request: HitRequest,
        r: &Random,
        ctx: &mut TxContext
    ) {

        assert!(game.status == IN_PROGRESS, EGameHasFinished);

        // Verify the HitRequest against the Game object and burn it
        let HitRequest { id, game_id, current_player_sum } = hit_request;
        assert!(game_id == object::id(game), EInvalidGameOfHitRequest);
        assert!(current_player_sum == game.player_sum, EInvalidSumOfHitRequest);
        object::delete(id);

        // Create a random generator and deal a card
        let mut random_generator = random::new_generator(r, ctx);
        let card = get_next_random_card(&mut random_generator, game);
        game.player_cards.push_back(card);
        game.player_sum = get_card_sum(&game.player_cards);
        event::emit(HitDoneEvent {
            game_id: object::uid_to_inner(&game.id),
            current_player_hand_sum: game.player_sum,
            player_cards: game.player_cards
        });
        //on twenty-one, hit option to be disabled via UI
        if (game.player_sum > 21) {
            game.house_won_post_handling(house_data, ctx);
        } else {
            game.counter = game.counter + 1;
        }
    }

    /// Function that is invoked when the player has finished asking for cards.
    /// Now its the dealer's turn to start drawing cards.
    /// Uses on-chain randomness to generate cards.
    ///
    /// Dealer should keep drawing cards until the sum of the cards is greater than 17.
    ///
    /// @param r: The Random object for generating randomness
    #[allow(lint(public_random))]
    public fun stand(
        game: &mut Game,
        house_data: &mut HouseData,
        stand_request: StandRequest,
        r: &Random,
        ctx: &mut TxContext
    ) {
        assert!(game.status == IN_PROGRESS, EGameHasFinished);

        // Verify the StandRequest against the Game object and burn it
        let StandRequest { id, game_id, current_player_sum } = stand_request;
        assert!(game_id == object::id(game), EInvalidGameOfStandRequest);
        assert!(current_player_sum == game.player_sum, EInvalidSumOfStandRequest);
        object::delete(id);

        // Create a random generator for dealer draws
        let mut random_generator = random::new_generator(r, ctx);

        // Dealer draws cards using on-chain randomness
        while (game.dealer_sum < 17) {
            let card = get_next_random_card(&mut random_generator, game);
            game.dealer_cards.push_back(card);
            game.dealer_sum = get_card_sum(&game.dealer_cards);
        };
        if (game.dealer_sum > 21) {
            game.player_won_post_handling(b"Dealer Busted!", ctx);
        }
        //case dealer got blackjack and player got twenty-one
        //dealer wins
        else if (game.dealer_sum == 21
                 && game.player_sum == 21
                 && game.dealer_cards.length() == 2) {
            game.house_won_post_handling(house_data, ctx);
        }
        else {
            if (game.dealer_sum > game.player_sum) {
                // House won
                game.house_won_post_handling(house_data, ctx);
            }
            else if (game.player_sum > game.dealer_sum) {
                // Player won
                game.player_won_post_handling(b"Player won!", ctx);
            }
            else {
                // Tie
                //captures case where both dealer and player got twenty-one
                game.tie_post_handling(house_data, ctx);
            }
        }
    }


    /// Function to be called by user who wants to ask for a hit.
    /// @param game: The Game object
    public fun do_hit(game: &mut Game, current_player_sum: u8, ctx: &mut TxContext): HitRequest {
        assert!(game.status == IN_PROGRESS, EGameHasFinished);
        assert!(ctx.sender() == game.player, EUnauthorizedPlayer);
        assert!(current_player_sum == game.player_sum, EInvalidSumOfHitRequest);
        assert!(current_player_sum != 21, EInvalidTwentyOneSumOfHitRequest);

        HitRequest {
            id: object::new(ctx),
            game_id: object::id(game),
            current_player_sum: game.player_sum,
        }
    }

    /// Function to be called by user who wants to stand.
    /// @param game: The Game object
    public fun do_stand(game: &mut Game, current_player_sum: u8, ctx: &mut TxContext): StandRequest {
        assert!(game.status == IN_PROGRESS, EGameHasFinished);
        assert!(ctx.sender() == game.player, EUnauthorizedPlayer);
        assert!(current_player_sum == game.player_sum, EInvalidSumOfStandRequest);

        StandRequest {
            id: object::new(ctx),
            game_id: object::id(game),
            current_player_sum: game.player_sum,
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
        let total_stake = game.total_stake.value();
        let coin = coin::take(&mut game.total_stake, total_stake, ctx);
        house_data.balance.join(coin.into_balance());
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
        let total_stake_value = game.total_stake.value();
        let half_stake = total_stake_value / 2;

        //player get back their stake
        let player_coin = coin::take(&mut game.total_stake, half_stake, ctx);
        transfer::public_transfer(player_coin, game.player);

        //house gets back their stake
        let house_coin = coin::take(&mut game.total_stake, half_stake, ctx);
        house_data.balance.join(house_coin.into_balance());
    }


    /// Returns next Card using the RandomGenerator, ensuring no duplicate cards
    ///
    /// @param random_generator: The RandomGenerator instance
    /// @param game: The Game object to track used cards
    /// @return: The next random card that hasn't been used yet
    /// --------------------------------
    fun get_next_random_card(random_generator: &mut RandomGenerator, game: &mut Game): u8 {
        let mut attempts = 0;
        let max_attempts = 100; // Prevent infinite loops
        
        loop {
            // Generate a random number between 0 and 51 (52 cards total)
            let card = random::generate_u8_in_range(random_generator, 0, 51);
            
            // Check if this card has already been used
            let mut is_used = false;
            let mut i = 0;
            let used_cards_len = game.used_cards.length();
            
            while (i < used_cards_len) {
                if (game.used_cards[i] == card) {
                    is_used = true;
                    break
                };
                i = i + 1;
            };
            
            // If card is not used, mark it as used and return it
            if (!is_used) {
                game.used_cards.push_back(card);
                return card
            };
            
            // Prevent infinite loop
            attempts = attempts + 1;
            if (attempts >= max_attempts) {
                // This should never happen with proper deck management
                // but provides a safety net
                abort 0
            };
        }
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
        let mut sum: u8 = 0;
        let mut i: u8 = 0;
        let n: u8 = (cards.length() as u8);
        let mut has_ace = false;

        while (i < n) {
            let cardIndex = cards[i as u64];

            let mut value = (cardIndex % 13) + 1 ;  // this constraints index to the space [1-13]
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

    /// Returns the balance of the house
    /// @param house_data: The HouseData object
    public fun balance(house_data: &HouseData): u64 {
        house_data.balance.value()
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

    /// Returns the used cards in the current game
    /// @param game: A Game object
    public fun used_cards(game: &Game): vector<u8> {
        game.used_cards
    }

    /// Game accessors
    public fun player(game: &Game): address {
        game.player
    }

    public fun player_cards(game: &Game): vector<u8> {
        game.player_cards
    }

    public fun player_sum(game: &Game): u8 {
        game.player_sum
    }

    public fun dealer_cards(game: &Game): vector<u8> {
        game.dealer_cards
    }

    public fun dealer_sum(game: &Game): u8 {
        game.dealer_sum
    }

    public fun status(game: &Game): u8 {
        game.status
    }

    public fun total_stake(game: &Game): u64 {
        game.total_stake.value()
    }

    // HitRequest accessors
    public fun hit_request_game_id(hit_request: &HitRequest): ID {
        hit_request.game_id
    }

    public fun hit_request_current_player_sum(hit_request: &HitRequest): u8 {
        hit_request.current_player_sum
    }

    // StandRequest accessors
    public fun stand_request_game_id(stand_request: &StandRequest): ID {
        stand_request.game_id
    }

    public fun stand_request_current_player_sum(stand_request: &StandRequest): u8 {
        stand_request.current_player_sum
    }

    // For Testing
    #[test_only]
    public fun get_and_transfer_house_admin_cap_for_testing(ctx: &mut TxContext) {
        let house_cap = HouseAdminCap {
            id: object::new(ctx)
        };
        transfer::transfer(house_cap, ctx.sender());
    }


    #[test_only]
    public fun draw_card_for_testing(
        game: &mut Game,
        is_dealer: bool,
        card_idx: u8,
    ) {
        if (!is_dealer) {
            game.player_cards.push_back(card_idx);
            game.player_sum = get_card_sum(&game.player_cards);
        } else {
            game.dealer_cards.push_back(card_idx);
            game.dealer_sum = get_card_sum(&game.dealer_cards);
        };
    }

    #[test_only]
    public fun pop_card_for_testing(
        game: &mut Game,
        is_dealer: bool
    ) {
        if (!is_dealer) {
            assert!(!game.player_cards.is_empty(), 0);
            game.player_cards.pop_back();
            game.player_sum = get_card_sum(&game.player_cards);
        } else {
            assert!(!game.dealer_cards.is_empty(), 0);
            game.dealer_cards.pop_back();
            game.dealer_sum = get_card_sum(&game.dealer_cards);
        };
    }

    #[test_only]
    public fun player_won_post_handling_for_test(
        game: &mut Game,
        ctx: &mut TxContext
    ) {
        player_won_post_handling(game, b"Player won!", ctx);
    }

    #[test_only]
    public fun house_won_post_handling_for_test(
        game: &mut Game,
        house_data: &mut HouseData,
        ctx: &mut TxContext
    ) {
        house_won_post_handling(game, house_data, ctx);
    }

    #[test_only]
    public fun tie_post_handling_for_test(
        game: &mut Game,
        house_data: &mut HouseData,
        ctx: &mut TxContext
    ) {
        tie_post_handling(game, house_data, ctx);
    }
}
