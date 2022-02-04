import pinataSDK, {PinataClient} from "@pinata/sdk"
import {config, DotenvParseOutput} from "dotenv"
import {MintSingleRequestData} from "../../types";
import {getCluster, loadWalletKey} from "./accounts";
import {web3} from "@project-serum/anchor";
import {Duplex} from "stream";
import {mintNFTv2} from "./commands/mint-nft";
import {CLUSTERS, DEFAULT_CLUSTER} from "./constants";


type PinataUploadResult = {
    tokenMetadata:any;
    metadataUrl:string
}

type PinataConfig = {
    apiKey:string;
    apiSecret:string;
    JWT:string;
}

export type MinterConstructorArguments = {
    pinataConfigPath:string;
    payerConfigPath:string;
    clusterName:string | null;
}


export default class Minter {

    pinataConfig : DotenvParseOutput;
    pinata: PinataClient;
    payerKeypair: web3.Keypair;
    solConnection:web3.Connection;

    constructor(minterConfig : MinterConstructorArguments){

        const {pinataConfigPath,payerConfigPath,clusterName = "devnet"} = minterConfig

        this.payerKeypair = loadWalletKey(payerConfigPath)
        this.solConnection = new web3.Connection(getCluster(clusterName))
        this.pinataConfig  = config({
            path:pinataConfigPath
        }).parsed
        this.pinata =  pinataSDK(this.pinataConfig.apiKey, this.pinataConfig.apiSecret)
    }
    /*
    export type MintSingleRequestData = {
        photo: any,
        name:string,
        description:string,
        user: {
            publicKey:string,
            secretKey:string
        }
    }

     */



    static bufferToStream(buffer) : Duplex {
        let bufferStream = new Duplex();
        bufferStream.push(buffer);
        bufferStream.push(null);
        return bufferStream;
    }

    async uploadDataToPinata(mintData : MintSingleRequestData) : Promise<PinataUploadResult>{
        const {photo,name,
            description,
            user: {
                publicKey
            }
        }  = mintData
        const fileResult = await this.pinata.pinFileToIPFS(Minter.bufferToStream(photo))
        const fileUrl = `https://gateway.pinata.cloud/ipfs/${fileResult.IpfsHash}`
        const tokenMetadata = {
            name,
            symbol:"ILLUSTRARE",
            description,
            seller_fee_basis_points:500,
            image:fileUrl,
            attributes:[],
            properties:{
                creators:[{
                    address:publicKey,
                    verified:true,
                    share:100
                }],
                files:[{
                    uri:fileUrl,type:"image/png"
                }]
            }
        }
        const metadataResult = await this.pinata.pinJSONToIPFS(tokenMetadata)
        const metadataUrl = `https://gateway.pinata.cloud/ipfs/${metadataResult.IpfsHash}`

        return {
            tokenMetadata,
            metadataUrl
        }
    }

    async mintSingle(mintData : MintSingleRequestData){
        const {
            user:{
                publicKey,
                secretKey
            }
        }  = mintData
        const {metadataUrl} = await this.uploadDataToPinata(mintData)
        const creatorKeypair = new web3.Keypair({
            publicKey:new Uint8Array(await publicKey.arrayBuffer()),
            secretKey:new Uint8Array(await secretKey.arrayBuffer()),
        })
        await mintNFTv2(
            this.solConnection,
            this.payerKeypair,
            creatorKeypair,
            metadataUrl,
        )
    }
}



