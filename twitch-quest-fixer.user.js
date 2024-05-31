// ==UserScript==
// @name         Twitch Quest Fixer
// @namespace    darkdroider
// @version      4
// @description  Fix Twitch Quests
// @match        *://www.twitch.tv/RedBeard*
// @match        *://www.twitch.tv/SirhcEz*
// @match        *://www.twitch.tv/sypherpk*
// @match        *://www.twitch.tv/acie*
// @match        *://www.twitch.tv/sydeon*
// @match        *://www.twitch.tv/kalamazi*
// @match        *://www.twitch.tv/rogersbase*
// @match        *://www.twitch.tv/kelsi*
// @match        *://www.twitch.tv/trishahershberger*
// @match        *://www.twitch.tv/sigils*
// @match        *://www.twitch.tv/thegeekentry*
// @match        *://www.twitch.tv/ellyen*
// @match        *://www.twitch.tv/matthewsantoro*
// @match        *://www.twitch.tv/fooya*
// @match        *://www.twitch.tv/alienware*
// @match        *://www.twitch.tv/DeMu*
// @match        *://www.twitch.tv/jess*
// @match        *://www.twitch.tv/lovinurstyle*
// @match        *://www.twitch.tv/naytesseractt*
// @match        *://www.twitch.tv/pirategray*
// @match        *://www.twitch.tv/redinfamy*
// @match        *://www.twitch.tv/dikymo*
// @match        *://www.twitch.tv/nicovald*
// @match        *://www.twitch.tv/runjdrun*
// @match        *://www.twitch.tv/maudegarrett*
// @match        *://www.twitch.tv/damienhaas*
// @match        *://www.twitch.tv/travisgafford*
// @match        *://www.twitch.tv/theblackhokage*
// @match        *://www.twitch.tv/Alixxa*
// @match        *://www.twitch.tv/Rogue*
// @match        *://www.twitch.tv/Lourlo*
// @grant        none
// @run-at       document-end
// @updateURL    https://raw.githubusercontent.com/darkdroider/twitch-quest-fixer/main/twitch-quest-fixer.user.js
// @downloadURL  https://raw.githubusercontent.com/darkdroider/twitch-quest-fixer/main/twitch-quest-fixer.user.js
// ==/UserScript==

(async function() {
    await new Promise(resolve => setTimeout(resolve, 5000)); // Espera de 5 segundos

    const extensionID = "ehc5ey5g9hoehi8ys54lr6eknomqgr";
    const channel = location.pathname.slice(1).toLowerCase();
    const channelId = __APOLLO_CLIENT__.cache.data.data.ROOT_QUERY["channel({\"name\":\""+channel+"\"})"].__ref.split(":")[1];
    const pollDuration = 60000;
    let authToken = __APOLLO_CLIENT__.cache.data.data["Channel:" + channelId].selfInstalledExtensions.filter(x => x.helixToken.extensionID == extensionID)[0].token.jwt;

    async function grantPermission() {
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
        const newAuthToken = permissionResponse[0].data.extensionLinkUser.token.jwt;
        if (newAuthToken) {
            authToken = newAuthToken;
            console.log("Looks like permission was successfully granted. You should see another message saying that you're earning ARP about 60 seconds from now.");
        }
    }

    function handlePolling() {
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
            if (data.state === "grant_permission") {
                await grantPermission();
            } else {
                clearInterval(intervalId); // Parar o polling após a conclusão
            }
        })
        .catch((err) => {
            console.log(err);
        });
    }
    
    const intervalId = setInterval(handlePolling, pollDuration); // Iniciar o polling
})();
