/// <reference path="main.ts" />
/// <reference path="../ref/joypad.d.ts" />

module TPP.Server {
    const http: typeof import('http') = require('http');
    const fs: typeof import('fs') = require('fs');

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
            response.end(getResponse(request, response));
        }
        else if (request.method == "POST") {
            var data = '';
            request.setEncoding('utf8');
            request.on('data', chunk => data += chunk);
            request.on('end', () => postResponse(request, data, response));
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

    function postResponse(request: import('http').IncomingMessage, data: string, response: import('http').ServerResponse) {
        response.end();
        const urlParts = (<string>request.url || '').split('/');
        urlParts.shift(); //remove host
        switch ((urlParts.shift() || '').toLowerCase()) {
            case 'override':
                return setOverrides(data);
            default:
                return setState(data);
        }
    }

    function getResponse(request: import('http').IncomingMessage, response: import('http').ServerResponse) {
        var state = TPP.Server.getState();
        const urlParts = (<string>request.url || '').split('/');
        urlParts.shift(); //remove host
        switch ((urlParts.shift() || '').toLowerCase()) {
            default:
                setJSONHeaders(response);
                return JSON.stringify(state);
            case "location":
                return locationTemplate
                    .replace(/%AREA%/g, state.area_name || state.map_name)
                    .replace(/%AREAID%/g, (state.area_id || state.map_id).toString())
                    .replace(/%MAPBANK%/g, (state.map_bank || 0).toString())
                    .replace(/%MAPID%/g, (state.map_id || 0).toString())
                    .replace(/%ENCOUNTERS%/g, JSON.stringify(RomData.GetCurrentMapEncounters(RomData.GetMap(state.map_id, state.map_bank), state), null, 2));
            case "raw":
                setJSONHeaders(response);
                return JSON.stringify(rawState());
            case "pokemon": {
                const pokemon = Object.values(Events.PokemonTracker.knownPokemon)
                    .sort((p1, p2) => Date.parse(p1.evolved.filter(_ => true).pop() || p1.caught) - Date.parse(p2.evolved.filter(_ => true).pop() || p2.caught))
                    .map(p => ({ ...p, badgeNums: p.dexNums.map(d => ((config.romDexToNatDex || [])[d] || d).toString().padStart(3, '0')) }));
                return JSON.stringify(pokemon);
            }
            case "romdata":
                setJSONHeaders(response);
                let outObj = {}
                if (urlParts.length) {
                    urlParts.forEach(p => outObj[p] = RomData[p]);
                }
                else {
                    outObj = RomData;
                }
                return JSON.stringify(outObj, null, 2);
            case "override":
                //console.log(request.url);
                const overrides: { [key: string]: any } = {};
                for (let i = 0; i < urlParts.length; i += 2)
                    overrides[urlParts[i]] = urlParts[i + 1] && urlParts[i + 1].length > 0 ? JSON.parse(decodeURIComponent(urlParts[i + 1])) : null;
                //console.dir(overrides);
                return setOverrides(overrides);
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