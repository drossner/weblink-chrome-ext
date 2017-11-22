

document.addEventListener('DOMContentLoaded', () => {

    $( "#tabs" ).tabs();

    var facade = chrome.extension.getBackgroundPage().currentLinkList;
    let i = 0, j = facade.length;
    for(; i < j; i++){
        var eps = facade[i].endpoints;
        for(var m = 0, n = eps.length; m < n; m++){
            var endpoint = eps[m];
            if(endpoint.direction === 'TO' || endpoint.direction === 'BIDIRECTIONAL'){
                var uri = endpoint.uri;
                $("#endpointlist").append("<li><a href="+uri+" target='_blank'>"+uri+"</a></li>");
            }
        }

    }

    ko.applyBindings(new AddLinkModel());
});

var AddLinkModel = function () {

    var self = this;
    self.directions = ko.observableArray(['TO', 'FROM', 'BIDIRECTIONAL']);
    self.endpoints = ko.observableArray([
        {uri: ko.observable('http://google.com'), direction: ko.observable(self.directions()[0])},
        {uri: ko.observable('http://iisys.de'), direction: ko.observable(self.directions()[2])}
    ]);

    self.addEp = function () {
        self.endpoints.push({uri: ko.observable(''), direction: ko.observable(self.directions()[0])});
    };

    self.rmEp = function () {
        self.endpoints.pop();
    };

    self.submit = function () {
        var link = {endpoints: []};
        var eps = self.endpoints();

        for(var i = 0, j = eps.length; i < j; i++){
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
            .then( (response) => response.json().then(data => {
                console.log(data);
            }));
    }

};

