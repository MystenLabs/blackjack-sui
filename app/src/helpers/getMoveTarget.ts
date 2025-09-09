const getMoveTarget = (name: string) => `${process.env.NEXT_PUBLIC_PACKAGE_ADDRESS}::single_player_blackjack::${name}`;

export default getMoveTarget;