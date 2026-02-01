# Solana Pumpfun & Bonkfun Bundler using JITO & LOOKUPTABLE

## Contact
Telegram: [Pio-ne-er](https://t.me/hi_3333)

You can contact me here if you have any problems with this repo then we can decide comfortable contact way.

## New Updates

Axiom Buy + Bloom Buy is bypassing bubble detection problem successfully.
Here is the example of successful launch.

https://solscan.io/token/CaqZUfejGnHQtZqkF98iNQNXBYEuaHBEZxkRnmVAtqXK

Bundle ID: 
https://explorer.jito.wtf/bundle/b7c31cdb366875fa66aead1933843ae4ee48ce7eb7713304bd454e8e0a0786c2
https://solscan.io/tx/LoQdPyTz2skmwNY1ouVZ4HoPWhU7G1pCw76mZHWzYGEWn3MZnFPn7ZQtWzsskLf99yeKCYLnhEH71KXX1eeWwLo
https://solscan.io/tx/5N99cCok6td3Tcp3MV7ajUJLq7DsXxWKEceQ4YcCXtobHwZmJnvyKHbs9mDTDosUcH6CywN4LHd2oEntxwymhrTz

<img width="567" height="616" alt="image" src="https://github.com/user-attachments/assets/1453624a-750e-45a9-a09b-11b6d4cad6eb" />

## Sample

https://pump.fun/7JTQG7Bp6fsbnSmfT6NqRoTmoMj6aX9NZXdnsnHgJtuz

with updated version

https://solscan.io/token/4KndEPnfUbBWMqt98MASDdRL7DNLzyRG2E5epTps3Hz5
https://pump.fun/4KndEPnfUbBWMqt98MASDdRL7DNLzyRG2E5epTps3Hz5

https://solscan.io/tx/qEkqUEhmxd13AKNVKQqNNYD6m7HybY1qS5vcUCdypKvqaVSGqhhpLMGhae3ca86TdA4UHTGvrzyifJQm3LgxwJh
https://solscan.io/tx/5GKq7hTTF9UKfeUNLE5WS34mo27NBewX74oxfni83KgWgtq9KQskcpEFCUiZbDLn4BkhXZ5CLh5pWH6CHX9EMwEH
https://solscan.io/tx/W33LBg34YvnKjt4db6thosLwLWHUHEqxSraXsVXCw8nqH8CPKNVKyNF6ykAnwqPLVArvWaP2aZnfN8NHhUKLZGh
https://solscan.io/tx/3w9jxKvFMYZmUXNAC9ee3QgsmvKAiBrm4zKNp6wJb32Mn4d2H9g1jdobeGfQxyPczfUcU6398msosKziSdhzBjeY

Each transaction is buying tokens from 5 wallets, totally buying with 24 wallets.
You can check successful buying transactions.
Now, again Updated with the random amounts to buy from 24 wallets and seperating dev and funding wallets to pass the security checks.

## Overview

Jito is supporting the bundle service that you can confirm 4 transactions (This is maximum from my experience) at once.

I am doing with 24 wallets, but there is possibility to increase the number of wallets.
So, each swap instruction of Pumpfun has less accounts than Raydium, so we can use Lookuptable more effectively than Raydium.

It provides methods for creating, buying from 24 wallets, and selling tokens when you want.

This is the steps of My bundler.

## 1. Creating wallets to buy tokens from the pool you creating.

## 2. Creating Lookuptable

## 3. Extending Lookuptable and simulations of each transactions to bundle

## 4. Bundle createPool with the token of metadata transaction and 3 transactions buying from 28 wallets.

## 5. Sell tokens at once from 24 wallets using bundle when you want

## 6. Gathering Sol from 24 wallets you bundle buy and sell

# Updated Version

Previous version has serious problem.
But nobody recorgnized it but after delivery of the product, when the clients are testing with big amount of solana, it meets error (exactly SLIPPAGE error)
So, in updated version, I solved that problem.
And seperate the dev wallet and funding wallet.
And randomize the amount of distributing to bundler wallets, by doing that we can decorate the chart well.

#BonkFun Bundler

https://explorer.jito.wtf/bundle/eaa8763d37102137000aab9ee7986e822e378a31a3d84c1d4c980e6b96074f21

This bundle transaction which is successfullly bundle the pool creation and buy transactions.

pool creation: https://solscan.io/tx/3WcHBgxMyZrXjf4fHCFUKgp1A4oK2C8ikUkhXt6fmBmxFoZffi6eDySaBi2xBmCYqWvnSeRCPvnrHpijqSkAFzUD
buy transaction: https://solscan.io/tx/5J5KNjqG1VHFEinoyZHptPitfy1tDZGs2aKoCfYGvgTF9wfZEpQ9zWZQr7dKRv2UpbxGLXjZH8vDUCEH2AF81Xyn

Please feel free to contact me for any help.
