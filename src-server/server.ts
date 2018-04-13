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
            // Set CORS headers
            response.setHeader('Access-Control-Allow-Origin', '*');
            response.setHeader('Access-Control-Request-Method', '*');
            response.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET');
            response.setHeader('Access-Control-Allow-Headers', '*');
            response.setHeader('Content-Type', 'text/json');
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
    const port = config.listenPort || 1337;
    server.on('clientError', (err, socket) => {
        socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
    });
    server.listen(port);
    server.on('close', ()=> {
        server.listen(port);
    });
    console.log(`Listening for connections on port ${port}`);

    var inputs:JoyPad.BizHawk = null;

    function endpointResponse(request) {
        var state = TPP.Server.getState();
        switch (((request.url || '').split('/').pop() || '').toLowerCase()) {
            default:
                return JSON.stringify(state);
            case "location":
                return locationTemplate.replace(/%AREA%/g, state.area_name || state.map_name).replace(/%MAPBANK%/g, state.map_bank.toString()).replace(/%MAPID%/g, state.map_id.toString());
            case "raw":
                return JSON.stringify(rawState());
            case "romdata":
                return JSON.stringify(RomData);
            case "input":
                if (!inputs) {
                    setInterval(()=>inputs = {
                        // touch_screen_x: Math.random() * (255 - 160) + 160,
                        // touch_screen_y: Math.random() * (140 - 110) + 110,
                        Left: Math.random() > .7,
                        Right: Math.random() > .7,
                        Up: Math.random() > .7,
                        Down: Math.random() > .7,
                        B: Math.random() > .4,
                        A: Math.random() > .3,
                        //Start: Math.random() > .9
                    },100);
                }
                return JSON.stringify(inputs);
        }
    }
}