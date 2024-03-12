// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

// code by:
// https://github.com/MystenLabs/sui/blob/main/apps/core/src/utils/formatAmount.ts

import BigNumber from "bignumber.js";

export function formatAmountParts(amount?: BigNumber | null) {
  if (typeof amount === "undefined" || amount === null) {
    return ["--"];
  }

  let postfix = "";
  let bn = new BigNumber(amount.toString());
  const bnAbs = bn.abs();

  // use absolute value to determine the postfix
  if (bnAbs.gte(1_000_000_000)) {
    bn = bn.shiftedBy(-9);
    postfix = "B";
  } else if (bnAbs.gte(1_000_000)) {
    bn = bn.shiftedBy(-6);
    postfix = "M";
  } else if (bnAbs.gte(10_000)) {
    bn = bn.shiftedBy(-3);
    postfix = "K";
  }

  bn = bn.decimalPlaces(2, BigNumber.ROUND_DOWN);

  return [bn.toFormat(), postfix];
}

export function formatSUIAmount(...args: Parameters<typeof formatAmountParts>) {
  return formatAmountParts(...args)
    .filter(Boolean)
    .join(" ");
}
