import { Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { balancesWaiting, logToFile } from "../src/msgLog";
import base58 from "bs58";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { readJson } from "../src/util";
import { connection } from "../config";
import { Bundler_provider_wallet_keypair, distNum, LP_wallet_keypair, token } from "../settings";
import { outputBalance } from "../utils";

export const show_holders = async () => {

    const mintKpStr = token.mintPk
    if (!mintKpStr) {
        return;
    }

    const mintkP = Keypair.fromSecretKey(base58.decode(mintKpStr))
    const mintAddress = mintkP.publicKey

    logToFile(`Loaded token Address : ${mintAddress.toBase58()}`);

    let holderWallets: string[] = []
    let bundlerWallets: string[] = []
    holderWallets = readJson("holders.json")
    bundlerWallets = readJson("bundlers.json")

    logToFile(`${holderWallets.length} Holders Loaded`);

    try {
        let totalBundlerTokenBalance = 0
        for (let i = 0; i < holderWallets.length; i++) {
            const kp = Keypair.fromSecretKey(bs58.decode(holderWallets[i]))
            const solBal = (await connection.getBalance(kp.publicKey, "processed")) / LAMPORTS_PER_SOL
            try {
                const tokenAta = getAssociatedTokenAddressSync(mintAddress, kp.publicKey)
                // const wsolAta = await getAssociatedTokenAddress(new PublicKey(WSOL.mint), kp.publicKey)
                const tokenBal = (await connection.getTokenAccountBalance(tokenAta, "processed")).value.uiAmount
                totalBundlerTokenBalance += tokenBal!
                // const wsolBal = await (await connection.getTokenAccountBalance(wsolAta)).value.uiAmount
                logToFile(`  Balance of holder${(i) % distNum + 1} ${kp.publicKey.toBase58()} -> Sol: ${solBal}sol, Token: ${Math.round(Number(tokenBal))}  ${token.symbol}, ${tokenBal! * 100 / 10 ** 9}%`)
            } catch (err) {
                logToFile(`  Balance of holder${(i) % distNum + 1} ${kp.publicKey.toBase58()} -> Sol: ${solBal}sol`)
            }

            if ((i) % distNum == (distNum - 1)) {
                try {
                    const bundler = Keypair.fromSecretKey(bs58.decode(bundlerWallets[i / distNum]))
                    const bundlerAta = getAssociatedTokenAddressSync(mintAddress, bundler.publicKey)
                    const bundlerBalance = (await connection.getTokenAccountBalance(bundlerAta, "processed")).value.uiAmount
                    totalBundlerTokenBalance += bundlerBalance!
                    logToFile(`Bundler ${Math.floor(i / distNum) + 1} => ${totalBundlerTokenBalance * 100 / 10 ** 9}%`)
                } catch (error) {
                    logToFile(`Bundler ${Math.floor(i / distNum) + 1} => ${totalBundlerTokenBalance * 100 / 10 ** 9}%`)
                }
                totalBundlerTokenBalance = 0
            }
        }
    } catch (err) {
        logToFile("Fail to get the balance of holder wallets. Please retry...")
        balancesWaiting()
    }

    await outputBalance(LP_wallet_keypair.publicKey)
    await outputBalance(Bundler_provider_wallet_keypair.publicKey)
    balancesWaiting()
}