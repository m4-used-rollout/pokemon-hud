/// <reference path="../ref/runstatus.d.ts" />
/// <reference path="../ref/config.d.ts" />
/// <reference path="../node_modules/@types/node/index.d.ts" />
/// <reference path="../node_modules/@types/electron/index.d.ts" />
/// <reference path="../ref/joypad.d.ts" />
declare module TPP.Server {
    function getConfig(): any;
    function getState(): RunStatus;
    function setState(dataJson: string): void;
    const fileExists: (path: string) => any;
}
declare module TPP.Server {
}
