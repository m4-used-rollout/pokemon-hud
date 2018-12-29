declare interface Config extends DexNavConfig, GoalConfig {
    runName: string;
    badgeCount?: number;
    mainRegion?: string;
    totalInDex?: number;
    romDexToNatDex?: (number | number[])[];
    displayOptions?: string[];
    hudTheme: string;
    romFile?: string;
    iniFile?: string;
    useGPU?: boolean;
    forceNoHighDPIScaling?: boolean;
    extractedRomFolder?: string;
    spriteFolder?: string;
    trainerSpriteFolder?: string;
    listenPort: number;
    runStatusEndpoint?: string;
    newCatchEndpoint?: string;
    screenWidth: number;
    screenHeight: number;
    windowX?: number;
    windowY?: number;
    frameless?: boolean;
    blockResize?: boolean;
    resetEveryHours?: number;
}

declare interface DexNavConfig {
    showDexNav?: boolean;
    dexNavUseAreaName?: boolean;
    dexNavWidth?: number;
    dexNavHeight?: number;
    dexNavX?: number;
    dexNavY?: number;
    dexNavResetEveryHours?: number;
    dexNavTheme?: string;
    hofMapId?: number;
    hofMapBank?: number;
}

declare interface GoalConfig {
    showGoals?: boolean;
    goals?: (TrickHouseConfig | LogoConfig | HoFEntriesConfig)[];
    goalWidth?: number;
    goalHeight?: number;
    goalX?: number;
    goalY?: number;
}

declare interface Goal {
    goalType: string;
}

declare interface TrickHouseConfig extends Goal {
    goalType: "TrickHouse";
}

declare interface LogoConfig extends Goal {
    goalType: "Logo";
}

declare interface HoFEntriesConfig extends Goal {
    goalType: "HoFEntries";
    hofEntries: number;
}