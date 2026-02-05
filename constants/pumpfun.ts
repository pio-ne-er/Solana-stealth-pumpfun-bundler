import { PublicKey } from "@solana/web3.js"

const GlobalAccount = {
  initialized: true,
  discriminator: 9183522199395952807n,
  authority: new PublicKey("DCpJReAfonSrgohiQbTmKKbjbqVofspFRHz9yQikzooP"),
  feeRecipient: new PublicKey("CebN5WGQ4jvEPvsVU4EoHEpgzq1VV7AbicfhtW4xC9iM"),
  initialVirtualTokenReserves: 1073000000000000n,
  initialVirtualSolReserves: 30000000000n,
  initialRealTokenReserves: 793100000000000n,
  tokenTotalSupply: 1000000000000000n,
  feeBasisPoints: 100n
}

export {
  GlobalAccount
}

export const global_mint = new PublicKey("p89evAyzjd9fphjJx7G3RFA48sbZdpGEppRcfRNpump")
export const PUMP_PROGRAM = new PublicKey("6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P");