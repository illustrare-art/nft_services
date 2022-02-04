import {
  Keypair,
  PublicKey,
  SystemProgram,
  AccountInfo,
} from '@solana/web3.js';
import {
  CANDY_MACHINE,
  CANDY_MACHINE_PROGRAM_ID,
  SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID,
  TOKEN_METADATA_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  FAIR_LAUNCH_PROGRAM_ID, CLUSTERS, DEFAULT_CLUSTER,

} from './constants';
import * as anchor from '@project-serum/anchor';
import fs from 'fs';
import { web3 } from '@project-serum/anchor';
import log from 'loglevel';


export enum WhitelistMintMode {
  BurnEveryTime,
  NeverBurn,
}
export interface CandyMachineData {
  itemsAvailable: anchor.BN;
  uuid: null | string;
  symbol: string;
  sellerFeeBasisPoints: number;
  isMutable: boolean;
  maxSupply: anchor.BN;
  price: anchor.BN;
  retainAuthority: boolean;
  gatekeeper: null | {
    expireOnUse: boolean;
    gatekeeperNetwork: web3.PublicKey;
  };
  goLiveDate: null | anchor.BN;
  endSettings: null | [number, anchor.BN];
  whitelistMintSettings: null | {
    mode: WhitelistMintMode;
    mint: anchor.web3.PublicKey;
    presale: boolean;
    discountPrice: null | anchor.BN;
  };
  hiddenSettings: null | {
    name: string;
    uri: string;
    hash: Uint8Array;
  };
  creators: {
    address: PublicKey;
    verified: boolean;
    share: number;
  }[];
}


export const getTokenWallet = async function (
  wallet: PublicKey,
  mint: PublicKey,
) {
  return (
    await PublicKey.findProgramAddress(
      [wallet.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
      SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID,
    )
  )[0];
};

export const getMetadata = async (
  mint: anchor.web3.PublicKey,
): Promise<anchor.web3.PublicKey> => {
  return (
    await anchor.web3.PublicKey.findProgramAddress(
      [
        Buffer.from('metadata'),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mint.toBuffer(),
      ],
      TOKEN_METADATA_PROGRAM_ID,
    )
  )[0];
};

export const getMasterEdition = async (
  mint: anchor.web3.PublicKey,
): Promise<anchor.web3.PublicKey> => {
  return (
    await anchor.web3.PublicKey.findProgramAddress(
      [
        Buffer.from('metadata'),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mint.toBuffer(),
        Buffer.from('edition'),
      ],
      TOKEN_METADATA_PROGRAM_ID,
    )
  )[0];
};

export function loadWalletKey(keypair): Keypair {
  if (!keypair || keypair == '') {
    throw new Error('Keypair is required!');
  }
  const loaded = Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(fs.readFileSync(keypair).toString())),
  );
  log.info(`wallet public key: ${loaded.publicKey}`);
  return loaded;
}

export const getCluster = (name: string): string => {
  for (const cluster of CLUSTERS) {
    if (cluster.name === name) {
      return cluster.url;
    }
  }
  return DEFAULT_CLUSTER.url;
}

export const getBalance = async (
  account: anchor.web3.PublicKey,
  env: string,
  customRpcUrl?: string,
): Promise<number> => {
  if (customRpcUrl) console.log('USING CUSTOM URL', customRpcUrl);
  const connection = new anchor.web3.Connection(
    //@ts-ignore
    customRpcUrl || getCluster(env),
  );
  return await connection.getBalance(account);
};

