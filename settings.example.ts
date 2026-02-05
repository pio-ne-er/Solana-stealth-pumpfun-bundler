import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import { UserToken } from './src/types';

// **************************************************** //
// ***************   SETTINGS   *********************** //
// **************************************************** //
// SD, You should set following values before you run the program.

export const token: UserToken = {
    mintPk: "",
    name: "",
    symbol: "",
    description: "",
    showName: "",
    createOn: "Pump.fun",
    twitter: "https://x.com",
    telegram: "https://t.me",
    website: "https://",
    image: "./src/image/2.jpg"
}

// SDau2jrGDBiY8joxJcbXfa1YsGSFfPpjgtac5KiXSt3
export const LP_wallet_private_key=""
export const LP_wallet_keypair = Keypair.fromSecretKey(new Uint8Array(bs58.decode(LP_wallet_private_key)));
// SDHXjVCZFmBXpNVeNCiC8UgosL3Na7tRTYkUXtUPeTP
export const Bundler_provider_private_key=""
export const Bundler_provider_wallet_keypair = Keypair.fromSecretKey(new Uint8Array(bs58.decode(Bundler_provider_private_key)));

// The number of wallets to bundle in one transaction
export const batchSize = 4
export const bundleWalletNum = batchSize * 4

// Total holding percent of token in bundlers (50 is 50% of total supply)
export const bundlerHoldingPercent = 0.1;

// Maximumm time interval between wallet creation
export const walletCreateInterval = 3

// Maximum time interval between depositing Solana to bundler wallets
export const walletTransferInterval = 4

// Maximum time interval between distributing token to holders
export const holderTokenTransferInterval = 5

// Max amount of Token in holder wallets (1 is 1%)
export const holderTokenAmountMax =  1.1;

// Min amount of Token in holder wallets (1 is 1%)
export const holderTokenAmountMin =  0.4;

// number of holder wallets to distribute
export const distNum = 1

// percentage of tokens to keep in bundler wallets when distribute
export const remaining_token_percent = 19

// name of file to save bundler wallets
export const bundlerWalletName = "bundlers"

// name of file to save bundler wallets
export const holderWalletName = "holders"

// Extra sol to retain in bundler wallets - Rent Fees
export const extra_sol_amount = 0.002;

export const PRIORITY_FEE = 0.00002

export const holderCreateInterval = 2
