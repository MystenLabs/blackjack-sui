/**************************************************************
 * THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
 **************************************************************/


/**
 * This module implements a simple, non transferable counter NFT. Creates a counter
 * object that can be incremented and burned. The counter NFT is non transferable,
 * i.e. it can only be ever owned by one account.
 */

import { MoveStruct, normalizeMoveArguments, type RawTransactionArgument } from '../utils/index';
import { bcs } from '@mysten/sui/bcs';
import { type Transaction } from '@mysten/sui/transactions';
import * as object from './deps/sui/object';
const $moduleName = '@local-pkg/blackjack::counter_nft';
export const Counter = new MoveStruct({ name: `${$moduleName}::Counter`, fields: {
        id: object.UID,
        count: bcs.u64()
    } });
export interface MintAndTransferOptions {
    package?: string;
    arguments?: [
    ];
}
/** Creates a new counter object & transfers it to the sender. */
export function mintAndTransfer(options: MintAndTransferOptions = {}) {
    const packageAddress = options.package ?? '@local-pkg/blackjack';
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'counter_nft',
        function: 'mint_and_transfer',
    });
}
export interface IncrementAndGetArguments {
    self: RawTransactionArgument<string>;
}
export interface IncrementAndGetOptions {
    package?: string;
    arguments: IncrementAndGetArguments | [
        self: RawTransactionArgument<string>
    ];
}
/**
 * Calculates the Counter NFT ID + count. Then it increases the count by 1 and
 * returns the appended bytes.
 */
export function incrementAndGet(options: IncrementAndGetOptions) {
    const packageAddress = options.package ?? '@local-pkg/blackjack';
    const argumentsTypes = [
        `${packageAddress}::counter_nft::Counter`
    ] satisfies string[];
    const parameterNames = ["self"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'counter_nft',
        function: 'increment_and_get',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface BurnArguments {
    self: RawTransactionArgument<string>;
}
export interface BurnOptions {
    package?: string;
    arguments: BurnArguments | [
        self: RawTransactionArgument<string>
    ];
}
/** Deletes the counter object. */
export function burn(options: BurnOptions) {
    const packageAddress = options.package ?? '@local-pkg/blackjack';
    const argumentsTypes = [
        `${packageAddress}::counter_nft::Counter`
    ] satisfies string[];
    const parameterNames = ["self"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'counter_nft',
        function: 'burn',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface CountArguments {
    self: RawTransactionArgument<string>;
}
export interface CountOptions {
    package?: string;
    arguments: CountArguments | [
        self: RawTransactionArgument<string>
    ];
}
/** Returns the current count of the counter object. */
export function count(options: CountOptions) {
    const packageAddress = options.package ?? '@local-pkg/blackjack';
    const argumentsTypes = [
        `${packageAddress}::counter_nft::Counter`
    ] satisfies string[];
    const parameterNames = ["self"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'counter_nft',
        function: 'count',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}