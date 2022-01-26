const admin = require('firebase-admin');

module.exports = async(req, res, next) => {
    const { userId } = req.body
    const user = await admin.auth().getUser(userId);
    if (user === null) {
        res.setStatus(HttpStatus.StatusCodes.UNAUTHORIZED);
        return res.json({
            success: false
        })
    } else {
        next()
    }
}