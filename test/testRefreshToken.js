let GoogleMyBusiness = require("../index");

const TOKENS_FILE = "./tokens.json";
const MANAGER_FILE = "./managers.json";
const SECRET_FILE = "./client_secret.json";

let gmb = new GoogleMyBusiness(SECRET_FILE, TOKENS_FILE, MANAGER_FILE);

gmb.refreshTokens(function (err, v) {
    if (err) {
        console.log(`Error: ${err}`);
    } else {
        console.log(v);
    }
});
