import { VersionedTransaction, Keypair, SystemProgram, Connection, TransactionInstruction, TransactionMessage, PublicKey, ComputeBudgetProgram } from "@solana/web3.js"
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { AnchorProvider } from "@coral-xyz/anchor";
import { getAssociatedTokenAddress, getMint } from "@solana/spl-token";
import base58 from "bs58"

import { rl } from "../menu/menu";
import { manual_each_sell } from "../layout";
import { connection, JITO_FEE } from "../config";
import { PumpFunSDK } from "./pumpfun/pumpfun";
import { getSPLBalance, readJson } from "./util";
import { logToFile, sellBuyWaiting } from "./msgLog";
import { bundleWalletNum, token } from "../settings";
import { executeVersionedTx } from "../utils";

const commitment = "confirmed"

let sdk = new PumpFunSDK(new AnchorProvider(connection, new NodeWallet(new Keypair()), { commitment }));

const eachBundleSell = async () => {
    const mintKpStr = token.mintPk
    if (!mintKpStr) {
        return;
    }

    const mintkP = Keypair.fromSecretKey(base58.decode(mintKpStr))
    const mintAddress = mintkP.publicKey
    let bundlerWallets: Keypair[] = []
    bundlerWallets = readJson("bundlers.json").map(ele => Keypair.fromSecretKey(base58.decode(ele)))

    logToFile(`${bundlerWallets.length} Bundlers Loaded`);
    let totalTokenBalance = 0

    for (let i = 0; i < bundleWalletNum; i++) {
        const baseAta = await getAssociatedTokenAddress(mintAddress, bundlerWallets[i].publicKey)
        // Check if the token account actually exists
        const accountInfo = await connection.getAccountInfo(baseAta);
        if (!accountInfo) {
            console.log(`Wallet ${i} has no token account.`);
            continue;
        }

        const tokenBalance = await connection.getTokenAccountBalance(baseAta)
        const tokenAmount = tokenBalance.value.uiAmount
        if (tokenAmount) totalTokenBalance = totalTokenBalance + tokenAmount
    }
    logToFile(`Total Token Balance: ${totalTokenBalance}`)
    logToFile("Please input the numbers of bundler wallets to sell.")

    rl.question("\t[Number of bundler wallets] - (if you want to go back, press c and press enter) : ", async (answer: string) => {

        if (answer == 'c') {
            sellBuyWaiting()
            return
        }

        const numberStrings = answer.split(/\s+/); // This regex handles multiple spaces between numbers
        const numbers = numberStrings.map(numStr => Number(numStr)).filter(num => !isNaN(num));
        const selectedBundlerWallets: Keypair[] = numbers.map(index => bundlerWallets[index - 1]);

        rl.question("\t[Percentage of wallet to Sell] - (if you want to go back, press c and press enter) : ", async (answer: string) => {
            if (answer == 'c') {
                manual_each_sell()
                return
            }
            const percent = Number(answer) / 100

            const buyRecentBlockhash = (await connection.getLatestBlockhash().catch(async () => {
                return await connection.getLatestBlockhash().catch(getLatestBlockhashError => {
                    console.log({ getLatestBlockhashError })
                    return null
                })
            }))?.blockhash;

            if (!buyRecentBlockhash) return { Err: "Failed to prepare transaction" }

            for (let i = 0; i < selectedBundlerWallets.length; i++) {
                logToFile(`\nProcessing bundler ${i + 1} ...`)
                const ixs: TransactionInstruction[] = [
                    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 744_452 }),
                    ComputeBudgetProgram.setComputeUnitLimit({ units: 1_183_504 })
                ]
                const sellAmount = await getSPLBalance(connection, mintAddress, selectedBundlerWallets[i].publicKey)
                console.log(sellAmount);
                if (!sellAmount) continue
                const ix = await makeSellIx(selectedBundlerWallets[i], Math.floor(percent * sellAmount * 10 ** 6), mintAddress, i)
                ixs.push(...ix)

                const buyRecentBlockhash = (await connection.getLatestBlockhash().catch(async () => {
                    return await connection.getLatestBlockhash().catch(getLatestBlockhashError => {
                        console.log({ getLatestBlockhashError })
                        return null
                    })
                }))?.blockhash;

                if (!buyRecentBlockhash) return { Err: "Failed to prepare transaction" }
                const swapVersionedTransaction = new VersionedTransaction(
                    new TransactionMessage({
                        payerKey: selectedBundlerWallets[i].publicKey,
                        recentBlockhash: buyRecentBlockhash,
                        instructions: ixs,
                    }).compileToV0Message()
                );
                logToFile(`Transaction size with address lookuptable: ${swapVersionedTransaction.serialize().length}bytes`);

                swapVersionedTransaction.sign([selectedBundlerWallets[i]])

                logToFile("-------- swap coin instructions [DONE] ---------")

                console.log((await connection.simulateTransaction(swapVersionedTransaction)))

                const buySig = await executeVersionedTx(swapVersionedTransaction)
                const tokenBuyTx = `https://solscan.io/tx/${buySig}`
                logToFile(`Token sold: ${tokenBuyTx}`)
            }

            sellBuyWaiting()

        })
    })
}

// jito FEE
const jitoTxsignature = async (mainKp: Keypair) => {
    const ixs: TransactionInstruction[] = []
    const tipAccounts = [
        'Cw8CFyM9FkoMi7K7Crf6HNQqf4uEMzpKw6QNghXLvLkY',
        'DttWaMuVvTiduZRnguLF7jNxTgiMBZ1hyAumKUiL2KRL',
        '96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5',
        '3AVi9Tg9Uo68tJfuvoKvqKNWKkC5wPdSSdeBnizKZ6jT',
        'HFqU5x63VTqvQss8hp11i4wVV8bD44PvwucfZ2bU7gRe',
        'ADaUMid9yfUytqMBgopwjb2DTLSokTSzL1zt6iGPaS49',
        'ADuUkR4vqLUMWXxW9gh6D6L8pMSawimctcNZ5pGwDcEt',
        'DfXygSm4jCyNCybVYYK6DwvWqjKee8pbDmJGcLWNDXjh',
    ];
    const jitoFeeWallet = new PublicKey(tipAccounts[Math.floor(tipAccounts.length * Math.random())])
    ixs.push(SystemProgram.transfer({
        fromPubkey: mainKp.publicKey,
        toPubkey: jitoFeeWallet,
        lamports: Math.floor(JITO_FEE),
    }))
    return ixs
}
// make sell instructions
const makeSellIx = async (kp: Keypair, sellAmount: number, mintAddress: PublicKey, index: number) => {
    let sellIx = await sdk.getSellInstructionsByTokenAmount(
        kp.publicKey,
        mintAddress,
        BigInt(sellAmount),
        BigInt(1000),
        commitment
    );
    return sellIx
}

export {
    eachBundleSell
}