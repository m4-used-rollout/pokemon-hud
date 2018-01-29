/// <reference path="../node_modules/@types/electron/index.d.ts" />
/// <reference path="../ref/config.d.ts" />

const electron = require('electron')
const { app, BrowserWindow, globalShortcut } = electron;
const path = require('path')
const url = require('url')
const config: Config = require('./config.json');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let windowList: Electron.BrowserWindow[] = [];

if (config.useGPU === false) {
    app.disableHardwareAcceleration();
}
if (config.forceNoHighDPIScaling) {
    //stop High DPI screen scaling behavior
    app.commandLine.appendSwitch('high-dpi-support', '1');
    app.commandLine.appendSwitch('force-device-scale-factor', '1');
}

function createWindow(page: string = 'hud', windowWidth: number = 640, windowHeight: number = 480, x: number = null, y: number = null, frameless: boolean = false, resetEveryHours: number = 0) {
    const { width, height } = electron.screen.getPrimaryDisplay().workAreaSize;
    if (x < 0)
        x = width - windowWidth + x;
    if (y < 0)
        y = height - windowHeight + y;

    // Create the browser window.
    let win = new BrowserWindow({
        width: windowWidth, height: windowHeight,
        webPreferences: {
            webSecurity: false,
            backgroundThrottling: false
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
        pathname: __dirname + `/${page}.html`,
        protocol: 'file:',
        slashes: true
    }));

    // Emitted when the window is closed.
    win.on('closed', () => windowList = windowList.filter(w => w != win));

    win.on('unresponsive', () => win.reload());

    globalShortcut.register('F5', () => win.reload());

    windowList.push(win);

    if (resetEveryHours) {
        setInterval(() => win.reload(), resetEveryHours * 60 * 60 * 1000);
    }

    return win;
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
    createWindow('hud', config.screenWidth, config.screenHeight, config.windowX, config.windowY, config.frameless, config.resetEveryHours)
    if (config.showDexNav) {
        createWindow('dexnav', config.dexNavWidth, config.dexNavHeight, config.dexNavX || -1, config.dexNavY || -1, config.frameless, config.dexNavResetEveryHours)
    }
});

// Quit when all windows are closed.
app.on('window-all-closed', () => app.quit());