export const getNetworkName = () => {
  const network = process.env.NEXT_PUBLIC_SUI_NETWORK!;
  if (network.includes("mainnet")) {
    return "mainnet";
  }
  if (network.includes("testnet")) {
    return "testnet";
  }
  if (network.includes("devnet")) {
    return "devnet";
  }
  return "localnet";
};
