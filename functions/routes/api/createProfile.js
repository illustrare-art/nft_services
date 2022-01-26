const admin = require('firebase-admin');

module.exports = async(req, res) => {

    const { user_id, username, profile_photo, phone_number } = req.body
    admin
        .firestore()
        .collection("users")
        .where("username", "==", username)
        .get()
        .then((querySnapshot) => {
            if (querySnapshot.size === 0) {
                admin
                    .firestore()
                    .collection("users")
                    .doc(user_id)
                    .update({
                        username,
                        profile_photo,
                        phone_number
                    })
                return res.json({ success: true })
            } else return res.json({
                success: false,
                msg: "Username already exist"
            })
        })



};

/*

GoogleSignInAccount:{displayName: Oğuz Vuruşkaner, email: oguzvuruskaner@gmail.com, id: 111224536715192972069, photoUrl: https://lh3.googleusercontent.com/a-/AOh14GimHz4e0YNJg2OF8jkRVCbU8vlFvumhz94aisP-b_s=s96-c, serverAuthCode: 4/0AX4XfWjW_orF-ay1_LG3cidjXUxApzrNCTvlEOL70HQDX_ZecdkdBO2Ri-N6CGIzCat73w}
*/