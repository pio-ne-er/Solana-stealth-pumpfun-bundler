import { PublicKey, Keypair, AddressLookupTableProgram, ComputeBudgetProgram, Transaction, sendAndConfirmTransaction, Connection } from "@solana/web3.js"
import base58 from 'bs58'
import { RPC_ENDPOINT, RPC_WEBSOCKET_ENDPOINT } from "./config"
import { readLUTAddressFromFile } from "./utils"
import { Bundler_provider_wallet_keypair, LP_wallet_keypair } from "./settings"
import { sleep } from "./src/util"
const commitment = "confirmed"
const mainKp = Bundler_provider_wallet_keypair
const connection = new Connection(RPC_ENDPOINT, {
  wsEndpoint: RPC_WEBSOCKET_ENDPOINT, commitment
})
const closeLut = async () => {
  const lutData = readLUTAddressFromFile()
  const lookupTableAddress = new PublicKey(lutData!)
  // try {
  //   const cooldownTx = new Transaction().add(
  //     ComputeBudgetProgram.setComputeUnitLimit({ units: 15_000_000 }),
  //     ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 5_000 }),
  //     AddressLookupTableProgram.deactivateLookupTable({
  //       lookupTable: lookupTableAddress, // Address of the lookup table to deactivate
  //       authority: mainKp.publicKey, // Authority to modify the lookup table
  //     })
  //   )
  //   const coolDownSig = await sendAndConfirmTransaction(connection, cooldownTx, [mainKp])
  //   console.log("Cool Down sig:", coolDownSig)
  // } catch (error) {
  //   console.log("Deactivating LUT error:", error)
  // }
  try {
    const closeTx = new Transaction().add(
      ComputeBudgetProgram.setComputeUnitLimit({ units: 15_000_000 }),
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 5_000 }),
      AddressLookupTableProgram.closeLookupTable({
        lookupTable: lookupTableAddress, // Address of the lookup table to close
        authority: mainKp.publicKey, // Authority to close the LUT
        recipient: mainKp.publicKey, // Recipient of the reclaimed rent balance
      })
    )
    const closeSig = await sendAndConfirmTransaction(connection, closeTx, [mainKp])
    console.log("Close LUT Sig:", closeSig)
  } catch (error) {
    console.log("Close LUT error:", error)
  }
}

closeLut()
