import bs58 from "bs58"
import {
  Keypair,
} from "@solana/web3.js"
import {
  getAssociatedTokenAddressSync
} from "@solana/spl-token";
import { bundlerWalletName, distNum, holderWalletName, remaining_token_percent, token } from "../settings";
import { readBundlerWallets, readHolderWallets, readJson, sleep } from "../src/util";
import { connection } from "../config";
import { generateDistribution } from "../src/distribute";
import { tokenHoldersWaiting } from "../src/msgLog";
import { newSendToken } from "../src/sendBulkToken";

export const holder_distribute = async () => {
  try {
    const bundlerWallets: string[] = readBundlerWallets(bundlerWalletName)
    const holderWallets = readHolderWallets(holderWalletName)
    const data = token.mintPk
    const baseMint = Keypair.fromSecretKey(bs58.decode(data)).publicKey

    for (let i = 0; i < bundlerWallets.length; i++) {
      const kp = Keypair.fromSecretKey(bs58.decode(bundlerWallets[i]))
      const tokenAta = getAssociatedTokenAddressSync(baseMint, kp.publicKey)
      const balance = (await connection.getTokenAccountBalance(tokenAta)).value.uiAmount
      const minVal = Math.floor(balance! / distNum / 2)
      const maxVal = Math.floor(balance! * 2 / distNum)
      let numTokenArray = generateDistribution(balance! * (1 - remaining_token_percent / 100), minVal, maxVal, distNum, "odd")

      const subHolderWallets = holderWallets.slice(distNum * i, distNum * (i + 1))
      const holderSks = subHolderWallets.map((privateKey: string) => Keypair.fromSecretKey(bs58.decode(privateKey)))
      await newSendToken(holderSks, numTokenArray, kp, baseMint, 6, i)
      // logToFile(`Successfully transferred tokens from bundler ${i}`)
    }

    await sleep(10000)
    tokenHoldersWaiting()
  } catch (error) {
    console.log("Failed to transfer the tokens to holder wallets.", error)
    tokenHoldersWaiting()
  }
}