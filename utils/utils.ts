import { Keypair, LAMPORTS_PER_SOL, PublicKey, Transaction, VersionedTransaction } from "@solana/web3.js";
import fs from 'fs'
import { connection } from "../config";
import { Bundler_provider_wallet_keypair, LP_wallet_keypair } from "../settings";
import { logToFile } from "../src/msgLog";

interface Blockhash {
    blockhash: string;
    lastValidBlockHeight: number;
}

export const outputBalance = async (solAddress: PublicKey) => {
    const bal = await connection.getBalance(solAddress, "processed") / LAMPORTS_PER_SOL
    switch (solAddress.toBase58()) {
        case LP_wallet_keypair.publicKey.toBase58():
            logToFile(`Balance in dev wallet ${solAddress.toBase58()} is ${bal}SOL`)
            break;
        case Bundler_provider_wallet_keypair.publicKey.toBase58():
            logToFile(`Balance in bundler provider wallet ${solAddress.toBase58()} is ${bal}SOL`)
            break;
        default:
            logToFile(`Balance in dev wallet ${solAddress.toBase58()} is ${bal}SOL`)
            break;
    }
    return bal
}


export const executeVersionedTx = async (transaction: VersionedTransaction) => {
    const latestBlockhash = await connection.getLatestBlockhash()
    const signature = await connection.sendRawTransaction(transaction.serialize(), { skipPreflight: true })

    const confirmation = await connection.confirmTransaction(
        {
            signature,
            lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
            blockhash: latestBlockhash.blockhash,
        }
    );

    if (confirmation.value.err) {
        console.log("Confirmation error")
        return ""
    } else {
        console.log(`Confirmed transaction: https://solscan.io/tx/${signature}`)
    }
    return signature
}


export const executeLegacyTx = async (transaction: Transaction, signer: Keypair[], latestBlockhash: Blockhash) => {

    const signature = await connection.sendTransaction(transaction, signer, { skipPreflight: true })
    const confirmation = await connection.confirmTransaction(
        {
            signature,
            lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
            blockhash: latestBlockhash.blockhash,
        }
    );
    if (confirmation.value.err) {
        console.log("Confirmation error")
        return null
    } else {
        console.log(`Confirmed transaction: https://solscan.io/tx/${signature}`)
    }
    return signature
}

export const saveLUTAddressToFile = (publicKey: string, filePath: string = "wallets/lutAddress.txt") => {
    try {
        // Write the public key to the specified file
        fs.writeFileSync(filePath, publicKey);
        console.log("Public key saved successfully to", filePath);
    } catch (error) {
        console.log('Error saving public key to file:', error);
    }
};

export const readLUTAddressFromFile = (filePath: string = "wallets/lutAddress.txt") => {
    try {
        // Check if the file exists
        if (fs.existsSync(filePath)) {
            // Read the file content
            const publicKey = fs.readFileSync(filePath, 'utf-8');
            return publicKey.trim(); // Remove any surrounding whitespace or newlines
        } else {
            console.log(`File ${filePath} does not exist.`);
            return null; // Return null if the file does not exist
        }
    } catch (error) {
        console.log('Error reading public key from file:', error);
        return null; // Return null in case of error
    }
};
