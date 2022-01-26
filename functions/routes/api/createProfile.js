const admin = require('firebase-admin');
const HttpStatus = require("http-status-codes")

module.exports = async(req, res) => {

    const { userId, username, profile_photo, description } = req.body
    const user = await admin
        .auth()
        .getUser(userId);
    if (user === null) {
        res.setStatus(HttpStatus.StatusCodes.UNAUTHORIZED);
        res.json({
            success: false
        })
    } else {
        admin
            .firestore()
            .where("username", "==", username)
            .get()
            .then((querySnapshot) => {
                if (querySnapshot.size === 0) return res.json({ success: true })
                else return res.json({
                    success: false,
                    msg: "Username already exist"
                })
            })
    }

};

/*

GoogleSignInAccount:{displayName: Oğuz Vuruşkaner, email: oguzvuruskaner@gmail.com, id: 111224536715192972069, photoUrl: https://lh3.googleusercontent.com/a-/AOh14GimHz4e0YNJg2OF8jkRVCbU8vlFvumhz94aisP-b_s=s96-c, serverAuthCode: 4/0AX4XfWjW_orF-ay1_LG3cidjXUxApzrNCTvlEOL70HQDX_ZecdkdBO2Ri-N6CGIzCat73w}
*/