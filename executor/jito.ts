import { Commitment, Keypair, VersionedTransaction } from "@solana/web3.js";
import base58 from "bs58";
import axios from "axios";
import https from "https";
import { connection } from "../config";

export const executeJitoTx = async (transactions: VersionedTransaction[], payer: Keypair, commitment: Commitment) => {

  try {
    let latestBlockhash = await connection.getLatestBlockhash();

    const jitoTxsignature = base58.encode(transactions[0].signatures[0]);

    // Serialize the transactions once here
    const serializedTransactions: string[] = [];
    for (let i = 0; i < transactions.length; i++) {
      const serializedTransaction = base58.encode(transactions[i].serialize());
      serializedTransactions.push(serializedTransaction);
    }

    const endpoints = [
      // 'https://mainnet.block-engine.jito.wtf/api/v1/bundles',
      // 'https://amsterdam.mainnet.block-engine.jito.wtf/api/v1/bundles',
      'https://frankfurt.mainnet.block-engine.jito.wtf/api/v1/bundles',
      // 'https://ny.mainnet.block-engine.jito.wtf/api/v1/bundles',
      // 'https://tokyo.mainnet.block-engine.jito.wtf/api/v1/bundles',
    ];

    // Create HTTPS agent with better SSL/TLS configuration
    const httpsAgent = new https.Agent({
      keepAlive: true,
      keepAliveMsecs: 1000,
      maxSockets: 50,
      maxFreeSockets: 10,
      timeout: 60000,
      rejectUnauthorized: true,
    });

    const axiosConfig = {
      httpsAgent: httpsAgent,
      timeout: 60000, // 60 second timeout
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    };

    const requests = endpoints.map((url) =>
      axios.post(url, {
        jsonrpc: '2.0',
        id: 1,
        method: 'sendBundle',
        params: [serializedTransactions],
      }, axiosConfig)
    );

    console.log('Sending transactions to endpoints...');

    const results = await Promise.all(requests.map((p) => p.catch((e) => e)));

    const successfulResults = results.filter((result) => !(result instanceof Error));

    if (successfulResults.length > 0) {
      console.log("Waiting for response")
      const confirmation = await connection.confirmTransaction(
        {
          signature: jitoTxsignature,
          lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
          blockhash: latestBlockhash.blockhash,
        },
        commitment,
      );


      if (confirmation.value.err) {
        console.log("Confirmtaion error")
        return null
      } else {
        return jitoTxsignature;

      }
    } else {
      console.log(`No successful responses received for jito`);
    }
    return null
  } catch (error) {
    console.log('Error during transaction execution', error);
    return null
  }
}




