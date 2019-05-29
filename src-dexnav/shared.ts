/// <reference path="../ref/runstatus.d.ts" />
/// <reference path="../ref/config.d.ts" />
/// <reference path="../node_modules/@types/node/index.d.ts" />
/// <reference path="../node_modules/@types/react/index.d.ts" />
/// <reference path="../node_modules/@types/react-dom/index.d.ts" />
/// <reference path="../node_modules/electron/electron.d.ts" />
/// <reference path="../ref/server.d.ts" />


(function () { //add TPP.Server module to global scope
    let scopeInject = require('electron').remote.require('./server');
    Object.keys(scopeInject).forEach(k => window[k] = scopeInject[k]);
})();

var config = TPP.Server.getConfig();

var cleanString = (str: string) => typeof str === "string" ? str.replace(/[^A-Z0-9-]/ig, '').toLowerCase() : str;

function* countTo(n: number) {
    let i = 0;
    while (i < n)
        yield i++;
}