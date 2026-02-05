
import { balances_display, gather_display, main_menu_display, rl, screen_clear, token_holders_display, token_launch_display, token_sell_buy_display } from "./menu/menu";
import { logToFile } from "./src/msgLog";
import { create_Buy, each_sol_gather, holder_create, holder_distribute, holder_gather_all, holder_gather_some, manual_each_sell, manual_part_sell, manual_rebuy, presimulate, show_bundlers, show_holders, sol_distribute, sol_gather } from './layout';
import { sleep } from "./src/util";
// add
import { AnchorProvider } from "@coral-xyz/anchor";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { Keypair, PublicKey, ComputeBudgetProgram, VersionedTransaction, TransactionMessage } from "@solana/web3.js";
import { PumpFunSDK } from "./src/pumpfun/pumpfun";
import { connection } from "./config";
import { Bundler_provider_wallet_keypair, token, PRIORITY_FEE, LP_wallet_keypair } from "./settings";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";

export const init = async () => {
  try {
    screen_clear();
    console.log("Pumpfun Token Launchpad Buy / Sell Bundler");
    main_menu_display();

    rl.question("\t[Main] - Choice: ", (answer: string) => {
      let choice = parseInt(answer);
      switch (choice) {
        case 1:
          token_launch();
          break;
        case 2:
          sell_buy();
          break;
        case 3:
          gather();
          break;
        case 4:
          balances();
          break;
        case 5:
          process.exit(1);
          break;
        default:
          console.log("\tInvalid choice!");
          sleep(1500);
          init();
          break;
      }
    })
  } catch (error) {
    console.log(error)
  }
}

export const test = () => {
  screen_clear();
  logToFile("Manual Buy Test")
  console.log("Enter SOL amount to buy (e.g., 0.01). Press 'c' to cancel.")

  rl.question("\t[Buy] - SOL Amount: ", async (answer: string) => {
    if (answer === 'c') {
      init();
      return;
    }

    const solAmount = parseFloat(answer);
    if (isNaN(solAmount) || solAmount <= 0) {
      console.log("\tInvalid amount!")
      await sleep(1500)
      test();
      return;
    }

    try {
      const provider = new AnchorProvider(connection, new NodeWallet(new Keypair()), { commitment: "confirmed" });
      const sdk = new PumpFunSDK(provider);

      const buyer = Bundler_provider_wallet_keypair;
      const mintPubkey = new PublicKey("CsbMyWRr9QKGDjtUUFdNLktmB3EzZsb1ujdgKETEpump");

      const buyIxs = await sdk.getBuyInstructionsBySolAmount(
        buyer.publicKey,
        mintPubkey,
        BigInt(Math.floor(solAmount * 10 ** 9)),
        0
      );

      const latestBlockhash = await connection.getLatestBlockhash();
      const instructions = [
        ComputeBudgetProgram.setComputeUnitLimit({ units: 500_000 }),
        ComputeBudgetProgram.setComputeUnitPrice({ microLamports: Math.floor((PRIORITY_FEE * 10 ** 9) / 500_000 * 10 ** 6) }),
        ...buyIxs,
      ];

      const v0Msg = new TransactionMessage({
        payerKey: buyer.publicKey,
        recentBlockhash: latestBlockhash.blockhash,
        instructions,
      }).compileToV0Message();

      const tx = new VersionedTransaction(v0Msg);
      tx.sign([buyer]);

      const sig = await connection.sendRawTransaction(tx.serialize(), { skipPreflight: true, maxRetries: 3 });
      console.log(`Submitted buy tx: https://solscan.io/tx/${sig}`)
      logToFile(`Buy signature: https://solscan.io/tx/${sig}`)
    } catch (e) {
      console.log("Buy failed:", e)
      logToFile(`Buy failed: ${String(e)}`)
    }

    await sleep(30000)
    init();
  })
}

export const token_launch = () => {
  screen_clear();
  logToFile("TOKEN LAUNCH")
  token_launch_display()

  rl.question("\t[Security Checks] - Choice: ", (answer: string) => {
    let choice = parseInt(answer);
    switch (choice) {
      case 1:
        presimulate();
        break;
      case 2:
        create_Buy();
        break;
      case 3:
        init();
        break;
      case 4:
        process.exit(1);
        break;
      default:
        logToFile("\tInvalid choice!");
        sleep(1500);
        token_launch();
        break;
    }
  })
}

export const token_holders = () => {
  screen_clear();
  logToFile("Token Holders")
  token_holders_display();

  rl.question("\t[Token Holders] - Choice: ", (answer: string) => {
    let choice = parseInt(answer);
    switch (choice) {
      case 1:
        holder_distribute()
        break;
      case 2:
        holder_gather_some()
        break;
      case 3:
        holder_gather_all()
        break;
      case 4:
        init();
        break;
      case 5:
        process.exit(1);
      default:
        logToFile("\tInvalid choice!");
        sleep(1500);
        token_holders();
        break;
    }
  })
}

export const sell_buy = () => {
  screen_clear();
  logToFile("Token Sell & Buy")
  token_sell_buy_display();

  rl.question("\t[Token Sell & Buy] - Choice: ", (answer: string) => {
    let choice = parseInt(answer);
    switch (choice) {
      case 1:
        manual_each_sell();
        break;
      case 2:
        init();
        break;
      case 3:
        process.exit(1);
      default:
        logToFile("\tInvalid choice!");
        sleep(1500);
        sell_buy();
        break;
    }
  })
}

export const gather = () => {
  screen_clear();
  logToFile("Gathering...")
  gather_display();

  rl.question("\t[Gather Options] - Choice: ", (answer: string) => {
    let choice = parseInt(answer);
    switch (choice) {
      case 1:
        sol_gather();
        break;
      case 2:
        each_sol_gather();
        break;
      case 3:
        sol_distribute();
        break;
      case 4:
        init();
        break;
      case 5:
        process.exit(1);
      default:
        logToFile("\tInvalid choice!");
        sleep(1500);
        gather();
        break;
    }
  })
}

export const balances = () => {
  screen_clear();
  logToFile("Balance Checks")
  balances_display();

  rl.question("\t[Balance Checks] - Choice: ", (answer: string) => {
    let choice = parseInt(answer);
    switch (choice) {
      case 1:
        show_bundlers();
        break;
      case 2:
        init();
        break;
      case 3:
        process.exit(1);
      default:
        logToFile("\tInvalid choice!");
        sleep(1500);
        balances();
        break;
    }
  })
}

init()
