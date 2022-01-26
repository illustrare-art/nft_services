const { default: axios } = require("axios");
const admin = require("firebase-admin");
const randomstring = require("randomstring");

let uid = randomstring.generate(32);
require("./exportEnv");

const apiAddress = "http://localhost:5001/illustrare-53f71/us-central1/api/create_profile"

admin.initializeApp({
    projectId: "illustrare-53f71"
});

const createUser = async(uid) => {
    await admin
        .auth()
        .createUser({ uid })
};

beforeAll(async() => {
    await createUser(uid)
})

afterAll(async() => {

    await admin
        .auth()
        .deleteUser(uid);
})

describe("Create Profile API can ", () => {

    test("create new user.", async() => {
        const { data } = await axios.post(apiAddress, {
            user_id: uid,
            username: "necati",
            profile_photo: "https://picsum.photos/200",
            phone_number: "+1234123412"
        })
        expect(data.success).toBe(true)
    })
    test("fails on created user.", async() => {
        const { data } = await axios.post(apiAddress, {
            user_id: uid,
            username: "necati"
        })
        expect(data.success).toBe(false)
    })
})