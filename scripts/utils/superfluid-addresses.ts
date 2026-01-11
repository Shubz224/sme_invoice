// Superfluid contract addresses for different networks
export interface SuperfluidAddresses {
    host: string;
    cfaV1: string;
    cfaV1Forwarder: string;
    gdaV1: string;
    gdaV1Forwarder: string;
    idaV1: string;
    resolver: string;
    superTokenFactory: string;
}

// Superfluid addresses (same across all EVM chains)
export const SUPERFLUID_ADDRESSES: SuperfluidAddresses = {
    host: "0x4E583d9390082B65Bef884b629DFA426114CED6d",
    cfaV1: "0x2844c1BBdA121E9E43105630b9C8310e5c72744b",
    cfaV1Forwarder: "0xcfA132E353cB4E398080B9700609bb008eceB125",
    gdaV1: "0xAAdBB3Eee3Bd080f5353d86DdF1916aCA3fAC842",
    gdaV1Forwarder: "0x6DA13Bde224A05a288748d857b9e7DDEffd1dE08",
    idaV1: "0xbCF9cfA8Da20B591790dF27DE65C1254Bf91563d",
    resolver: "0xeE4cD028f5fdaAdeA99f8fc38e8bA8A57c90Be53",
    superTokenFactory: "0x0422689cc4087b6B7280e0a7e7F655200ec86Ae1",
};

// USDY addresses (to be filled in)
export const USDY_ADDRESSES = {
    mantleSepolia: "", // To be filled - may need to deploy MockUSDY
    mantleMainnet: "", // To be filled from Ondo Finance
};
