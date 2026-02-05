import { ComputeBudgetProgram, Keypair, PublicKey, TransactionInstruction, TransactionMessage, VersionedTransaction } from "@solana/web3.js";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { AnchorProvider } from "@coral-xyz/anchor";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { batchSize, Bundler_provider_wallet_keypair, bundlerWalletName, bundleWalletNum, PRIORITY_FEE, token } from "../settings";
import { logToFile, sellBuyWaiting } from "../src/msgLog";
import { readBundlerWallets } from "../src/util";
import { readLUTAddressFromFile } from "../utils";
import { connection } from "../config";
import { rl } from "../menu/menu";
import { PumpFunSDK } from "../src/pumpfun/pumpfun";
import bs58 from 'bs58'

let sdk = new PumpFunSDK(new AnchorProvider(connection, new NodeWallet(new Keypair()), { commitment: "confirmed" }));
const transactions: VersionedTransaction[] = []
const baseMint = (Keypair.fromSecretKey(bs58.decode(token.mintPk))).publicKey

export async function manual_rebuy() {
    const wallets = readBundlerWallets(bundlerWalletName)
    const lutAddress = readLUTAddressFromFile()
    const walletKPs = wallets.map((ele: string) => Keypair.fromSecretKey(bs58.decode(ele)))

    const lookupTableAddress = new PublicKey(lutAddress!);
    const lookupTable = (await connection.getAddressLookupTable(lookupTableAddress)).value;

    logToFile(`Bundler Wallet Address: ${Bundler_provider_wallet_keypair.publicKey.toString()}`);

    let totalTokenBalance = 0

    for (let i = 0; i < bundleWalletNum; i++) {
        const baseAta = await getAssociatedTokenAddress(baseMint, walletKPs[i].publicKey)
        const tokenBalance = (await connection.getTokenAccountBalance(baseAta)).value.uiAmount
        if (tokenBalance) totalTokenBalance = totalTokenBalance + tokenBalance
    }
    logToFile(`Total Token Balance: ${totalTokenBalance}`)
    logToFile("Please input the sol amount to buy.")

    rl.question("\t[Solana] - Buy Sol Amount in each bundler wallet (if you want to go back, press c and press enter): ", async (answer: string) => {

        if (answer == 'c') sellBuyWaiting()

        let buySolAmount = parseFloat(answer);

        const buyIxs: TransactionInstruction[] = []

        for (let i = 0; i < bundleWalletNum; i++) {
            const amount = await connection.getBalance(walletKPs[i].publicKey)
            const ix = await makeBuyIx(walletKPs[i], Math.floor(buySolAmount * 10 ** 9), i)
            buyIxs.push(...ix)
        }

        for (let i = 0; i < Math.ceil(bundleWalletNum / batchSize); i++) {
            const latestBlockhash = await connection.getLatestBlockhash()
            const instructions: TransactionInstruction[] = []

            instructions.push(
                ComputeBudgetProgram.setComputeUnitLimit({ units: 500_000 }),
                ComputeBudgetProgram.setComputeUnitPrice({ microLamports: Math.floor((PRIORITY_FEE * 10 ** 9) / 500_000 * 10 ** 6) })
            )
            for (let j = 0; j < batchSize; j++) {
                const index = i * batchSize + j
                if (walletKPs[index])
                    instructions.push(buyIxs[index * 2], buyIxs[index * 2 + 1])
            }
            const msg = new TransactionMessage({
                payerKey: walletKPs[i * 5].publicKey,
                recentBlockhash: latestBlockhash.blockhash,
                instructions
            }).compileToV0Message([lookupTable!])

            const tx = new VersionedTransaction(msg)
            for (let j = 0; j < 5; j++) {
                const index = i * 5 + j
                if (walletKPs[index])
                    tx.sign([walletKPs[index]])
            }
            transactions.push(tx)
        }
        sellBuyWaiting()
    })
}

// make buy instructions
const makeBuyIx = async (kp: Keypair, buyAmount: number, index: number) => {
    let buyIx = await sdk.getBuyInstructionsBySolAmount(
        kp.publicKey,
        baseMint,
        BigInt(buyAmount),
        index
    );

    return buyIx
}