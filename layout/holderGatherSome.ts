import bs58 from "bs58"
import {
  ComputeBudgetProgram,
  Keypair,
  Transaction,
} from "@solana/web3.js"
import {
  createTransferCheckedInstruction,
  getAssociatedTokenAddressSync
} from "@solana/spl-token";
import { sendAndConfirmTransaction } from "@solana/web3.js";
import { bundlerWalletName, distNum, holderWalletName, token } from "../settings";
import { rl } from "../menu/menu";
import { readBundlerWallets, readHolderWallets, readJson, sleep } from "../src/util";
import { logToFile, tokenHoldersWaiting } from "../src/msgLog";
import { connection } from "../config";

export const holder_gather_some = async () => {
  try {
    const bundlerWallets: string[] = readBundlerWallets(bundlerWalletName)
    const holderWallets = readHolderWallets(holderWalletName)
    const data = token.mintPk
    const baseMint = Keypair.fromSecretKey(bs58.decode(data)).publicKey

    rl.question("\t[Bundlers] - Bundler wallets to gather tokens (if you want to go back, press c and press enter): ", async (answer: string) => {

      if (answer == 'c') tokenHoldersWaiting()

      const numberStrings = answer.split(/\s+/); // This regex handles multiple spaces between numbers
      const numbers = numberStrings.map(numStr => Number(numStr)).filter(num => !isNaN(num));
      const selectedBundlerWallets = numbers.map(index => bundlerWallets[index - 1]);

      selectedBundlerWallets.map(async (bundler: string, i) => {
        const kp = Keypair.fromSecretKey(bs58.decode(bundler))
        const tokenAta = getAssociatedTokenAddressSync(baseMint, kp.publicKey)
        const balance = (await connection.getTokenAccountBalance(tokenAta)).value.uiAmount

        logToFile(`Balance of bundler ${numbers[i]}: ${balance}`)

        const subHolderWallets = holderWallets.slice(distNum * (numbers[i] - 1), distNum * numbers[i])
        const holderKps = subHolderWallets.map((privateKey: string) => Keypair.fromSecretKey(bs58.decode(privateKey)))

        let batchSize = 5
        let batchNum = Math.ceil(distNum / batchSize)

        for (let k = 0; k < batchNum; k++) {
          const signers = holderKps.slice(k * batchSize, (k + 1) * batchSize > distNum ? distNum : (k + 1) * batchSize)
          const tx = new Transaction().add(
            ComputeBudgetProgram.setComputeUnitLimit({ units: 200_000 }),
            ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1_000_000 })
          )
          for (let j = 0; j < batchSize; j++) {
            if ((k * batchSize + j) == distNum) break;
            let index = k * batchSize + j
            const srcAta = getAssociatedTokenAddressSync(baseMint, holderKps[index].publicKey)
            const amount = (await connection.getTokenAccountBalance(srcAta)).value.amount
            const tokenDecimal = (await connection.getTokenAccountBalance(srcAta)).value.decimals

            tx.add(
              createTransferCheckedInstruction(
                srcAta,
                baseMint,
                tokenAta,
                holderKps[index].publicKey,
                Math.floor(Number(amount)),
                tokenDecimal
              )
            )
          }
          tx.feePayer = kp.publicKey
          // console.log(await connection.simulateTransaction(tx))
          const sig = await sendAndConfirmTransaction(connection, tx, [kp, ...signers])
          if (sig) {
            logToFile(`Success gather to bundler ${numbers[i]}: https://solscan.io/tx/${sig}`)
          }

        }

      })
      await sleep(20000)
      tokenHoldersWaiting()
    })

  } catch (error) {
    console.log("Error in gather token to bundler: ", error)
    tokenHoldersWaiting()
  }

}