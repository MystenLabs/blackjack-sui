/**************************************************************
 * THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
 **************************************************************/
import { MoveStruct, normalizeMoveArguments, type RawTransactionArgument } from '../utils/index';
import { bcs } from '@mysten/sui/bcs';
import { type Transaction } from '@mysten/sui/transactions';
import * as object from './deps/sui/object';
import * as balance_1 from './deps/sui/balance';
const $moduleName = '@local-pkg/blackjack::single_player_blackjack';
export const GameCreatedEvent = new MoveStruct({ name: `${$moduleName}::GameCreatedEvent`, fields: {
        game_id: bcs.Address
    } });
export const GameOutcomeEvent = new MoveStruct({ name: `${$moduleName}::GameOutcomeEvent`, fields: {
        game_id: bcs.Address,
        game_status: bcs.u8(),
        winner_address: bcs.Address,
        message: bcs.vector(bcs.u8())
    } });
export const HitDoneEvent = new MoveStruct({ name: `${$moduleName}::HitDoneEvent`, fields: {
        game_id: bcs.Address,
        current_player_hand_sum: bcs.u8(),
        player_cards: bcs.vector(bcs.u8())
    } });
export const HouseAdminCap = new MoveStruct({ name: `${$moduleName}::HouseAdminCap`, fields: {
        id: object.UID
    } });
export const HouseData = new MoveStruct({ name: `${$moduleName}::HouseData`, fields: {
        id: object.UID,
        balance: balance_1.Balance,
        house: bcs.Address,
        public_key: bcs.vector(bcs.u8())
    } });
export const Game = new MoveStruct({ name: `${$moduleName}::Game`, fields: {
        id: object.UID,
        user_randomness: bcs.vector(bcs.u8()),
        total_stake: balance_1.Balance,
        player: bcs.Address,
        player_cards: bcs.vector(bcs.u8()),
        player_sum: bcs.u8(),
        dealer_cards: bcs.vector(bcs.u8()),
        dealer_sum: bcs.u8(),
        status: bcs.u8(),
        counter: bcs.u8()
    } });
export const HitRequest = new MoveStruct({ name: `${$moduleName}::HitRequest`, fields: {
        id: object.UID,
        game_id: bcs.Address,
        current_player_sum: bcs.u8()
    } });
export const StandRequest = new MoveStruct({ name: `${$moduleName}::StandRequest`, fields: {
        id: object.UID,
        game_id: bcs.Address,
        current_player_sum: bcs.u8()
    } });
export interface InitializeHouseDataArguments {
    houseCap: RawTransactionArgument<string>;
    coin: RawTransactionArgument<string>;
    publicKey: RawTransactionArgument<number[]>;
}
export interface InitializeHouseDataOptions {
    package?: string;
    arguments: InitializeHouseDataArguments | [
        houseCap: RawTransactionArgument<string>,
        coin: RawTransactionArgument<string>,
        publicKey: RawTransactionArgument<number[]>
    ];
}
/**
 * Initializer function that should only be called once and by the creator of the
 * contract. Initializes the house data object. This object is involed in all games
 * created by the same instance of this package. @param house_cap: The HouseCap
 * object @param coin: The coin object that will be used to initialize the house
 * balance. Acts as a treasury @param public_key: The public key of the house
 */
export function initializeHouseData(options: InitializeHouseDataOptions) {
    const packageAddress = options.package ?? '@local-pkg/blackjack';
    const argumentsTypes = [
        `${packageAddress}::single_player_blackjack::HouseAdminCap`,
        '0x0000000000000000000000000000000000000000000000000000000000000002::coin::Coin<0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI>',
        'vector<u8>'
    ] satisfies string[];
    const parameterNames = ["houseCap", "coin", "publicKey"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'single_player_blackjack',
        function: 'initialize_house_data',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface TopUpArguments {
    houseData: RawTransactionArgument<string>;
    coin: RawTransactionArgument<string>;
}
export interface TopUpOptions {
    package?: string;
    arguments: TopUpArguments | [
        houseData: RawTransactionArgument<string>,
        coin: RawTransactionArgument<string>
    ];
}
/**
 * Function used to top up the house balance. Can be called by anyone. House can
 * have multiple accounts so giving the treasury balance is not limited. @param
 * house_data: The HouseData object @param coin: The coin object that will be used
 * to top up the house balance. The entire coin is consumed
 */
export function topUp(options: TopUpOptions) {
    const packageAddress = options.package ?? '@local-pkg/blackjack';
    const argumentsTypes = [
        `${packageAddress}::single_player_blackjack::HouseData`,
        '0x0000000000000000000000000000000000000000000000000000000000000002::coin::Coin<0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI>'
    ] satisfies string[];
    const parameterNames = ["houseData", "coin"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'single_player_blackjack',
        function: 'top_up',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface WithdrawArguments {
    houseData: RawTransactionArgument<string>;
}
export interface WithdrawOptions {
    package?: string;
    arguments: WithdrawArguments | [
        houseData: RawTransactionArgument<string>
    ];
}
/**
 * House can withdraw the entire balance of the house object @param house_data: The
 * HouseData object
 */
export function withdraw(options: WithdrawOptions) {
    const packageAddress = options.package ?? '@local-pkg/blackjack';
    const argumentsTypes = [
        `${packageAddress}::single_player_blackjack::HouseData`
    ] satisfies string[];
    const parameterNames = ["houseData"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'single_player_blackjack',
        function: 'withdraw',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface PlaceBetAndCreateGameArguments {
    userRandomness: RawTransactionArgument<number[]>;
    userCounter: RawTransactionArgument<string>;
    userBet: RawTransactionArgument<string>;
    houseData: RawTransactionArgument<string>;
}
export interface PlaceBetAndCreateGameOptions {
    package?: string;
    arguments: PlaceBetAndCreateGameArguments | [
        userRandomness: RawTransactionArgument<number[]>,
        userCounter: RawTransactionArgument<string>,
        userBet: RawTransactionArgument<string>,
        houseData: RawTransactionArgument<string>
    ];
}
/**
 * Function used to create a new game. The player must provide a random vector of
 * bytes. Stake is taken from the player's coin and added to the game's stake. The
 * house's stake is also added to the game's stake. @param user_randomness: A
 * vector of randomly produced bytes that will be used to calculate the result of
 * the VRF @param user_counter: A user counter object that serves as additional
 * source of randomness. @param user_bet: The coin object that will be used to take
 * the player's stake @param house_data: The HouseData object
 */
export function placeBetAndCreateGame(options: PlaceBetAndCreateGameOptions) {
    const packageAddress = options.package ?? '@local-pkg/blackjack';
    const argumentsTypes = [
        'vector<u8>',
        `${packageAddress}::counter_nft::Counter`,
        '0x0000000000000000000000000000000000000000000000000000000000000002::coin::Coin<0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI>',
        `${packageAddress}::single_player_blackjack::HouseData`
    ] satisfies string[];
    const parameterNames = ["userRandomness", "userCounter", "userBet", "houseData"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'single_player_blackjack',
        function: 'place_bet_and_create_game',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface FirstDealArguments {
    game: RawTransactionArgument<string>;
    blsSig: RawTransactionArgument<number[]>;
    houseData: RawTransactionArgument<string>;
}
export interface FirstDealOptions {
    package?: string;
    arguments: FirstDealArguments | [
        game: RawTransactionArgument<string>,
        blsSig: RawTransactionArgument<number[]>,
        houseData: RawTransactionArgument<string>
    ];
}
/**
 * Function that is invoked by the house (Dealer) to deal cards. If an incorrect
 * bls sig is passed the function will abort.
 *
 * @param game: The Game object @param bls_sig: The bls signature of the game id
 * and the player's randomn bytes and the counter appended together @param
 * house_data: The HouseData object
 */
export function firstDeal(options: FirstDealOptions) {
    const packageAddress = options.package ?? '@local-pkg/blackjack';
    const argumentsTypes = [
        `${packageAddress}::single_player_blackjack::Game`,
        'vector<u8>',
        `${packageAddress}::single_player_blackjack::HouseData`
    ] satisfies string[];
    const parameterNames = ["game", "blsSig", "houseData"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'single_player_blackjack',
        function: 'first_deal',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface HitArguments {
    game: RawTransactionArgument<string>;
    blsSig: RawTransactionArgument<number[]>;
    houseData: RawTransactionArgument<string>;
    hitRequest: RawTransactionArgument<string>;
}
export interface HitOptions {
    package?: string;
    arguments: HitArguments | [
        game: RawTransactionArgument<string>,
        blsSig: RawTransactionArgument<number[]>,
        houseData: RawTransactionArgument<string>,
        hitRequest: RawTransactionArgument<string>
    ];
}
/**
 * Function that is invoked when the player selects hit, so the dealer deals
 * another card. We use the player's randomness to generate the next card. Dealer
 * (house) signs the game id, the randomness and the game counter appended
 * together. If an incorrect bls sig is passed the function will abort.
 *
 * Function checks if the latest draw has caused the player to bust and deals with
 * proper handling after that.
 */
export function hit(options: HitOptions) {
    const packageAddress = options.package ?? '@local-pkg/blackjack';
    const argumentsTypes = [
        `${packageAddress}::single_player_blackjack::Game`,
        'vector<u8>',
        `${packageAddress}::single_player_blackjack::HouseData`,
        `${packageAddress}::single_player_blackjack::HitRequest`
    ] satisfies string[];
    const parameterNames = ["game", "blsSig", "houseData", "hitRequest"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'single_player_blackjack',
        function: 'hit',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface StandArguments {
    game: RawTransactionArgument<string>;
    blsSig: RawTransactionArgument<number[]>;
    houseData: RawTransactionArgument<string>;
    standRequest: RawTransactionArgument<string>;
}
export interface StandOptions {
    package?: string;
    arguments: StandArguments | [
        game: RawTransactionArgument<string>,
        blsSig: RawTransactionArgument<number[]>,
        houseData: RawTransactionArgument<string>,
        standRequest: RawTransactionArgument<string>
    ];
}
/**
 * Function that is invoked when the player has finished asking for cards. Now its
 * the dealer's turn to start drawing cards. We use the player's randomness to
 * generate the next card. Dealer (house) signs the game id, the randomness and the
 * game counter appended together. If an incorrect bls sig is passed the function
 * will abort.
 *
 * Dealer should keep drawing cards until the sum of the cards is greater than 17.
 */
export function stand(options: StandOptions) {
    const packageAddress = options.package ?? '@local-pkg/blackjack';
    const argumentsTypes = [
        `${packageAddress}::single_player_blackjack::Game`,
        'vector<u8>',
        `${packageAddress}::single_player_blackjack::HouseData`,
        `${packageAddress}::single_player_blackjack::StandRequest`
    ] satisfies string[];
    const parameterNames = ["game", "blsSig", "houseData", "standRequest"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'single_player_blackjack',
        function: 'stand',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface DoHitArguments {
    game: RawTransactionArgument<string>;
    currentPlayerSum: RawTransactionArgument<number>;
}
export interface DoHitOptions {
    package?: string;
    arguments: DoHitArguments | [
        game: RawTransactionArgument<string>,
        currentPlayerSum: RawTransactionArgument<number>
    ];
}
/**
 * Function to be called by user who wants to ask for a hit. @param game: The Game
 * object
 */
export function doHit(options: DoHitOptions) {
    const packageAddress = options.package ?? '@local-pkg/blackjack';
    const argumentsTypes = [
        `${packageAddress}::single_player_blackjack::Game`,
        'u8'
    ] satisfies string[];
    const parameterNames = ["game", "currentPlayerSum"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'single_player_blackjack',
        function: 'do_hit',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface DoStandArguments {
    game: RawTransactionArgument<string>;
    currentPlayerSum: RawTransactionArgument<number>;
}
export interface DoStandOptions {
    package?: string;
    arguments: DoStandArguments | [
        game: RawTransactionArgument<string>,
        currentPlayerSum: RawTransactionArgument<number>
    ];
}
/** Function to be called by user who wants to stand. @param game: The Game object */
export function doStand(options: DoStandOptions) {
    const packageAddress = options.package ?? '@local-pkg/blackjack';
    const argumentsTypes = [
        `${packageAddress}::single_player_blackjack::Game`,
        'u8'
    ] satisfies string[];
    const parameterNames = ["game", "currentPlayerSum"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'single_player_blackjack',
        function: 'do_stand',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface GetNextRandomCardArguments {
    inputHash: RawTransactionArgument<number[]>;
}
export interface GetNextRandomCardOptions {
    package?: string;
    arguments: GetNextRandomCardArguments | [
        inputHash: RawTransactionArgument<number[]>
    ];
}
/**
 * Returns next Card from the hashed byte array after re-hashing it
 *
 * @param hashed_byte_array: The hashed byte array @return: The next random card
 *
 * ---
 */
export function getNextRandomCard(options: GetNextRandomCardOptions) {
    const packageAddress = options.package ?? '@local-pkg/blackjack';
    const argumentsTypes = [
        'vector<u8>'
    ] satisfies string[];
    const parameterNames = ["inputHash"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'single_player_blackjack',
        function: 'get_next_random_card',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface GameCounterVectorArguments {
    game: RawTransactionArgument<string>;
}
export interface GameCounterVectorOptions {
    package?: string;
    arguments: GameCounterVectorArguments | [
        game: RawTransactionArgument<string>
    ];
}
/** Returns a vector containing the game counter @param game: A Game object */
export function gameCounterVector(options: GameCounterVectorOptions) {
    const packageAddress = options.package ?? '@local-pkg/blackjack';
    const argumentsTypes = [
        `${packageAddress}::single_player_blackjack::Game`
    ] satisfies string[];
    const parameterNames = ["game"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'single_player_blackjack',
        function: 'game_counter_vector',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface UserRandomnessArguments {
    game: RawTransactionArgument<string>;
}
export interface UserRandomnessOptions {
    package?: string;
    arguments: UserRandomnessArguments | [
        game: RawTransactionArgument<string>
    ];
}
/** Returns the player's randomn bytes input @param game: A Game object */
export function userRandomness(options: UserRandomnessOptions) {
    const packageAddress = options.package ?? '@local-pkg/blackjack';
    const argumentsTypes = [
        `${packageAddress}::single_player_blackjack::Game`
    ] satisfies string[];
    const parameterNames = ["game"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'single_player_blackjack',
        function: 'user_randomness',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface BalanceArguments {
    houseData: RawTransactionArgument<string>;
}
export interface BalanceOptions {
    package?: string;
    arguments: BalanceArguments | [
        houseData: RawTransactionArgument<string>
    ];
}
/** Returns the balance of the house @param house_data: The HouseData object */
export function balance(options: BalanceOptions) {
    const packageAddress = options.package ?? '@local-pkg/blackjack';
    const argumentsTypes = [
        `${packageAddress}::single_player_blackjack::HouseData`
    ] satisfies string[];
    const parameterNames = ["houseData"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'single_player_blackjack',
        function: 'balance',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface HouseArguments {
    houseData: RawTransactionArgument<string>;
}
export interface HouseOptions {
    package?: string;
    arguments: HouseArguments | [
        houseData: RawTransactionArgument<string>
    ];
}
/** Returns the address of the house @param house_data: The HouseData object */
export function house(options: HouseOptions) {
    const packageAddress = options.package ?? '@local-pkg/blackjack';
    const argumentsTypes = [
        `${packageAddress}::single_player_blackjack::HouseData`
    ] satisfies string[];
    const parameterNames = ["houseData"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'single_player_blackjack',
        function: 'house',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface PublicKeyArguments {
    houseData: RawTransactionArgument<string>;
}
export interface PublicKeyOptions {
    package?: string;
    arguments: PublicKeyArguments | [
        houseData: RawTransactionArgument<string>
    ];
}
/** Returns the public key of the house @param house_data: The HouseData object */
export function publicKey(options: PublicKeyOptions) {
    const packageAddress = options.package ?? '@local-pkg/blackjack';
    const argumentsTypes = [
        `${packageAddress}::single_player_blackjack::HouseData`
    ] satisfies string[];
    const parameterNames = ["houseData"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'single_player_blackjack',
        function: 'public_key',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface PlayerArguments {
    game: RawTransactionArgument<string>;
}
export interface PlayerOptions {
    package?: string;
    arguments: PlayerArguments | [
        game: RawTransactionArgument<string>
    ];
}
/** Game accessors */
export function player(options: PlayerOptions) {
    const packageAddress = options.package ?? '@local-pkg/blackjack';
    const argumentsTypes = [
        `${packageAddress}::single_player_blackjack::Game`
    ] satisfies string[];
    const parameterNames = ["game"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'single_player_blackjack',
        function: 'player',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface PlayerCardsArguments {
    game: RawTransactionArgument<string>;
}
export interface PlayerCardsOptions {
    package?: string;
    arguments: PlayerCardsArguments | [
        game: RawTransactionArgument<string>
    ];
}
export function playerCards(options: PlayerCardsOptions) {
    const packageAddress = options.package ?? '@local-pkg/blackjack';
    const argumentsTypes = [
        `${packageAddress}::single_player_blackjack::Game`
    ] satisfies string[];
    const parameterNames = ["game"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'single_player_blackjack',
        function: 'player_cards',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface PlayerSumArguments {
    game: RawTransactionArgument<string>;
}
export interface PlayerSumOptions {
    package?: string;
    arguments: PlayerSumArguments | [
        game: RawTransactionArgument<string>
    ];
}
export function playerSum(options: PlayerSumOptions) {
    const packageAddress = options.package ?? '@local-pkg/blackjack';
    const argumentsTypes = [
        `${packageAddress}::single_player_blackjack::Game`
    ] satisfies string[];
    const parameterNames = ["game"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'single_player_blackjack',
        function: 'player_sum',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface DealerCardsArguments {
    game: RawTransactionArgument<string>;
}
export interface DealerCardsOptions {
    package?: string;
    arguments: DealerCardsArguments | [
        game: RawTransactionArgument<string>
    ];
}
export function dealerCards(options: DealerCardsOptions) {
    const packageAddress = options.package ?? '@local-pkg/blackjack';
    const argumentsTypes = [
        `${packageAddress}::single_player_blackjack::Game`
    ] satisfies string[];
    const parameterNames = ["game"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'single_player_blackjack',
        function: 'dealer_cards',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface DealerSumArguments {
    game: RawTransactionArgument<string>;
}
export interface DealerSumOptions {
    package?: string;
    arguments: DealerSumArguments | [
        game: RawTransactionArgument<string>
    ];
}
export function dealerSum(options: DealerSumOptions) {
    const packageAddress = options.package ?? '@local-pkg/blackjack';
    const argumentsTypes = [
        `${packageAddress}::single_player_blackjack::Game`
    ] satisfies string[];
    const parameterNames = ["game"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'single_player_blackjack',
        function: 'dealer_sum',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface StatusArguments {
    game: RawTransactionArgument<string>;
}
export interface StatusOptions {
    package?: string;
    arguments: StatusArguments | [
        game: RawTransactionArgument<string>
    ];
}
export function status(options: StatusOptions) {
    const packageAddress = options.package ?? '@local-pkg/blackjack';
    const argumentsTypes = [
        `${packageAddress}::single_player_blackjack::Game`
    ] satisfies string[];
    const parameterNames = ["game"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'single_player_blackjack',
        function: 'status',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface TotalStakeArguments {
    game: RawTransactionArgument<string>;
}
export interface TotalStakeOptions {
    package?: string;
    arguments: TotalStakeArguments | [
        game: RawTransactionArgument<string>
    ];
}
export function totalStake(options: TotalStakeOptions) {
    const packageAddress = options.package ?? '@local-pkg/blackjack';
    const argumentsTypes = [
        `${packageAddress}::single_player_blackjack::Game`
    ] satisfies string[];
    const parameterNames = ["game"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'single_player_blackjack',
        function: 'total_stake',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface HitRequestGameIdArguments {
    hitRequest: RawTransactionArgument<string>;
}
export interface HitRequestGameIdOptions {
    package?: string;
    arguments: HitRequestGameIdArguments | [
        hitRequest: RawTransactionArgument<string>
    ];
}
export function hitRequestGameId(options: HitRequestGameIdOptions) {
    const packageAddress = options.package ?? '@local-pkg/blackjack';
    const argumentsTypes = [
        `${packageAddress}::single_player_blackjack::HitRequest`
    ] satisfies string[];
    const parameterNames = ["hitRequest"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'single_player_blackjack',
        function: 'hit_request_game_id',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface HitRequestCurrentPlayerSumArguments {
    hitRequest: RawTransactionArgument<string>;
}
export interface HitRequestCurrentPlayerSumOptions {
    package?: string;
    arguments: HitRequestCurrentPlayerSumArguments | [
        hitRequest: RawTransactionArgument<string>
    ];
}
export function hitRequestCurrentPlayerSum(options: HitRequestCurrentPlayerSumOptions) {
    const packageAddress = options.package ?? '@local-pkg/blackjack';
    const argumentsTypes = [
        `${packageAddress}::single_player_blackjack::HitRequest`
    ] satisfies string[];
    const parameterNames = ["hitRequest"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'single_player_blackjack',
        function: 'hit_request_current_player_sum',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface StandRequestGameIdArguments {
    standRequest: RawTransactionArgument<string>;
}
export interface StandRequestGameIdOptions {
    package?: string;
    arguments: StandRequestGameIdArguments | [
        standRequest: RawTransactionArgument<string>
    ];
}
export function standRequestGameId(options: StandRequestGameIdOptions) {
    const packageAddress = options.package ?? '@local-pkg/blackjack';
    const argumentsTypes = [
        `${packageAddress}::single_player_blackjack::StandRequest`
    ] satisfies string[];
    const parameterNames = ["standRequest"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'single_player_blackjack',
        function: 'stand_request_game_id',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface StandRequestCurrentPlayerSumArguments {
    standRequest: RawTransactionArgument<string>;
}
export interface StandRequestCurrentPlayerSumOptions {
    package?: string;
    arguments: StandRequestCurrentPlayerSumArguments | [
        standRequest: RawTransactionArgument<string>
    ];
}
export function standRequestCurrentPlayerSum(options: StandRequestCurrentPlayerSumOptions) {
    const packageAddress = options.package ?? '@local-pkg/blackjack';
    const argumentsTypes = [
        `${packageAddress}::single_player_blackjack::StandRequest`
    ] satisfies string[];
    const parameterNames = ["standRequest"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'single_player_blackjack',
        function: 'stand_request_current_player_sum',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}