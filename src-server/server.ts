/// <reference path="main.ts" />
/// <reference path="../ref/joypad.d.ts" />

module TPP.Server {
    const http = require('http');
    const fs = require('fs');

    var config = getConfig();

    var locationTemplate = "%AREA% Bank:%MAPBANK% Id: %MAPID%";
    fs.readFile(__dirname + '/location.html', 'utf8', (err, data) => {
        if (err)
            console.error(err);
        else
            locationTemplate = data || locationTemplate;
    });

    const server = http.createServer((request, response) => {
        if (request.method == "GET") {
            // Set CORS headers
            response.end(endpointResponse(request, response));
        }
        else if (request.method == "POST") {
            var data = '';
            request.setEncoding('utf8');
            request.on('data', chunk => data += chunk);
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
    console.log(`Listening for connections on port ${port}`);
    try {
        server.listen(port);
    }
    catch (e) {
        console.log("Port is occupied.");
    }
    server.on('close', () => {
        server.listen(port);
    });

    var inputs: JoyPad.BizHawk = null;

    function setJSONHeaders(response) {
        response.setHeader('Access-Control-Allow-Origin', '*');
        response.setHeader('Access-Control-Request-Method', '*');
        response.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET');
        response.setHeader('Access-Control-Allow-Headers', '*');
        response.setHeader('Content-Type', 'text/json; charset=utf-8');
    }

    function endpointResponse(request, response) {
        var state = TPP.Server.getState();
        switch (((request.url || '').split('/').pop() || '').toLowerCase()) {
            default:
                setJSONHeaders(response);
                return JSON.stringify(state);
            case "location":
                return locationTemplate
                    .replace(/%AREA%/g, state.area_name || state.map_name)
                    .replace(/%MAPBANK%/g, (state.map_bank || 0).toString())
                    .replace(/%MAPID%/g, (state.map_id || 0).toString())
                    .replace(/%ENCOUNTERS%/g, JSON.stringify(RomData.GetCurrentMapEncounters(RomData.GetMap(state.map_id, state.map_bank), state), null, 2));
            case "raw":
                setJSONHeaders(response);
                return JSON.stringify(rawState());
            case "romdata":
                setJSONHeaders(response);
                return JSON.stringify(RomData);
            case "input":
                setJSONHeaders(response);
                if (!inputs) {
                    setInterval(() => inputs = {
                        // touch_screen_x: Math.random() * (255 - 160) + 160,
                        // touch_screen_y: Math.random() * (140 - 110) + 110,
                        Left: Math.random() > .7,
                        Right: Math.random() > .7,
                        Up: Math.random() > .7,
                        Down: Math.random() > .7,
                        B: Math.random() > .4,
                        A: Math.random() > .3,
                        //Start: Math.random() > .9
                    }, 100);
                }
                return JSON.stringify(inputs);
        }
    }
}