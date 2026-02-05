import { ComputeBudgetProgram, Keypair, LAMPORTS_PER_SOL, SystemProgram, Transaction, TransactionInstruction, TransactionMessage, VersionedTransaction } from "@solana/web3.js";
import { Bundler_provider_wallet_keypair, bundlerWalletName } from "../settings"
import bs58 from 'bs58'
import { rl, screen_clear } from "../menu/menu";
import { gatherWaiting, logToFile } from "../src/msgLog";
import { readBundlerWallets, sleep } from "../src/util";
import { connection } from "../config";
import { execute } from "../executor/legacy";
import { outputBalance } from "../utils";

export const each_sol_gather = async () => {
  screen_clear()
  logToFile(`Gathering sol from one of bundler wallets...`);

  const savedWallets = readBundlerWallets(bundlerWalletName)
  // console.log("🚀 ~ savedWallets: ", savedWallets)

  const walletKPs : Keypair[] = savedWallets.map((wallet: string) => Keypair.fromSecretKey(bs58.decode(wallet)));

  rl.question("\t[Bundler] - Bundler wallet to gather sol (if you want to go back, press c and press enter): ", async (answer: string) => {
    if (answer == 'c') {
      gatherWaiting()
      return
    }

    const walletIndex = parseInt(answer)
    let solBalance = await connection.getBalance(walletKPs[walletIndex - 1].publicKey)

    logToFile(`Balance of the wallet${walletIndex} SOL : ${solBalance / LAMPORTS_PER_SOL}sol`)

    rl.question("\t[Wsol Amount] - Please input the amount of sol to gather (if you want to go back, press c and press enter): ", async (answer: string) => {
      if (answer == 'c') {
        gatherWaiting()
        return
      }

      const solAmount = parseFloat(answer)
      const sendWsolTx: TransactionInstruction[] = []
      sendWsolTx.push(
        ComputeBudgetProgram.setComputeUnitLimit({ units: 100_000 }),
        ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 750_000 }),
        SystemProgram.transfer({
          fromPubkey : walletKPs[walletIndex - 1].publicKey,
          toPubkey : Bundler_provider_wallet_keypair.publicKey,
          lamports : BigInt(solAmount * LAMPORTS_PER_SOL)
        })
      )

      let index = 0
      while (true) {
        try {
          if (index > 3) {
            logToFile("Error in gathering wsol. Please retry gathering.")
            gatherWaiting()
            return
          }
          const siTx = new Transaction().add(...sendWsolTx)
          const latestBlockhash = await connection.getLatestBlockhash()
          siTx.feePayer = Bundler_provider_wallet_keypair.publicKey
          siTx.recentBlockhash = latestBlockhash.blockhash
          const messageV0 = new TransactionMessage({
            payerKey: Bundler_provider_wallet_keypair.publicKey,
            recentBlockhash: latestBlockhash.blockhash,
            instructions: sendWsolTx,
          }).compileToV0Message()
          const transaction = new VersionedTransaction(messageV0)
          const signers = [walletKPs[walletIndex - 1]]
          transaction.sign(signers)
          transaction.sign([Bundler_provider_wallet_keypair])
          console.log(await connection.simulateTransaction(transaction))
          const txSig = await execute(transaction, latestBlockhash, 1)
          const tokenBuyTx = txSig ? `https://solscan.io/tx/${txSig}` : ''
          if (txSig) {
            logToFile(`WSOL gathered from bundler ${walletIndex}: ${tokenBuyTx}`)
          }
          break
        } catch (error) {
          index++
          console.log(error)
        }
      }
      await sleep(5000)
      await outputBalance(Bundler_provider_wallet_keypair.publicKey)
      gatherWaiting()
    })
  })
}
