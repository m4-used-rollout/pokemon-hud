/// <reference path="../ref/config.d.ts" />
/// <reference path="../ref/runstatus.d.ts" />
/// <reference path="../node_modules/@types/node/index.d.ts" />
/// <reference path="../node_modules/electron/electron.d.ts" />
/// <reference path="../ref/joypad.d.ts" />
/// <reference path="../ref/ini.d.ts" />
/// <reference path="../ref/pge.ini.d.ts" />
/// <reference path="../ref/upr.ini.d.ts" />
declare module Args {
    interface CmdConf extends Config {
    }
    class CmdConf {
        Merge(config: Config): this;
    }
    function Parse(): CmdConf;
}
declare namespace Events {
    interface Action {
        type: string;
    }
    interface Timestamp {
        timestamp: string;
    }
    abstract class Tracker<T extends Action = Action> {
        protected config: Config;
        constructor(config: Config);
        abstract Analyzer(newState: TPP.RunStatus, oldState: TPP.RunStatus, dispatch: (action: T) => void): void;
        abstract Reducer(action: T & Timestamp): void;
        abstract Reporter(state: TPP.RunStatus): TPP.RunStatus;
    }
    function RegisterTracker(trackerClass: new (config: Config) => Tracker): void;
    class RunEvents {
        private config;
        private currentState;
        private trackers;
        private ready;
        private saveStream;
        private savePath;
        constructor(config: Config);
        Init(): void;
        readonly EventsFileName: string;
        private OpenFile;
        Analyze(newState: TPP.RunStatus): TPP.RunStatus;
        private DedupeEvents;
        private Replay;
        Dispatch(action: Action): void;
        private SaveAction;
        private DispatchInternal;
    }
}
declare namespace Pokemon {
    namespace ExpCurve {
        interface CalcExp {
            (level: number): number;
        }
        const MediumFast: CalcExp;
        const SlightlyFast: CalcExp;
        const SlightlySlow: CalcExp;
        const MediumSlow: CalcExp;
        const Fast: CalcExp;
        const Slow: CalcExp;
        const Erratic: CalcExp;
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
    interface Evolution {
        level?: number;
        item?: Item;
        isTrade?: boolean;
        happiness?: number;
        mapId?: number;
        timeOfDay?: "Morn" | "Day" | "Night";
        speciesId: number;
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
        abilities?: string[];
        catchRate: number;
        eggCycles: number;
        eggGroup1: string;
        eggGroup2: string;
        baseExp: number;
        genderRatio: number;
        frontSpritePointer?: number;
        spriteSize?: number;
        growthRate: string;
        expFunction: ExpCurve.CalcExp;
        baseSpeciesId?: number;
        formNumber?: number;
        doNotFlipSprite?: boolean;
        heldItem1?: Item;
        heldItem2?: Item;
        tmMoves?: Move[];
        tmCompat?: string[];
        evolutions?: Evolution[];
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
        trainerString?: string;
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
        protected types: string[];
        protected expCurves: Pokemon.ExpCurve.CalcExp[];
        protected expCurveNames: string[];
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
        static FindLocalFile(path: string): string;
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
        CalculateHiddenPowerType(stats: TPP.Stats): string;
        CalculateHiddenPowerPower(stats: TPP.Stats): number;
        CollapseSeenForms(seen: number[]): number[];
        MapCaughtBallId(ballId: number): number;
        ShinyThreshold(): number;
        GetType(typeId: number): string;
        protected CombineDuplicateEncounters(mons: Pokemon.EncounterMon[]): Pokemon.EncounterMon[];
        ReadStridedData(romData: Buffer, startOffset: number, strideBytes: number, length?: number, lengthIsMax?: boolean, endValue?: number): Buffer[];
        GetSetFlags(flagBytes: Buffer, flagCount?: number, offset?: number): number[];
        CalculateGender(pokemon: TPP.Pokemon): void;
        CalculateShiny(pokemon: TPP.Pokemon): void;
        CalculateUnownForm(pokemon: {
            species?: TPP.PokemonSpecies;
            form?: number;
            personality_value?: number;
        }): void;
        private surfExp;
    }
}
declare namespace RomReader {
    type ShadowData = {
        id: number;
        catchRate: number;
        species: number;
        purificationStart: number;
        aggression?: number;
        fleeChance?: number;
        alwaysFlee?: number;
        storyId?: number;
        shadowLevel?: number;
        shadowMoves?: Pokemon.Move[];
    };
    type StringTable = {
        [key: number]: string;
    };
    abstract class GCNReader extends RomReaderBase {
        protected basePath: string;
        protected commonIndex: CommonRelIndex;
        protected isXd: boolean;
        shadowData: ShadowData[];
        protected strings: StringTable;
        protected trainerClasses: Pokemon.Trainer[];
        protected typeNames: string[];
        protected eggGroups: string[];
        protected expCurves: Pokemon.ExpCurve.CalcExp[];
        protected expCurveNames: string[];
        protected contestTypes: string[];
        protected contestEffects: string[];
        constructor(basePath: string, commonIndex: CommonRelIndex, isXd?: boolean);
        protected readonly StartDol: Buffer;
        protected readonly CommonRel: RelTable;
        FixAllCaps(str: string): string;
        ReadStringTable(table: Buffer, address?: number): {
            id: number;
            addr: string;
            string: string;
        }[];
        ReadStringOld(data: Buffer, address?: number, length?: number): string;
        ReadStringSloppy(data: Buffer, address?: number, length?: number): string;
        ReadString(data: Buffer, address?: number): string;
        GetPokemonSprite(id: number, form?: number, gender?: string, shiny?: boolean, generic?: boolean): string;
        CheckIfCanSurf(runState: TPP.RunStatus): boolean;
        GetMap(id: number): Pokemon.Map;
        readonly DefaultMap: Pokemon.Map;
        protected unlabeledMaps: {
            [key: number]: string;
        };
        protected abstract ReadPokeData(commonRel: RelTable, names?: StringTable): Pokemon.Species[];
        protected abstract ReadAbilities(startDol: Buffer, abilityNames?: string[]): string[];
        protected ReadItemData(startDol: Buffer, commonRel: RelTable, names?: StringTable): Pokemon.Item[];
        protected ReadTMHMMapping(startDol: Buffer): number[];
        protected tmExp: RegExp;
        protected MapTM(name: string, tmMap: number[]): string;
        protected ReadMoveData(commonRel: RelTable, names?: StringTable): Pokemon.Move[];
        protected ReadShadowData(commonRel: RelTable): ShadowData[];
        protected ReadTrainerData(commonRel: RelTable, names?: StringTable, classes?: Pokemon.Trainer[]): Pokemon.Trainer[];
        protected ReadTrainerClasses(commonRel: RelTable, names?: StringTable): Pokemon.Trainer[];
        protected abstract ReadRooms(commonRel: RelTable, names?: StringTable): Pokemon.Map[];
    }
    class RelTable {
        data: Buffer;
        private static readonly DataStartOffsetPtr;
        private static readonly CommonRelDataStartOffsetPtr;
        private static readonly PointerStartOffsetPtr;
        private static readonly PointerHeaderPointerOffsetPtr;
        private static readonly PointerStructSize;
        private pointers;
        constructor(data: Buffer, isCommonRel?: boolean);
        GetValueEntry(index: number): number;
        GetRecordEntry(index: number): Buffer;
    }
    interface CommonRelIndex {
        NumberOfItems?: number;
        BGM?: number;
        NumberOfBGMIDs?: number;
        BattleFields?: number;
        LegendaryPokemon?: number;
        NumberOfLegendaryPokemon?: number;
        PokefaceTextures?: number;
        PeopleIDs: number;
        NumberOfPeopleIDs: number;
        TrainerClasses: number;
        NumberOfTrainerClasses: number;
        Doors: number;
        NumberOfDoors: number;
        Trainers?: number;
        NumberOfTrainers?: number;
        TrainerAIData?: number;
        NumberOfTrainerAIData?: number;
        TrainerPokemonData?: number;
        NumberOfTrainerPokemonData?: number;
        Battles: number;
        NumberOfBattles: number;
        MusicSamples?: number;
        NumberOfMusicSamples?: number;
        BattleDebugScenarios?: number;
        NumberOfBattleDebugScenarios?: number;
        AIDebugScenarios?: number;
        NumberOfAIDebugScenarios?: number;
        StoryDebugOptions?: number;
        NumberOfStoryDebugOptions?: number;
        KeyboardCharacters?: number;
        NumberOfKeyboardCharacters?: number;
        Keyboard2Characters?: number;
        NumberOfKeyboard2Characters?: number;
        Keyboard3Characters?: number;
        NumberOfKeyboard3Characters?: number;
        BattleStyles?: number;
        NumberOfBattleStyles?: number;
        Rooms: number;
        NumberOfRooms: number;
        RoomData?: number;
        NumberOfRoomData?: number;
        TreasureBoxData: number;
        NumberTreasureBoxes: number;
        CharacterModels: number;
        NumberOfCharacterModels: number;
        ShadowData?: number;
        NumberOfShadowPokemon?: number;
        PokemonMetLocations?: number;
        NumberOfMetLocations?: number;
        InteractionPoints: number;
        NumberOfInteractionPoints: number;
        USStringTable: number;
        StringTableB?: number;
        StringTableC?: number;
        PokemonStats: number;
        NumberOfPokemon: number;
        Natures: number;
        NumberOfNatures: number;
        Moves: number;
        NumberOfMoves: number;
        PokemonData?: number;
        NumberOfPokemonData?: number;
        BattleBingo?: number;
        NumberOfBingoCards?: number;
        NumberOfPokespots?: number;
        PokespotRock?: number;
        PokespotRockEntries?: number;
        PokespotOasis?: number;
        PokespotOasisEntries?: number;
        PokespotCave?: number;
        PokespotCaveEntries?: number;
        PokespotAll?: number;
        PokespotAllEntries?: number;
        BattleCDs?: number;
        NumberBattleCDs?: number;
        NumberOfBattleFields?: number;
        BattleLayouts?: number;
        NumberOfBattleLayouts?: number;
        Flags?: number;
        NumberOfFlags?: number;
        RoomBGM?: number;
        NumberOfRoomBGMs?: number;
        ValidItems?: number;
        TotalNumberOfItems?: number;
        Items?: number;
        SoundsMetaData?: number;
        NumberOfSounds?: number;
        TutorMoves?: number;
        NumberOfTutorMoves?: number;
        Types?: number;
        NumberOfTypes?: number;
    }
}
declare namespace RomReader {
    interface XDTrainer extends Pokemon.Trainer {
        partySummary: string[];
        deckId: number;
    }
    interface XDTrainerPokemon {
        speciesId: number;
        level: number;
        friendship: number;
        heldItemId: number;
        ivs: Pokemon.Stats;
        evs: Pokemon.Stats;
        moveIds: number[];
        pv: number;
    }
    interface XDShadowData extends ShadowData {
        baseMon: XDTrainerPokemon;
    }
    enum XDBattleStyle {
        None = 0,
        Single = 1,
        Double = 2,
        Other = 3
    }
    enum XDBattleType {
        None = 0,
        StoryAdminColo = 1,
        Story = 2,
        ColosseumPrelim = 3,
        Sample = 4,
        ColosseumFinal = 5,
        ColosseumOrrePrelim = 6,
        ColosseumOrreFinal = 7,
        MtBattle = 8,
        MtBattleFinal = 9,
        BattleMode = 10,
        LinkBattle = 11,
        WildBattle = 12,
        BattleBingo = 13,
        BattleCD = 14,
        BattleTraining = 15,
        MirorBPokespot = 16,
        BattleModeMtBattleColo = 17
    }
    interface XDBattle {
        id: number;
        battleType: XDBattleType;
        battleTypeStr: string;
        trainersPerSide: number;
        battleStyle: XDBattleStyle;
        partySize: number;
        bgm: number;
        isStoryBattle: boolean;
        colosseumRound: number;
        participants: {
            deckId: number;
            trainerId: number;
            trainer: XDTrainer;
        }[];
    }
    interface XDEncounterMon extends Pokemon.EncounterMon {
        minLevel: number;
        maxLevel: number;
        stepsPerSnack: number;
    }
    interface XDEncounterSet {
        [key: string]: XDEncounterMon[];
    }
    interface XDEncounters extends Pokemon.Encounters {
        all: XDEncounterSet;
    }
    class XD extends GCNReader {
        protected trainers: XDTrainer[];
        protected battles: XDBattle[];
        shadowData: XDShadowData[];
        constructor(basePath: string);
        GetTrainerByBattle(id: number, slot: number, battleId: number): XDTrainer;
        GetBattle(id: number): XDBattle;
        protected LoadDeckFile(deckName: string): Deck;
        protected ReadDeckTrainers(deck: Deck, deckId: number): XDTrainer[];
        protected ReadTMHMMapping(startDol: Buffer): number[];
        protected MapTM(name: string, tmMap: number[]): string;
        FixAllCaps(str: string): string;
        protected ReadAbilities(startDol: Buffer): string[];
        protected ReadBattles(commonRel: RelTable, deckTrainers: Pokemon.Trainer[][]): XDBattle[];
        protected ReadPokeData(commonRel: RelTable, names?: StringTable): Pokemon.Species[];
        protected ReadRooms(commonRel: RelTable, names?: StringTable): Pokemon.Map[];
        protected ReadShadowDataXD(shadowDeck: Deck, storyDeck: Deck): XDShadowData[];
        protected LookUpTrainerPokemon(pkmDeck: Deck, id: number): XDTrainerPokemon;
        protected ReadEncounters(data: Buffer, entries?: number): XDEncounters;
    }
    class Deck {
        private sections;
        readonly TrainerData: {
            entries: number;
            data: Buffer;
        };
        readonly TrainerPokemonData: {
            entries: number;
            data: Buffer;
        };
        readonly TrainerAIData: {
            entries: number;
            data: Buffer;
        };
        readonly TrainerStringData: {
            entries: number;
            data: Buffer;
        };
        readonly ShadowPokemonData: {
            entries: number;
            data: Buffer;
        };
        constructor(data: Buffer);
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
declare namespace Pokemon.Convert {
    function SpeciesFromRunStatus(s: TPP.PokemonSpecies): Species;
    function EnemyTrainerFromRunStatus(t: TPP.EnemyTrainer): Trainer;
    function EnemyTrainerToRunStatus(t: Trainer): TPP.EnemyTrainer;
    function StatsToRunStatus(stats: Stats): TPP.Stats;
    interface StatSpeciesWithExp extends TPP.PokemonSpecies {
        expFunction?: ExpCurve.CalcExp;
    }
    function SpeciesToRunStatus(species: Species): StatSpeciesWithExp;
    function MoveToRunStatus(move: Move, pp?: number, ppUp?: number, maxPP?: number): TPP.Move;
    function MoveLearnToRunStatus(move: MoveLearn, pp?: number, ppUp?: number, maxPP?: number): TPP.MoveLearn;
    function ItemToRunStatus(item: Item, count?: number): TPP.Item;
    function EvolutionToRunStatus(evo: Evolution): TPP.Evolution;
}
declare namespace RamReader {
    interface OptionsFieldSpec {
        [key: number]: string;
        bitmask?: number;
        offset?: number;
    }
    interface OptionsSpec {
        [key: string]: OptionsFieldSpec;
    }
    function ParseOptions(rawOptions: number, optionsSpec: OptionsSpec): TPP.Options;
    function SetOptions(rawOptions: number, desiredOptions: TPP.Options, optionsSpec: OptionsSpec): number;
}
declare namespace RamReader {
    abstract class RamReaderBase<T extends RomReader.RomReaderBase = RomReader.RomReaderBase> {
        rom: T;
        port: number;
        hostname: string;
        protected config: Config;
        constructor(rom: T, port: number, hostname: string, config: Config);
        private partyInterval;
        private pcInterval;
        private trainerInterval;
        private battleInterval;
        private running;
        private stringDataCache;
        protected currentState: TPP.RunStatus;
        Read(state: TPP.RunStatus, transmitState: (state: TPP.RunStatus) => void): void;
        Stop(): void;
        Init(): void;
        abstract ReadParty: () => Promise<TPP.PartyData>;
        abstract ReadPC: () => Promise<TPP.CombinedPCData>;
        ReadTrainer: () => Promise<TPP.TrainerData>;
        abstract ReadBattle: () => Promise<TPP.BattleStatus>;
        protected StoreCurrentBattleMons(mons: TPP.PartyPokemon[], monPartyIndexes: number[], monInEnemyParty: boolean[]): void;
        private HasBeenSeenThisBattle;
        private GetBattleMon;
        private IsCurrentlyBattling;
        private CurrentParty;
        private CurrentBattleMons;
        private CurrentBattleSeenPokemon;
        protected ConcealEnemyParty(party: (TPP.PartyPokemon & {
            active?: boolean;
        })[]): TPP.EnemyParty;
        protected abstract TrainerChunkReaders: Array<() => Promise<TPP.TrainerData>>;
        CallEmulator<T>(path: string[] | string, callback?: (data: string) => T, force?: boolean): Promise<T>;
        CachedEmulatorCaller<T>(path: string[] | string, callback: (data: string) => T, ignoreCharStart?: number, ignoreCharEnd?: number): () => Promise<T>;
        WrapBytes<T>(callback: (data: Buffer) => T): (hex: string) => T;
        protected Markings: string[];
        protected ParseMarkings(marks: number): string;
        protected Decrypt(data: Buffer, key: number, checksum?: number): Buffer;
        CalcChecksum(data: Buffer): number;
        protected Descramble(data: Buffer, key: number): {
            A: Buffer;
            B: Buffer;
            C: Buffer;
            D: Buffer;
        };
        protected DataScrambleOrders: string[];
        protected ParseStatus(status: number): "SLP" | "PSN" | "BRN" | "FRZ" | "PAR" | "TOX";
        protected ParsePokerus(pokerus: number): {
            infected: boolean;
            days_left: number;
            strain: number;
            cured: boolean;
        };
        protected ParseGender(gender: number): "Male" | "Female";
        protected ParseRibbon(ribbonVal: number, ribbonName: string): string;
        protected RibbonRanks: string[];
        protected ParseHoennRibbons(ribbonVal: any): string[];
        protected abstract OptionsSpec: OptionsSpec;
        ParseOptions: (rawOptions: number) => TPP.Options;
        SetOptions: (rawOptions: number, desiredOptions: TPP.Options) => number;
        ShouldForceOptions: (options: TPP.Options) => boolean;
        GetSetFlags(flagBytes: Buffer, flagCount?: number, offset?: number): number[];
        protected CalculateShiny(pokemon: TPP.Pokemon): boolean;
        protected CalculateLevelFromExp(current: number, expFunction: Pokemon.ExpCurve.CalcExp): number;
        protected CalculateExpVals(current: number, level: number, expFunction: Pokemon.ExpCurve.CalcExp): {
            current: number;
            next_level: number;
            this_level: number;
            remaining: number;
        };
        protected StructEmulatorCaller<T>(domain: string, struct: {
            [key: string]: number;
        }, symbolMapper: (symbol: string) => number, callback: (struct: {
            [key: string]: Buffer;
        }) => T): () => Promise<T>;
        protected SetSelfCallEvent(eventName: string, event: "Read" | "Write" | "Execute", address: number, callEndpoint: string, ifAddress?: number, ifValue?: number, bytes?: number): Promise<{}>;
        protected AissId: (dexNum: number, idByte: number) => number;
    }
}
declare namespace RamReader {
    abstract class DolphinWatchBase<T extends RomReader.GCNReader> extends RamReaderBase<T> {
        private connection;
        protected transmitState: (state?: TPP.RunStatus) => void;
        private saveStateInterval;
        Read(state: TPP.RunStatus, transmitState: (state: TPP.RunStatus) => void): void;
        Stop(): void;
        protected abstract battleBagAddress: number;
        protected abstract battlePartyAddress: number;
        protected abstract enemyTrainerAddress: number;
        protected abstract enemyPartyAddress: number;
        protected abstract baseAddrPtr: number;
        protected abstract musicIdAddress: number;
        protected abstract musicIdBytes: number;
        protected abstract fsysStartAddress: number;
        protected abstract fsysSlots: number;
        protected abstract fsysStructBytes: number;
        protected abstract partyOffset: number;
        protected abstract partySize: number;
        protected abstract partyPokeBytes: number;
        protected abstract trainerDataOffset: number;
        protected abstract trainerDataSize: number;
        protected abstract pokedexOffset: number;
        protected abstract pokedexSize: number;
        protected abstract pcOffset: number;
        protected abstract pcSize: number;
        protected abstract pcBoxes: number;
        protected abstract pcBoxBytes: number;
        protected abstract bagSize: number;
        protected abstract itemPCSize: number;
        protected abstract daycareOffset: number;
        protected abstract battlePartyPokeBytes: number;
        protected abstract enemyTrainerBytes: number;
        private currentPartyAddr;
        private currentTrainerAddr;
        private currentPokedexAddr;
        private currentItemPCAddr;
        private currentPCAddrs;
        private currentDaycareAddr;
        protected BaseAddrSubscriptions(baseSub: (oldAddr: number, offset: number, size: number, handler: (data: Buffer) => void) => number): void;
        protected AdditionalSubscriptions(): void;
        Init(): void;
        ReadByteRange(address: number, length: number, handler: (data: Buffer) => void): void;
        Subscribe(address: number, length: number, handler: (data: Buffer) => void): void;
        Unsubscribe(address: number): void;
        private Handlers;
        private ResponseHandler;
        protected ParsePokemon: (monData: Buffer) => TPP.ShadowPokemon;
        protected AugmentShadowMon(mon: TPP.ShadowPokemon): TPP.ShadowPokemon;
        protected ParseMove: (moveData: Buffer) => TPP.Move;
        SendParty: (data: Buffer, monBytes?: number, inBattle?: boolean) => Promise<void>;
        SendEnemyParty: (data: Buffer) => Promise<void>;
        SendEnemyTrainer: (data: Buffer) => void;
        SendTrainer: (data: Buffer) => Promise<void>;
        SendBag: (data: Buffer) => void;
        SendPokedex: (data: Buffer) => Promise<void>;
        SendItemPC: (data: Buffer) => Promise<void>;
        SendDaycare: (data: Buffer) => Promise<void>;
        SendMap: (data: Buffer) => void;
        FsysWatcher: (data: Buffer) => void;
        SendMusic: (data: Buffer) => void;
        ReadParty: (data?: Buffer, monBytes?: number) => Promise<TPP.PartyData>;
        ReadTrainer: (data?: Buffer) => Promise<TPP.TrainerData>;
        ReadBag: (data: Buffer) => {
            [key: string]: TPP.Item[];
        };
        ReadPocket: (data: Buffer) => (TPP.Item & Pokemon.Item & {
            count: number;
        })[];
        ReadPokedex: (data: Buffer) => Promise<{
            owned: number[];
            seen: number[];
        }>;
        ReadItemPC: (data: Buffer) => Promise<TPP.Item[]>;
        protected currentPC: TPP.BoxData[];
        PCBoxReader(boxNum: number): (data: Buffer) => void;
        ReadPCBox: (data: Buffer, boxNum: number) => TPP.BoxData;
        ReadDaycare: (data: Buffer) => Promise<TPP.PartyPokemon>;
        ReadPC: (data?: Buffer) => Promise<TPP.CombinedPCData>;
        ReadBattle: (data?: Buffer) => Promise<TPP.BattleStatus>;
        protected TrainerChunkReaders: ((data?: Buffer) => Promise<TPP.TrainerData>)[];
        protected OptionsSpec: OptionsSpec;
        IsPartyDefeated: (party: TPP.PartyData) => boolean;
        protected Status: {
            [key: number]: string;
        };
        protected Game: {
            [key: number]: string;
        };
    }
}
declare namespace RamReader {
    interface XDRAMShadowData {
        snagged: boolean;
        purified: boolean;
        shadowExp: number;
        speciesId: number;
        pId: number;
        purification: number;
    }
    class XD extends DolphinWatchBase<RomReader.XD> {
        protected partyOffset: number;
        protected partySize: number;
        protected partyPokeBytes: number;
        protected trainerDataOffset: number;
        protected trainerDataSize: number;
        protected pokedexOffset: number;
        protected pokedexSize: number;
        protected pcOffset: number;
        protected pcSize: number;
        protected pcBoxes: number;
        protected pcBoxBytes: number;
        protected bagSize: number;
        protected itemPCSize: number;
        protected daycareOffset: number;
        protected battlePartyPokeBytes: number;
        protected enemyTrainerBytes: number;
        protected shadowDataOffset: number;
        protected shadowEntryBytes: number;
        protected shadowEntries: number;
        protected purificationChamberOffset: number;
        protected purificationChamberSize: number;
        protected battlePartyAddress: any;
        protected enemyTrainerAddress: any;
        protected enemyPartyAddress: any;
        protected baseAddrPtr: number;
        protected battleAddress: number;
        protected battleTrainersOffset: number;
        protected battleTrainerBytes: number;
        protected battleBagAddress: number;
        protected musicIdAddress: number;
        protected musicIdBytes: number;
        protected mapIdAddress: number;
        protected fsysStartAddress: any;
        protected fsysSlots: number;
        protected fsysStructBytes: number;
        protected purifierAddr: number;
        protected shadowAddr: number;
        protected BaseAddrSubscriptions(baseSub: (oldAddr: number, offset: number, size: number, handler: (data: Buffer) => void) => number): void;
        protected AdditionalSubscriptions(): void;
        protected ParseOrreRibbons(ribbonVal: number, ribbonCounts: number[]): string[];
        protected ParsePokemon: (monData: Buffer) => TPP.ShadowPokemon;
        ReadBag: (data: Buffer) => {
            [key: string]: TPP.Item[];
        };
        ReadTrainer: (data?: Buffer) => Promise<TPP.TrainerData>;
        private currentBattle;
        private currentEnemyTrainers;
        private currentEnemyParty;
        ReadBattle: (data?: Buffer) => Promise<TPP.BattleStatus>;
        BattleTrainerReader(slot: number): (data: Buffer) => void;
        SendBattle: (data: Buffer) => Promise<void>;
        private shadowData;
        ReadShadowData: (data: Buffer) => XDRAMShadowData[];
        protected AugmentShadowMon(mon: TPP.ShadowPokemon): TPP.ShadowPokemon;
        ReadPurifierData: (data: Buffer) => void;
    }
}
declare module TPP.Server {
    function getConfig(): Config;
    function MainProcessRegisterStateHandler(stateFunc: (state: TPP.RunStatus) => void): void;
    function getState(): RunStatus;
    const events: Events.RunEvents;
    let RomData: RomReader.RomReaderBase;
    let RamData: RamReader.RamReaderBase;
    function StartRamReading(): void;
    function StopRamReading(): void;
    function rawState(): RunStatus;
    function setOverrides(parsed: {
        [key: string]: any;
    }): any;
    function setOverrides(dataJSON: string): any;
    function MergeOverrides(currState?: RunStatus): void;
    function setState(dataJson: string): void;
    function NewCatch(dexNum: number): void;
    const fileExists: (path: string) => any;
}
declare module TPP.Server {
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
        is_shadow?: boolean;
    }
    interface GoalTrainer extends Pokemon.Trainer {
        met?: boolean;
        defeated?: boolean;
        attempts: number;
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
        GlitchOut: boolean;
        KnownEncounters: KnownEncounters;
        readonly HasEncounters: boolean;
        BattleKind: string;
        WildBattle: WildPokemon[];
        EnemyTrainers: TPP.EnemyTrainer[];
        EnemyParty: TPP.EnemyParty;
        IsUnknownArea: boolean;
        GoalTrainers: GoalTrainer[];
        constructor(map: Pokemon.Map, encounters: Pokemon.EncounterSet, allMapEncounters: Pokemon.EncounterSet, runState: TPP.RunStatus);
        private categories;
        private PopulateKnownEncounters;
        private PopulateCompletionTotals;
    }
}
declare namespace TPP.Server.DexNav {
}
declare namespace Events {
}
declare namespace Events {
    type BlackoutAction = {
        type: "Blackout";
    };
    const PartyIsFainted: (party: {
        health: number[];
    }[]) => boolean;
}
declare namespace Events {
}
declare namespace Events {
    type CaughtPokemonAction = {
        type: "Caught Pokemon";
        pv: number;
        dexNum: number;
        species: string;
        name: string;
        isShadow?: boolean;
        caughtIn?: string;
    };
    const AllMons: (state: TPP.RunStatus) => TPP.Pokemon[];
}
declare namespace Events {
    type ChallengedTrainerAction = {
        type: "Challenged Trainer";
        id: number;
        classId?: number;
        name: string;
        trainerString?: string;
    };
    type DefeatedTrainerAction = {
        type: "Defeated Trainer";
        id: number;
        classId?: number;
        name: string;
        trainerString?: string;
    };
}
declare namespace Events {
}
declare namespace Events {
}
declare namespace RomReader {
    class Col extends GCNReader {
        protected ReadAbilities(startDol: Buffer, abilityNames?: string[]): string[];
        protected unlabeledMaps: {
            [key: number]: string;
        };
        constructor(basePath: string);
        protected ReadPokeData(commonRel: RelTable, names?: StringTable): Pokemon.Species[];
        protected ReadRooms(commonRel: RelTable, names?: StringTable): Pokemon.Map[];
    }
}
declare namespace RamReader {
    class Col extends DolphinWatchBase<RomReader.Col> {
        protected partyOffset: number;
        protected partySize: number;
        protected partyPokeBytes: number;
        protected trainerDataOffset: number;
        protected trainerDataSize: number;
        protected pokedexOffset: number;
        protected pokedexSize: number;
        protected pcOffset: number;
        protected pcSize: number;
        protected pcBoxes: number;
        protected pcBoxBytes: number;
        protected bagSize: number;
        protected itemPCSize: number;
        protected daycareOffset: any;
        protected battlePartyPokeBytes: number;
        protected enemyTrainerBytes: number;
        protected battleBagAddress: number;
        protected battlePartyAddress: number;
        protected enemyTrainerAddress: number;
        protected enemyPartyAddress: number;
        protected baseAddrPtr: number;
        protected musicIdAddress: number;
        protected musicIdBytes: number;
        protected fsysStartAddress: number;
        protected fsysSlots: number;
        protected fsysStructBytes: number;
        protected evoFsysId: number;
    }
}
declare namespace RamReader {
    interface Gen1BoxedMon extends TPP.Pokemon {
        health: number[];
        status: string;
        sleep_turns?: number;
    }
    class Gen1 extends RamReaderBase<RomReader.Gen1> {
        protected SymAddr: (symbol: string) => string;
        protected PCBoxSize: () => number;
        protected PartySize: () => number;
        protected PartyMonSize: () => number;
        protected BattleMonSize: () => number;
        ReadParty: () => Promise<TPP.PartyData>;
        ReadPC: () => Promise<TPP.CombinedPCData>;
        ReadBattle: () => Promise<TPP.BattleStatus>;
        protected TrainerChunkReaders: (() => Promise<TPP.TrainerData>)[];
        protected OptionsSpec: {
            text_speed: {
                1: string;
                3: string;
                5: string;
            };
            battle_style: {
                0: string;
                0x40: string;
            };
            battle_scene: {
                0: string;
                0x80: string;
            };
        };
        protected BaseOffsetCalc: (baseSymbol: string, extraOffset?: number) => (symbol: string) => number;
        protected ParseBattleBundle(data: Buffer): TPP.BattleStatus;
        protected ParsePC(data: Buffer): TPP.CombinedPCData;
        protected ParsePCBox(data: Buffer): Gen1BoxedMon[];
        protected ParseParty(data: Buffer): TPP.PartyData;
        protected AddOTNames(mons: Gen1BoxedMon[], data: Buffer, monCount: number): void;
        protected AddNicknames(mons: Gen1BoxedMon[], data: Buffer, monCount: number): void;
        protected FixCapsNonNickname(nick: string, speciesName: string): string;
        protected ParsePartyMon(data: Buffer, species?: number): TPP.PartyPokemon;
        protected ParsePokemon(data: Buffer, species?: number): Gen1BoxedMon;
        protected ParseBattlePokemon(data: Buffer): TPP.PartyPokemon & {
            active: boolean;
        };
        protected UnpackDVs(dvs: number): TPP.Stats;
        Init(): void;
    }
}
declare namespace RamReader {
    class Gen3 extends RamReaderBase<RomReader.Gen3> {
        protected Markings: string[];
        ReadParty: () => Promise<TPP.PartyPokemon[]>;
        ReadPC: () => Promise<TPP.CombinedPCData>;
        ReadBattle: () => Promise<TPP.BattleStatus>;
        protected TrainerChunkReaders: (() => Promise<TPP.TrainerData>)[];
        protected TotalItemSlots(): number;
        protected ParseItemCollection(itemData: Buffer, length?: number, key?: number): TPP.Item[];
        protected ParseParty(partyData: Buffer): TPP.PartyPokemon[];
        protected ParseBattleMons(battleData: Buffer, numBattlers: number): TPP.PartyPokemon[];
        protected ParsePokemon(pkmdata: Buffer, boxSlot?: number): TPP.PartyPokemon & TPP.BoxedPokemon;
        protected ParseBattlePokemon(pkmdata: Buffer): TPP.PartyPokemon;
        protected ParseVolatileStatus(status: number): string[];
        protected CalculateGender(genderRatio: number, personalityValue: number): "Male" | "Female";
        private GameStatsMapping;
        protected ParseGameStats(statArr: number[]): {
            [key: string]: number;
        };
        protected Decrypt(data: Buffer, key: number, checksum?: number): Buffer;
        protected OptionsSpec: {
            sound: {
                0: string;
                0x10000: string;
            };
            battle_style: {
                0: string;
                0x20000: string;
            };
            battle_scene: {
                0: string;
                0x40000: string;
            };
            map_zoom: {
                0: string;
                0x80000: string;
            };
            text_speed: {
                0: string;
                0x100: string;
                0x200: string;
            };
            frame: {
                bitmask: number;
                offset: number;
            };
            button_mode: {
                0: string;
                1: string;
                2: string;
            };
        };
    }
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
declare const gen3Charmap: string[];
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
declare namespace RomReader {
    abstract class GBReader extends RomReaderBase {
        private romFileLocation;
        private charmap;
        protected stringTerminator: number;
        symTable: {
            [key: string]: number;
        };
        constructor(romFileLocation: string, charmap: string[]);
        ConvertText(text: string | Buffer | number[]): string;
        GetForm(pokemon: TPP.Pokemon): number;
        protected loadROM(): Buffer;
        CalculateGender(pokemon: TPP.Pokemon): void;
        CalculateShiny(pokemon: TPP.Pokemon): void;
        protected ReadBundledData(romData: Buffer, startOffset: number, terminator: number, numBundles: number, endOffset?: number): Buffer[];
        protected ReadStringBundle(romData: Buffer, startOffset: number, numStrings: number, endOffset?: number): string[];
        LinearAddressToBanked(linear: number, bankSize?: number, hasHomeBank?: boolean): {
            bank: number;
            address: number;
        };
        BankAddressToLinear(bank: number, address: number, bankSize?: number): number;
        SameBankPtrToLinear(baseAddr: number, ptr: number): number;
        FixAllCaps(str: string): string;
        CalculateHiddenPowerType(stats: TPP.Stats): string;
        CalculateHiddenPowerPower(stats: TPP.Stats): number;
        BankSizes: {
            ROM: number;
            VRAM: number;
            SRAM: number;
            CartRAM: number;
            WRAM: number;
        };
        private symbolEntry;
        protected LoadSymbolFile(filename: string): {
            [key: string]: number;
        };
        GetOamAddress: (symbol: string) => number;
        GetHramAddress: (symbol: string) => number;
        IsFlagSet(romData: Buffer, flagStartOffset: number, flagIndex: number): boolean;
        ParseBCD(bcd: Buffer): number;
        FindTerminator(data: Buffer): number;
    }
}
declare namespace Tools.LZ77 {
    function Decompress(compressed: Buffer, offset?: number): Buffer;
}
declare namespace RomReader {
    abstract class GBAReader extends GBReader {
        private iniFileLocation;
        protected stringTerminator: number;
        protected romHeader: string;
        constructor(romFileLocation: string, iniFileLocation: string);
        protected LoadConfig(romData: Buffer): PGEINI;
        protected ReadRomPtr(romData: Buffer, addr?: number): number;
        protected ReadPtrBlock(romData: Buffer, startAddr: number, endAddr?: number): number[];
        protected FindPtrFromPreceedingData(romData: Buffer, hexStr: string): number;
        protected DecompressPointerCollection(romData: Buffer, startAddr: number, numPtrs: number, strideBytes?: number): Buffer[];
        CalculateHiddenPowerType(stats: TPP.Stats): string;
        CalculateHiddenPowerPower(stats: TPP.Stats): number;
        CalculateGender(pokemon: TPP.Pokemon): void;
        CalculateShiny(pokemon: TPP.Pokemon): void;
    }
}
declare namespace Tools {
    class NARChive {
        filenames: string[];
        files: Buffer[];
        hasFilenames: boolean;
        constructor(data?: Buffer);
        getBytes(): Buffer;
        private readNitroFrames;
    }
}
declare namespace BLZCoder {
    function Decode(data: Buffer): Buffer;
}
declare namespace RomReader {
    abstract class NDSReader extends RomReaderBase {
        private basePath;
        protected dataPath: string;
        protected romHeader: string;
        constructor(basePath: string);
        protected readNARC(path: string): Tools.NARChive;
        protected readArm9(): Buffer;
        protected readFile(path: string): Buffer;
        protected LoadConfig(iniFileLocation: string): UPRINI;
        GetPokemonSprite(id: number, form?: number, gender?: string, shiny?: boolean, generic?: boolean): string;
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
        GetItemSprite(id: number): string;
        CheckIfCanSurf(runState: TPP.RunStatus): boolean;
        private FindFishingEncounters;
        private ParseEncounters;
        private ReadEncounterTablesAt;
        private ReadMaps;
        private ReadAreaNames;
        private AddTMHMs;
        private ReadMoveData;
        private FindBallIds;
        private FindFishingRods;
        private ReadItemData;
        BankSizes: {
            ROM: number;
            VRAM: number;
            SRAM: number;
            CartRAM: number;
            WRAM: number;
        };
        private PokedexToIndex;
        private IndexToPokedex;
        private ReadPokeData;
        private ReadMoveLearns;
        private ProcessPalette;
    }
}
declare namespace RomReader {
    class Gen2 extends GBReader {
        private timeOfDay;
        private tmMapping;
        private johtoGrassSummary;
        private johtoSurfSummary;
        private kantoGrassSummary;
        private kantoSurfSummary;
        private treeSummary;
        private fishingSummary;
        private trainerSummary;
        constructor(romFileLocation: string);
        GetCurrentMapEncounters(map: Pokemon.Map, state: TPP.TrainerData): Pokemon.EncounterSet;
        CheckIfCanSurf(runState: TPP.RunStatus): boolean;
        private ReadPyriteLevelCaps;
        private FindFishingEncounters;
        private FindTreeEncounters;
        private FindMapEncounters;
        private ReadMaps;
        private ReadAreaNames;
        private GetTMHMNames;
        private ReadMoveData;
        private ReadItemData;
        private ReadTrainerData;
        private ReadPokeData;
        private ReadMoveLearns;
        private ReadFrameBorders;
        private TranslatePicBank;
        private ProcessPalette;
        private ReadTrainerSprites;
        private ReadPokemonSprites;
        private CalculateTimesOfDay;
    }
}
declare namespace RomReader {
    class Gen3 extends GBAReader {
        config: PGEINI;
        constructor(romFileLocation: string, iniFileLocation?: string);
        CheckIfCanSurf(runState: TPP.RunStatus): boolean;
        GetCurrentMapEncounters(map: Pokemon.Map, state: TPP.TrainerData): Pokemon.EncounterSet;
        private CurrentMapIn;
        IsUnknownTrainerMap(id: number, bank: number): boolean;
        private isFRLG;
        private ReadAbilities;
        private ReadPokeData;
        private ReadTrainerData;
        private ReadItemData;
        private ReadMoveData;
        private GetTMHMNames;
        private ReadMapLabels;
        private ReadMaps;
        private FindMapEncounters;
        private ReadEncounterSet;
        private ReadMoveLearns;
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
        private DecyptPtrs;
        private CreatePtrList;
        private DecyptTxt;
        private MakeString;
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
        CheckIfCanSurf(runState: TPP.RunStatus): boolean;
        constructor(basePath: string, iniFile?: string);
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
        private cutAndTranspose;
        private decompress;
        private repeat;
        private get_offset;
        private resizeOutput;
        peek(): number;
        next(): number;
    }
}
