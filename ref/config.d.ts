declare interface Config {
    runName: string;
    badgeCount?: number;
    totalInDex?: number;
    romDexToNatDex?: number[];
    spriteFolder: string;
    listenPort: number;
    runStatusEndpoint?: string;
    newCatchEndpoint?: string;
    screenWidth: number;
    screenHeight: number;
}