/// <reference path="../ref/runstatus.d.ts" />
/// <reference path="../ref/config.d.ts" />
/// <reference path="../node_modules/@types/node/index.d.ts" />
/// <reference path="../node_modules/@types/react/index.d.ts" />
/// <reference path="../node_modules/@types/react-dom/index.d.ts" />

var config: Config = require('../config.json');

config.totalInDex = config.totalInDex || (config.romDexToNatDex || []).length;

var cleanString = (str: string) => (str || '').replace(/[^A-Z0-9-]/ig, '').toLowerCase();