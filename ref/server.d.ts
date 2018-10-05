/// <reference path="../ref/config.d.ts" />
/// <reference path="../ref/runstatus.d.ts" />
/// <reference path="../node_modules/@types/node/index.d.ts" />
/// <reference path="../ref/ini.d.ts" />
/// <reference path="../ref/pge.ini.d.ts" />
/// <reference path="../node_modules/@types/electron/index.d.ts" />
/// <reference path="../ref/joypad.d.ts" />
/// <reference types="node" />
declare module Args {
    class CmdConf implements Config {
        runName: string;
        badgeCount?: number;
        mainRegion?: string;
        totalInDex?: number;
        romDexToNatDex?: number[];
        displayOptions?: string[];
        hudTheme: string;
        romFile?: string;
        iniFile?: string;
        useGPU?: boolean;
        forceNoHighDPIScaling?: boolean;
        extractedRomFolder: string;
        spriteFolder: string;
        trainerSpriteFolder: string;
        listenPort: number;
        runStatusEndpoint: string;
        newCatchEndpoint: string;
        screenWidth: number;
        screenHeight: number;
        windowX: number;
        windowY: number;
        frameless: boolean;
        blockResize: boolean;
        resetEveryHours?: number;
        showDexNav: boolean;
        dexNavUseAreaName?: boolean;
        dexNavWidth: number;
        dexNavHeight: number;
        dexNavX: number;
        dexNavY: number;
        dexNavResetEveryHours: number;
        dexNavTheme: string;
        hofMapId: number;
        hofMapBank: number;
        Merge(config: Config): this;
    }
    function Parse(): CmdConf;
}
declare namespace Pokemon {
    namespace ExpCurve {
        interface CalcExp {
            (level: number): number;
        }
        var Erratic: CalcExp;
        var Fast: CalcExp;
        var MediumFast: CalcExp;
        var MediumSlow: CalcExp;
        var Slow: CalcExp;
        var Fluctuating: CalcExp;
        function ExpToLevel(exp: number, expFunc: CalcExp): number;
    }
}
declare namespace Pokemon {
    interface Stats {
        hp: number;
        atk: number;
        def: number;
        spatk: number;
        spdef: number;
        speed: number;
    }
}
declare namespace Pokemon {
    interface Species {
        id: number;
        name: string;
        dexNumber: number;
        type1: string;
        type2: string;
        baseStats: Stats;
        abilities: string[];
        catchRate: number;
        eggCycles: number;
        eggGroup1: string | number;
        eggGroup2: string | number;
        baseExp: number;
        genderRatio: number;
        frontSpritePointer?: number;
        spriteSize?: number;
        growthRate: string;
        expFunction: ExpCurve.CalcExp;
        baseSpeciesId?: number;
        formNumber?: number;
        doNotFlipSprite?: boolean;
    }
}
declare namespace Pokemon {
    interface EncounterMon {
        species?: Pokemon.Species;
        speciesId?: number;
        form?: number;
        rate: number;
        requiredItem?: Pokemon.Item;
        categoryIcon?: string;
    }
    interface EncounterSet {
        [key: string]: EncounterMon[];
        grass?: EncounterMon[];
        hidden_grass?: EncounterMon[];
        surfing?: EncounterMon[];
        hidden_surfing?: EncounterMon[];
        fishing?: EncounterMon[];
        hidden_fishing?: EncounterMon[];
    }
    interface Encounters {
        [key: string]: EncounterSet;
    }
}
declare namespace Pokemon {
    interface Map {
        name: string;
        id: number;
        bank?: number;
        areaId?: number;
        areaName?: string;
        encounters: Encounters;
    }
}
declare namespace Pokemon {
    interface Move {
        name: string;
        id: number;
        basePower: number;
        basePP: number;
        accuracy: number;
        type: string;
        contestData?: ContestData;
    }
    interface ContestData {
        effect: string;
        type: string;
        appeal: string;
        jamming: string;
    }
    interface MoveLearn extends Move {
        level: number;
    }
}
declare namespace Pokemon {
    interface Item {
        id: number;
        name: string;
        isKeyItem: boolean;
    }
}
declare namespace Pokemon {
    interface Trainer {
        classId: number;
        className: string;
        id: number;
        name: string;
        spriteId: number;
        gender?: string;
    }
}
declare namespace Tools {
    function ZeroPad(str: string, len: number, left?: boolean): string;
}
declare namespace Sprites {
    interface ImageMap {
        palette: string[];
        pixels: number[][];
    }
    function ParseTilesToLayout(data: Buffer, palette: string[], numTiles: number, layout: number[][], bpp: number): ImageMap;
    function ParseTilesToImageMap(data: Buffer, palette: string[], tilesWide: number, tilesHigh: number, fullTilesWide?: number, fullTilesHigh?: number, bpp?: number): ImageMap;
    function Convert16BitColorToRGB(color16: number): string;
    function FloodClear(img: ImageMap, paletteIndex: number, stopPixels?: number[][], startPixels?: number[][], clearDiagonal?: boolean): ImageMap;
}
declare namespace Tools.File {
    const Exists: (filename: string) => boolean;
}
declare namespace RomReader {
    abstract class RomReaderBase {
        protected pokemon: Pokemon.Species[];
        protected moves: Pokemon.Move[];
        protected items: Pokemon.Item[];
        protected maps: Pokemon.Map[];
        protected pokemonSprites: {
            base: string;
            shiny: string;
        }[][];
        protected trainerSprites: string[];
        protected frameBorders: string[];
        protected trainers: Pokemon.Trainer[];
        protected areas: string[];
        protected abilities: string[];
        protected moveLearns: {
            [key: number]: Pokemon.MoveLearn[];
        };
        protected levelCaps: number[];
        protected ballIds: number[];
        protected natures: string[];
        protected characteristics: {
            hp: string[];
            atk: string[];
            def: string[];
            speed: string[];
            spatk: string[];
            spdef: string[];
        };
        protected formBackMapping: {
            [key: number]: number;
        };
        protected ZeroPad(int: number, digits: number): string;
        GetCurrentMapEncounters(map: Pokemon.Map, state: TPP.TrainerData): Pokemon.EncounterSet;
        ConvertText(text: string | Buffer | number[]): string;
        GetForm(pokemon: TPP.Pokemon): number;
        GetSpecies(id: number, form?: number): Pokemon.Species;
        GetSpeciesByDexNumber(dexNum: number): Pokemon.Species;
        GetMove(id: number): Pokemon.Move;
        GetMap(id: number, bank?: number): Pokemon.Map;
        GetItem(id: number): Pokemon.Item;
        GetAbility(id: number): string;
        readonly HasAbilities: boolean;
        GetNextMoveLearn(speciesId: number, form: number, level: number, moveSet: number[]): Pokemon.MoveLearn;
        GetAreaName(id: number): string;
        ItemIsBall(id: number | Pokemon.Item): boolean;
        GetCurrentLevelCap(badges: number): number;
        GetNature(id: number): string;
        readonly HasNatures: boolean;
        GetCharacteristic(stats: Pokemon.Stats, pv: number): any;
        GetAllMapEncounters(map: Pokemon.Map): Pokemon.EncounterSet;
        GetTrainer(id: number, classId?: number): Pokemon.Trainer;
        GetPokemonSprite(id: number, form?: number, gender?: string, shiny?: boolean, generic?: boolean): string;
        GetTrainerSprite(id: number): string;
        GetItemSprite(id: number): string;
        IsUnknownTrainerMap(id: number, bank?: number): boolean;
        GetFrameBorder(id: number): string;
        CachePokemonSprite(id: number, data: string, form?: number, shiny?: boolean): void;
        CacheTrainerSprite(id: number, data: string): void;
        CacheFrameBorder(id: number, data: string): void;
        CheckIfCanSurf(runState: TPP.RunStatus): boolean;
        CheckIfCanFish(runState: TPP.RunStatus): boolean;
        CalcHiddenPowerType(stats: TPP.Stats): string;
        CalcHiddenPowerPower(stats: TPP.Stats): number;
        CollapseSeenForms(seen: number[]): number[];
        MapCaughtBallId(ballId: number): number;
        protected CombineDuplicateEncounters(mons: Pokemon.EncounterMon[]): Pokemon.EncounterMon[];
        protected ReadStridedData(romData: Buffer, startOffset: number, strideBytes: number, length?: number, lengthIsMax?: boolean): Buffer[];
        private surfExp;
    }
}
declare namespace RomReader {
    abstract class GBReader extends RomReaderBase {
        private romFileLocation;
        private charmap;
        protected stringTerminator: number;
        protected symTable: {
            [key: string]: number;
        };
        constructor(romFileLocation: string, charmap: string[]);
        ConvertText(text: string | Buffer | number[]): string;
        GetForm(pokemon: TPP.Pokemon): number;
        protected loadROM(): Buffer;
        protected ReadBundledData(romData: Buffer, startOffset: number, terminator: number, numBundles: number, endOffset?: number): Buffer[];
        protected ReadStringBundle(romData: Buffer, startOffset: number, numStrings: number, endOffset?: number): string[];
        protected LinearAddrToROMBank(linear: number, bankSize?: number): {
            bank: number;
            address: number;
        };
        protected ROMBankAddrToLinear(bank: number, address: number, bankSize?: number): number;
        protected SameBankPtrToLinear(baseAddr: number, ptr: number): number;
        protected FixAllCaps(str: string): string;
        CalcHiddenPowerType(stats: TPP.Stats): string;
        CalcHiddenPowerPower(stats: TPP.Stats): number;
        private symbolEntry;
        protected LoadSymbolFile(filename: string): {
            [key: string]: number;
        };
        protected IsFlagSet(romData: Buffer, flagStartOffset: number, flagIndex: number): boolean;
        protected ParseBCD(bcd: Buffer): number;
    }
}
declare const gen3Charmap: string[];
declare namespace Tools.LZ77 {
    function Decompress(compressed: Buffer, offset?: number): Buffer;
}
declare namespace RomReader {
    abstract class GBAReader extends GBReader {
        private iniFileLocation;
        protected stringTerminator: number;
        constructor(romFileLocation: string, iniFileLocation: string);
        protected LoadConfig(romData: Buffer): PGEINI;
        protected ReadRomPtr(romData: Buffer, addr?: number): number;
        protected ReadPtrBlock(romData: Buffer, startAddr: number, endAddr?: number): number[];
        protected FindPtrFromPreceedingData(romData: Buffer, hexStr: string): number;
        protected DecompressPointerCollection(romData: Buffer, startAddr: number, numPtrs: number, strideBytes?: number): Buffer[];
    }
}
declare namespace RomReader {
    class Gen3 extends GBAReader {
        constructor(romFileLocation: string, iniFileLocation?: string);
        CheckIfCanSurf(runState: TPP.RunStatus): boolean;
        GetCurrentMapEncounters(map: Pokemon.Map, state: TPP.TrainerData): Pokemon.EncounterSet;
        IsUnknownTrainerMap(id: number, bank: number): boolean;
        private isFRLG(config);
        private ReadAbilities(romData, config);
        private ReadPokeData(romData, config);
        private ReadTrainerData(romData, config);
        private ReadItemData(romData, config);
        private ReadMoveData(romData, config);
        private GetTMHMNames(romData, config);
        private ReadMapLabels(romData, config);
        private ReadMaps(romData, config);
        private FindMapEncounters(romData, config);
        private ReadEncounterSet(romData, setAddr, encounterRates, requiredItems?, includeGroupRate?);
    }
}
declare namespace RomReader {
    class Generic extends RomReaderBase {
        constructor(dataFolder?: string);
        GetPokemonSprite(id: number, form?: number, gender?: string, shiny?: boolean, generic?: boolean): string;
        GetItemSprite(id: number): string;
        GetCurrentMapEncounters(map: Pokemon.Map, state: TPP.TrainerData): Pokemon.EncounterSet;
        CollapseSeenForms(seen: number[]): number[];
    }
}
declare module TPP.Server {
    function getConfig(): Config;
    function MainProcessRegisterStateHandler(stateFunc: (state: TPP.RunStatus) => void): void;
    function getState(): RunStatus;
    let RomData: RomReader.RomReaderBase;
    function rawState(): any;
    function setState(dataJson: string): void;
    const fileExists: (path: string) => any;
}
declare module TPP.Server {
}
declare namespace Pokemon.Convert {
    function SpeciesFromRunStatus(s: TPP.PokemonSpecies): Species;
    function EnemyTrainerFromRunStatus(t: TPP.EnemyTrainer): Trainer;
}
declare namespace TPP.Server.DexNav {
    interface KnownEncounter {
        speciesId: number;
        dexNum: number;
        form: number;
        rate: number;
        owned: boolean;
        categoryIcon: string;
        requiredItemId: number;
    }
    interface KnownEncounters {
        [key: string]: KnownEncounter[];
    }
    interface WildPokemon extends Pokemon.Species {
        gender?: string;
        shiny?: boolean;
        form?: number;
        health?: number[];
        owned: boolean;
        encounterRate?: number;
    }
    class State {
        MapName: string;
        MapID: number;
        MapBank: number;
        AreaID: number;
        AreaName: string;
        Hour: number;
        TotalEncounters: number;
        CompletedCategories: number;
        MoreLeftToCatch: boolean;
        ShowDexNav: boolean;
        TehUrn: boolean;
        KnownEncounters: KnownEncounters;
        readonly HasEncounters: boolean;
        BattleKind: string;
        WildBattle: WildPokemon[];
        EnemyTrainers: TPP.EnemyTrainer[];
        EnemyParty: TPP.EnemyParty;
        IsUnknownArea: boolean;
        constructor(map: Pokemon.Map, encounters: Pokemon.EncounterSet, allMapEncounters: Pokemon.EncounterSet, runState: TPP.RunStatus);
        private categories;
        private PopulateKnownEncounters(encounters, runState);
        private PopulateCompletionTotals(allMapEncounters, runState);
    }
}
declare namespace TPP.Server.DexNav {
}
declare namespace RomReader {
    function AugmentState(romData: RomReaderBase, state: TPP.RunStatus): void;
}
declare const gen1Charmap: string[];
declare const gen1MapNames: string[];
declare const gen2Offsets: {
    ItemAttributesOffset: string;
    PokemonPalettes: string;
    TrainerPalettes: string;
    TMMovesOffset: string;
    TimeOfDayOffset: string;
    WildPokemonOffset: string;
    TrainerClassNamesOffset: string;
    TrainerGroupsOffset: string;
    MoveDataOffset: string;
    PokemonStatsOffset: string;
    PokemonNamesOffset: string;
    FishingWildsOffset: string;
    TimeFishGroups: string;
    MapHeaders: string;
    BugContestWilds: string;
    HeadbuttWildsOffset: string;
    FrameBordersOffset: string;
    PokemonPicPointers: string;
    UnownPicPointers: string;
    TrainerPicPointers: string;
    ItemNamesOffset: string;
    MoveNamesOffset: string;
    AreaNamesOffset: string;
    CrystalPicBankOffset: number;
    charmap: any[];
    mapNames: {
        [key: number]: {
            [key: number]: {
                name: string;
            };
        };
    };
};
declare const gen4FilesOffsets: {
    TextStrings: string;
    PokemonGraphics: string;
    PokemonStats: string;
    MapTableFile: string;
    MoveData: string;
    ItemData: string;
    ItemGraphics: string;
    BadgeGraphics: string;
    EncounterData: string;
    PokemonFormIndex: string;
    TextOffsets: {
        PokemonNames: number;
        MoveNames: number;
        AbilityNames: number;
        ItemNames: number;
        MapNames: number;
    };
    MapTableARM9Offset: number;
    MapTableNameIndexSize: number;
};
declare const gen5FilesOffsets: {
    TextStrings: string;
    PokemonGraphics: string;
    PokemonStats: string;
    MapTableFile: string;
    MoveData: string;
    ItemData: string;
    ItemGraphics: string;
    BadgeGraphics: string;
    EncounterData: string;
    PokemonFormIndex: string;
    TextOffsets: {
        PokemonNames: number;
        MoveNames: number;
        AbilityNames: number;
        ItemNames: number;
        MapNames: number;
    };
};
declare namespace Tools {
    class NARChive {
        filenames: string[];
        files: Buffer[];
        hasFilenames: boolean;
        constructor(data?: Buffer);
        getBytes(): Buffer;
        private readNitroFrames(data);
    }
}
declare namespace BLZCoder {
    function Decode(data: Buffer): Buffer;
}
declare namespace RomReader {
    abstract class NDSReader extends RomReaderBase {
        private basePath;
        protected dataPath: string;
        constructor(basePath: string);
        protected readNARC(path: string): Tools.NARChive;
        protected readArm9(): Buffer;
        protected readFile(path: string): Buffer;
    }
}
declare namespace Tools.LZGSC {
    function Decompress(compressed: Buffer): Buffer;
}
declare namespace RomReader {
    class Gen1 extends GBReader {
        private fishingRodIds;
        constructor(romFileLocation: string);
        GetPokemonSprite(id: number, form?: number, gender?: string, shiny?: boolean, generic?: boolean): string;
        GetTrainerSprite(id: number): string;
        CheckIfCanSurf(runState: TPP.RunStatus): boolean;
        private FindFishingEncounters(romData);
        private ParseEncounters(encounters, encounterRates);
        private ReadEncounterTablesAt(romData, addr, encounterRates);
        private ReadMaps(romData);
        private ReadAreaNames();
        private AddTMHMs(romData);
        private ReadMoveData(romData);
        private FindBallIds(romData);
        private FindFishingRods(romData);
        private ReadItemData(romData);
        private PokedexToIndex(romData, dexNum);
        private ReadPokeData(romData);
        private ProcessPalette(palData);
    }
}
declare namespace RomReader {
    class Gen2 extends GBReader {
        private timeOfDay;
        constructor(romFileLocation: string);
        GetCurrentMapEncounters(map: Pokemon.Map, state: TPP.TrainerData): Pokemon.EncounterSet;
        CheckIfCanSurf(runState: TPP.RunStatus): boolean;
        private ReadPyriteLevelCaps(romData);
        private FindFishingEncounters(romData);
        private FindMapEncounters(romData);
        private ReadMaps(romData);
        private ReadAreaNames(romData);
        private GetTMHMNames(romData);
        private ReadMoveData(romData);
        private ReadItemData(romData);
        private ReadTrainerData(romData);
        private ReadPokeData(romData);
        private ReadMoveLearns(romData);
        private ReadFrameBorders(romData);
        private TranslatePicBank(bank);
        private ProcessPalette(palData);
        private ReadTrainerSprites(romData);
        private ReadPokemonSprites(romData);
        private CalculateTimesOfDay(romData);
    }
}
declare namespace Tools.PokeText {
    function GetStrings(data: Buffer): string[];
    class PokeTextData {
        private data;
        ptrlist: PointerEntry[];
        strlist: string[];
        compressFlag: boolean;
        constructor(data: Buffer);
        readonly Data: Buffer;
        decrypt(): void;
        encrypt(): void;
        private DecyptPtrs(count, key, sdidx);
        private CreatePtrList(count, sdidx);
        private DecyptTxt(count, id, idx);
        private MakeString(count, idx);
        Key: number;
    }
    class PointerEntry {
        private ptr;
        private chars;
        constructor(ptr: number, chars: number);
        readonly Ptr: number;
        readonly Chars: number;
    }
    const CharMap: {
        [key: number]: string;
    };
}
declare namespace RomReader {
    class Gen4 extends NDSReader {
        private tmHmMoves;
        CheckIfCanSurf(runState: TPP.RunStatus): boolean;
        GetPokemonSprite(id: number, form?: number, gender?: string, shiny?: boolean, generic?: boolean): string;
        GetItemSprite(id: number): string;
        ConvertText(text: string): string;
        GetCurrentMapEncounters(map: Pokemon.Map, state: TPP.TrainerData): Pokemon.EncounterSet;
        constructor(basePath: string);
    }
}
declare namespace Tools.PPTxt {
    function GetStrings(ds: Buffer): string[];
    function PokeToText(str: string): string;
}
declare namespace RomReader {
    class Gen5 extends NDSReader {
        ConvertText(text: string): string;
        GetCurrentMapEncounters(map: Pokemon.Map, state: TPP.TrainerData): Pokemon.EncounterSet;
        constructor(basePath: string);
    }
}
declare namespace RomReader {
    class Gen6 extends Generic {
        constructor();
        CheckIfCanSurf(runState: TPP.RunStatus): boolean;
        GetItemSprite(id: number): string;
    }
}
declare namespace RomReader {
    class Gen7 extends Generic {
        constructor();
        GetCurrentMapEncounters(map: Pokemon.Map, state: TPP.TrainerData): Pokemon.EncounterSet;
        CollapseSeenForms(seen: number[]): number[];
    }
}
declare namespace Tools.DSDecmp {
    function Decompress(data: Buffer, offset?: number): Buffer;
}
declare namespace Tools {
    class Gen2LZDecmp {
        data: Buffer;
        address: number;
        private output;
        private out_idx;
        private cmd;
        private len;
        private offset;
        constructor(input: Buffer, baseOffset: number, tilesWide: number, tilesHigh: number);
        getData(): Buffer;
        getFlattenedData(): Buffer;
        private cutAndTranspose(width, height);
        private decompress();
        private repeat(direction?, table?);
        private get_offset();
        private resizeOutput();
        peek(): number;
        next(): number;
    }
}
