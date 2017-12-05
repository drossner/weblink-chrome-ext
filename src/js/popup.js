document.addEventListener('DOMContentLoaded', () => {

    $("#tabs").tabs();

    ko.applyBindings(linkOverview, document.getElementById('tabs-get'));
    ko.applyBindings(inspectLink, document.getElementById('tabs-inspect'));
    ko.applyBindings(addLink, document.getElementById('tabs-add'));
});

/*
 * knockout.js model
 */

let LinkModel = function () {
    let self = this;
    self.directions = ko.observableArray(['TO', 'FROM', 'BIDIRECTIONAL']);
    self.id = ko.observable();
    self.endpoints = ko.observableArray();

    self.addEndpoint = function (endpoint) {
        self.endpoints.push(endpoint);
    };

    self.setId = function (id) {
        self.id(id);
    };

    self.addEp = function () {
        self.endpoints.push(new EndpointModel('', self.directions()[0]));
    };

    self.rmEp = function () {
        if (self.endpoints().length > 2) {
            self.endpoints.pop();
        }
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

    self.inspect = function (context) {
        inspectLink.linkUri(context.id());
        inspectLink.loadLink();
        $("#tabs").tabs({active: 2});
    };

    self.update = function () {
        self.links.removeAll();
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
    };

    if (init) {
        self.update();
    }
};

let InspectLinkModel = function () {

    let self = this;
    self.empty = ko.observable(true);
    self.linkUri = ko.observable();
    self.link = ko.observable(null);

    self.loadLink = function () {
        self.inspect(self.linkUri());
        self.empty(false);
    };

    self.delete = function () {
        fetch(self.linkUri(), {
            method: "DELETE",
        })
            .then((response) => {
                if (response.ok) {
                    $("#tabs").tabs({active: 0});
                    self.close();
                    chrome.runtime.sendMessage({}, function(response) {
                        linkOverview.update();
                    });
                } else {
                    $('#inspect-form').effect('shake');
                }
            });
    };

    self.close = function () {
        self.empty(true);
        self.linkUri('');
        self.link(null);
    };

    self.update = function () {
        let jsonlink = {endpoints: []};

        for(let i = 0, j = self.link().endpoints().length; i < j; i++){
            let tmp = self.link().endpoints()[i];
            jsonlink.endpoints.push({uri: tmp.uri(), direction: tmp.direction()});
        }

        fetch(self.linkUri(), {
            method: "PUT",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },

            body: JSON.stringify(jsonlink)
        })
            .then((response) => {
                if (response.ok) {
                    $('#tabs-inspect').effect('highlight', {color: '#1aad35'});
                    chrome.runtime.sendMessage({}, function(response) {
                        linkOverview.update();
                    });
                } else {
                    $('#inspect-form').effect('shake');
                }
            });
    };

    self.inspect = function (uri) {
        fetch(uri).then((response) => {
            response.json().then((data) => {
                let link = new LinkModel();
                link.setId(uri);
                let eps = data.endpoints;
                for (let i = 0, j = eps.length; i < j; i++) {
                    link.addEndpoint(new EndpointModel(eps[i].uri, eps[i].direction));
                }
                self.link(link);
            });
        })
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
            uri: ko.observable('https://www.heise.de/'),
            direction: ko.observable(self.directions()[0])
        });
    };

    self.submit = function () {
        let link = {endpoints: []};
        let eps = self.endpoints();

        for (let i = 0, j = eps.length; i < j; i++) {
            link.endpoints.push({uri: eps[i].uri(), direction: eps[i].direction()});
        }

        fetch(chrome.extension.getBackgroundPage().apibase+"/links", {
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
                    chrome.runtime.sendMessage({}, function(response) {
                        linkOverview.update();
                    });
                } else {
                    $('#dialog-form').effect('shake');
                }
            });
    };

    self.toDefault();
};

//define 'global' viewmodels

let linkOverview = new LinkOverviewModel(true);
let inspectLink = new InspectLinkModel();
let addLink = new AddLinkModel();

