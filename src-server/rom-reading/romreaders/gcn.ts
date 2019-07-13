/// <reference path="base.ts" />
/// <reference path="../../../node_modules/@types/node/index.d.ts" />

namespace RomReader {
    const fs = require("fs") as typeof import('fs');
    const fixCaps = /(\b[a-z])/g;
    const fixWronglyCapped = /(['’][A-Z]|okéMon)/g;
    const fixWronglyLowercased = /(^[T|H]m|\bTv\b)/g;

    export type ShadowData = {
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
    }

    export type StringTable = { [key: number]: string };

    export abstract class GCNReader extends RomReaderBase {

        public shadowData: ShadowData[];

        protected strings: StringTable = {};
        protected trainerClasses: Pokemon.Trainer[];

        protected typeNames = ["Normal", "Fighting", "Flying", "Poison", "Ground", "Rock", "Bug", "Ghost", "Steel", "Fairy", "Fire", "Water", "Grass", "Electric", "Psychic", "Ice", "Dragon", "Dark"];
        protected eggGroups = ["???", "Monster", "Water 1", "Bug", "Flying", "Field", "Fairy", "Grass", "Human-Like", "Water 3", "Mineral", "Amorphous", "Water 2", "Ditto", "Dragon", "Undiscovered"];
        protected expCurves = [Pokemon.ExpCurve.MediumFast, Pokemon.ExpCurve.Erratic, Pokemon.ExpCurve.Fluctuating, Pokemon.ExpCurve.MediumSlow, Pokemon.ExpCurve.Fast, Pokemon.ExpCurve.Slow];
        protected expCurveNames = ["Medium Fast", "Erratic", "Fluctuating", "Medium Slow", "Fast", "Slow"];
        protected contestTypes = ['Cool', 'Beauty', 'Cute', 'Smart', 'Tough'];
        protected contestEffects = ['The appeal effect of this move is constant.', 'Prevents the user from being startled.', 'Startles the previous appealer.', 'Startles all previous appealers.', 'Affects appealers other than startling them.', 'Appeal effect may change.', 'The appeal order changes for the next round.'];


        constructor(protected basePath: string, protected commonIndex: CommonRelIndex, protected isXd = false) {
            super();
            if (!this.basePath.endsWith('/') && !this.basePath.endsWith('\\')) {
                this.basePath += '/';
            }

            const startDol = this.StartDol;
            if (!this.isXd)
                this.ReadStringTable(startDol, 0x2CC810).forEach(s => this.strings[s.id] = s.string);
            const commonRel = this.CommonRel;
            const mainStringList = this.ReadStringTable(commonRel.GetRecordEntry(commonIndex.USStringTable).slice(this.isXd ? 0x68 : 0)); //col 0x59890
            mainStringList.forEach(s => this.strings[s.id] = s.string);
            if (!this.isXd) {
                this.ReadStringTable(commonRel.GetRecordEntry(commonIndex.StringTableB)).forEach(s => this.strings[s.id] = s.string); //col 0x66000
                this.ReadStringTable(commonRel.GetRecordEntry(commonIndex.StringTableC)).forEach(s => this.strings[s.id] = s.string); //col 0x784E0
            }

            this.abilities = this.ReadAbilities(startDol, ["-", ...mainStringList.filter(s => s.id > 3100 && s.id < 3200).map(s => s.string)]);

            this.moveLearns = {};
            this.ballIds = [];


            if (this.commonIndex.Moves)
                this.moves = this.ReadMoveData(commonRel);
            this.items = this.ReadItemData(startDol, commonRel);
            if (this.commonIndex.PokemonStats)
                this.pokemon = this.ReadPokeData(commonRel);
            if (this.commonIndex.TrainerClasses)
                this.trainerClasses = this.ReadTrainerClasses(commonRel);
            if (this.commonIndex.Trainers)
                this.trainers = this.ReadTrainerData(commonRel);
            if (this.commonIndex.ShadowData)
                this.shadowData = this.ReadShadowData(commonRel);
            if (this.commonIndex.Rooms)
                this.maps = this.ReadRooms(commonRel);
        }

        protected get StartDol() {
            return fs.readFileSync(this.basePath + "start.dol");
        }

        protected get CommonRel() {
            return new RelTable(fs.readFileSync(this.basePath + "common.rel"), true);
        }

        public FixAllCaps(str: string) {
            return str.toLowerCase().replace(fixCaps, c => c.toUpperCase()).replace(fixWronglyCapped, c => c.toLowerCase()).replace(fixWronglyLowercased, c => c.toUpperCase());
        }

        public ReadStringTable(table: Buffer, address = 0) {
            if (address > 0)
                table = table.slice(address);
            const totalEntries = table.readInt16BE(0x4);
            return this.ReadStridedData(table, 0x10, 0x8, totalEntries)
                .map(data => ({ id: data.readInt32BE(0), addr: data.readInt32BE(0x4) }))
                .map(addr => ({ id: addr.id, addr: addr.addr.toString(16), string: this.FixAllCaps(this.ReadString(table, addr.addr)) }));
        }

        public ReadStringOld(data: Buffer, address = 0, length = 0) {
            length = length || (data.indexOf("\u0000", address + 2, "utf16le") - address);
            const strBuf = data.slice(address, address + length);
            if (length) {
                try {
                    return strBuf.swap16().toString("utf16le");
                }
                catch { }
            }
            return "";
        }

        public ReadStringSloppy(data: Buffer, address = 0, length = 0) {
            length = length || (data.indexOf("\u0000", address + 2, "utf16le") - address);
            if (length)
                return String.fromCodePoint(...this.ReadStridedData(data, address, 2, length / 2)
                    .map(chr => chr.readUInt16BE(0) % 0xFFFF)
                    .filter((c, i, arr) => c > 0 || i < arr.indexOf(0, 1))
                    .filter(c => !!c));
            return "";
        }

        public ReadString(data: Buffer, address = 0) {
            const chars = new Array<number>();
            for (let i = address; i < data.length; i += 2) {
                let char = data.readUInt16BE(i);
                if (char == 0)
                    return String.fromCharCode(...chars);
                if (char == 0xFFFF) {
                    char = data[i + 2];
                    i += (codeBytes[char] || 1);
                    let codeResult = controlCodeMap[char];
                    if (codeResult)
                        chars.push(...codeResult.split('').map(c => c.charCodeAt(0)));
                }
                else
                    chars.push(char);
            }
            return String.fromCharCode(...chars);
        }

        GetPokemonSprite(id: number, form = 0, gender = "", shiny = false, generic = false) {
            return `./img/sprites/${TPP.Server.getConfig().spriteFolder}/${shiny ? "shiny/" : ""}${id}${form ? `-${form}` : ""}.png`;
        }

        public CheckIfCanSurf(runState: TPP.RunStatus) {
            return false; //no water in Orre
        }

        public GetMap(id: number) {
            const map = super.GetMap(id);
            if (!map || !map.id)
                return this.DefaultMap;
            return map;
        }

        public get DefaultMap() {
            return <Pokemon.Map>{
                id: 0,
                name: "Orre Region"
            };
        }

        protected unlabeledMaps: { [key: number]: string } = {}

        protected abstract ReadPokeData(commonRel: RelTable, names?: StringTable): Pokemon.Species[];

        protected abstract ReadAbilities(startDol: Buffer, abilityNames?: string[]): string[];

        protected ReadItemData(startDol: Buffer, commonRel: RelTable, names: StringTable = this.strings) {
            const tmMap = this.ReadTMHMMapping(startDol);
            return (
                this.commonIndex.Items
                    ? this.ReadStridedData(commonRel.GetRecordEntry(this.commonIndex.Items), 0, 0x28, commonRel.GetValueEntry(this.commonIndex.NumberOfItems))
                    : this.ReadStridedData(startDol, 0x360CE8, 0x28, 397)
            ).map((data, i) => (<Pokemon.Item>{
                id: i,
                name: this.MapTM(names[data.readUInt32BE(0x10)], tmMap),
                isKeyItem: data[1] > 0
            }));
        }

        protected ReadTMHMMapping(startDol: Buffer) {
            return [0, ...this.ReadStridedData(startDol, 0x365018, 0x8, 58).map(data => data.readUInt32BE(4))];
        }

        protected tmExp = /^TM([0-9]+)$/i;
        protected MapTM(name: string, tmMap: number[]) {
            const matches = this.tmExp.exec(name);
            if (matches) {
                const tmNum = parseInt(matches[1]);
                return `TM${tmNum < 10 ? "0" : ""}${tmNum} ${this.GetMove(tmMap[tmNum]).name}`;
            }
            return name;
        }

        protected ReadMoveData(commonRel: RelTable, names: StringTable = this.strings) {
            return this.ReadStridedData(commonRel.GetRecordEntry(this.commonIndex.Moves), 0, 0x38, commonRel.GetValueEntry(this.commonIndex.NumberOfMoves)).map((data, i) => (<Pokemon.Move>{ //0x11E048
                id: i,
                basePP: data[1],
                type: this.typeNames[data[2]],
                accuracy: data[4],
                basePower: data[this.isXd ? 0x19 : 0x17],
                name: names[data.readUInt32BE(0x20)]
            }));
        }

        protected ReadShadowData(commonRel: RelTable) {
            return this.ReadStridedData(commonRel.GetRecordEntry(this.commonIndex.ShadowData), 0, 0x38, commonRel.GetValueEntry(this.commonIndex.NumberOfShadowPokemon)).map((data, i) => (<ShadowData>{ //0x145224
                id: i,
                catchRate: data[0],
                species: data.readUInt16BE(2),
                purificationStart: data[9] * 100
            }));
        }

        protected ReadTrainerData(commonRel: RelTable, names: StringTable = this.strings, classes: Pokemon.Trainer[] = this.trainerClasses) {
            return this.ReadStridedData(commonRel.GetRecordEntry(this.commonIndex.Trainers), 0, 0x34, commonRel.GetValueEntry(this.commonIndex.NumberOfTrainers)).map((data, i) => (<Pokemon.Trainer>{ //0x92ED0
                id: i,
                gender: data[0x0] ? "Female" : "Male",
                classId: data[0x3],
                name: names[data.readUInt32BE(0x8)] || data.readUInt32BE(0x8),
                className: (classes[data[0x3]] || { className: null }).className,
                spriteId: data[0x13],
                //data: data.toString('hex')
            } as Pokemon.Trainer)).filter(t => !!t);
        }

        protected ReadTrainerClasses(commonRel: RelTable, names: StringTable = this.strings) {
            return this.ReadStridedData(commonRel.GetRecordEntry(this.commonIndex.TrainerClasses), 0, 0xC, commonRel.GetValueEntry(this.commonIndex.NumberOfTrainerClasses)).map((data, i) => (<Pokemon.Trainer>{ //0x90F70
                classId: i,
                className: names[data.readUInt32BE(0x4)] || data.readUInt32BE(0x4),
            }));
        }

        protected abstract ReadRooms(commonRel: RelTable, names?: StringTable): Pokemon.Map[];

    }

    const codeBytes: { [key: number]: number } = {
        0x07: 2,
        0x08: 5,
        0x09: 2,
        0x38: 2,
        0x52: 2,
        0x53: 2,
        0x5B: 2,
        0x5C: 2
    }
    const controlCodeMap: { [key: number]: string } = {
        0x00: "\n",
        0x02: " ",
        0x03: " ",
        0x0F: "[POKEMON]",
        0x10: "[POKEMON]",
        0x11: "[POKEMON]",
        0x12: "[POKEMON]",
        0x13: "[PLAYER]",
        0x14: "[POKEMON]",
        0x15: "[POKEMON]",
        0x16: "[POKEMON]",
        0x17: "[POKEMON]",
        0x18: "[POKEMON]",
        0x19: "[POKEMON]",
        0x1A: "[ABILITY]",
        0x1B: "[ABILITY]",
        0x1C: "[ABILITY]",
        0x1D: "[ABILITY]",
        0x1E: "[POKEMON]",
        0x20: "[POKEMON]",
        0x21: "[POKEMON]",
        0x22: "[CLASS]",
        0x23: "[TRAINER]",
        0x28: "[MOVE]",
        0x29: "[ITEM]",
        0x2B: "[PLAYER_F]",
        0x2C: "[RUI]",
    }

    export class RelTable {
        private static readonly DataStartOffsetPtr = 0x64;
        private static readonly CommonRelDataStartOffsetPtr = 0x6C;
        private static readonly PointerStartOffsetPtr = 0x24;
        private static readonly PointerHeaderPointerOffsetPtr = 0x28;
        private static readonly PointerStructSize = 0x8;

        private pointers: number[];

        constructor(public data: Buffer, isCommonRel = false) {
            this.pointers = [];
            if (data) {
                const dataStartOffset = data.readUInt32BE(isCommonRel ? RelTable.CommonRelDataStartOffsetPtr : RelTable.DataStartOffsetPtr);
                const pointerStartOffset = data.readUInt32BE(RelTable.PointerStartOffsetPtr) + 0x8;
                const pointerHeaderOffset = data.readUInt32BE(RelTable.PointerHeaderPointerOffsetPtr);
                const pointerEndOffset = data.readUInt32BE(pointerHeaderOffset + 0xC);

                for (let i = pointerStartOffset; i < pointerEndOffset; i += RelTable.PointerStructSize) {
                    this.pointers.push(data.readUInt32BE(i + 0x4) + dataStartOffset);
                }
            }
        }

        public GetValueEntry(index: number) {
            return index >= 0 && index < this.pointers.length ? this.data.readUInt32BE(this.pointers[index]) : undefined;
        }
        public GetRecordEntry(index: number) {
            return index >= 0 && index < this.pointers.length ? this.data.slice(this.pointers[index]) : undefined;
        }
    }

    export interface CommonRelIndex {
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
        NumberOfPokespots?: number
        PokespotRock?: number
        PokespotRockEntries?: number
        PokespotOasis?: number
        PokespotOasisEntries?: number
        PokespotCave?: number
        PokespotCaveEntries?: number
        PokespotAll?: number
        PokespotAllEntries?: number
        BattleCDs?: number
        NumberBattleCDs?: number
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