document.addEventListener('DOMContentLoaded', () => {

    $("#tabs").tabs();

    ko.applyBindings(new LinkOverviewModel(true), document.getElementById('tabs-get'));
    ko.applyBindings(new AddLinkModel(), document.getElementById('tabs-add'));
});

/*
 * knockout.js model
 */

let LinkModel = function () {
    let self = this;
    self.id = ko.observable();
    self.endpoints = ko.observableArray();

    self.addEndpoint = function (endpoint) {
        self.endpoints.push(endpoint);
    };

    self.setId = function (id) {
        self.id(id);
    };
};

let EndpointModel = function (uri, direction) {
    let self = this;
    self.uri = ko.observable(uri);
    self.direction = ko.observable(direction);
};

let LinkOverviewModel = function (init) {
    let self = this;
    self.links = ko.observableArray();

    if (init) {
        let facade = chrome.extension.getBackgroundPage().currentLinkList;
        for (let i = 0, j = facade.length; i < j; i++) {
            let eps = facade[i].endpoints;
            let link = new LinkModel();
            link.setId(facade[i]._links.self.href);
            for (let m = 0, n = eps.length; m < n; m++) {
                const endpoint = eps[m];
                const uri = endpoint.uri;
                const direction = endpoint.direction;
                let endpointmodel = new EndpointModel(uri, direction);
                link.addEndpoint(endpointmodel)
            }
            self.links.push(link);
        }
    }
};

let AddLinkModel = function () {

    let self = this;
    self.directions = ko.observableArray(['TO', 'FROM', 'BIDIRECTIONAL']);
    self.endpoints = ko.observableArray();

    self.addEp = function () {
        self.endpoints.push({uri: ko.observable(''), direction: ko.observable(self.directions()[0])});
    };

    self.rmEp = function () {
        self.endpoints.pop();
    };

    self.toDefault = function () {
        self.endpoints.removeAll();
        self.endpoints.push({
            uri: ko.observable(chrome.extension.getBackgroundPage().currentUrl),
            direction: ko.observable(self.directions()[1])
        });
        self.endpoints.push({
            uri: ko.observable('https://news.google.com/news/?ned=de&gl=DE&hl=de'),
            direction: ko.observable(self.directions()[0])
        });
    };

    self.submit = function () {
        let link = {endpoints: []};
        let eps = self.endpoints();

        for (let i = 0, j = eps.length; i < j; i++) {
            link.endpoints.push({uri: eps[i].uri(), direction: eps[i].direction()});
        }

        fetch("http://localhost:8080/links", {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },

            body: JSON.stringify(link)
        })
            .then((response) => {
                if (response.ok) {
                    self.toDefault();
                    $('#tabs-add').effect('highlight', {color: '#1aad35'});
                } else {
                    $('#dialog-form').effect('shake');
                }
            });
    };

    self.toDefault();

};

