// ==UserScript==
// @name         Twitch Quest Fixer
// @namespace    http://tampermonkey.net/
// @version      3.3
// @description  Fixes Twitch quest issues automatically on specified channels
// @author       Your Name
// @match        https://www.twitch.tv/*
// @updateURL    https://raw.githubusercontent.com/USERNAME/twitch-quest-fixer/main/twitch-quest-fixer.user.js
// @downloadURL  https://raw.githubusercontent.com/USERNAME/twitch-quest-fixer/main/twitch-quest-fixer.user.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const allowedUrls = [
        'https://www.twitch.tv/RedBeard',
        'https://www.twitch.tv/SirhcEz',
        'https://www.twitch.tv/sypherpk',
        'https://www.twitch.tv/acie',
        'https://www.twitch.tv/sydeon',
        'https://www.twitch.tv/kalamazi',
        'https://www.twitch.tv/rogersbase',
        'https://www.twitch.tv/kelsi',
        'https://www.twitch.tv/trishahershberger',
        'https://www.twitch.tv/sigils',
        'https://www.twitch.tv/thegeekentry',
        'https://www.twitch.tv/ellyen',
        'https://www.twitch.tv/matthewsantoro',
        'https://www.twitch.tv/fooya',
        'https://www.twitch.tv/alienware',
        'https://www.twitch.tv/DeMu',
        'https://www.twitch.tv/jess',
        'https://www.twitch.tv/lovinurstyle',
        'https://www.twitch.tv/naytesseractt',
        'https://www.twitch.tv/pirategray',
        'https://www.twitch.tv/redinfamy',
        'https://www.twitch.tv/dikymo',
        'https://www.twitch.tv/nicovald',
        'https://www.twitch.tv/runjdrun',
        'https://www.twitch.tv/maudegarrett',
        'https://www.twitch.tv/damienhaas',
        'https://www.twitch.tv/travisgafford',
        'https://www.twitch.tv/theblackhokage',
        'https://www.twitch.tv/Alixxa',
        'https://www.twitch.tv/Rogue',
        'https://www.twitch.tv/Lourlo'
    ];

    const currentUrl = window.location.href.split('?')[0].toLowerCase();
    if (!allowedUrls.includes(currentUrl)) {
        return;
    }

    /* Twitch Quest Fixer v3.1 */
    const extensionID = "ehc5ey5g9hoehi8ys54lr6eknomqgr";
    const channel = location.pathname.slice(1).toLowerCase();

    const waitForApolloClient = () => {
        return new Promise((resolve, reject) => {
            const checkInterval = setInterval(() => {
                if (window.__APOLLO_CLIENT__) {
                    clearInterval(checkInterval);
                    resolve(window.__APOLLO_CLIENT__);
                }
            }, 100);
        });
    };

    waitForApolloClient().then((__APOLLO_CLIENT__) => {
        const channelId = __APOLLO_CLIENT__.cache.data.data.ROOT_QUERY["channel({\"name\":\""+channel+"\"})"].__ref.split(":")[1];
        const pollDuration = 60000;
        let authToken = __APOLLO_CLIENT__.cache.data.data["Channel:" + channelId].selfInstalledExtensions.filter(x => x.helixToken.extensionID == extensionID)[0].token.jwt;

        const commonOptions = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `OAuth ${authToken}`
            }
        };

        const grantPermission = async () => {
            console.log("Attempting to grant permission automatically...");
            const integrityResponse = await (await fetch("https://gql.twitch.tv/integrity", { method: "post", headers: commonOptions.headers })).json();
            const integrity = integrityResponse.token;
            const permissionResponse = await (await fetch("https://gql.twitch.tv/gql", {
                method: "post",
                headers: {
                    ...commonOptions.headers, ...{
                        "Client-Integrity": integrity
                    }
                },
                body: JSON.stringify([{
                    "operationName": "LinkUserMutation",
                    "variables": {
                        "channelID": channelId,
                        "extensionID": extensionID,
                        "token": authToken,
                        "showUser": true
                    },
                    "extensions": { "persistedQuery": { "version": 1, "sha256Hash": "b5dfec96759d42ac5a24f79beec27bcdf90e936e0fac4f727b7ab36dadb6a22a" } }
                }])
            })).json();
            console.log(permissionResponse);
            let newAuthToken = permissionResponse[0].data.extensionLinkUser.token.jwt;
            if (newAuthToken) {
                authToken = newAuthToken;
                console.log("Looks like permission was successfully granted. You should see another message saying that you're earning ARP about 60 seconds from now.");
            };
        };

        const handlePolling = () => {
            fetch("https://alienware.jkmartindale.dev/?url=https://www.alienwarearena.com/twitch/extensions/track", {
                method: 'GET',
                headers: {
                    'x-extension-jwt': authToken,
                    'x-extension-channel': channelId
                }
            })
            .then(response => response.json())
            .then(async data => {
                console.log(data);
                /* Attempt to authorize extension if not authorized */
                if (data.state === "grant_permission") {
                    await grantPermission();
                };
            })
            .catch((err) => {
                console.log(err);
            })
            .finally(() => {
                setTimeout(handlePolling, pollDuration);
            });
        };
        handlePolling();
    });
})();
