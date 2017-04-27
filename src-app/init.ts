/// <reference path="../node_modules/@types/electron/index.d.ts" />
/// <reference path="../ref/config.d.ts" />

const {app, BrowserWindow, globalShortcut} = require('electron')
const path = require('path')
const url = require('url')
const config:Config = require('./config.json');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win: Electron.BrowserWindow;

function createWindow(x:number = null, y:number = null, frameless:boolean = false) {
    // Create the browser window.
    win = new BrowserWindow({
        width: config.screenWidth, height: config.screenHeight,
        webPreferences: {
            webSecurity: false,
            // backgroundThrottling: false
        },
        useContentSize: true,
        frame: !frameless,
        x: x,
        y: y,
        show: false
    });

    win.once('ready-to-show', () => win.show());

    // and load the index.html of the app.
    win.loadURL(url.format({
        pathname: __dirname + "/index.html",
        protocol: 'file:',
        slashes: true
    }));

    // Emitted when the window is closed.
    win.on('closed', () => win = null);

    win.on('unresponsive', ()=> win.reload());

    globalShortcut.register('F5', () => win.reload());
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => createWindow(config.windowX, config.windowY, config.frameless));

// Quit when all windows are closed.
app.on('window-all-closed', () => app.quit());