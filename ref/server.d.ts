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
    interface Species {
        id: number;
        name: string;
        dexNumber: number;
        type1: string;
        type2: string;
        baseStats: {
            hp: number;
            atk: number;
            def: number;
            spatk: number;
            spdef: number;
        };
        abilities: string[];
        catchRate: number;
        expYield?: number;
        genderRatio?: number;
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
            surfing: Species[];
            fishing: Species[];
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
        protected ballIds: number[];
        abstract ConvertText(text: string): string;
        GetSpecies(id: number): Pokemon.Species;
        GetMove(id: number): Pokemon.Move;
        GetMap(id: number): Pokemon.Map;
        GetItem(id: number): Pokemon.Item;
        ItemIsBall(id: number | Pokemon.Item): boolean;
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
declare namespace RomReader {
    abstract class NDSReader extends RomReaderBase {
        private basePath;
        constructor(basePath: string);
        protected readNARC(path: string): NDS.NARChive;
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
    function getState(): RunStatus;
    function setState(dataJson: string): void;
    const fileExists: (path: string) => any;
}
declare module TPP.Server {
}
declare namespace NDS.DSDecmp {
    function Decompress(data: Buffer, offset?: number): Buffer;
}
