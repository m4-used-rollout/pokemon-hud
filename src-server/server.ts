/// <reference path="main.ts" />
/// <reference path="../ref/joypad.d.ts" />

module TPP.Server {
    const http = require('http');
    const fs = require('fs');

    var config = getConfig();

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
                setState(data);
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

    var inputs:any/*JoyPad.Generic*/ = null;

    function endpointResponse(request) {
        var state = TPP.Server.getState();
        switch (((request.url || '').split('/').pop() || '').toLowerCase()) {
            default:
                return JSON.stringify(state);
            case "location":
                return locationTemplate.replace(/%AREA%/g, <any>state.area_name).replace(/%MAPBANK%/g, <any>state.map_bank).replace(/%MAPID%/g, <any>state.map_id);
            case "input":
                if (!inputs) {
                    setInterval(()=>inputs = {
                        touch_screen_x: Math.random() * (255 - 160) + 160,
                        touch_screen_y: Math.random() * (140 - 110) + 110,
                        // left: Math.random() > .7,
                        // right: Math.random() > .7,
                        // up: Math.random() > .7,
                        // down: Math.random() > .7,
                        // B: Math.random() > .4,
                        // A: Math.random() > .3,
                        //Start: Math.random() > .9
                    },100);
                }
                return JSON.stringify(inputs);
        }
    }
}