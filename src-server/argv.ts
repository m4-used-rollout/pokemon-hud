/// <reference path="../ref/config.d.ts" />

module Args {
    const fs = require('fs');

    export class CmdConf implements Config {
        runName: string = null;
        badgeCount?: number = null;
        mainRegion?: string = null;
        totalInDex?: number = null;
        romDexToNatDex?: number[] = null;
        displayOptions?: string[] = null;
        hudTheme: string = null;
        romFile?: string = null;
        iniFile?: string = null;
        useGPU?: boolean = null;
        forceNoHighDPIScaling?: boolean = null;
        extractedRomFolder: string = null;
        spriteFolder: string = null;
        trainerSpriteFolder: string = null;
        listenPort: number = null;
        runStatusEndpoint: string = null;
        newCatchEndpoint: string = null;
        screenWidth: number = null;
        screenHeight: number = null;
        windowX: number = null;
        windowY: number = null;
        frameless: boolean = null;
        blockResize: boolean = null;
        resetEveryHours?: number = null;
        showDexNav: boolean = null;
        dexNavUseAreaName?: boolean = null;
        dexNavWidth: number = null;
        dexNavHeight: number = null;
        dexNavX: number = null;
        dexNavY: number = null;
        dexNavResetEveryHours: number = null;
        dexNavTheme: string = null;
        hofMapId: number = null;
        hofMapBank: number = null;

        Merge(config: Config) {
            Object.keys(config || {}).forEach(k => this[k] = this[k] === null || typeof this[k] === "undefined" ? config[k] : this[k]);
            return this;
        }
    }

    export function Parse(): CmdConf {
        const conf = new CmdConf();
        Object.keys(conf).filter(k => typeof conf[k] != "function").forEach(k => {
            const index = process.argv.indexOf(`--${k}`);
            if (index > 0) {
                conf[k] = JSON.parse(process.argv[index + 1]);
            }
        });
        const index = process.argv.indexOf('--config');
        if (index > 0) {
            conf.Merge(JSON.parse(fs.readFileSync(process.argv[index + 1], 'utf8')));
        }
        return conf;
    }
}