import bs58 from "bs58"
import {
  ComputeBudgetProgram,
  Connection,
  Keypair,
  PublicKey,
  Transaction,
} from "@solana/web3.js"
import {
  createCloseAccountInstruction,
  createTransferCheckedInstruction,
  getAssociatedTokenAddressSync
} from "@solana/spl-token";
import { sendAndConfirmTransaction } from "@solana/web3.js";
import { bundlerWalletName, distNum, holderWalletName, token } from "../settings";
import { connection } from "../config";
import { readBundlerWallets, readHolderWallets, readJson, sleep } from "../src/util";
import { logToFile, tokenHoldersWaiting } from "../src/msgLog";

export const holder_gather_all = async () => {
  try {
    const bundlerWallets: string[] = readBundlerWallets(bundlerWalletName)
    const holderWallets = readHolderWallets(holderWalletName)
    const data = token.mintPk
    const baseMint = Keypair.fromSecretKey(bs58.decode(data)).publicKey

    bundlerWallets.map(async (bundler: string, i) => {
      const kp = Keypair.fromSecretKey(bs58.decode(bundler))
      const tokenAta = getAssociatedTokenAddressSync(baseMint, kp.publicKey)
      const balance = (await connection.getTokenAccountBalance(tokenAta)).value.uiAmount

      logToFile(`Balance of bundler ${i + 1}: ${balance}`)
      
      const subHolderWallets = holderWallets.slice(distNum * i, distNum * (i + 1))
      logToFile(`Holder wallet from ${distNum * i}, ${distNum * (i + 1)}`)

      const holderKps = subHolderWallets.map((privateKey: string) => Keypair.fromSecretKey(bs58.decode(privateKey)))

      let batchSize = 5
      let batchNum = Math.ceil(distNum / batchSize)

      for (let k = 0; k < batchNum; k++) {
        const signers = holderKps.slice(k * batchSize, (k + 1) * batchSize > distNum ? distNum : (k + 1) * batchSize)
        // signers.forEach((element : Keypair) => {
        //     console.log(element.publicKey);
        // });
        const tx = new Transaction().add(
          ComputeBudgetProgram.setComputeUnitLimit({ units: 200_000 }),
          ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1_000_000 })
        )

        for (let j = 0; j < batchSize; j++) {
          if ((k * batchSize + j) == distNum) break;
          let index = (k * batchSize + j)
          const srcAta = getAssociatedTokenAddressSync(baseMint, holderKps[index].publicKey)
          let amount;
          let tokenDecimal;
          try {
            amount = (await connection.getTokenAccountBalance(srcAta)).value.amount
            tokenDecimal = (await connection.getTokenAccountBalance(srcAta)).value.decimals
          } catch (error) {
            continue;
          }

          tx.add(
            createTransferCheckedInstruction(
              srcAta,
              baseMint,
              tokenAta,
              holderKps[index].publicKey,
              Math.floor(Number(amount)),
              tokenDecimal
            ),
            createCloseAccountInstruction(
              srcAta,
              kp.publicKey,
              holderKps[index].publicKey,
            )
          )
        }
        tx.feePayer = kp.publicKey
        // console.log(await connection.simulateTransaction(tx))
        const sig = await sendAndConfirmTransaction(connection, tx, [kp, ...signers])
        if (sig) logToFile(`Success gather to bundler ${i + 1}: https://solscan.io/tx/${sig}`)
      }
    })

    await sleep(5000)
    tokenHoldersWaiting()
  } catch (error) {
    tokenHoldersWaiting()
    console.log("Error in gather token to bundler: ", error)
  }

}