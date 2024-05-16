import {getAddressBtcUtxo} from "./fetch";
import {collection_config} from "../config";

export function transactionInputBytesCal(inputs: number = 1) {
  return inputs * 180 + 40 - inputs;
}

export function transactionOutputBytesCal(outputs: number = 1) {
  return outputs * 34;
}

export function transferNetworkFeeCal(transactionBytes: number, extraBytes: number = 0, divisor: number = 1) {
  const totalBytes = transactionBytes + Math.floor(extraBytes / 4);
  return Math.round(collection_config.feeRate * totalBytes / divisor);
}

/**
 * try to find enough sats for collection inscriptions
 * dynamic calculation of transaction fee
 * @param address
 * @param noChange
 * @param inputs
 * @param outputs
 */
export async function findEnoughSats(address: string, noChange: number, inputs: number, outputs: number) {
  const data = await getAddressBtcUtxo(address);
  if (data.code != 0) {
    console.log("get btc utxo failed");
    return null;
  }
  const utxos = data.data.utxo.sort((arg1: any, arg2: any) => arg2.satoshi - arg1.satoshi);
  if (!utxos || utxos.length == 0) {
    console.log("The configured wallet address is not enough sats at the moment")
    return null;
  }
  let calAmount = 0;
  let changeAmount = 0;
  const multiUtxos: any[] = [];
  let btcUtxoCount = 1;
  let accomplish = false;
  let changeRequired = true;
  utxos.forEach((utxo: any) => {
    if (accomplish) {
      return;
    }
    const inputBytes = transactionInputBytesCal(inputs + btcUtxoCount);
    const outputBytes = transactionOutputBytesCal(outputs + btcUtxoCount);
    const dynamicAmountCal = transferNetworkFeeCal(inputBytes + outputBytes, 0, 2);
    calAmount += utxo.satoshi;
    multiUtxos.push(utxo);
    if (calAmount >= dynamicAmountCal) {
      accomplish = true;
      changeAmount = calAmount - dynamicAmountCal;
      if (changeAmount <= noChange) {
        changeRequired = false;
        return;
      }
    }
  });
  if (!accomplish) {
    return null;
  }
  return {
    calAmount: calAmount,
    utxos: multiUtxos,
    changeRequired: changeRequired,
    changeAmount: changeAmount
  };
}
