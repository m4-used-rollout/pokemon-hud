/// <reference path="../ref/runstatus.d.ts" />
/// <reference path="../node_modules/@types/node/index.d.ts" />
/// <reference path="../ref/ini.d.ts" />
/// <reference path="../ref/pge.ini.d.ts" />
/// <reference path="../ref/config.d.ts" />
/// <reference path="../node_modules/@types/electron/index.d.ts" />
/// <reference path="../ref/joypad.d.ts" />
/// <reference types="node" />
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
        doNotFlipSprite?: boolean;
    }
}
declare namespace Pokemon {
    interface EncounterMon {
        species: Pokemon.Species;
        rate: number;
        requiredItem?: Pokemon.Item;
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
        abstract ConvertText(text: string | Buffer | number[]): string;
        abstract GetCurrentMapEncounters(map: Pokemon.Map, state: TPP.TrainerData): Pokemon.EncounterSet;
        abstract GetForm(pokemon: TPP.Pokemon): number;
        GetSpecies(id: number): Pokemon.Species;
        GetSpeciesByDexNumber(dexNum: number): Pokemon.Species;
        GetMove(id: number): Pokemon.Move;
        GetMap(id: number, bank?: number): Pokemon.Map;
        GetItem(id: number): Pokemon.Item;
        GetAbility(id: number): string;
        readonly HasAbilities: boolean;
        GetAreaName(id: number): string;
        ItemIsBall(id: number | Pokemon.Item): boolean;
        GetCurrentLevelCap(badges: number): number;
        GetNature(id: number): string;
        readonly HasNatures: boolean;
        GetCharacteristic(stats: Pokemon.Stats, pv: number): any;
        GetAllMapEncounters(map: Pokemon.Map): Pokemon.EncounterSet;
        GetTrainer(id: number, classId?: number): Pokemon.Trainer;
        GetPokemonSprite(id: number, form?: number, shiny?: boolean): string;
        GetTrainerSprite(id: number): string;
        IsUnknownTrainerMap(id: number, bank?: number): boolean;
        GetFrameBorder(id: number): string;
        CachePokemonSprite(id: number, data: string, form?: number, shiny?: boolean): void;
        CacheTrainerSprite(id: number, data: string): void;
        CacheFrameBorder(id: number, data: string): void;
        CheckIfCanSurf(runState: TPP.RunStatus): boolean;
        CheckIfCanFish(runState: TPP.RunStatus): boolean;
        CalcHiddenPowerType(stats: TPP.Stats): string;
        CalcHiddenPowerPower(stats: TPP.Stats): number;
        protected CombineDuplicateEncounters(mons: Pokemon.EncounterMon[]): Pokemon.EncounterMon[];
        private surfExp;
    }
}
declare namespace RomReader {
    abstract class GBReader extends RomReaderBase {
        private romFileLocation;
        private charmap;
        protected stringTerminator: number;
        constructor(romFileLocation: string, charmap: string[]);
        ConvertText(text: string | Buffer | number[]): string;
        GetForm(pokemon: TPP.Pokemon): number;
        protected loadROM(): Buffer;
        protected ReadStridedData(romData: Buffer, startOffset: number, strideBytes: number, length?: number, lengthIsMax?: boolean): Buffer[];
        protected ReadBundledData(romData: Buffer, startOffset: number, terminator: number, numBundles: number, endOffset?: number): Buffer[];
        protected ReadStringBundle(romData: Buffer, startOffset: number, numStrings: number): string[];
        protected LinearAddrToROMBank(linear: number): {
            bank: number;
            address: number;
        };
        protected ROMBankAddrToLinear(bank: number, address: number): number;
        protected SameBankPtrToLinear(baseAddr: number, ptr: number): number;
        protected FixAllCaps(str: string): string;
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
declare module TPP.Server {
    function getConfig(): Config;
    function MainProcessRegisterStateHandler(stateFunc: (state: TPP.RunStatus) => void): void;
    function getState(): RunStatus;
    const RomData: RomReader.Gen3;
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
        rate: number;
        owned: boolean;
        requiredItemId: number;
    }
    interface KnownEncounters {
        [key: string]: KnownEncounter[];
    }
    interface OwnedSpecies extends Pokemon.Species {
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
        KnownEncounters: KnownEncounters;
        readonly HasEncounters: boolean;
        WildBattle: OwnedSpecies;
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
declare const gen2Offsets: {
    ItemAttributesOffset: number;
    PokemonPalettes: number;
    TrainerPalettes: number;
    TMMovesOffset: number;
    TimeOfDayOffset: number;
    WildPokemonOffset: number;
    TrainerClassNamesOffset: number;
    TrainerGroupsOffset: number;
    MoveDataOffset: number;
    PokemonStatsOffset: number;
    PokemonNamesOffset: number;
    FishingWildsOffset: number;
    TimeFishGroups: number;
    MapHeaders: number;
    BugContestWilds: number;
    HeadbuttWildsOffset: number;
    FrameBordersOffset: number;
    PokemonPicPointers: number;
    UnownPicPointers: number;
    TrainerPicPointers: number;
    ItemNamesOffset: number;
    MoveNamesOffset: number;
    AreaNamesOffset: number;
    PicBankOffset: number;
    charmap: any[];
    mapNames: {
        [key: number]: {
            [key: number]: {
                name: string;
            };
        };
    };
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
        constructor(basePath: string);
        GetForm(pokemon: TPP.Pokemon): number;
        protected readNARC(path: string): Tools.NARChive;
        protected readArm9(): Buffer;
        private readFile(path);
    }
}
declare namespace Tools.LZGSC {
    function Decompress(compressed: Buffer): Buffer;
}
declare namespace RomReader {
    class Gen2 extends GBReader {
        private timeOfDay;
        constructor(romFileLocation: string);
        GetCurrentMapEncounters(map: Pokemon.Map, state: TPP.TrainerData): Pokemon.EncounterSet;
        CheckIfCanSurf(runState: TPP.RunStatus): boolean;
        CalcHiddenPowerType(stats: TPP.Stats): string;
        CalcHiddenPowerPower(stats: TPP.Stats): number;
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
        private ReadFrameBorders(romData);
        private ProcessPalette(palData);
        private ReadTrainerSprites(romData);
        private ReadPokemonSprites(romData);
        private CalculateTimesOfDay(romData);
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
