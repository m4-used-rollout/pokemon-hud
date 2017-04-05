/// <reference path="main.ts" />

const http = require('http');
const fs = require('fs');

var config = TPP.Server.getConfig();

var locationTemplate = "%AREA% Bank:%MAPBANK% Id: %MAPID%";
fs.readFile(__dirname + '/location.html', 'utf8', (err, data)=> {
    if (err)
        console.error(err);
    else 
        locationTemplate = data || locationTemplate;
});

const server = http.createServer((request, response) => {
    if (request.method == "GET") {
        response.end(endpointResponse(request));
    }
    else if (request.method == "POST") {
        var data = '';
        request.setEncoding('utf8');
        request.on('data', chunk=> data += chunk);
        request.on('end', () => {
            response.end();
            TPP.Server.setState(data);
        });
    }
});
server.on('clientError', (err, socket) => {
    socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
});
server.listen(config.listenPort || 1337);
server.on('close', ()=> {
    server.listen(config.listenPort || 1337);
});

function endpointResponse(request) {
    var state = TPP.Server.getState();
    switch (((request.url || '').split('/').pop() || '').toLowerCase()) {
        default:
            return JSON.stringify(state);
        case "location":
            return locationTemplate.replace(/%AREA%/g, <any>state.area_name).replace(/%MAPBANK%/g, <any>state.map_bank).replace(/%MAPID%/g, <any>state.map_id);
    }
}