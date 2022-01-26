const { Router } = require("express");

const router = Router();
const createProfile = require("./createProfile");

router.post("/create_profile", createProfile);

module.exports = router;