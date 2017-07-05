declare interface Config extends DexNavConfig {
    runName: string;
    badgeCount?: number;
    mainRegion?: string;
    totalInDex?: number;
    romDexToNatDex?: number[];
    displayOptions?: string[];
    hudTheme: string;
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

declare interface DexNavConfig {
    showDexNav?: boolean;
    dexNavUseAreaName?: boolean;
    dexNavWidth?: number;
    dexNavHeight?: number;
    dexNavX?: number;
    dexNavY?: number;
}