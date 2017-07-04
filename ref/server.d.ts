/// <reference path="../node_modules/@types/node/index.d.ts" />
/// <reference path="../ref/runstatus.d.ts" />
/// <reference path="../ref/config.d.ts" />
/// <reference path="../node_modules/@types/electron/index.d.ts" />
/// <reference path="../ref/joypad.d.ts" />
/// <reference types="node" />
declare const gen2Offsets: {
    ItemAttributesOffset: number;
    TMMovesOffset: number;
    WildPokemonOffset: number;
    MoveDataOffset: number;
    PokemonStatsOffset: number;
    PokemonNamesOffset: number;
    FishingWildsOffset: number;
    HeadbuttWildsOffset: number;
    PicPointers: number;
    ItemNamesOffset: number;
    MoveNamesOffset: number;
    AreaNamesOffset: number;
    charmap: any[];
    mapNames: {
        [key: number]: {
            [key: number]: {
                name: string;
            };
        };
    };
};
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
    }
}
declare namespace Pokemon {
    interface Map {
        name: string;
        id: number;
        bank?: number;
        encounters: {
            [key: string]: Species[];
            grass: Species[];
            hidden_grass?: Species[];
            surfing: Species[];
            hidden_surfing?: Species[];
            fishing: Species[];
            hidden_fishing?: Species[];
        };
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
    }
}
declare namespace Pokemon {
    interface Item {
        id: number;
        name: string;
        isKeyItem: boolean;
    }
}
declare namespace RomReader {
    abstract class RomReaderBase {
        protected pokemon: Pokemon.Species[];
        protected moves: Pokemon.Move[];
        protected items: Pokemon.Item[];
        protected maps: Pokemon.Map[];
        protected areas: string[];
        protected abilities: string[];
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
        GetSpecies(id: number): Pokemon.Species;
        GetMove(id: number): Pokemon.Move;
        GetMap(id: number, bank?: number): Pokemon.Map;
        GetItem(id: number): Pokemon.Item;
        GetAbility(id: number): string;
        GetAreaName(id: number): string;
        ItemIsBall(id: number | Pokemon.Item): boolean;
        GetNature(id: number): string;
        GetCharacteristic(stats: Pokemon.Stats, pv: number): any;
    }
}
declare namespace RomReader {
    abstract class GBReader extends RomReaderBase {
        private romFileLocation;
        private charmap;
        constructor(romFileLocation: string, charmap: string[]);
        ConvertText(text: string | Buffer | number[]): string;
        protected loadROM(): Buffer;
        protected ReadStridedData(romData: Buffer, startOffset: number, strideBytes: number, length: number): Buffer[];
        protected ReadStringBundle(romData: Buffer, startOffset: number, numStrings: number): string[];
        protected LinearAddrToROMBank(linear: number): {
            bank: number;
            address: number;
        };
        protected ROMBankAddrToLinear(bank: number, address: number): number;
    }
}
declare namespace RomReader {
    interface Gen2Item extends Pokemon.Item {
        price: number;
        pocket: string;
    }
    class Gen2 extends GBReader {
        constructor(romFileLocation: string);
        private ReadAreaNames(romData);
        private ReadMoveData(romData);
        private ReadItemData(romData);
        private ReadPokeData(romData);
    }
}
declare module TPP.Server {
    function getConfig(): Config;
    function MainProcessRegisterStateHandler(stateFunc: (state: TPP.RunStatus) => void): void;
    function getState(): RunStatus;
    const RomData: RomReader.Gen2;
    function setState(dataJson: string): void;
    const fileExists: (path: string) => any;
}
declare module TPP.Server {
}
declare namespace TPP.Server.DexNav {
    interface KnownEncounter {
        speciesId: number;
        owned: boolean;
    }
    class State {
        MapName: string;
        MapID: number;
        TotalEncounters: number;
        CompletedCategories: number;
        MoreLeftToCatch: boolean;
        KnownEncounters: {
            grass: KnownEncounter[];
            hidden_grass: KnownEncounter[];
            surfing: KnownEncounter[];
            hidden_surfing: KnownEncounter[];
            fishing: KnownEncounter[];
            hidden_fishing: KnownEncounter[];
        };
        readonly HasEncounters: boolean;
        constructor(map: Pokemon.Map, runState: TPP.RunStatus);
    }
}
declare namespace TPP.Server.DexNav {
}
declare namespace RomReader {
    function AugmentState(romData: RomReaderBase, state: TPP.RunStatus): void;
}
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
declare namespace BLZCoder {
    function Decode(data: Buffer): Buffer;
}
declare namespace NDS.DSDecmp {
    function Decompress(data: Buffer, offset?: number): Buffer;
}
declare namespace NDS {
    class NARChive {
        filenames: string[];
        files: Buffer[];
        hasFilenames: boolean;
        constructor(data?: Buffer);
        getBytes(): Buffer;
        private readNitroFrames(data);
    }
}
declare namespace NDS.PPTxt {
    function GetStrings(ds: Buffer): string[];
    function PokeToText(str: string): string;
}
declare namespace RomReader {
    abstract class NDSReader extends RomReaderBase {
        private basePath;
        constructor(basePath: string);
        protected readNARC(path: string): NDS.NARChive;
        protected readArm9(): Buffer;
        private readFile(path);
    }
}
declare namespace RomReader {
    class Gen5 extends NDSReader {
        ConvertText(text: string): string;
        constructor(basePath: string);
    }
}
