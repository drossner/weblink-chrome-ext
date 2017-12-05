/**
 * @file
 * @author Daniel Roßner <daniel.rossner@iisys.de>
 */


document.addEventListener('DOMContentLoaded', () => {
    ko.applyBindings(new OptionsModel());
});

let OptionsModel = function () {
    let self = this;

    self.apibase = ko.observable();
    self.save = function () {
        chrome.storage.local.set({
            apibase: self.apibase()
        }, function() {
            // Update status to let user know options were saved.
        });
    };

    //load from store
    chrome.storage.local.get({
        apibase: "test"
    }, function(items) {
        self.apibase(items.apibase);
    });
};
