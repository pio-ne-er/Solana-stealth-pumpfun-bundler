import {
  Commitment,
  ComputeBudgetProgram,
  Connection,
  Finality,
  Keypair,
  PublicKey,
  SendTransactionError,
  Transaction,
  TransactionMessage,
  VersionedTransaction,
  VersionedTransactionResponse,
} from "@solana/web3.js";
import fs from "fs"
import bs58 from "bs58";
import { sha256 } from "js-sha256";
import path from 'path';
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { PriorityFee, TransactionResult } from "./pumpfun/types";

export const DEFAULT_COMMITMENT: Commitment = "finalized";
export const DEFAULT_FINALITY: Finality = "finalized";

export const sleep = async (ms: number) => {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

// Function to read JSON file from the "keys" folder
export function readJson(fileName: string = "data.json"): string[] {
  const folderPath = 'wallets';
  const filePath = path.join(folderPath, fileName);

  if (!fs.existsSync(filePath)) {
    // If the file does not exist, create an empty array file in the "keys" folder
    fs.writeFileSync(filePath, '[]', 'utf-8');
  }

  const data = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(data) as string[];
}

export const saveBundlerTokenAmountToFile = (newData: number[], filename: string = "tokenBundlingPercents") => {
  const filePath: string = `wallets/${filename}.json`
  try {
    // Remove the existing file if it exists
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`File ${filePath} deleted.`);
    }

    // Write the new data to the file
    fs.writeFileSync(filePath, JSON.stringify(newData, null, 2));
    console.log("File is saved successfully.");

  } catch (error) {
    console.log('Error saving data to JSON file:', error);
  }
};

export const saveBundlerWalletsToFile = (newData: string[], filename: string) => {
  const filePath: string = `wallets/${filename}.json`
  try {
    // Remove the existing file if it exists
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`File ${filePath} deleted.`);
    }

    // Write the new data to the file
    fs.writeFileSync(filePath, JSON.stringify(newData, null, 2));
    console.log("File is saved successfully.");

  } catch (error) {
    console.log('Error saving data to JSON file:', error);
  }
};

export const readBundlerWallets = (filename: string) => {
  const filePath: string = `wallets/${filename}.json`

  try {
    // Check if the file exists
    if (fs.existsSync(filePath)) {
      // Read the file content
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const wallets = JSON.parse(fileContent);
      return wallets;
    } else {
      console.log(`File ${filePath} does not exist.`);
      return [];
    }
  } catch (error) {
    console.log('Error reading data from JSON file:', error);
    return [];
  }
};

export const readHolderWallets = (filename: string) => {
  const filePath: string = `wallets/${filename}.json`

  try {
    // Check if the file exists
    if (fs.existsSync(filePath)) {
      // Read the file content
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const wallets = JSON.parse(fileContent);
      return wallets;
    } else {
      console.log(`File ${filePath} does not exist.`);
      return [];
    }
  } catch (error) {
    console.log('Error reading data from JSON file:', error);
    return [];
  }
};

export const calculateWithSlippageBuy = (
  amount: bigint,
  basisPoints: bigint
) => {
  return amount + (amount * basisPoints) / BigInt(1000);
};

export const saveDataToFile = (newData: string[], fileName: string = "data.json") => {
  const folderPath = 'wallets';
  const filePath = path.join(folderPath, fileName);

  try {
    // Create the folder if it doesn't exist
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    let existingData: string[] = [];

    // Check if the file exists
    if (fs.existsSync(filePath)) {
      // If the file exists, read its content
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      existingData = JSON.parse(fileContent);
    }

    // Add the new data to the existing array
    existingData.push(...newData);

    // Write the updated data back to the file
    fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2));

    console.log("File is saved successfully.");

  } catch (error) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`File ${filePath} deleted and will be recreated.`);
      }
      fs.writeFileSync(filePath, JSON.stringify(newData, null, 2));
      console.log(`${fileName} File is saved successfully.`);
    } catch (error) {
      console.log('Error saving data to JSON file:', error);
    }
  }
};
// Function to read JSON file
export function readHolderWalletDataJson(filename: string = "wallets/holderWallets.json"): Data[] {
  if (!fs.existsSync(filename)) {
    // If the file does not exist, create an empty array
    fs.writeFileSync(filename, '[]', 'utf-8');
  }
  const data = fs.readFileSync(filename, 'utf-8');
  return JSON.parse(data) as Data[];
}

export const calculateWithSlippageSell = (
  amount: bigint,
  basisPoints: bigint
) => {
  return amount - (amount * basisPoints) / BigInt(1000);
};

export const saveSwapSolAmountToFile = (newData: number[], filename: string = "swapAmounts") => {
  const filePath: string = `wallets/${filename}.json`
  try {
    // Remove the existing file if it exists
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`File ${filePath} deleted.`);
    }

    // Write the new data to the file
    fs.writeFileSync(filePath, JSON.stringify(newData, null, 2));
    console.log("File is saved successfully.");

  } catch (error) {
    console.log('Error saving data to JSON file:', error);
  }
};


export const readSwapAmounts = (filename: string = "swapAmounts") => {
  const filePath: string = `wallets/${filename}.json`

  try {
    // Check if the file exists
    if (fs.existsSync(filePath)) {
      // Read the file content
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const amounts = JSON.parse(fileContent);
      return amounts;
    } else {
      console.log(`File ${filePath} does not exist.`);
      return [];
    }
  } catch (error) {
    console.log('Error reading data from JSON file:', error);
    return [];
  }
};


export const getRandomInt = (min: number, max: number): number => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min; // The maximum is inclusive, the minimum is inclusive
}

export const readBuyerWallet = (fileName: string) => {
  const filePath = `./wallets/${fileName}.txt`
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

export const retrieveEnvVariable = (variableName: string) => {
  const variable = process.env[variableName] || ''
  if (!variable) {
    console.log(`${variableName} is not set`)
    process.exit(1)
  }
  return variable
}

export function getOrCreateKeypair(dir: string, keyName: string): Keypair {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const authorityKey = dir + "/" + keyName + ".json";
  if (fs.existsSync(authorityKey)) {
    const data: {
      secretKey: string;
      publicKey: string;
    } = JSON.parse(fs.readFileSync(authorityKey, "utf-8"));
    return Keypair.fromSecretKey(bs58.decode(data.secretKey));
  } else {
    const keypair = Keypair.generate();
    keypair.secretKey;
    fs.writeFileSync(
      authorityKey,
      JSON.stringify({
        secretKey: bs58.encode(keypair.secretKey),
        publicKey: keypair.publicKey.toBase58(),
      })
    );
    return keypair;
  }
}

export const baseToValue = (base: number, decimals: number): number => {
  return base * Math.pow(10, decimals);
};

export const valueToBase = (value: number, decimals: number): number => {
  return value / Math.pow(10, decimals);
};

//i.e. account:BondingCurve
export function getDiscriminator(name: string) {
  return sha256.digest(name).slice(0, 8);
}

// Define the type for the JSON file content
export interface Data {
  privateKey: string;
  pubkey: string;
}

export const saveHolderWalletsToFile = (newData: Data[], filePath: string = ".wallets/holderWallets.json") => {
  try {
    let existingData: Data[] = [];

    // Check if the file exists
    if (fs.existsSync(filePath)) {
      // If the file exists, read its content
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      existingData = JSON.parse(fileContent);
    }

    // Add the new data to the existing array
    existingData.push(...newData);

    // Write the updated data back to the file
    fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2));

  } catch (error) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`File ${filePath} deleted and create new file.`);
      }
      fs.writeFileSync(filePath, JSON.stringify(newData, null, 2));
      console.log("File is saved successfully.")
    } catch (error) {
      console.log('Error saving data to JSON file:', error);
    }
  }
};

export async function sendTx(
  connection: Connection,
  tx: Transaction,
  payer: PublicKey,
  signers: Keypair[],
  priorityFees?: PriorityFee,
  commitment: Commitment = DEFAULT_COMMITMENT,
  finality: Finality = DEFAULT_FINALITY
): Promise<TransactionResult> {

  let newTx = new Transaction();

  if (priorityFees) {
    const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({
      units: priorityFees.unitLimit,
    });

    const addPriorityFee = ComputeBudgetProgram.setComputeUnitPrice({
      microLamports: priorityFees.unitPrice,
    });
    newTx.add(modifyComputeUnits);
    newTx.add(addPriorityFee);
  }
  newTx.add(tx);
  let versionedTx = await buildVersionedTx(connection, payer, newTx, commitment);
  versionedTx.sign(signers);
  try {
    console.log((await connection.simulateTransaction(versionedTx, undefined)))

    const sig = await connection.sendTransaction(versionedTx, {
      skipPreflight: false,
    });
    console.log("Transaction signature: ", `https://solscan.io/tx/${sig}`);

    let txResult = await getTxDetails(connection, sig, commitment, finality);
    if (!txResult) {
      return {
        success: false,
        error: "Transaction failed",
      };
    }
    return {
      success: true,
      signature: sig,
      results: txResult,
    };
  } catch (e) {
    if (e instanceof SendTransactionError) {
      let ste = e as SendTransactionError;
    } else {
      console.error(e);
    }
    return {
      error: e,
      success: false,
    };
  }
}

export const buildVersionedTx = async (
  connection: Connection,
  payer: PublicKey,
  tx: Transaction,
  commitment: Commitment = DEFAULT_COMMITMENT
): Promise<VersionedTransaction> => {
  const blockHash = (await connection.getLatestBlockhash(commitment))
    .blockhash;

  let messageV0 = new TransactionMessage({
    payerKey: payer,
    recentBlockhash: blockHash,
    instructions: tx.instructions,
  }).compileToV0Message();

  return new VersionedTransaction(messageV0);
};

export const getTxDetails = async (
  connection: Connection,
  sig: string,
  commitment: Commitment = DEFAULT_COMMITMENT,
  finality: Finality = DEFAULT_FINALITY
): Promise<VersionedTransactionResponse | null> => {
  const latestBlockHash = await connection.getLatestBlockhash();
  await connection.confirmTransaction(
    {
      blockhash: latestBlockHash.blockhash,
      lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
      signature: sig,
    },
    commitment
  );

  return connection.getTransaction(sig, {
    maxSupportedTransactionVersion: 0,
    commitment: finality,
  });
};

export const getSPLBalance = async (
  connection: Connection,
  mintAddress: PublicKey,
  pubKey: PublicKey,
  allowOffCurve: boolean = false
) => {
  try {
    let ata = getAssociatedTokenAddressSync(mintAddress, pubKey, allowOffCurve);
    const balance = await connection.getTokenAccountBalance(ata, "processed");
    return balance.value.uiAmount;
  } catch (e) { }
  return null;
};