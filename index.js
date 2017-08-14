// Authentication from:
// https://github.com/google/google-api-nodejs-client/tree/master#options
// CONSTANTS

const SCOPES = ["https://www.googleapis.com/auth/plus.business.manage"];
const API_URL = "https://mybusiness.googleapis.com";
const VERSION = "v3";
const BASE_URL = `${API_URL}/${VERSION}`;
const GET_ACCOUNTS_URL = `${BASE_URL}/accounts`;

const moment = require('moment');
const winston = require('winston');
const fs = require("fs");
let google = require("googleapis");
const readline = require("readline");
let _ = require("lodash");
let request = require("request");

winston.level = "info";

class GoogleMyBusiness {
    constructor(secretFile, tokenFile, managerFile) {
        if (!secretFile || !tokenFile || !managerFile) {
            console.log("Error: Missing files");
            return;
        }
        this.secretFile = secretFile;
        let config = require(this.secretFile);
        let clientId = config.installed.client_id;
        let clientSecret = config.installed.client_secret;
        let redirectUrl = config.installed.redirect_uris[0]

        this.oauth2Client = new google
            .auth
            .OAuth2(clientId, clientSecret, redirectUrl);

        this.tokenFile = tokenFile;
        try {
            this.tokens = require(this.tokenFile);

        } catch (err) {
            this.tokens = null;
        }

        this.managerFile = managerFile;

    }

    hasToken() {
        if (this.tokens) {
            return true;
        } else {
            console.log("Error: No Tokens");
            return false;
        }
    }

    hasManagerId() {
        try {
            var self = this;
            let managers = require(self.managerFile);
            let manager_id = managers[0]['name'].split('/')[1];
            return true;
        } catch (err) {
            console.log("Error: No account_name");
            return false;
        }
    }

    refreshTokens(cb) {
        let self = this;
        if (!self.hasToken()) {
            return;
        }
        self
            .oauth2Client
            .setCredentials(self.tokens);
        self
            .oauth2Client
            .refreshAccessToken(function (err, tokens) {
                // your access_token is now refreshed and stored in oauth2Client store these new
                // tokens in a safe place (e.g. database)
                if (err) {
                    return cb(err, null);
                } else {
                    self.tokens = tokens;
                    fs.writeFile(self.tokenFile, JSON.stringify(self.tokens));
                    winston.log("info", "Refreshed Tokens");
                    return cb(null, self.tokens);
                }

            });
    }

    getAuthentation(cb) {
        let self = this;

        let url = self
            .oauth2Client
            .generateAuthUrl({access_type: 'offline', scope: SCOPES});

        console.log(`Get the authorisation token at:\n${url}`);

        const readFromConsole = readline.createInterface({input: process.stdin, output: process.stdout});

        readFromConsole.question("Enter your authorisation code:", (code) => {
            readFromConsole.close();

            self
                .oauth2Client
                .getToken(code, function (err, tokens) {
                    // Now tokens contains an access_token and an optional refresh_token. Save them.
                    if (err) {
                        return cb(err, null);
                    } else {
                        self.tokens = tokens;
                        self
                            .oauth2Client
                            .setCredentials(self.tokens);
                        fs.writeFile(self.tokenFile, JSON.stringify(self.tokens));

                        request.get(GET_ACCOUNTS_URL, {
                            'auth': {
                                'bearer': self.tokens.access_token
                            }
                        }, function (error, response, body) {
                            let googleResponse = JSON.parse(body);
                            if (googleResponse.error) {
                                console.log(`Error:${googleResponse.error}`);
                                return;
                            }
                            let accounts = googleResponse.accounts;
                            let managers = _.filter(accounts, {
                                'type': 'BUSINESS',
                                'role': 'MANAGER'
                            });
                            fs.writeFile(self.managerFile, JSON.stringify(managers));
                            winston.log("info", "Authentication saved");
                            return cb(null, self.tokens);
                        });
                    }
                });
        })
    };

    getUserAccounts(cb) {
        let self = this;
        if (!self.hasToken()) {
            return;
        }
        request
            .get(GET_ACCOUNTS_URL, {
                'auth': {
                    'bearer': self.tokens.access_token
                }
            }, function (error, response, body) {
                let googleResponse = JSON.parse(body);
                if (googleResponse.error) {
                    return cb(googleResponse.error, null);
                } else {
                    return cb(null, googleResponse);
                }
            })
    };

    getNextLocations(level, result, nextPageToken, cb) {
        let self = this;
        if (!self.hasToken()) {
            return cb({
                error: "No Token"
            }, null);
        }
        if (!self.hasManagerId()) {
            return cb({
                error: "No account_name"
            }, null);
        }
        let managers = require(self.managerFile);
        let manager_id = managers[0]['name'].split('/')[1];

        request.get(`${BASE_URL}/accounts/${manager_id}/locations?pageToken=${nextPageToken}`, {
            'auth': {
                'bearer': self.tokens.access_token
            }
        }, function (error, response, body) {

            let googleResponse = JSON.parse(body);
            if (googleResponse.error) {
                return cb(googleResponse.error, null);
            }
            winston.log("info", `Locations Page number ${level}: ${googleResponse.locations.length}`);
            result = result.concat(googleResponse.locations);
            if (googleResponse.nextPageToken) {
                self.getNextLocations(level + 1, result, googleResponse.nextPageToken, cb);
            } else {
                return cb(null, result);
            }

        })
    };

    getAllLocations(cb) {
        let self = this;
        if (!self.hasToken()) {
            return;
        }
        if (!self.hasManagerId()) {
            return cb({
                error: "No account_name"
            }, null);
        }
        let managers = require(self.managerFile);
        let manager_id = managers[0]['name'].split('/')[1];
        request.get(`${BASE_URL}/accounts/${manager_id}/locations`, {
            'auth': {
                'bearer': self.tokens.access_token
            }
        }, function (error, response, body) {
            let level = 1;
            let googleResponse = JSON.parse(body);
            if (googleResponse.error) {
                return cb({
                    error: googleResponse.error
                }, null);
            }

            winston.log("info", `Locations Page Number ${level}: ${googleResponse.locations.length}`);
            let result = googleResponse.locations;
            if (googleResponse.nextPageToken) {
                self.getNextLocations(level + 1, result, googleResponse.nextPageToken, cb);
            }
        })
    };

    getLocationById(locationId, cb) {
        let self = this;
        if (!self.hasToken()) {
            return;
        }
        if (!self.hasManagerId()) {
            return cb({
                error: "No account_name"
            }, null);
        }
        let managers = require(self.managerFile);
        let manager_id = managers[0]['name'].split('/')[1];

        request.get(`${BASE_URL}/accounts/${manager_id}/locations/${locationId}`, {
            'auth': {
                'bearer': self.tokens.access_token
            }
        }, function (error, response, body) {

            let googleResponse = JSON.parse(body);
            if (googleResponse.error) {
                return cb({
                    error: googleResponse.error
                }, null);
            }

            return cb(null, googleResponse);
        })

    }

    getLocationReviews(locationId, cb) {

        let self = this;
        if (!self.hasToken()) {
            return;
        }
        if (!self.hasManagerId()) {
            return cb({
                error: "No account_name"
            }, null);
        }
        let managers = require(self.managerFile);
        let manager_id = managers[0]['name'].split('/')[1];

        request.get(`${BASE_URL}/accounts/${manager_id}/locations/${locationId}/reviews`, {
            'auth': {
                'bearer': self.tokens.access_token
            }
        }, function (error, response, body) {

            let googleResponse = JSON.parse(body);
            if (googleResponse.error) {
                return cb({
                    error: googleResponse.error
                }, null);
            }

            return cb(null, googleResponse);
        })

    }

    getInsightsByLocation(locationId, numberOfPeriods, periodUnit, cb) {
        let self = this;

        if (!self.hasToken()) {
            return;
        }
        if (!self.hasManagerId()) {
            return cb({
                error: "No account_name"
            }, null);
        }

        let managers = require(self.managerFile);
        let manager_id = managers[0]['name'].split('/')[1];

        let requestBody = {
            url: `${BASE_URL}/accounts/${manager_id}/locations:reportInsights`,
            "auth": {
                "bearer": self.tokens.access_token
            },
            json: {
                "locationNames": [`accounts/${manager_id}/locations/${locationId}`],
                "basicRequest": {
                    "metricRequests": [
                        {
                            "metric": "ALL",
                            "options": "AGGREGATED_DAILY"
                        }
                    ],
                    "timeRange": {
                        "startTime": moment()
                            .subtract(1, 'week')
                            .toISOString(),
                        "endTime": moment()
                            .toISOString()
                    }
                }
            }
        }

        request.post( requestBody, function (error, response, body) {
            
            let googleResponse = body;
            
            if (googleResponse.error) {
                return cb({
                    error: googleResponse.error
                }, null);
            }

            return cb(null, googleResponse);
        });
    }
}

module.exports = GoogleMyBusiness;