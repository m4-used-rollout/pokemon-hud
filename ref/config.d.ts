/// <reference path="./runstatus.d.ts" />

declare interface Config extends DexNavConfig, GoalConfig, EmuCtlConfig, SplitsConfig, EmotesConfig {
    generation: number;
    runName: string;
    badgeCount?: number;
    frontierFacilities?: number;
    dexName?: string;
    mainRegion?: string;
    totalInDex?: number;
    romDexToNatDex?: (number | number[])[];
    displayOptions?: string[];
    forceOptions: TPP.Options;
    hudTheme: string;
    romFile?: string[];
    iniFile?: string;
    useGPU?: boolean;
    forceNoHighDPIScaling?: boolean;
    extractedRomFolder?: string;
    spriteFolder?: string;
    trainerSpriteFolder?: string;
    listenPort: number;
    runStatusEndpoint?: string;
    newCatchEndpoint?: string;
    forceNewCatch?: boolean;
    screenWidth: number;
    screenHeight: number;
    windowX?: number;
    windowY?: number;
    frameless?: boolean;
    blockResize?: boolean;
    resetEveryHours?: number;
    transitionDurationMs?: number;
    stateBackupFolder?: string;
    stateBackupIntervalMinutes?: number;
    eventBackupFolder?: string;
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

declare interface EmuCtlConfig {
    saveStatePath?: string;
    saveStateIntervalSeconds?: number;
}

declare interface SplitsConfig {
    runStartTime?: string;
    splitFile?: string;
    splitsX?: number;
    splitsY?: number;
    splitsWidth?: number;
    splitsHeight?: number;
}

declare interface EmotesConfig {
    emoteEndpoint?: string;
    emoteEffectsFile?: string;
    emotePollIntervalSeconds?: number;
    emotesX?: number;
    emotesY?: number;
    emotesWidth?: number;
    emotesHeight?: number;
}

declare interface GoalConfig {
    showGoals?: boolean;
    goals?: (TrickHouseConfig | LogoConfig | HoFEntriesConfig | TrainerHitListConfig)[];
    goalWidth?: number;
    goalHeight?: number;
    goalX?: number;
    goalY?: number;
}

declare interface Goal {
    goalType: string;
}

declare interface TrainerHitListConfig extends Goal {
    goalType: "Trainers";
    requiredTrainerIds: number[];
    requiredTrainerClasses?: number[];
    optionalTrainerIds?: number[];
    optionalTrainerClasses?: number[];
    finalTrainerIds?: number[];
    finalTrainerClasses?: number[];
    extraTrackedTrainerIds?: number[];
    extraTrackedTrainerClasses?: number[];
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