export const collection_config = {
  unisatApikey: "",
  feeRate: 13,
  // livenet or testnet
  network: "livenet",
  // payment wallet wifkey
  wifKey: "",
  // payment wallet address
  address: "",
  // collection inscriptions config
  collections: {
    inscriptions: [
      // collection inscription wallet1
      {
        inscriptionWifKey: "",
        inscriptionAddress: "",
        excludeInscriptionIds: [],
        includeInscriptionIds: [],
        // include or exclude
        mode: "include"
      },
      // collection inscription wallet2
      {
        inscriptionWifKey: "",
        inscriptionAddress: "",
        excludeInscriptionIds: [],
        includeInscriptionIds: [],
        // include or exclude
        mode: "exclude"
      }
    ],
    // receive wallet address, eg. bc1p.....
    receiveAddress: "",
  },
  noChange: 1000
}
