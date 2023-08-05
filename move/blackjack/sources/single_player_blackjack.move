module blackjack::single_player_blackjack {

    use std::vector;

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
    struct Outcome has key {
        id: UID,
        player_won: bool,
        message: vector<u8>,
        card1:u8,
        card2:u8,
        card3:u8,
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
        guess_placed_epoch: u64,
        total_stake: Balance<SUI>,
        player: address,
        player_cards: vector<u8>,
        player_sum: u32,
        dealer_cards: vector<u8>,
        dealer_sum: u32,
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
    /// To open cards you do blake2b(GameID || Randomness || counter)
    /// You sign this and then the randomness is defined as blake2b(housesig)
    /// You do mod52 to that and voila! you have a random card.
    ///
    /// If an incorrect bls sig is passed the function will abort.
    ///
    /// @param game: The Game object
    /// @param bls_sig: The bls signature of the game id and the player's randomn bytes and the counter appended together
    /// @param house_data: The HouseData object
    public entry fun deal(game: &mut Game,
                          bls_sig: vector<u8>,
                          house_data: &mut HouseData,
                          ctx: &mut TxContext) {
        // Step 1: Check the bls signature, if its invalid, house loses
        let messageVector = *&object::id_bytes(game);
        vector::append(&mut messageVector, player_randomness(game));
        vector::append(&mut messageVector, game_counter(game));
        let is_sig_valid = bls12381_min_pk_verify(&bls_sig, &house_data.public_key, &messageVector);
        assert!(is_sig_valid, EInvalidBlsSig);

        // Hash the beacon before taking the 1st byte.
        let hashed_beacon = blake2b256(&bls_sig);
        let byte1 = vector::borrow(&hashed_beacon, 0);
        let byte2 = vector::borrow(&hashed_beacon, 1);
        let byte3 = vector::borrow(&hashed_beacon, 2);

        let card1 = *byte1 % 52;
        let card2 = *byte2 % 52;
        let card3 = *byte3 % 52;

        transfer::share_object(Outcome {
            id: object::new(ctx),
            player_won: false,
            message: hashed_beacon,
            card1,
            card2,
            card3,
        });
        //New Card should be displayed. We need to select a random card from the deck.

        // Step 2: Determine the user's current sum
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

        //New Card should be displayed. We need to select a random card from the deck.

        // Step 2: Determine the user's current sum
    }

    // Returns Value of the card
    // 1 = 1 (or 10 but this will be handled by business logic)
    // 2 = 2
    // 3 = 3
    // ...
    // 10 = 10
    // 11 = J = 10
    // 12 = Q = 10
    // 13 = K = 10
    public fun card_to_value(card: u8): u8 {
        if (card <= 10) {
            card
        }
        else {
            10
        };
        10
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