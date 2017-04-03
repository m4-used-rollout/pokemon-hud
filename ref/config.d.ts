declare interface Config {
    runName: string;
    badgeCount?: number;
    totalInDex?: number;
    romDexToNatDex?: number[];
    spriteFolder: string;
    listenPort: number;
    runStatusEndpoint: string;
    runStatusUpdateInterval: number;
    newCatchEndpoint: string;
    screenWidth: number;
    screenHeight: number;
}