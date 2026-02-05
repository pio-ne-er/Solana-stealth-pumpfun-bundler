import {
  Commitment,
  Connection,
  Finality,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { Program, Provider } from "@coral-xyz/anchor";
import { setGlobalDispatcher, Agent } from 'undici'
import { GlobalAccount } from "./globalAccount";
import {
  CompleteEvent,
  CreateEvent,
  CreateTokenMetadata,
  PriorityFee,
  PumpFunEventHandlers,
  PumpFunEventType,
  SetParamsEvent,
  TradeEvent,
  TransactionResult,
} from "./types";
import {
  toCompleteEvent,
  toCreateEvent,
  toSetParamsEvent,
  toTradeEvent,
} from "./events";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createCloseAccountInstruction,
  getAccount,
  getAssociatedTokenAddress,
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { BondingCurveAccount } from "./bondingCurveAccount";
import { BN } from "bn.js";

import { PumpFun, IDL } from "./idl/index";
import { TransactionInstruction } from "@solana/web3.js";
import { calculateWithSlippageBuy, calculateWithSlippageSell, DEFAULT_COMMITMENT, DEFAULT_FINALITY, sendTx } from "../util";
import { global_mint } from "../../constants";
import { LP_wallet_keypair } from "../../settings";

const PROGRAM_ID = "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P";
const MPL_TOKEN_METADATA_PROGRAM_ID =
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s";

export const GLOBAL_ACCOUNT_SEED = "global";
export const MINT_AUTHORITY_SEED = "mint-authority";
export const BONDING_CURVE_SEED = "bonding-curve";
export const METADATA_SEED = "metadata";

export const DEFAULT_DECIMALS = 6;

export class PumpFunSDK {
  public program: Program<PumpFun>;
  public connection: Connection;
  constructor(provider?: Provider) {
    this.program = new Program<PumpFun>(IDL as unknown as PumpFun, provider);
    this.connection = this.program.provider.connection;
  }

  // async buy(
  //   buyer: Keypair,
  //   mint: PublicKey,
  //   buyAmountSol: bigint,
  //   slippageBasisPoints: bigint = BigInt(500),
  //   priorityFees?: PriorityFee,
  //   commitment: Commitment = DEFAULT_COMMITMENT,
  //   finality: Finality = DEFAULT_FINALITY
  // ): Promise<TransactionResult> {
  //   let buyTx = await this.getBuyInstructionsBySolAmount(
  //     buyer.publicKey,
  //     mint,
  //     buyAmountSol,
  //     slippageBasisPoints,
  //     commitment
  //   );

  //   let buyResults = await sendTx(
  //     this.connection,
  //     buyTx,
  //     buyer.publicKey,
  //     [buyer],
  //     priorityFees,
  //     commitment,
  //     finality
  //   );
  //   return buyResults;
  // }

  async sell(
    seller: Keypair,
    mint: PublicKey,
    sellTokenAmount: bigint,
    slippageBasisPoints: bigint = BigInt(500),
    priorityFees?: PriorityFee,
    commitment: Commitment = DEFAULT_COMMITMENT,
    finality: Finality = DEFAULT_FINALITY
  ): Promise<TransactionResult> {
    let sellIxs = await this.getSellInstructionsByTokenAmount(
      seller.publicKey,
      mint,
      sellTokenAmount,
      slippageBasisPoints,
      commitment
    );

    let sellResults = await sendTx(
      this.connection,
      new Transaction().add(...sellIxs),
      seller.publicKey,
      [seller],
      priorityFees,
      commitment,
      finality
    );
    return sellResults;
  }

  //create token instructions
  async getCreateInstructions(
    creator: PublicKey,
    name: string,
    symbol: string,
    uri: string,
    mint: Keypair
  ) {
    const mplTokenMetadata = new PublicKey(MPL_TOKEN_METADATA_PROGRAM_ID);

    const [metadataPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from(METADATA_SEED),
        mplTokenMetadata.toBuffer(),
        mint.publicKey.toBuffer(),
      ],
      mplTokenMetadata
    );

    const associatedBondingCurve = await getAssociatedTokenAddress(
      mint.publicKey,
      this.getBondingCurvePDA(mint.publicKey),
      true
    );

    return this.program.methods
      .create(name, symbol, uri, creator)
      .accounts({
        program: this.program.programId,
        mint: mint.publicKey,
        user: creator,
      })
      .signers([mint])
      .instruction();
  }

  async getBuyInstructionsBySolAmount(
    buyer: PublicKey,
    mint: PublicKey,
    buyAmountSol: bigint,
    index: number
    // slippageBasisPoints: bigint = BigInt(500),
    // commitment: Commitment = DEFAULT_COMMITMENT
  ) {
    const commitment = "confirmed"
    let bondingCurveAccount = await this.getBondingCurveAccount(
      global_mint,
      commitment
    );
    if (!bondingCurveAccount) {
      throw new Error(`Bonding curve account not found: ${mint.toBase58()}`);
    }
    let buyAmount: bigint
    if (index == 0)
      buyAmount = bondingCurveAccount.getBuyPrice(buyAmountSol);
    else
      buyAmount = bondingCurveAccount.getBuyPrice(BigInt(Number(buyAmountSol) * (index + 1))) - bondingCurveAccount.getBuyPrice(BigInt(Number(buyAmountSol) * index))

    let buyAmountWithSlippage = await this.connection.getBalance(buyer)
    const feeRecipient = new PublicKey("CebN5WGQ4jvEPvsVU4EoHEpgzq1VV7AbicfhtW4xC9iM");

    return await this.getBuyInstructions(
      buyer,
      mint,
      feeRecipient,
      buyAmount,
      BigInt(buyAmountWithSlippage - 10 ** 6)
    );
  }

  //buy
  async getBuyInstructions(
    buyer: PublicKey,
    mint: PublicKey,
    feeRecipient: PublicKey,
    amount: bigint,
    solAmount: bigint,
    commitment: Commitment = DEFAULT_COMMITMENT,
  ) {
    const associatedUser = await getAssociatedTokenAddress(mint, buyer, false, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID);

    const creatorVault = this.getCreatorVaultPda(this.program.programId, LP_wallet_keypair.publicKey)
    const GLOBAL_VOLUME_ACCUMULATOR = new PublicKey(
        "Hq2wp8uJ9jCPsYgNHex8RtqdvMPfVGoYwjvF1ATiwn2Y"
    );
    const global = new PublicKey("4wTV1YmiEkRvAtNtsSGPtUrqRYQMe5SKy2uB4Jjaxnjf")
    const eventAuthority = new PublicKey("Ce6TQqeHC9p8KetsN6JsjHK7UTZk7nasjjnr7XxXp9F1")
    const feeConfig = new PublicKey("8Wf5TiAheLUqBrKXeYg2JtAFFMWtKdG2BSFgqUcPVwTt");
    const feeProgram = new PublicKey("pfeeUxB6jkeY1Hxd7CsFCAjcbHA9rWtchMGdZ6VojVZ");
    const bondingCurve = this.getBondingCurvePDA(mint)
    const associatedBondingCurve = getAssociatedTokenAddressSync(mint, bondingCurve, true)

    return [
      createAssociatedTokenAccountInstruction(buyer, associatedUser, buyer, mint, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID),
      await this.program.methods
        .buy(new BN(amount.toString()), new BN(solAmount.toString()), { 0: false })
        .accountsPartial({
          associatedBondingCurve: associatedBondingCurve,
          associatedUser: associatedUser,
          bondingCurve: bondingCurve,
          creatorVault: creatorVault,
          eventAuthority: eventAuthority,
          feeConfig: feeConfig,
          feeProgram: feeProgram,
          feeRecipient: feeRecipient,
          global: global,
          globalVolumeAccumulator: GLOBAL_VOLUME_ACCUMULATOR,
          mint: mint,
          program: this.program.programId,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          user: buyer,
          userVolumeAccumulator: this.getUserVolumeAccumulator(buyer),
        })
        .instruction()
    ]
    // const associatedUser = await getAssociatedTokenAddress(mint, buyer, false, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID);

    // return [
    //   createAssociatedTokenAccountInstruction(buyer, associatedUser, buyer, mint, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID),
    //   await this.program.methods
    //     .buy(new BN(amount.toString()), new BN(solAmount.toString()), { 0: false })
    //     .accounts({
    //       associatedUser: associatedUser,
    //       feeRecipient: feeRecipient,
    //       mint: mint,
    //       user: buyer,
    //     })
    //     .instruction()
    // ]
  }


  async getBuyIxsBySolAmount(
    buyer: PublicKey,
    mint: PublicKey,
    buyAmountSol: bigint,
    slippageBasisPoints: bigint = BigInt(500),
    commitment: Commitment = DEFAULT_COMMITMENT
  ) {
    let bondingCurveAccount = await this.getBondingCurveAccount(
      global_mint,
      commitment
    );
    if (!bondingCurveAccount) {
      throw new Error(`Bonding curve account not found: ${mint.toBase58()}`);
    }

    let buyAmount = bondingCurveAccount.getBuyPrice(buyAmountSol);
    let buyAmountWithSlippage = calculateWithSlippageBuy(
      buyAmountSol,
      slippageBasisPoints
    );
    // let globalAccount = await this.getGlobalAccount(commitment);
    const feeRecipient = new PublicKey("CebN5WGQ4jvEPvsVU4EoHEpgzq1VV7AbicfhtW4xC9iM");

    return await this.getBuyIxs(
      buyer,
      mint,
      feeRecipient,
      buyAmount,
      buyAmountWithSlippage,
    );
  }

  //buy
  async getBuyIxs(
    buyer: PublicKey,
    mint: PublicKey,
    feeRecipient: PublicKey,
    amount: bigint,
    solAmount: bigint,
    commitment: Commitment = DEFAULT_COMMITMENT,
  ) {
    const associatedBondingCurve = await getAssociatedTokenAddress(
      mint,
      this.getBondingCurvePDA(mint),
      true
    );

    const associatedUser = await getAssociatedTokenAddress(mint, buyer, false);

    let ixs: TransactionInstruction[] = [];

    try {
      await getAccount(this.connection, associatedUser, commitment);
    } catch (e) {
      ixs.push(
        createAssociatedTokenAccountInstruction(
          buyer,
          associatedUser,
          buyer,
          mint
        )
      );
    }

    ixs.push(
      await this.program.methods
        .buy(new BN(amount.toString()), new BN(solAmount.toString()), { 0: false })
        .accounts({
          associatedUser: associatedUser,
          feeRecipient: feeRecipient,
          mint: mint,
          user: buyer,
        })
        .instruction()
    );

    return ixs;
  }

  //sell
  async getSellInstructionsByTokenAmount(
    seller: PublicKey,
    mint: PublicKey,
    sellTokenAmount: bigint,
    slippageBasisPoints: bigint = BigInt(500),
    commitment: Commitment = DEFAULT_COMMITMENT
  ) {
    let bondingCurveAccount = await this.getBondingCurveAccount(
      mint,
      commitment
    );
    if (!bondingCurveAccount) {
      throw new Error(`Bonding curve account not found: ${mint.toBase58()}`);
    }

    let globalAccount = await this.getGlobalAccount(commitment);

    let minSolOutput = bondingCurveAccount.getSellPrice(
      sellTokenAmount,
      globalAccount.feeBasisPoints
    );

    let sellAmountWithSlippage = calculateWithSlippageSell(
      BigInt(0),
      slippageBasisPoints
    );

    return await this.getSellInstructions(
      seller,
      mint,
      globalAccount.feeRecipient,
      sellTokenAmount,
      sellAmountWithSlippage
    );
  }

  async getSellInstructions(
    seller: PublicKey,
    mint: PublicKey,
    feeRecipient: PublicKey,
    amount: bigint,
    minSolOutput: bigint
  ) {
    const associatedBondingCurve = await getAssociatedTokenAddress(
      mint,
      this.getBondingCurvePDA(mint),
      true
    );

    const associatedUser = await getAssociatedTokenAddress(mint, seller, false);

    return [await this.program.methods
      .sell(new BN(amount.toString()), new BN(minSolOutput.toString()))
      .accounts({
        associatedUser: associatedUser,
        feeRecipient: feeRecipient,
        mint: mint,
        user: seller,
      }).instruction(),
    createCloseAccountInstruction(associatedUser, seller, seller)
    ]
  }

  async getBondingCurveAccount(
    mint: PublicKey,
    commitment: Commitment = DEFAULT_COMMITMENT
  ) {
    const bondingCurvePDA = this.getBondingCurvePDA(mint);
    const tokenAccount = await this.connection.getAccountInfo(bondingCurvePDA, commitment);

    if (!tokenAccount) {
      return null;
    }
    return BondingCurveAccount.fromBuffer(tokenAccount!.data);
  }

  async getGlobalAccount(commitment: Commitment = DEFAULT_COMMITMENT) {
    const [globalAccountPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from(GLOBAL_ACCOUNT_SEED)],
      new PublicKey(PROGRAM_ID)
    );

    const tokenAccount = await this.connection.getAccountInfo(
      globalAccountPDA,
      commitment
    );

    return GlobalAccount.fromBuffer(tokenAccount!.data);
  }

  getBondingCurvePDA(mint: PublicKey) {
    return PublicKey.findProgramAddressSync(
      [Buffer.from(BONDING_CURVE_SEED), mint.toBuffer()],
      this.program.programId
    )[0];
  }

  async createTokenMetadata(create: CreateTokenMetadata) {
    let formData = new FormData();
    formData.append("file", create.file),
      formData.append("name", create.name),
      formData.append("symbol", create.symbol),
      formData.append("description", create.description),
      formData.append("twitter", create.twitter || ""),
      formData.append("telegram", create.telegram || ""),
      formData.append("website", create.website || ""),
      formData.append("showName", "true");

    setGlobalDispatcher(new Agent({ connect: { timeout: 60_000 } }))
    let request = await fetch("https://pump.fun/api/ipfs", {
      method: "POST",
      headers: {
        "Host": "www.pump.fun",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:126.0) Gecko/20100101 Firefox/126.0",
        "Accept": "*/*",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br, zstd",
        "Referer": "https://www.pump.fun/create",
        "Origin": "https://www.pump.fun",
        "Connection": "keep-alive",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
        "Priority": "u=1",
        "TE": "trailers"
      },
      body: formData,
    });
    return request.json();
  }

  getUserVolumeAccumulator(user: PublicKey) {
    const seeds = [
      Buffer.from("user_volume_accumulator"),
      user.toBuffer()
    ];
    const [userVolumeAccumulator] = PublicKey.findProgramAddressSync(seeds, this.program.programId);
    return userVolumeAccumulator;
  }

  getCreatorVaultPda(programId: PublicKey, creator: PublicKey) {
    const [creatorVault] = PublicKey.findProgramAddressSync([Buffer.from("creator-vault"), creator.toBuffer()], programId);
    return creatorVault;
  }

  //EVENTS
  // addEventListener<T extends PumpFunEventType>(
  //   eventType: T,
  //   callback: (
  //     event: PumpFunEventHandlers[T],
  //     slot: number,
  //     signature: string
  //   ) => void
  // ) {
  //   return this.program.addEventListener(
  //     eventType,
  //     (event: any, slot: number, signature: string) => {
  //       let processedEvent;
  //       switch (eventType) {
  //         case "createEvent":
  //           processedEvent = toCreateEvent(event as CreateEvent);
  //           callback(
  //             processedEvent as PumpFunEventHandlers[T],
  //             slot,
  //             signature
  //           );
  //           break;
  //         case "tradeEvent":
  //           processedEvent = toTradeEvent(event as TradeEvent);
  //           callback(
  //             processedEvent as PumpFunEventHandlers[T],
  //             slot,
  //             signature
  //           );
  //           break;
  //         case "completeEvent":
  //           processedEvent = toCompleteEvent(event as CompleteEvent);
  //           callback(
  //             processedEvent as PumpFunEventHandlers[T],
  //             slot,
  //             signature
  //           );
  //           console.log("completeEvent", event, slot, signature);
  //           break;
  //         case "setParamsEvent":
  //           processedEvent = toSetParamsEvent(event as SetParamsEvent);
  //           callback(
  //             processedEvent as PumpFunEventHandlers[T],
  //             slot,
  //             signature
  //           );
  //           break;
  //         default:
  //           console.error("Unhandled event type:", eventType);
  //       }
  //     }
  //   );
  // }

  // removeEventListener(eventId: number) {
  //   this.program.removeEventListener(eventId);
  // }
}
