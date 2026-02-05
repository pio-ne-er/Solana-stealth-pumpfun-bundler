import { VersionedTransaction, Keypair, SystemProgram, Connection, TransactionInstruction, TransactionMessage, PublicKey } from "@solana/web3.js"
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { AnchorProvider } from "@coral-xyz/anchor";
import base58 from "bs58"
import { rl } from "../menu/menu";
import { logToFile, sellBuyWaiting } from "../src/msgLog";
import { batchSize, Bundler_provider_wallet_keypair, bundleWalletNum, LP_wallet_keypair, token } from "../settings";
import { executeJitoTx } from "../executor/jito";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { PumpFunSDK } from "../src/pumpfun/pumpfun";
import { getSPLBalance, readJson, sleep } from "../src/util";
import { connection, JITO_FEE } from "../config";
import { readLUTAddressFromFile } from "../utils";
import { sendBundle } from "../executor/lilJito";

export const manual_part_sell = async () => {

    console.log("manual_part_sell");

    await percentBundleSell()

    sellBuyWaiting()
}

let sdk = new PumpFunSDK(new AnchorProvider(connection, new NodeWallet(new Keypair()), { commitment: "confirmed" }));

const percentBundleSell = async () => {
    try {
        const mintKpStr = token.mintPk
        if (!mintKpStr) {
            return;
        }

        const mintkP = Keypair.fromSecretKey(base58.decode(mintKpStr))
        const mintAddress = mintkP.publicKey

        logToFile(`Loaded token Address : ${mintAddress.toBase58()}`);

        let walletKPs: Keypair[] = []
        walletKPs = readJson("bundlers.json").map((kpStr: string) => Keypair.fromSecretKey(base58.decode(kpStr)))

        logToFile(`${walletKPs.length} Bundlers Loaded`);

        const lutAddress = readLUTAddressFromFile()
        if (!lutAddress) {
            return
        }

        const lookupTable = (await connection.getAddressLookupTable(new PublicKey(lutAddress))).value;
        if (!lookupTable) {
            return
        }

        logToFile(`LUT is loaded ${lutAddress}`);

        logToFile(`Main Wallet Address: ${LP_wallet_keypair.publicKey.toString()}`);
        logToFile(`Bundler Wallet Address: ${Bundler_provider_wallet_keypair.publicKey.toString()}`);

        let totalTokenBalance = 0
        for (let i = 0; i < bundleWalletNum; i++) {
            const baseAta = await getAssociatedTokenAddress(mintAddress, walletKPs[i].publicKey)
            // Check if the token account actually exists
            const accountInfo = await connection.getAccountInfo(baseAta);
            if (!accountInfo) {
                console.log(`Wallet ${i} has no token account.`);
                continue;
            }

            const tokenBalance = (await connection.getTokenAccountBalance(baseAta)).value.uiAmount
            if (tokenBalance) totalTokenBalance = totalTokenBalance + tokenBalance
        }
        logToFile(`Total Token Balance: ${totalTokenBalance}`)
        logToFile("Please input the % of the token to sell.")

        rl.question("\t[Percent of total supply] - Sell Amount (if you want to go back, press c and press enter) : ", async (answer: string) => {

            if (answer == 'c') {
                sellBuyWaiting()
                return
            }

            let sellPercentAmount = parseFloat(answer);

            const sellIxs: TransactionInstruction[] = []
            for (let i = 0; i < bundleWalletNum; i++) {
                const sellAmount = await getSPLBalance(connection, mintAddress, walletKPs[i].publicKey)
                if (!sellAmount) continue
                const ix = await makeSellIx(walletKPs[i], Math.floor(sellPercentAmount * sellAmount * 10 ** 6 / 100), mintAddress, i)
                sellIxs.push(...ix)
            }
            console.log("🚀 ~ percentBundleSell ~ sellIxs:", sellIxs.length)
            logToFile(`Sell Instructions are ready`);

            if (!lookupTable) {
                logToFile("Lookup table not ready")
                return
            }

            const latestBlockhash = await connection.getLatestBlockhash()
            const transactions: VersionedTransaction[] = [];
            const jitofeeixs = await jitoTxsignature(Bundler_provider_wallet_keypair);

            const jitoTx = new VersionedTransaction(
                new TransactionMessage({
                    payerKey: Bundler_provider_wallet_keypair.publicKey,
                    recentBlockhash: latestBlockhash.blockhash,
                    instructions: jitofeeixs
                }).compileToV0Message()
            )
            transactions.push(jitoTx)

            // const latestBlockhash = await connection.getLatestBlockhash()
            for (let i = 0; i < Math.ceil(bundleWalletNum / batchSize); i++) {
                const instructions: TransactionInstruction[] = [];

                for (let j = 0; j < batchSize; j++) {
                    const index = i * batchSize + j
                    if (walletKPs[index])
                        instructions.push(sellIxs[index * 2], sellIxs[index * 2 + 1])
                }

                transactions.push(new VersionedTransaction(
                    new TransactionMessage({
                        payerKey: Bundler_provider_wallet_keypair.publicKey,
                        recentBlockhash: latestBlockhash.blockhash,
                        instructions: instructions
                    }).compileToV0Message([lookupTable])
                ))
                await sleep(1000);
            }

            transactions[0].sign([Bundler_provider_wallet_keypair])
            for (let j = 1; j < transactions.length; j++) {
                transactions[j].sign([Bundler_provider_wallet_keypair])
                for (let i = 0; i < batchSize; i++) {
                    transactions[j].sign([walletKPs[(j - 1) * batchSize + i]])
                }
                // console.log(await connection.simulateTransaction(transactions[j]));
            }

            // const res = await executeJitoTx(transactions, Bundler_provider_wallet_keypair, "confirmed")
            const res = await sendBundle(transactions)
            await sleep(10000)

            if (res == null)
                logToFile("sell is failed")
            else
                logToFile("sell is successed jito tx:" + res)

            sellBuyWaiting()
        })
    } catch (e) {
        // logToFile(e);
        logToFile("You don't create token and buy yet.\nfirst you have to go step 1\n")
        sellBuyWaiting()
    }
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
        "confirmed"
    );
    return sellIx
}