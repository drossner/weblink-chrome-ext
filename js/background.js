
var currentLinkList;
var currentUrl;

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

function getEndpointsFor(uri) {
    if(uri !== null && uri !== "")
    fetch("http://localhost:8080/links", {mode: 'cors'}).then((response) => {
        response.json().then((data) => {
            currentLinkList = data;
            setBadgeNumber(currentLinkList.length);
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

    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) =>{
        clearBadge();
        getEndpointsFor(changeInfo.url);
    });

    chrome.tabs.onActivated.addListener((activeInfo) =>{
        clearBadge();
        getCurrentTabUrl(getEndpointsFor);
    });

})();