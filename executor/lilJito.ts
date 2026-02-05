import axios from "axios";
import { VersionedTransaction } from "@solana/web3.js";
import base58 from 'bs58';
import { LILJITO_RPC_ENDPOINT } from "../config";

let bundleId: string

export const sendBundle = async (txs: VersionedTransaction[]): Promise<string | undefined> => {
    try {
        const serializedTxs = txs.map(tx => base58.encode(tx.serialize()))
        const config = {
            headers: {
                "Content-Type": "application/json",
            },
        };
        const data = {
            jsonrpc: "2.0",
            id: 1,
            method: "sendBundle",
            params: [serializedTxs],
        };
        axios
            .post(
                LILJITO_RPC_ENDPOINT,
                data,
                config
            )
            .then(function (response) {
                // handle success
                bundleId = response.data.result
                console.log("Bundle sent successfully", bundleId)
                return bundleId
            })
            .catch((err) => {
                console.log("Error when sending the bundle");
                return bundleId
            }).finally(() => {
                return bundleId
            })
        return bundleId
    } catch (error) {
        console.log("Error while sending bundle")
        return
    }
}

export const encodeToBase64Transaction = (transaction: VersionedTransaction): string => {
    // Serialize the transaction and encode it as base64
    const serializedTx = transaction.serialize();
    const base64Tx = Buffer.from(serializedTx).toString('base64');
    return base64Tx
}

export const simulateBundle = async (vTxs: VersionedTransaction[]) => {
    const txs = vTxs.map(tx => encodeToBase64Transaction(tx))
    const config = {
        headers: {
            "Content-Type": "application/json",
        },
    };
    const data = {
        jsonrpc: "2.0",
        id: 1,
        method: "simulateBundle",
        params: [{ "encodedTransactions": txs }],
    };
    axios
        .post(
            LILJITO_RPC_ENDPOINT,
            data,
            config
        )
        .then(function (response) {
            // handle success
            console.log(response.data);
            console.log(response.data.result.value.transactionResults);
        })
        .catch((err) => {
            // handle error
            console.log(err);
        });
}

export const getBundleStatus = async (bundleId: string) => {
    const config = {
        headers: {
            "Content-Type": "application/json",
        },
    };
    const data = {
        jsonrpc: "2.0",
        id: 1,
        method: "getBundleStatuses",
        params: [[bundleId]],
    };
    axios
        .post(
            LILJITO_RPC_ENDPOINT,
            data,
            config
        )
        .then(function (response) {
            // handle success
            console.log("\n====================================================================")
            console.log(response.data);
            console.log("====================================================================\n")
        })
        .catch((err) => {
            console.log("Error confirming the bundle result");
        });
}