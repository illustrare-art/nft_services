const admin = require("firebase-admin");
const axios = require("axios");

const randomstring = require("randomstring");
let uid = randomstring.generate(32);

require("./exportEnv");



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

describe("Auth ", () => {

    test("returns 401 and unauthorized for non-authenticated users.", async() => {
        const data = {
            user_id: "uid"
        }
        const result = await axios.post("http://localhost:5001/illustrare-53f71/us-central1/api", data).catch(data => data);
        expect(result.response.status).toBe(401);


    })

    test("returns 404 on authenticated not found.", async() => {
        const data = {
            user_id: uid
        }
        const result = await axios.post("http://localhost:5001/illustrare-53f71/us-central1/api", data).catch(data => data);
        expect(result.response.status).toBe(404);

    })
})