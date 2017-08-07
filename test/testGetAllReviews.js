const TOKENS_FILE = "./tokens.json";
const MANAGER_FILE = "./managers.json";
const SECRET_FILE = "./client_secret.json";
const STORE_REVIEW_FILE = "./storeReviews.json";

let GoogleMyBusiness = require("../index");
let _ = require("lodash");
let fs = require("fs");

let gmb = new GoogleMyBusiness(SECRET_FILE, TOKENS_FILE, MANAGER_FILE);

let stores = require("../locations.json");

let ids = _.map(stores, (store) => {
    return {
        id: store
            .name
            .split("/")[3]
    };
});

let storeReviews = [];

let getReviewI = function (i, storeReviews) {
    try {
        console.log("Started: id", i, ids[i].id);
        
        if (i >= ids.length) {
            console.log("Completed:", storeReviews.length, "store reviews");
            fs.writeFile(STORE_REVIEW_FILE, JSON.stringify(storeReviews));
            console.log("Review written to disk");
            return;
        }
        gmb
            .getLocationReviews(ids[i].id, function (err, v) {
                try {
                    if (err) {
                        console.log(`Error: ${JSON.stringify(err)} ${JSON.stringify(ids[i])}`);
                    } else {
                        storeReviews.push({id: ids[i].id, reviews: v});
                        console.log("Completed: id", i, ids[i].id);
                        getReviewI(i + 1, storeReviews);
                    }
                } catch (err) {
                    console.log(`Error: ${JSON.stringify(err)}`)
                    console.log("Completed:", storeReviews.length, "store reviews");
                    fs.writeFile(STORE_REVIEW_FILE, JSON.stringify(storeReviews));
                    console.log("Error occured. Saving reviews to disk");
                }
            });
    } catch (err) {
        console.log(`Error: ${JSON.stringify(err)}`)
        console.log("Completed:", storeReviews.length, "store reviews");
        fs.writeFile(STORE_REVIEW_FILE, JSON.stringify(storeReviews));
        console.log("Error occured. Saving reviews to disk");
    }
}

getReviewI(0, []);