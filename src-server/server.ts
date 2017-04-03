/// <reference path="main.ts" />

const http = require('http');

var config = TPP.Server.getConfig();

const server = http.createServer((request, response) => {
    if (request.method == "GET") {
        response.end(JSON.stringify(TPP.Server.getState()));
    }
    else if (request.method == "POST") {
        var data = '';
        request.setEncoding('utf-8');
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