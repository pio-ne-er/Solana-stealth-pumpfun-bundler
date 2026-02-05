import { ComputeBudgetProgram, Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction, TransactionInstruction, TransactionMessage, VersionedTransaction } from "@solana/web3.js";
import { batchSize, Bundler_provider_wallet_keypair, bundlerWalletName, bundleWalletNum, token } from "../settings"
import bs58 from 'bs58'
import { screen_clear } from "../menu/menu";
import { gatherWaiting, logToFile } from "../src/msgLog";
import { readBundlerWallets } from "../src/util";
import { connection } from "../config";
import { execute } from "../executor/legacy";
import { outputBalance } from "../utils";
import { createAssociatedTokenAccountIdempotentInstruction, createCloseAccountInstruction, createTransferCheckedInstruction, getAssociatedTokenAddress } from "@solana/spl-token";

export const sol_gather = async () => {
  screen_clear()
  logToFile(`Gathering Sol from ${bundleWalletNum} bundler wallets...`);

  const savedWallets = readBundlerWallets(bundlerWalletName)
  // console.log("🚀 ~ savedWallets: ", savedWallets)

  const walletKPs = savedWallets.map((wallet: string) => Keypair.fromSecretKey(bs58.decode(wallet)));
  const batchNum = Math.ceil(bundleWalletNum / batchSize)
  let successNum = 0

  try {
    for (let i = 0; i < batchNum; i++) {
      console.log(i);
      const sendSolTx: TransactionInstruction[] = []
      sendSolTx.push(
        ComputeBudgetProgram.setComputeUnitLimit({ units: 100_000 }),
        ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 750_000 })
      )
      for (let j = 0; j < batchSize; j++) {

        let solAmount = await connection.getBalance(walletKPs[i * batchSize + j].publicKey)
        if (solAmount > 0) {
          let tokenAmount = 0
          const mintKpStr = token.mintPk
          const mint = (Keypair.fromSecretKey(bs58.decode(mintKpStr))).publicKey
          const mainAta = await getAssociatedTokenAddress(mint, Bundler_provider_wallet_keypair.publicKey)
          const baseAta = await getAssociatedTokenAddress(mint, walletKPs[i * batchSize + j].publicKey)
          if ((i * batchSize + j) >= bundleWalletNum) continue;
          if (await connection.getAccountInfo(baseAta)) {
            tokenAmount = Number((await connection.getTokenAccountBalance(baseAta)).value.amount)
            if (tokenAmount !== 0) {
              if (!(await connection.getAccountInfo(mainAta))) {
                sendSolTx.push(
                  createAssociatedTokenAccountIdempotentInstruction(
                    Bundler_provider_wallet_keypair.publicKey,
                    mainAta,
                    Bundler_provider_wallet_keypair.publicKey,
                    mint
                  )
                )
              }
              sendSolTx.push(
                createTransferCheckedInstruction(
                  baseAta, mint, mainAta, walletKPs[i * batchSize + j].publicKey, tokenAmount, 6
                )
              )
            }
            sendSolTx.push(
              createCloseAccountInstruction(
                baseAta,
                Bundler_provider_wallet_keypair.publicKey,
                walletKPs[i * batchSize + j].publicKey
              )
            )
          }
          sendSolTx.push(
            SystemProgram.transfer({
              fromPubkey: walletKPs[i * batchSize + j].publicKey,
              toPubkey: Bundler_provider_wallet_keypair.publicKey,
              lamports: Math.floor(solAmount)
            })
          )
        }
      }
      let index = 0
      while (true) {
        try {
          if (index > 3) {
            logToFile("Error in gathering sol. Please retry gathering.")
            gatherWaiting()
            return
          }
          const siTx = new Transaction().add(...sendSolTx)
          const latestBlockhash = await connection.getLatestBlockhash()
          siTx.feePayer = Bundler_provider_wallet_keypair.publicKey
          siTx.recentBlockhash = latestBlockhash.blockhash
          const messageV0 = new TransactionMessage({
            payerKey: Bundler_provider_wallet_keypair.publicKey,
            recentBlockhash: latestBlockhash.blockhash,
            instructions: sendSolTx,
          }).compileToV0Message()
          const transaction = new VersionedTransaction(messageV0)
          const signers = walletKPs.slice(i * batchSize, bundleWalletNum > (i + 1) * batchSize ? (i + 1) * batchSize : bundleWalletNum)
          transaction.sign(signers)
          transaction.sign([Bundler_provider_wallet_keypair])
          console.log(await connection.simulateTransaction(transaction, { sigVerify: true }))
          const txSig = await execute(transaction, latestBlockhash, 1)
          const tokenBuyTx = txSig ? `https://solscan.io/tx/${txSig}` : ''
          if (txSig) {
            successNum++
            logToFile(`SOL gathered from bundler ${batchSize * i + 1}, ${batchSize * i + 2}, ${batchSize * i + 3}, ${batchSize * i + 4}, ${batchSize * i + 5}: ${tokenBuyTx}`)
          }
          break
        } catch (error) {
          index++
          // console.log(error)
        }
      }
    }
    console.log(`Number of successful gathering: ${successNum}`)
    if (successNum == batchNum) logToFile("Successfully gathered sol from bundler wallets!")
  } catch (error) {
    logToFile(`Failed to transfer SOL ${error}`)
  }
  await outputBalance(Bundler_provider_wallet_keypair.publicKey)
  gatherWaiting()
}
