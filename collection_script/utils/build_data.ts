import {getAddressInscriptions,} from "./fetch";
import {collection_config} from "../config";

export async function buildInscriptionData() {
  const inscriptions = collection_config.collections.inscriptions;
  const completeBuild: any[] = [];
  for (let i = 0; i < inscriptions.length; i++) {
    const inscription = inscriptions[i];
    if (inscription.inscriptionWifKey == "") {
      continue;
    }
    const res = await getAddressInscriptions(inscription.inscriptionAddress);
    if (res.code != 0) {
      console.log(`fetch inscriptions data failed`);
      return;
    }
    const fetchInscriptions = res.data.inscription;
    if (!fetchInscriptions || fetchInscriptions.length == 0) {
      console.log("The configured wallet address is not inscription at the moment");
      continue;
    }
    const filterInscriptions: any[] = [];
    const mode = inscription.mode;
    if (mode == "exclude") {
      const excludeInscriptionIds: string[] = inscription.excludeInscriptionIds;
      fetchInscriptions.forEach((item: any) => {
        if (!excludeInscriptionIds.includes(item.inscriptionId)) {
          filterInscriptions.push(
            {
              txid: item.utxo.txid,
              vout: item.utxo.vout,
              value: item.utxo.satoshi
            }
          )
        }
      });
      completeBuild.push(
        {
          wifKey: inscription.inscriptionWifKey,
          inscriptions: filterInscriptions
        }
      );
    } else if (mode == "include") {
      const includeInscriptionIds: string[] = inscription.includeInscriptionIds;
      fetchInscriptions.forEach((item: any) => {
        if (includeInscriptionIds.includes(item.inscriptionId)) {
          filterInscriptions.push(
            {
              txid: item.utxo.txid,
              vout: item.utxo.vout,
              value: item.utxo.satoshi
            }
          )
        }
      });
      completeBuild.push(
        {
          wifKey: inscription.inscriptionWifKey,
          inscriptions: filterInscriptions
        }
      );
    }
  }
  return completeBuild;
}
