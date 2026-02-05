import { logToFile, sellBuyWaiting } from "../src/msgLog";
import { eachBundleSell } from "../src/eachBundleSell";

export const manual_each_sell = async () => {

  await eachBundleSell()

  sellBuyWaiting()
}