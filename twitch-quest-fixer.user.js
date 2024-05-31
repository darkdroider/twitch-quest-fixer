// ==UserScript==
// @name         Twitch Quest Fixer Auto Execute
// @namespace    https://github.com/darkdroider
// @version      7
// @description  Automatically execute a script in the console on specified Twitch channels
// @updateURL    https://github.com/darkdroider/twitch-quest-fixer/raw/main/twitch-quest-fixer.user.js
// @downloadURL  https://github.com/darkdroider/twitch-quest-fixer/raw/main/twitch-quest-fixer.user.js
// @match        *://*.twitch.tv/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    console.log('Twitch Quest Fixer script loaded');

    const scriptToExecute = `
        const extensionID = "ehc5ey5g9hoehi8ys54lr6eknomqgr";
        const channel = location.pathname.slice(1).toLowerCase();
        const channelId = __APOLLO_CLIENT__.cache.data.data.ROOT_QUERY["channel({\\"name\\":\\""+channel+"\\"})"].__ref.split(":")[1];
        const pollDuration = 60000;
        let authToken = __APOLLO_CLIENT__.cache.data.data["Channel:" + channelId].selfInstalledExtensions.filter(x => x.helixToken.extensionID == extensionID)[0].token.jwt;

        grantPermission = async () => {
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
            newAuthToken = permissionResponse[0].data.extensionLinkUser.token.jwt;
            if (newAuthToken) {
                authToken = newAuthToken;
                console.log("Looks like permission was successfully granted. You should see another message saying that you're earning ARP about 60 seconds from now.");
            };
        }

        handlePolling = () => {
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
    `;

    const executeScript = () => {
        const scriptElement = document.createElement('script');
        scriptElement.textContent = scriptToExecute;
        document.body.appendChild(scriptElement);
        console.log("Script executed.");
    };

    // Execute the script when the page is fully loaded
    window.addEventListener('load', executeScript);
})();
