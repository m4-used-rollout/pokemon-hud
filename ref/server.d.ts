/// <reference path="../ref/runstatus.d.ts" />
/// <reference path="../ref/config.d.ts" />
/// <reference path="../node_modules/@types/node/index.d.ts" />
/// <reference path="../node_modules/@types/electron/index.d.ts" />
declare module TPP.Server {
    function getConfig(): any;
    function registerStateChangeHandler(callback: (state: TPP.RunStatus) => void): void;
    function getState(): RunStatus;
    function setState(data: any): void;
}
declare const http: any;
declare var config: any;
declare const server: any;
