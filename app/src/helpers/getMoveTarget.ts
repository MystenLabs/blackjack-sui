
const getMoveTarget = (pkg: string, fun: string) => `${process.env.NEXT_PUBLIC_PACKAGE_ADDRESS}::${pkg}::${fun}`;

export default getMoveTarget;