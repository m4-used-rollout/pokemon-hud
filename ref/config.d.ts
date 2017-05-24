declare interface Config {
    runName: string;
    badgeCount?: number;
    mainRegion?: string;
    totalInDex?: number;
    romDexToNatDex?: number[];
    displayOptions?:string[];
    romFile?: string;
    extractedRomFolder?: string;
    spriteFolder?: string;
    listenPort: number;
    runStatusEndpoint?: string;
    newCatchEndpoint?: string;
    screenWidth: number;
    screenHeight: number;
    windowX?: number;
    windowY?: number;
    frameless?: boolean;
}