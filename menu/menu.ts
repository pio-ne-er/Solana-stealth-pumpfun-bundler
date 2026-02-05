import readline from "readline"
import fs from 'fs'

export const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

export const screen_clear = () => {
    console.clear();
}

export const main_menu_display = () => {
    console.log('\t[1] - Token Launch');
    console.log('\t[2] - Token Sell & Buy');
    console.log('\t[3] - Gather Sol from bundler wallets');
    console.log('\t[4] - Balance of bundlers');
    console.log('\t[5] - Exit');
}                                                       

export const token_launch_display = () => {
    console.log('\t[1] - Presimulate before everything');
    console.log('\t[2] - Create Token & Pool and BundleBuy');
    console.log('\t[3] - Back');
    console.log('\t[4] - Exit');
}

export const token_holders_display = () => {
    console.log('\t[1] - Distribute Token to HolderWallets');
    console.log('\t[2] - Gather selected Token to BundlerWallets');
    console.log('\t[3] - Gather all Token to BundlerWallets');
    console.log('\t[4] - Back');
    console.log('\t[5] - Exit');
}


export const token_sell_buy_display = () => {
    console.log('\t[1] - Sell tokens from each bundler');
    console.log('\t[2] - Back');
    console.log('\t[3] - Exit');
}

export const gather_display = () => {
    console.log('\t[1] - Gather Sol from all bundler wallets');
    console.log('\t[2] - Gather sol from one bundler wallet');
    console.log('\t[3] - Distribute Sol to bundler wallets');
    console.log('\t[4] - Back');
    console.log('\t[5] - Exit');
}

export const balances_display = () => {
    console.log('\t[1] - Show sol & token balances of bundlers');
    console.log('\t[2] - Back');
    console.log('\t[3] - Exit');
}

