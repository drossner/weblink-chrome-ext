
var currentLinkList = [];
var currentUrl;
var apibase;

/**
 * Get the current URL.
 *
 * @param {function(string)} callback called when the URL of the current tab
 *   is found.
 */
function getCurrentTabUrl(callback) {
    var queryInfo = {
        active: true,
        currentWindow: true
    };

    chrome.tabs.query(queryInfo, (tabs) => {
        // exactly one tab.
        var tab = tabs[0];

        var url = tab.url;
        currentUrl = url;
        callback(url);
    });
}

function getEndpointsFor(uri, callback) {
    if(uri === undefined && uri === null && uri === '') return;
    fetch(apibase+"/findlinks", {
        method: "POST",
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },

        body: JSON.stringify({
            component_uri: uri,
            all_anchors: false,
            directions: ['FROM', 'BIDIRECTIONAL', 'TO']
        })
    }).then((response) => {
        response.json().then((data) => {
            currentLinkList = data;
            currentUrl = uri;
            setBadgeNumber(currentLinkList.length);
            if(callback !== undefined) callback({});
        });
    })
}

function clearBadge() {
    setBadgeNumber(0);
}

function setBadgeNumber(text) {
    if(text <= 0) text = "";
    else if(text > 0) text += "";
    chrome.browserAction.setBadgeText({text: text});
}

(function initBadge() {
    chrome.browserAction.setBadgeBackgroundColor({ color: [90, 100, 130, 255] });
})();

(function (){
    chrome.storage.onChanged.addListener(function (changes, areaName) {
        console.log(changes);
        if(changes.apibase !== undefined) apibase = changes.apibase.newValue;
    });

    chrome.storage.local.get('apibase', function (item) {
        if(item.apibase !== undefined) apibase = item.apibase;
        else{
            apibase = 'http://localhost:8080';
            chrome.storage.local.set({apibase: apibase});
        }
    });

    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) =>{
        clearBadge();
        getEndpointsFor(tab.url);
    });

    chrome.tabs.onActivated.addListener((activeInfo) =>{
        clearBadge();
        getCurrentTabUrl(getEndpointsFor);
    });

    chrome.runtime.onMessage.addListener(function (msg, sender, respond) {
        getEndpointsFor(currentUrl, respond);
        return true;
    });


})();