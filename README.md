Google My Business API
======================

Node.js client library for using Google My Business API v3. Support for authentication, token refresh. Tokens are saved to a local file. This is meant for users who want a quick way to extract most commonly required business data for analysis. For full usage of Google My Business API, please refer to the full [API documentation](https://developers.google.com/my-business/)

Library Maintenance
-------------------

This client library was created to support a personal project. No regular maintenance is done.

Usage
-----

### Getting Started
1. Create and download your client secret from Google Cloud Console, following instructions from [Google OAuth2](https://developers.google.com/identity/protocols/OAuth2ForDevices#creatingcred)
2. Save index.js to your project directory
3. Save package.json to your project directory
3. Run <code>npm install</code>

### Get Authenticated

This will save the [access tokens](https://developers.google.com/identity/protocols/OAuth2) and first [account_name](https://developers.google.com/identity/protocols/OAuth2ForDevices#creatingcred) to your TOKENS_FILE and MANAGER_FILE

``` javascript
const GoogleMyBusiness = require("./index");
const TOKENS_FILE = "./tokens.json";
const MANAGER_FILE = "./managers.json";
const SECRET_FILE = "./client_secret.json";

let gmb = new GoogleMyBusiness(SECRET_FILE, TOKENS_FILE, MANAGER_FILE);

gmb.getAuthentation(function (err, v) {
    if (err) {
        console.log(`Error: ${err}`);
    } else {
        console.log(v);
    }
});
```

### Refresh Token
This refreshes the token in the TOKENS_FILE
``` javascript
gmb.refreshTokens(function (err, v) {
    if (err) {
        console.log(`Error: ${err}`);
    } else {
        console.log(v);
    }
});
```

APIs supported
--------------
- getUserAccounts(callback): get all accounts
- getAllLocations(callback): get all locations
- getLocationById(locationId, callback): get a single location by location id
- getLocationReviews(locationId, callback): list reviews for a given location id
- getInsightsbyLocationId(locationId, numberOfPeriods, periodUnit, callback), list location insights for a given location id for the past number of periods as defined by the [periodUnit](https://momentjs.com/docs/#/manipulating/add)

Examples
--------

### Get User Accounts
``` javascript
gmb.getUserAccounts(function (err, v) {
    if (err) {
        console.log(`Error: ${JSON.stringify(err)}`);
    }
    else {
        console.log(v);
    }
});
```

### Get All Locations
```javascript
gmb.getAllLocations(function (err, v) {
    if (err) {
        console.log(`Error: ${JSON.stringify(err)}`);
    } else {
        console.log(`Number of Locations: ${v.length}`);
    }
});
```

### Get Location Details
``` javascript
const locationId = '<LOCATION_ID>';
gmb.getLocationById(locationId, function (err, v) {
    if (err) {
        console.log(`Error: ${err}`);
    } else {
        console.log(JSON.stringify(v, 4));
    }
});
```

### Get Reviews for a Location
``` javascript
const locationId = '<LOCATION_ID>';
gmb.getLocationReviews(locationId, function (err, v) {
    if (err) {
        console.log(`Error: ${JSON.stringify(err)}`);
    } else {
        console.log(JSON.stringify(v, 4));
    }
});
```

### Get Location Insights
Get location insights for the past week
``` javascript
let locationId = "<LOCATION_ID>";
gmb.getInsightsByLocation(locationId, 1, "week", function (err, v) {
    if (err) {
        console.log(`Error: ${JSON.stringify(err)}`);
    } else {
        console.log(JSON.stringify(v));
    }
});
```

License
-------
This library is licensed under Apache 2.0. Full license text is available in [COPYING.](/COPYING)