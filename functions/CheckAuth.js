const admin = require('firebase-admin');
const HttpStatus = require("http-status-codes")

module.exports = async(req, res, next) => {
    const { user_id = null } = req.body

    if (user_id === null) {
        res.statusCode = HttpStatus.StatusCodes.UNAUTHORIZED;
        return res.json({
            success: false
        })
    }

    const user = await admin.auth().getUser(user_id).catch(() => {
        res.statusCode = HttpStatus.StatusCodes.UNAUTHORIZED;
        return res.json({
            success: false
        })
    })
    if (user === null) {
        res.statusCode = HttpStatus.StatusCodes.UNAUTHORIZED;
        return res.json({
            success: false
        })
    } else {
        next()
    }
}