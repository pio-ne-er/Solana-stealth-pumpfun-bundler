import { Connection, PublicKey, Keypair } from "@solana/web3.js"
import dotenv from 'dotenv'

dotenv.config()

const retrieveEnvVariable = (variableName: string) => {
  const variable = process.env[variableName] || ''
  if (!variable) {
    console.log(`${variableName} is not set`)
    process.exit(1)
  }
  return variable
}

export const BLOCKENGINE_URL = retrieveEnvVariable('BLOCKENGINE_URL')
export const COMPUTE_UNIT_PRICE = Number(retrieveEnvVariable('COMPUTE_UNIT_PRICE'))
export const RPC_ENDPOINT = retrieveEnvVariable("RPC_ENDPOINT")
export const RPC_WEBSOCKET_ENDPOINT = retrieveEnvVariable("RPC_WEBSOCKET_ENDPOINT")
export const connection = new Connection(RPC_ENDPOINT, {wsEndpoint: RPC_WEBSOCKET_ENDPOINT, commitment: 'confirmed'})
export const LILJITO_RPC_ENDPOINT = retrieveEnvVariable("LILJITO_RPC_ENDPOINT")

// define these
export const JITO_FEE = Number(retrieveEnvVariable('JITO_FEE')) * 10 ** 9
