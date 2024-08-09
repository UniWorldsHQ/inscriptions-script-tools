import {
  Signer,
  crypto,
  networks,
  payments,
  initEccLib
} from "bitcoinjs-lib";
import { ECPairFactory, ECPairAPI, TinySecp256k1Interface } from 'ecpair';
import {collection_config} from "../config";

const tinysecp: TinySecp256k1Interface = require('tiny-secp256k1');
initEccLib(tinysecp as any);
const ECPair: ECPairAPI = ECPairFactory(tinysecp);
const network = collection_config.network == "testnet" ? networks.testnet : networks.bitcoin;

export function buildWalletInfo(wifKey: string) {
  const keyPair = ECPair.fromWIF(wifKey, network)
  // Tweak the original key pair
  const tweakedSigner = tweakSigner(keyPair, { network });
  const p2tr = payments.p2tr({
    pubkey: toXOnly(tweakedSigner.publicKey),
    network
  });
  const p2tr_addr = p2tr.address ?? "";
  return {
    p2tr: p2tr,
    address: p2tr_addr,
    keyPair: keyPair,
    tweakedSigner: tweakedSigner,
    network: network
  }
}

export function tweakSigner(signer: Signer, opts: any = {}): Signer {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  let privateKey: Uint8Array | undefined = signer.privateKey!;
  if (!privateKey) {
    throw new Error('Private key is required for tweaking signer!');
  }
  if (signer.publicKey[0] === 3) {
    privateKey = tinysecp.privateNegate(privateKey);
  }

  const tweakedPrivateKey = tinysecp.privateAdd(
    privateKey,
    tapTweakHash(toXOnly(signer.publicKey), opts.tweakHash),
  );
  if (!tweakedPrivateKey) {
    throw new Error('Invalid tweaked private key!');
  }

  return ECPair.fromPrivateKey(Buffer.from(tweakedPrivateKey), {
    network: opts.network,
  });
}

export function tapTweakHash(pubKey: Buffer, h: Buffer | undefined): Buffer {
  return crypto.taggedHash(
    'TapTweak',
    Buffer.concat(h ? [pubKey, h] : [pubKey]),
  );
}

export function toXOnly(pubkey: Buffer): Buffer {
  return pubkey.subarray(1, 33)
}
