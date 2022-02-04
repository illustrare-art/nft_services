const functions = require("firebase-functions");
const admin = require("firebase-admin");
const web3 = require("@solana/web3.js");

admin.initializeApp();


//auth trigger(new user signup)
exports.newUserSignUp = functions.auth.user().onCreate(async(user) => {
    const { email, uid, photoURL, phoneNumber } = user;
    const { _keypair: { publicKey, secretKey } } = web3.Keypair.generate();


    await admin
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
exports.userDeleted = functions.auth.user().onDelete(async(user) => {
    const { uid } = user;

    await admin
        .firestore()
        .collection("users")
        .doc(uid)
        .delete();
});