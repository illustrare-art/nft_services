const {Router} = require("express");

const router = Router();
const api = require("./api");


router.use(api);

module.exports = router;
