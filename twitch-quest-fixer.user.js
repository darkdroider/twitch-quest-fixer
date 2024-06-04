// ==UserScript==
// @name         Twitch Quest Fixer Auto Execute with UI
// @namespace    https://github.com/darkdroider
// @version      7.2
// @description  Automatically execute a script in the console on specified Twitch channels with a visual interface for status messages
// @updateURL    https://github.com/darkdroider/twitch-quest-fixer/raw/main/twitch-quest-fixer.user.js
// @downloadURL  https://github.com/darkdroider/twitch-quest-fixer/raw/main/twitch-quest-fixer.user.js
// @match        *://*.twitch.tv/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    console.log('Twitch Quest Fixer script with UI loaded');

    const scriptToExecute = `
        const extensionID = "ehc5ey5g9hoehi8ys54lr6eknomqgr";
        const channel = location.pathname.slice(1).toLowerCase();
        const channelId = __APOLLO_CLIENT__.cache.data.data.ROOT_QUERY["channel({\\"name\\":\\""+channel+"\\"})"].__ref.split(":")[1];
        const pollDuration = 60000;
        let authToken = __APOLLO_CLIENT__.cache.data.data["Channel:" + channelId].selfInstalledExtensions.filter(x => x.helixToken.extensionID == extensionID)[0].token.jwt;
        let inactivityTimeout;

        const updateStatusIndicator = (color) => {
            const statusIndicator = document.getElementById('status-indicator');
            if (statusIndicator) {
                statusIndicator.style.backgroundColor = color;
            }
            // Reset the inactivity timer
            resetInactivityTimer();
        };

        const resetInactivityTimer = () => {
            if (inactivityTimeout) {
                clearTimeout(inactivityTimeout);
            }
            inactivityTimeout = setTimeout(() => {
                updateStatusIndicator('white');
            }, 60000);
        };

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

                /* Update status indicator color based on the message */
                if (data.state === "streamer_offline") {
                    updateStatusIndicator('red');
                } else if (data.state === "streamer_online") {
                    updateStatusIndicator('cyan');
                } else if (data.state === "daily_cap_reached") {
                    updateStatusIndicator('green');
                }

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

    // Function to create the UI elements
    const createUIElements = () => {
        // Create status indicator
        const statusIndicator = document.createElement('div');
        statusIndicator.id = 'status-indicator';
        statusIndicator.style.width = '20px';
        statusIndicator.style.height = '20px';
        statusIndicator.style.borderRadius = '50%';
        statusIndicator.style.backgroundColor = 'grey';
        statusIndicator.style.marginLeft = '10px';

        // Create container for the status indicator
        const container = document.createElement('div');
        container.style.display = 'flex';
        container.style.alignItems = 'center';

        // Append status indicator to the container
        container.appendChild(statusIndicator);

        // Add the container next to the specific element
        const targetElement = document.querySelector('.Layout-sc-1xcs6mc-0.jdpzyl');
        if (targetElement) {
            targetElement.insertAdjacentElement('afterbegin', container);
        }

        // Execute the script immediately
        executeScript();
    };

    const executeScript = () => {
        const scriptElement = document.createElement('script');
        scriptElement.textContent = scriptToExecute;
        document.body.appendChild(scriptElement);
        console.log("Script executed.");
    };

    // Execute the script when the page is fully loaded
    window.addEventListener('load', createUIElements);
    
    // Independent function to reload the page once after 5 seconds
    const reloadPageOnce = () => {
        if (!sessionStorage.getItem('pageReloaded')) {
            sessionStorage.setItem('pageReloaded', 'true');
            setTimeout(() => {
                location.reload();
            }, 5000);
        }
    };

    // Call the independent function to reload the page once after 5 seconds
    window.addEventListener('load', reloadPageOnce);

})();
