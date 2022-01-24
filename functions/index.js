const functions = require("firebase-functions");
const admin = require("firebase-admin");


admin.initializeApp();

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

// auth trigger ( new user signup )
exports.newUserSignUp = functions.auth.user().onCreate((user) => {
    const {email, uid, photoURL, phoneNumber} = user;
    admin
        .firestore()
        .collection("users")
        .doc(uid)
        .set({
            email,
            profilePhoto: photoURL,
            phoneNumber,
        });
});

// auth trigger ( user deleted +)
exports.userDeleted = functions.auth.user().onDelete((user) => {
    const {uid} = user;

    const userRef = admin
        .firestore()
        .collection("users")
        .ref(uid);

    if (userRef) {
        userRef.remove();
    }
});
