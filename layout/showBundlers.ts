import { Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { balancesWaiting, logToFile } from "../src/msgLog";
import bs58 from "bs58";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { readBundlerWallets, readJson } from "../src/util";
import { connection } from "../config";
import { Bundler_provider_wallet_keypair, bundlerWalletName, LP_wallet_keypair, token } from "../settings";
import { outputBalance } from "../utils";

export const show_bundlers = async () => {

  const mintKpStr = token.mintPk
  const mintkP = Keypair.fromSecretKey(bs58.decode(mintKpStr))
  const mintAddress = mintkP.publicKey

  logToFile(`Loaded token Address : ${mintAddress.toBase58()}`);

  let bundlerWallets: string[] = []
  bundlerWallets = readBundlerWallets(bundlerWalletName)

  logToFile(`${bundlerWallets.length} Bundlers Loaded`);
  try {
    for (let i = 0; i < bundlerWallets.length; i++) {
      const kp = Keypair.fromSecretKey(bs58.decode(bundlerWallets[i]))
      const solBal = (await connection.getBalance(kp.publicKey)) / LAMPORTS_PER_SOL
      try {
        const tokenAta = await getAssociatedTokenAddress(mintAddress, kp.publicKey)
        const tokenBal = (await connection.getTokenAccountBalance(tokenAta)).value.uiAmount
        logToFile(`Balance of bundler${i + 1} ${kp.publicKey.toBase58()}=> Sol: ${solBal}sol, Token: ${tokenBal}  ${token.symbol}, ${tokenBal! * 100 / 10 ** 9}%`)
      } catch (err) {
        logToFile(`Balance of bundler${i + 1} ${kp.publicKey.toBase58()}=> Sol: ${solBal}sol`)
      }

    }
  } catch (err) {
    logToFile("Fail to get the balance of bundler wallets. Please retry...")
    balancesWaiting()
  }

  await outputBalance(LP_wallet_keypair.publicKey)
  await outputBalance(Bundler_provider_wallet_keypair.publicKey)
  balancesWaiting()
}