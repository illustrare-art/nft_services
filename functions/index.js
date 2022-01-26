const functions = require("firebase-functions");
const admin = require("firebase-admin");
const web3 = require("@solana/web3.js");

admin.initializeApp();

const app = require("./app");


//auth trigger(new user signup)
exports.newUserSignUp = functions.auth.user().onCreate((user) => {
    const { email, uid, photoURL, phoneNumber } = user;
    const { _keypair: { publicKey, secretKey } } = web3.Keypair.generate();


    admin
        .firestore()
        .collection("users")
        .doc(uid)
        .set({
            email,
            profile_photo: photoURL,
            phone_number: phoneNumber,
            public_key: publicKey,
            secret_key: secretKey,
        });
});

// auth trigger ( user deleted +)
exports.userDeleted = functions.auth.user().onDelete((user) => {
    const { uid } = user;

    admin
        .firestore()
        .collection("users")
        .doc(uid)
        .delete();
});

// REST API server
exports.api = functions.https.onRequest(app);