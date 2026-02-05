import { Keypair } from "@solana/web3.js";
import { screen_clear } from "../menu/menu";
import { logToFile, tokenLaunchWaiting } from "../src/msgLog";
import base58 from "bs58";
import { bundleWalletNum, distNum, holderCreateInterval, holderWalletName } from "../settings";
import { saveBundlerWalletsToFile, sleep } from "../src/util";

export const holder_create = async () => {
  screen_clear()
  logToFile("creating holder wallets")

  const distWallets: string[] = []
  try {
    for (let i = 0; i < bundleWalletNum * distNum; i++) {

      await sleep(holderCreateInterval * 1000)
      
      const kp = Keypair.generate()
      distWallets.push(base58.encode(kp.secretKey))
    }
    saveBundlerWalletsToFile(
      distWallets, holderWalletName
    )
    for (let i = 0; i < bundleWalletNum; i++) {
      logToFile(`Bundler ${i + 1} => `)
      for (let j = 0; j < distNum; j++) {
        logToFile(`  Holder ${j + 1}: ${distWallets[i * distNum + j]}`)
      }
    }
  } catch (err) { }

  tokenLaunchWaiting()
}
