import {
  createAssociatedTokenAccountInstruction,
  createMetadataInstruction,
  createMasterEditionInstruction,
} from '../instructions';
import { sendTransactionWithRetryWithKeypair } from '../transactions';
import {
  getTokenWallet,
  getMetadata,
  getMasterEdition,
} from '../accounts';
import * as anchor from '@project-serum/anchor';
import { Creator, METADATA_SCHEMA } from '../schema';
import { serialize } from 'borsh';
import { TOKEN_PROGRAM_ID } from '../constants';
import fetch from 'node-fetch';
import { MintLayout, Token } from '@solana/spl-token';
import {
  Keypair,
  Connection,
  SystemProgram,
  TransactionInstruction,
  PublicKey,
  Transaction
} from '@solana/web3.js';
import log from 'loglevel';
import {
  CreateMetadataV2Args,
  UpdateMetadataV2Args,
  CreateMasterEditionV3Args,
  DataV2,
  Collection,
  Uses,
  VerifyCollection,
} from '@metaplex-foundation/mpl-token-metadata';
import { sendAndConfirmTransaction } from '@solana/web3.js';

export const createMetadata = async (
  metadataLink: string,
  collection: PublicKey,
  uses?: Uses,
): Promise<DataV2> => {
  // Metadata
  let metadata;
  try {
    metadata = await (await fetch(metadataLink, { method: 'GET' })).json();
  } catch (e) {
    log.debug(e);
    log.error('Invalid metadata at', metadataLink);
    return;
  }

  // Validate metadata
  if (
    !metadata.name ||
    !metadata.image ||
    isNaN(metadata.seller_fee_basis_points) ||
    !metadata.properties ||
    !Array.isArray(metadata.properties.creators)
  ) {
    log.error('Invalid metadata file', metadata);
    return;
  }

  // Validate creators
  const metaCreators = metadata.properties.creators;
  if (
    metaCreators.some(creator => !creator.address) ||
    metaCreators.reduce((sum, creator) => creator.share + sum, 0) !== 100
  ) {
    return;
  }

  const creators = metaCreators.map(
    creator =>
      new Creator({
        address: creator.address,
        share: creator.share,
        verified: true,
      }),
  );
  return new DataV2({
    symbol: metadata.symbol,
    name: metadata.name,
    uri: metadataLink,
    sellerFeeBasisPoints: metadata.seller_fee_basis_points,
    creators: creators,
    collection: collection
      ? new Collection({ key: collection.toBase58(), verified: false })
      : null,
    uses
  });
};

type PartialMetadata = {
  image : string;
  description : string;
  name : string;
} 

/*
export declare class DataV2 extends Borsh.Data<DataV2Args> {
    static readonly SCHEMA: any;
    name: string;
    symbol: string;
    uri: string;
    sellerFeeBasisPoints: number;
    creators: Creator[] | null;
    collection: Collection | null;
    uses: Uses | null;
}

*/




export const mintNFTv2 = async (
  connection: Connection,
  companyKeypair: Keypair,
  creatorKeypair:Keypair,
  metadataLink : string
) =>  {

  const data = await createMetadata(metadataLink,null)



  const mintRent = await connection.getMinimumBalanceForRentExemption(
    MintLayout.span,
  );
  
  var transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: companyKeypair.publicKey,
      toPubkey: creatorKeypair.publicKey,
      lamports: mintRent + mintRent *.1, // number of SOL to send
    }),
  );
  
  // Sign transaction, broadcast, and confirm
  await sendAndConfirmTransaction(connection, transaction, [
    companyKeypair,
  ]);


  const mint = anchor.web3.Keypair.generate();
  const instructions: TransactionInstruction[] = [];
  const signers: anchor.web3.Keypair[] = [mint, creatorKeypair];


  instructions.push(
    SystemProgram.createAccount({
      fromPubkey: creatorKeypair.publicKey,
      newAccountPubkey: mint.publicKey,
      lamports: mintRent,
      space: MintLayout.span,
      programId: TOKEN_PROGRAM_ID,
    }),
  );
  instructions.push(
    Token.createInitMintInstruction(
      TOKEN_PROGRAM_ID,
      mint.publicKey,
      0,
      creatorKeypair.publicKey,
      creatorKeypair.publicKey,
    ),
  );

  const userTokenAccountAddress = await getTokenWallet(
    creatorKeypair.publicKey,
    mint.publicKey,
  );

  instructions.push(
    createAssociatedTokenAccountInstruction(
      userTokenAccountAddress,
      creatorKeypair.publicKey,
      creatorKeypair.publicKey,
      mint.publicKey,
    ),
  );

  const metadataAccount = await getMetadata(mint.publicKey);
  let txnData = Buffer.from(
    serialize(
      new Map([
        DataV2.SCHEMA,
        ...METADATA_SCHEMA,
        ...CreateMetadataV2Args.SCHEMA,
      ]),
      new CreateMetadataV2Args({ data, isMutable: true }),
    ),
  );

  instructions.push(
    createMetadataInstruction(
      metadataAccount,
      mint.publicKey,
      creatorKeypair.publicKey,
      creatorKeypair.publicKey,
      creatorKeypair.publicKey,
      txnData,
    ),
  );

  instructions.push(
    Token.createMintToInstruction(
      TOKEN_PROGRAM_ID,
      mint.publicKey,
      userTokenAccountAddress,
      creatorKeypair.publicKey,
      [],
      1,
    ),
  );

  const editionAccount = await getMasterEdition(mint.publicKey);
  txnData = Buffer.from(
    serialize(
      new Map([
        DataV2.SCHEMA,
        ...METADATA_SCHEMA,
        ...CreateMasterEditionV3Args.SCHEMA,
      ]),
      new CreateMasterEditionV3Args({ maxSupply: new anchor.BN(0) }),
    ),
  );

  instructions.push(
    createMasterEditionInstruction(
      metadataAccount,
      editionAccount,
      mint.publicKey,
      creatorKeypair.publicKey,
      creatorKeypair.publicKey,
      creatorKeypair.publicKey,
      txnData,
    ),
  );

  const res = await sendTransactionWithRetryWithKeypair(
    connection,
    creatorKeypair,
    instructions,
    signers,
  );

  try {
    await connection.confirmTransaction(res.txid, 'max');
  } catch {
    // ignore
  }

  // Force wait for max confirmations
  await connection.getParsedConfirmedTransaction(res.txid, 'confirmed');
  log.info('NFT created', res.txid);
  log.info('\n\nNFT: Mint Address is ', mint.publicKey.toBase58());
  return metadataAccount;

}

