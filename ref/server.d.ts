/// <reference path="../node_modules/@types/node/index.d.ts" />
/// <reference path="../ref/runstatus.d.ts" />
/// <reference path="../ref/config.d.ts" />
/// <reference path="../node_modules/@types/electron/index.d.ts" />
/// <reference path="../ref/joypad.d.ts" />
/// <reference types="node" />
declare var gen5FilesOffsets: {
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
        eggGroup1: number;
        eggGroup2: number;
        baseExp: number;
        genderRatio: number;
        frontSpritePointer?: number;
        spriteSize?: number;
        expFunction: ExpCurve.CalcExp;
    }
}
declare namespace Pokemon {
    interface Map {
        name: string;
        id: number;
        encounters: {
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
        abstract ConvertText(text: string): string;
        GetSpecies(id: number): Pokemon.Species;
        GetMove(id: number): Pokemon.Move;
        GetMap(id: number): Pokemon.Map;
        GetItem(id: number): Pokemon.Item;
        GetAbility(id: number): string;
        ItemIsBall(id: number | Pokemon.Item): boolean;
        GetNature(id: number): string;
        GetCharacteristic(stats: Pokemon.Stats, pv: number): any;
    }
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
declare namespace BLZCoder {
    function Decode(data: Buffer): Buffer;
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
declare namespace NDS.PPTxt {
    function GetStrings(ds: Buffer): string[];
    function PokeToText(str: string): string;
}
declare namespace RomReader {
    class Gen5 extends NDSReader {
        ConvertText(text: string): string;
        constructor(basePath: string);
    }
}
declare module TPP.Server {
    function getConfig(): Config;
    function MainProcessRegisterStateHandler(stateFunc: (state: TPP.RunStatus) => void): void;
    function getState(): RunStatus;
    const RomData: RomReader.Gen5;
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
        IncompleteCategories: number;
        KnownEncounters: {
            grass: KnownEncounter[];
            surfing: KnownEncounter[];
            fishing: KnownEncounter[];
        };
        readonly HasEncounters: boolean;
        constructor(map: Pokemon.Map, runState: TPP.RunStatus);
    }
}
declare namespace TPP.Server.DexNav {
}
declare namespace NDS.DSDecmp {
    function Decompress(data: Buffer, offset?: number): Buffer;
}
declare namespace RomReader {
    function AugmentState(romData: RomReaderBase, state: TPP.RunStatus): void;
}
