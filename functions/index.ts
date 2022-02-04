import * as functions from "firebase-functions"
import * as admin from "firebase-admin"
import * as web3  from "@solana/web3.js"
import {
    MintSingleRequestData,
    FunctionsMessage
} from "./types"
import Minter from "./nft_services/src/Minter";
admin.initializeApp();


//auth trigger(new user signup)
export const newUserSignUp = functions.auth.user().onCreate(async(user) => {
    const { email, uid, photoURL, phoneNumber } = user;
    const keypair = web3.Keypair.generate();


    await admin
        .firestore()
        .collection("users")
        .doc(uid)
        .set({
            email,
            profile_photo: photoURL,
            phone_number: phoneNumber,
            public_key: keypair.publicKey.toString(),
            secret_key: keypair.secretKey.toString(),
        });
});


// auth trigger ( user deleted +)
export const userDeleted = functions.auth.user().onDelete(async(user) => {
    const { uid } = user;

    await admin
        .firestore()
        .collection("users")
        .doc(uid)
        .delete();
});

// The function can only be called by Google Cloud.
/*

    message:{
        data:{
            photo: Buffer
            name: string
        }
    }
*/
export const mintSingle = async (message : FunctionsMessage<MintSingleRequestData>) => {
    const { data } = message
    console.log(data)
    const minterConfig = {
        pinataConfigPath : "pinata.env",
        payerConfigPath : "devnet-wallet.json",
        clusterName : "devnet"
    }
    const minter = new Minter(minterConfig)
    await minter.mintSingle(data)
}