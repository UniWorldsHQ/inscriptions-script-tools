import {Psbt, networks} from "bitcoinjs-lib";
import {buildInscriptionData} from "./utils/build_data";
import {buildWalletInfo, toXOnly} from "./utils/wallet_utils";
import {broadcast} from "./utils/fetch";
import {collection_config} from "./config";
import {findEnoughSats} from "./utils/transaction_utils";

export async function collectionInscriptions() {
  const inscriptionData = await buildInscriptionData();
  if (!inscriptionData || inscriptionData.length == 0) {
    console.log("Failed to build inscription data");
    return;
  }
  const changeCount = 1;
  let inputs = 0;
  let outputs = changeCount;
  const network = collection_config.network ? networks.testnet : networks.bitcoin;
  const psbt = new Psbt({network});

  const signers = [];
  let startSignIndex = 0;
  for (let i = 0; i < inscriptionData.length; i++) {
    const wifKey = inscriptionData[i].wifKey;
    const inscriptions = inscriptionData[i].inscriptions;
    const walletInfo = buildWalletInfo(wifKey);
    if (!walletInfo) {
      console.log("Failed to build walletInfo");
      return;
    }
    const keyPair = walletInfo.keyPair;
    const tweakedSigner = walletInfo.tweakedSigner;
    const p2tr = walletInfo.p2tr;
    const tapInternalKey = toXOnly(keyPair.publicKey);
    inscriptions.forEach((item: any) => {
      psbt.addInput(
        {
          hash: item.txid,
          index: item.vout,
          witnessUtxo: { value: item.value, script: p2tr.output! },
          tapInternalKey: tapInternalKey
        }
      );
      psbt.addOutput(
        {
          address: collection_config.collections.receiveAddress,
          value: item.value
        }
      );

      inputs ++;
      outputs ++;
    });

    signers.push(
      {
        tweakedSigner: tweakedSigner,
        startSignIndex: startSignIndex,
        endSignIndex: psbt.inputCount
      }
    );
    startSignIndex = psbt.inputCount;
  }

  const findRes = await findEnoughSats(collection_config.address, collection_config.noChange, inputs, outputs);
  if (!findRes) {
    console.log("Unable to find a utxo that matches");
    return;
  }

  const utxos = findRes.utxos;
  let paymentWalletInfo = buildWalletInfo(collection_config.wifKey);
  utxos.forEach((utxo: any) => {
    psbt.addInput(
      {
        hash: utxo.txid,
        index: utxo.vout,
        witnessUtxo: { value: utxo.satoshi, script: paymentWalletInfo.p2tr.output! },
        tapInternalKey: toXOnly(paymentWalletInfo.keyPair.publicKey)
      }
    );
  });

  const changeRequired = findRes.changeRequired;
  if (changeRequired) {
    psbt.addOutput(
      {
        address: collection_config.address,
        value: findRes.changeAmount
      }
    );
  }

  signers.forEach((signer: any) => {
    for (let i = signer.startSignIndex; i < signer.endSignIndex; i++) {
      psbt.signInput(i, signer.tweakedSigner);
    }
  })
  for (let i = startSignIndex; i < psbt.inputCount; i++) {
    psbt.signInput(i, paymentWalletInfo.tweakedSigner);
  }
  psbt.finalizeAllInputs();
  const tx = psbt.extractTransaction();
  const broadcastRes = await broadcast(tx.toHex());
  console.log(`broadcast res ${broadcastRes}`);
}

collectionInscriptions();
