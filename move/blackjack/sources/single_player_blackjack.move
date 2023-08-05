module blackjack::single_player_blackjack {

    use std::vector;

    use sui::object_table::{Self, ObjectTable};
    use sui::bls12381::bls12381_min_pk_verify;
    use sui::tx_context::{Self, TxContext};
    use sui::balance::{Self, Balance};
    use sui::object::{Self, UID};
    use sui::coin::{Self, Coin};
    use sui::hash::{blake2b256};
    use sui::sui::SUI;
    use sui::transfer;


    // Consts
    const EPOCHS_CANCEL_AFTER: u64 = 7;
    const STAKE: u64 = 5000;


    // Errors
    const EInvalidBlsSig: u64 = 10;
    const ECallerNotHouse: u64 = 12;
    const ECanNotCancel: u64 = 13;
    const EInvalidGuess: u64 = 14;
    const EInsufficientBalance: u64 = 15;
    const EGameHasAlreadyBeenCanceled: u64 = 16;
    const EInsufficientHouseBalance: u64 = 17;
    const ECoinBalanceNotEnough: u64 = 9;


    // Structs

    struct Card has key, store {
        id:UID,
        suit: vector<u8>,
        name: vector<u8>,
        value: u8
    }

    struct Outcome has key {
        id: UID,
        player_won: bool,
        message: vector<u8>,
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
        fees: Balance<SUI>,
        card_deck: ObjectTable<u8,Card>
    }

    struct Game has key {
        id: UID,
        user_randomness: vector<u8>,
        counter: u8,
        guess_placed_epoch: u64,
        total_stake: Balance<SUI>,
        player: address,
        player_cards: vector<u8>,
        player_sum: u8,
        dealer_cards: vector<u8>,
        dealer_sum: u8,
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
            fees: balance::zero(),
            card_deck: get_card_deck(ctx)
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
            guess_placed_epoch: tx_context::epoch(ctx),
            total_stake: stake,
            player: tx_context::sender(ctx),
            player_cards: vector[],
            player_sum: 0,
            dealer_cards: vector[],
            dealer_sum: 0
        };

        transfer::share_object(new_game);
    }

    /// Function that is invoked by the house (Dealer) to deal cards.
    /// If an incorrect bls sig is passed the function will abort.
    ///
    /// @param game: The Game object
    /// @param bls_sig: The bls signature of the game id and the player's randomn bytes and the counter appended together
    /// @param house_data: The HouseData object
    public fun deal(game: &mut Game,
                          bls_sig: vector<u8>,
                          house_data: &mut HouseData
                          ) {
        // Step 1: Check the bls signature, if its invalid, house loses
        let messageVector = *&object::id_bytes(game);
        vector::append(&mut messageVector, player_randomness(game));
        vector::append(&mut messageVector, game_counter(game));
         let is_sig_valid = bls12381_min_pk_verify(&bls_sig, &house_data.public_key, &messageVector);
         assert!(is_sig_valid, EInvalidBlsSig);
        //
        //Hash the beacon before taking the 1st byte.
        let hashed_beacon = blake2b256(&bls_sig);
        let byte1 = vector::borrow(&hashed_beacon, 0);
        let byte2 = vector::borrow(&hashed_beacon, 1);
        let byte3 = vector::borrow(&hashed_beacon, 2);

        let card1 = *byte1 % 52;
        let card2 = *byte2 % 52;
        let card3 = *byte3 % 52;

        vector::push_back(&mut game.player_cards, card1);
        vector::push_back(&mut game.player_cards, card2);
        game.player_sum = get_card_sum(&game.player_cards, &house_data.card_deck);


        vector::push_back(&mut game.dealer_cards, card3);
        game.dealer_sum = get_card_sum(&game.dealer_cards, &house_data.card_deck);

        game.counter = game.counter + 1;
    }


    /// Function that determines the winner and distributes the funds accordingly.
    /// Anyone can end the game (game & house_data objects are shared).
    /// If an incorrect bls sig is passed the function will abort.
    /// A shared Outcome object is created to signal that the game has ended. Contains the winner, guess, and the unsigned message used as an input in the VRF.
    /// @param game: The Game object
    /// @param bls_sig: The bls signature of the game id and the player's randomn bytes appended together
    /// @param house_data: The HouseData object
    public entry fun hit(user_randomness: vector<u8>,
                         game: &mut Game,
                         bls_sig: vector<u8>,
                         house_data: &mut HouseData) {
        // Step 1: Check the bls signature, if its invalid, house loses
        let messageVector = *&object::id_bytes(game);
        vector::append(&mut messageVector, user_randomness);
        let is_sig_valid = bls12381_min_pk_verify(&bls_sig, &house_data.public_key, &messageVector);
        assert!(is_sig_valid, EInvalidBlsSig);


        //TODO: Implement the game logic
        //New Card should be displayed. We need to select a random card from the deck.


        //TODO: Implement the game logic
        // Step 2: Determine the user's current sum
    }


    /// Creation of Card Deck.
    /// This is called only once when initializing house data.
    /// We opted for object_table due to 0(1) lookup time
    fun get_card_deck(ctx: &mut TxContext): ObjectTable<u8,Card>
    {
        let cards = object_table::new(ctx);

        object_table::add(&mut cards, 0,  Card{id: object::new(ctx), suit:b"Clubs",name:b"A", value:1 });
        object_table::add(&mut cards, 1,  Card{id: object::new(ctx), suit:b"Clubs",name:b"2", value:2 });
        object_table::add(&mut cards, 2,  Card{id: object::new(ctx), suit:b"Clubs",name:b"3", value:3 });
        object_table::add(&mut cards, 3,  Card{id: object::new(ctx), suit:b"Clubs",name:b"4", value:4 });
        object_table::add(&mut cards, 4,  Card{id: object::new(ctx), suit:b"Clubs",name:b"5", value:5 });
        object_table::add(&mut cards, 5,  Card{id: object::new(ctx), suit:b"Clubs",name:b"6", value:6 });
        object_table::add(&mut cards, 6,  Card{id: object::new(ctx), suit:b"Clubs",name:b"7", value:7 });
        object_table::add(&mut cards, 7,  Card{id: object::new(ctx), suit:b"Clubs",name:b"8", value:8 });
        object_table::add(&mut cards, 8,  Card{id: object::new(ctx), suit:b"Clubs",name:b"9", value:9 });
        object_table::add(&mut cards, 9, Card{id: object::new(ctx), suit:b"Clubs",name:b"10",value:10 });
        object_table::add(&mut cards, 10, Card{id: object::new(ctx), suit:b"Clubs",name:b"J", value:10 });
        object_table::add(&mut cards, 11, Card{id: object::new(ctx), suit:b"Clubs",name:b"Q", value:10 });
        object_table::add(&mut cards, 12, Card{id: object::new(ctx), suit:b"Clubs",name:b"K", value:10 });

        object_table::add(&mut cards, 13, Card{id: object::new(ctx), suit:b"Diamonds",name:b"A", value:1 });
        object_table::add(&mut cards, 14, Card{id: object::new(ctx), suit:b"Diamonds",name:b"2", value:2 });
        object_table::add(&mut cards, 15, Card{id: object::new(ctx), suit:b"Diamonds",name:b"3", value:3 });
        object_table::add(&mut cards, 16, Card{id: object::new(ctx), suit:b"Diamonds",name:b"4", value:4 });
        object_table::add(&mut cards, 17, Card{id: object::new(ctx), suit:b"Diamonds",name:b"5", value:5 });
        object_table::add(&mut cards, 18, Card{id: object::new(ctx), suit:b"Diamonds",name:b"6", value:6 });
        object_table::add(&mut cards, 19, Card{id: object::new(ctx), suit:b"Diamonds",name:b"7", value:7 });
        object_table::add(&mut cards, 20, Card{id: object::new(ctx), suit:b"Diamonds",name:b"8", value:8 });
        object_table::add(&mut cards, 21, Card{id: object::new(ctx), suit:b"Diamonds",name:b"9", value:9 });
        object_table::add(&mut cards, 22, Card{id: object::new(ctx), suit:b"Diamonds",name:b"10",value:10 });
        object_table::add(&mut cards, 23, Card{id: object::new(ctx), suit:b"Diamonds",name:b"J", value:10 });
        object_table::add(&mut cards, 24, Card{id: object::new(ctx), suit:b"Diamonds",name:b"Q", value:10 });
        object_table::add(&mut cards, 25, Card{id: object::new(ctx), suit:b"Diamonds",name:b"K", value:10 });

        object_table::add(&mut cards, 26, Card{id: object::new(ctx), suit:b"Hearts",name:b"A", value:1 });
        object_table::add(&mut cards, 27, Card{id: object::new(ctx), suit:b"Hearts",name:b"2", value:2 });
        object_table::add(&mut cards, 28, Card{id: object::new(ctx), suit:b"Hearts",name:b"3", value:3 });
        object_table::add(&mut cards, 29, Card{id: object::new(ctx), suit:b"Hearts",name:b"4", value:4 });
        object_table::add(&mut cards, 30, Card{id: object::new(ctx), suit:b"Hearts",name:b"5", value:5 });
        object_table::add(&mut cards, 31, Card{id: object::new(ctx), suit:b"Hearts",name:b"6", value:6 });
        object_table::add(&mut cards, 32, Card{id: object::new(ctx), suit:b"Hearts",name:b"7", value:7 });
        object_table::add(&mut cards, 33, Card{id: object::new(ctx), suit:b"Hearts",name:b"8", value:8 });
        object_table::add(&mut cards, 34, Card{id: object::new(ctx), suit:b"Hearts",name:b"9", value:9 });
        object_table::add(&mut cards, 35, Card{id: object::new(ctx), suit:b"Hearts",name:b"10",value:10 });
        object_table::add(&mut cards, 36, Card{id: object::new(ctx), suit:b"Hearts",name:b"J", value:10 });
        object_table::add(&mut cards, 37, Card{id: object::new(ctx), suit:b"Hearts",name:b"Q", value:10 });
        object_table::add(&mut cards, 38, Card{id: object::new(ctx), suit:b"Hearts",name:b"K", value:10 });

        object_table::add(&mut cards, 39, Card{id: object::new(ctx), suit:b"Spades",name:b"A", value:1 });
        object_table::add(&mut cards, 40, Card{id: object::new(ctx), suit:b"Spades",name:b"2", value:2 });
        object_table::add(&mut cards, 41, Card{id: object::new(ctx), suit:b"Spades",name:b"3", value:3 });
        object_table::add(&mut cards, 42, Card{id: object::new(ctx), suit:b"Spades",name:b"4", value:4 });
        object_table::add(&mut cards, 43, Card{id: object::new(ctx), suit:b"Spades",name:b"5", value:5 });
        object_table::add(&mut cards, 44, Card{id: object::new(ctx), suit:b"Spades",name:b"6", value:6 });
        object_table::add(&mut cards, 45, Card{id: object::new(ctx), suit:b"Spades",name:b"7", value:7 });
        object_table::add(&mut cards, 46, Card{id: object::new(ctx), suit:b"Spades",name:b"8", value:8 });
        object_table::add(&mut cards, 47, Card{id: object::new(ctx), suit:b"Spades",name:b"9", value:9 });
        object_table::add(&mut cards, 48, Card{id: object::new(ctx), suit:b"Spades",name:b"10",value:10 });
        object_table::add(&mut cards, 49, Card{id: object::new(ctx), suit:b"Spades",name:b"J", value:10 });
        object_table::add(&mut cards, 50, Card{id: object::new(ctx), suit:b"Spades",name:b"Q", value:10 });
        object_table::add(&mut cards, 51, Card{id: object::new(ctx), suit:b"Spades",name:b"K", value:10 });

        cards
    }


    /// Function that calculates the total value of a player's cards
    fun get_card_sum(cards: &vector<u8>, deck: &ObjectTable<u8,Card>): u8 {
        let sum:u8 = 0;
        let i : u8 = 0;
        let n : u8 = (vector::length(cards) as u8);
        while (i < n) {
            let cardIndex = *vector::borrow(cards, (i as u64));
            let card : &Card = object_table::borrow(deck, cardIndex);
            let value = card.value;
            sum = sum + value;
            if(card.name == b"A" && sum <= 11) {
                sum = sum + 10;
            };
            i = i +1;
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