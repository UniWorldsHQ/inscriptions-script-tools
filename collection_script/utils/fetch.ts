import axios, { AxiosResponse } from "axios";
import {collection_config} from "../config";

let unisatClient: any;
let mempoolClient: any;
if (collection_config.network == "testnet") {
  unisatClient = new axios.Axios({
    baseURL: `https://open-api-testnet.unisat.io`
  });

  mempoolClient = new axios.Axios({
    baseURL: `https://mempool.space/testnet/api`
  });
} else {
  unisatClient = new axios.Axios({
    baseURL: `https://open-api.unisat.io`
  });

  mempoolClient = new axios.Axios({
    baseURL: `https://mempool.space/api`
  });
}


export async function getAddressInscriptions(address: string) {
  const response: AxiosResponse<string> = await unisatClient.get(`/v1/indexer/address/${address}/inscription-data?size=1000`, {
    headers: {
      Authorization: `Bearer ${collection_config.unisatApikey}`
    }
  })
  return JSON.parse(response.data);
}

export async function getAddressBtcUtxo(address: string) {
  const response: AxiosResponse<string> = await unisatClient.get(`/v1/indexer/address/${address}/utxo-data?size=1000`, {
    headers: {
      Authorization: `Bearer ${collection_config.unisatApikey}`
    }
  })
  return JSON.parse(response.data);
}

export async function broadcast(txHex: string) {
  const response: AxiosResponse<string> = await mempoolClient.post('/tx', txHex);
  return response.data;
}
