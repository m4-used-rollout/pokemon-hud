/// <reference path="../gcn.ts" />

namespace RomReader {
    const fs = require("fs") as typeof import('fs');
    const tmExp = /^(T|S)M([0-9]+)$/i;

    export interface XDTrainer extends Pokemon.Trainer {
        partySummary: string[];
        deckId: number;
    }

    export interface XDTrainerPokemon {
        speciesId: number;
        level: number;
        friendship: number;
        heldItemId: number;
        ivs: Pokemon.Stats,
        evs: Pokemon.Stats,
        moveIds: number[],
        pv: number;
    }

    export interface XDShadowData extends ShadowData {
        baseMon: XDTrainerPokemon
    }

    export enum XDBattleStyle {
        None = 0,
        Single,
        Double,
        Other
    }

    export enum XDBattleType {
        None = 0,
        StoryAdminColo,
        Story,
        ColosseumPrelim,
        Sample,
        ColosseumFinal,
        ColosseumOrrePrelim,
        ColosseumOrreFinal,
        MtBattle,
        MtBattleFinal,
        BattleMode,
        LinkBattle,
        WildBattle,
        BattleBingo,
        BattleCD,
        BattleTraining,
        MirorBPokespot,
        BattleModeMtBattleColo
    }

    export interface XDBattle {
        id: number;
        battleType: XDBattleType;
        battleTypeStr: string;
        trainersPerSide: number;
        battleStyle: XDBattleStyle;
        partySize: number;
        bgm: number;
        isStoryBattle: boolean;
        colosseumRound: number;
        participants: { deckId: number, trainerId: number, trainer: XDTrainer }[];
    }

    export interface XDEncounterMon extends Pokemon.EncounterMon {
        minLevel: number;
        maxLevel: number;
        stepsPerSnack: number;
    }
    export interface XDEncounterSet {
        [key: string]: XDEncounterMon[];
    }
    export interface XDEncounters extends Pokemon.Encounters {
        all: XDEncounterSet;
    }

    const unlabeledMaps: { [key: number]: string } = {
        0x38E: "Orre Region"
    };


    export class XD extends GCNReader {

        protected trainers: XDTrainer[] = [];
        protected battles: XDBattle[] = [];
        public shadowData: XDShadowData[];
        //protected encounters: { rock: XDEncounters, oasis: XDEncounters, cave: XDEncounters, all: XDEncounters };

        constructor(basePath: string, ) {
            super(basePath, XDCommonRelIndexes, true);

            const startDol = this.StartDol;
            const commonRel = this.CommonRel;

            const decks = ["DarkPokemon", "Story", "Hundred", "Imasugu", "Virtual", "Bingo", "Colosseum", "Sample"]
                .map(d => this.LoadDeckFile(d));

            this.shadowData = this.ReadShadowDataXD(decks[0], decks[1]);

            const deckTrainers = decks.map((d, i) => this.ReadDeckTrainers(d, i));

            deckTrainers.forEach(dt => dt.forEach(t => this.trainers.push(t)));

            this.battles = this.ReadBattles(commonRel, deckTrainers);

            const encounters = {
                rock: this.ReadEncounters(commonRel.GetRecordEntry(this.commonIndex.PokespotRock), commonRel.GetValueEntry(this.commonIndex.PokespotRockEntries)),
                cave: this.ReadEncounters(commonRel.GetRecordEntry(this.commonIndex.PokespotCave), commonRel.GetValueEntry(this.commonIndex.PokespotCaveEntries)),
                oasis: this.ReadEncounters(commonRel.GetRecordEntry(this.commonIndex.PokespotOasis), commonRel.GetValueEntry(this.commonIndex.PokespotOasisEntries)),
                all: this.ReadEncounters(commonRel.GetRecordEntry(this.commonIndex.PokespotAll), commonRel.GetValueEntry(this.commonIndex.PokespotAllEntries))
            }

            //Load pokespots
            this.GetMap(90).encounters = encounters.rock;
            this.GetMap(91).encounters = encounters.oasis;
            this.GetMap(92).encounters = encounters.cave;
            // "All" encounters are Bonsly, Munchlax and legends. Not usually obtainable, so left out.

        }


        public GetTrainerByBattle(id: number, slot: number, battleId: number): XDTrainer {
            const { participants } = ((this.battles.find(b => b.id == battleId) || { participants: [] as XDBattle['participants'] }));
            return (participants.find(p => p.trainerId == id) || { trainer: this.trainers.find(t => t.id == id && t.deckId == participants[slot].deckId) }).trainer;
        }

        public GetBattle(id: number) {
            return this.battles.find(b => b.id == id);
        }

        protected LoadDeckFile(deckName: string) {
            const fileName = `${this.basePath}Decks/DeckData_${deckName}.bin`;
            if (fs.existsSync(fileName))
                return new Deck(fs.readFileSync(fileName));
            console.error(`Missing deck file: ${fileName}`);
            return new Deck(Buffer.from([]));
        }

        protected ReadDeckTrainers(deck: Deck, deckId: number) {
            if (!deck.TrainerData || !deck.TrainerData.entries)
                return [];
            return this.ReadArray(deck.TrainerData.data, 0, 0x38, deck.TrainerData.entries).map((data, i) => {
                const shadowMask = data[4];
                const partySummary = this.ReadArray(data, 0x1C, 2, 6).map((pkId, i) => {
                    const isShadowMon = ((shadowMask >> i) % 2) > 0;
                    const id = pkId.readInt16BE(0);
                    if (!id)
                        return null;
                    if (isShadowMon)
                        return Object.assign({ isShadow: true }, this.shadowData[id].baseMon);
                    return Object.assign({ isShadow: false }, this.LookUpTrainerPokemon(deck, id));
                }).filter(p => !!p).map(p => `Lv ${p.level} ${p.isShadow ? "Shadow " : ""}${this.GetSpecies(p.speciesId).name}`);
                return {
                    id: i,
                    deckId,
                    trainerString: deck.TrainerStringData.data.toString('ascii', data.readUInt16BE(0), deck.TrainerStringData.data.indexOf(0, data.readUInt16BE(0))),
                    name: this.strings[data.readUInt16BE(0x6)],
                    classId: data.readUInt8(0x5),
                    className: (this.trainerClasses.find(c => c.classId == data.readUInt8(0x5)) || { className: data.readUInt8(0x5).toString() }).className,
                    spriteId: data[0x11],
                    partySummary
                } as XDTrainer;
            });
        }

        protected ReadTMHMMapping(startDol: Buffer) {
            return [0, ...this.ReadArray(startDol, 0x4023A0, 0x8, 58).map(data => data.readUInt16BE(6))];
        }

        protected MapTM(name: string, tmMap: number[]) {
            const matches = tmExp.exec(name);
            if (matches) {
                const isSM = matches[1] == "S";
                const tmNum = parseInt(matches[2]);
                return `${matches[1]}M${tmNum < 10 ? "0" : ""}${tmNum} ${(this.GetMove(tmMap[tmNum + (54 * (isSM ? 1 : 0))]) || { name: tmNum }).name}`;
            }
            return name;
        }

        public FixAllCaps(str: string) {
            return str;
        }

        protected ReadAbilities(startDol: Buffer) {
            const abilitiesOffset = 0x3FCC50;
            const abilitiesAreHacked = startDol.readUInt32BE(abilitiesOffset + 8) != 0;
            const numAbilities = abilitiesAreHacked ? (0x3A8 / 8) : 0x4E
            const nameIdOffset = abilitiesAreHacked ? 0 : 4
            const descriptionIdOffsetconst = abilitiesAreHacked ? 4 : 8
            const abilityBytes = abilitiesAreHacked ? 8 : 12
            return this.ReadArray(startDol, abilitiesOffset, abilityBytes, numAbilities).map(data => this.strings[data.readUInt32BE(nameIdOffset)]);
        }

        protected ReadBattles(commonRel: RelTable, deckTrainers: Pokemon.Trainer[][]) {
            return this.ReadArray(commonRel.GetRecordEntry(this.commonIndex.Battles), 0, 0x3C, commonRel.GetValueEntry(this.commonIndex.NumberOfBattles)).map((data, i) => (<XDBattle>{
                id: i,
                battleType: data[0],
                battleTypeStr: XDBattleType[data[0]],
                trainersPerSide: data[1],
                battleStyle: data[2],
                partySize: data[3],
                isStoryBattle: data[4] == 1,
                bgm: data.readUInt16BE(0x12),
                colosseumRound: data[0x1b],
                participants: this.ReadArray(data, 0x1C, 8, 4).map(p => ({
                    deckId: p.readUInt16BE(0),
                    trainerId: p.readUInt16BE(2),
                    trainer: deckTrainers[p.readUInt16BE(0)][p.readUInt16BE(2)]
                }))
            }));
        }

        protected ReadPokeData(commonRel: RelTable, names: StringTable = this.strings) {
            return this.ReadArray(commonRel.GetRecordEntry(this.commonIndex.PokemonStats), 0, 0x124, commonRel.GetValueEntry(this.commonIndex.NumberOfPokemon)).map((data, i) => { //0x12336C
                this.moveLearns[i] = this.ReadArray(data, 0xC4, 4, 20, true, 0)
                    .map(mData => Object.assign({
                        level: mData[0]
                    }, this.GetMove(mData.readUInt16BE(2))) as Pokemon.MoveLearn);
                return <Pokemon.Species>{
                    id: i,
                    growthRate: this.expCurveNames[data[0]],
                    expFunction: this.expCurves[data[0]],
                    catchRate: data[1],
                    genderRatio: data[2],
                    baseExp: data[5],
                    dexNumber: data.readUInt16BE(0x0E),
                    // eggCycles: data[0x17],
                    name: names[data.readInt32BE(0x18)],
                    type1: this.typeNames[data[0x30]],
                    type2: this.typeNames[data[0x31]],
                    abilities: [this.abilities[data[0x32]] || data[0x32], this.abilities[data[0x33]] || data[0x33]].filter(a => !!a && a != '-'),
                    tmCompat: this.ReadArray(data, 0x34, 1, 58)
                        .map((c, i) => c[0] ? i + 1 : 0)
                        .filter(i => !!i)
                        .map(tm => `${tm <= 54 ? "T" : "S"}M${tm > 54 || tm < 10 ? "0" : ""}${tm > 54 ? tm - 54 : tm}`),
                    // eggGroup1: this.eggGroups[data[0x6E]],
                    // eggGroup2: this.eggGroups[data[0x6F]],
                    baseStats: {
                        hp: data.readUInt16BE(0x8E),
                        atk: data.readUInt16BE(0x90),
                        def: data.readUInt16BE(0x92),
                        spatk: data.readUInt16BE(0x94),
                        spdef: data.readUInt16BE(0x96),
                        speed: data.readUInt16BE(0x98),
                    },
                    evolutions: this.ReadArray(data, 0xA6, 6, 5)
                        .filter(d => d.readUInt16BE(0) > 0).map(eData => {
                            const type = eData.readUInt16BE(0);
                            return {
                                happiness: (type == 1 || type == 2 || type == 3) && 220,
                                isTrade: type == 5 || type == 6,
                                timeOfDay: (type == 2 && "Day") || (type == 3 && "Night"),
                                level: (type == 4 || type > 7) && eData.readUInt16BE(2),
                                item: (type == 6 || type == 7) && this.GetItem(eData.readUInt16BE(2)),
                                speciesId: eData.readUInt16BE(4)
                            } as Pokemon.Evolution;
                        })
                };
            });
        }

        protected ReadRooms(commonRel: RelTable, names: StringTable = this.strings) {
            return this.ReadArray(commonRel.GetRecordEntry(this.commonIndex.Rooms), 0, 0x40, commonRel.GetValueEntry(this.commonIndex.NumberOfRooms)).map(data => (<Pokemon.Map><any>{ //0x8D540
                id: data.readUInt16BE(0x2),
                name: names[data.readUInt32BE(0x18)] || unlabeledMaps[data.readUInt16BE(0x2)],
                areaId: data.readUInt16BE(0x2e),
                data: data.toString('hex')
            }));
        }

        protected ReadShadowDataXD(shadowDeck: Deck, storyDeck: Deck) {
            return this.ReadArray(shadowDeck.ShadowPokemonData.data, 0, 0x18, shadowDeck.ShadowPokemonData.entries).map((data, i) => {
                const storyId = data.readUInt16BE(6);
                const baseMon = this.LookUpTrainerPokemon(storyDeck, storyId);
                return {
                    fleeChance: data[0], //0 = no flee. Other values probably chances of finding with mirorb. Higher value = more common encounter.
                    catchRate: data[1], // this catch rate overrides the species' catch rate
                    shadowLevel: data[2], // the pokemon's level after it's caught. Regular level can be increased so AI shadows are stronger
                    storyId, // dpkm index of pokemon data in deck story
                    purificationStart: data.readUInt16BE(0x08), // the starting value of the heart gauge
                    shadowMoves: this.ReadArray(data, 0xC, 2, 4).map(m => Object.assign({}, this.GetMove(m.readUInt16BE(0)))).filter(m => m && m.id),
                    aggression: data[0x14], // determines how often it enters reverse mode
                    alwaysFlee: data[0x15], // the shadow pokemon is sent to miror b. even if you lose the battle
                    baseMon,
                    species: (baseMon || { speciesId: 0 }).speciesId
                } as XDShadowData;
            });
        }

        protected LookUpTrainerPokemon(pkmDeck: Deck, id: number) {
            if (id > pkmDeck.TrainerPokemonData.entries)
                return null;
            const pkmSize = 0x20;
            const pkData = pkmDeck.TrainerPokemonData.data.slice(pkmSize * id);
            return {
                speciesId: pkData.readUInt16BE(0),
                level: pkData[2],
                friendship: pkData[3],
                heldItemId: pkData.readUInt16BE(4),
                ivs: {
                    hp: pkData[0x8],
                    atk: pkData[0x9],
                    def: pkData[0xA],
                    spatk: pkData[0xB],
                    spdef: pkData[0xC],
                    speed: pkData[0xD],
                },
                evs: {
                    hp: pkData[0xE],
                    atk: pkData[0xF],
                    def: pkData[0x10],
                    spatk: pkData[0x11],
                    spdef: pkData[0x12],
                    speed: pkData[0x13],
                },
                moveIds: [pkData.readUInt16BE(0x14), pkData.readUInt16BE(0x16), pkData.readUInt16BE(0x18), pkData.readUInt16BE(0x1A)].filter(m => m > 0),
                pv: pkData[0x1E]
            } as XDTrainerPokemon;
        }

        protected ReadEncounters(data: Buffer, entries = 12) {
            return {
                all: {
                    grass: this.ReadArray(data, 0, 0xC, entries).map(encounterData => (<XDEncounterMon>{
                        minLevel: encounterData[0],
                        maxLevel: encounterData[1],
                        speciesId: data.readUInt16BE(2),
                        species: this.GetSpecies(encounterData.readUInt16BE(2)),
                        rate: encounterData[7],
                        stepsPerSnack: encounterData.readUInt16BE(10)
                    }))
                }
            } as XDEncounters;
        }

    }

    const XDCommonRelIndexes: CommonRelIndex = {
        // 0xf6c is debug menu options
        // each entry is used to set the story flag to the specified value
        // then calls common.scd's "@flagshop" function (0x5960017) to set other necessary flags

        BattleBingo: 0,
        NumberOfBingoCards: 2,
        PeopleIDs: 4,  // 2 bytes at offset 0 person id 4 bytes at offset 4 string id for character name
        NumberOfPeopleIDs: 6,
        NumberOfPokespots: 22,
        PokespotRock: 24,
        PokespotRockEntries: 26,
        PokespotOasis: 30,
        PokespotOasisEntries: 32,
        PokespotCave: 36,
        PokespotCaveEntries: 38,
        PokespotAll: 42,
        PokespotAllEntries: 44,
        BattleCDs: 48,
        NumberBattleCDs: 50,
        Battles: 52,
        NumberOfBattles: 54,
        BattleFields: 56,
        NumberOfBattleFields: 58,
        TrainerClasses: 76,
        NumberOfTrainerClasses: 78,
        BattleLayouts: 84,  // eg 2 trainers per side, 1 active pokemon per trainer, 6 pokemon per trainer
        NumberOfBattleLayouts: 86,
        Flags: 88,
        NumberOfFlags: 90,
        Rooms: 117,  // same as maps
        NumberOfRooms: 118,
        Doors: 120,  // doors that open when player is near
        NumberOfDoors: 122,
        InteractionPoints: 124,  // warps and inanimate objects
        NumberOfInteractionPoints: 126,
        RoomBGM: 128,  // byte 1 = volume, short 2 = room id, short 4 = bgm id
        NumberOfRoomBGMs: 130,
        TreasureBoxData: 132,  // 0x1c bytes each
        NumberTreasureBoxes: 134,
        ValidItems: 136,  // list of items which are actually available in XD
        TotalNumberOfItems: 138,
        Items: 141,
        NumberOfItems: 142,
        CharacterModels: 168,
        NumberOfCharacterModels: 170,
        PokemonStats: 177,
        NumberOfPokemon: 178,
        Natures: 188,
        NumberOfNatures: 190,
        SoundsMetaData: 204,
        NumberOfSounds: 206,
        BGM: 208,
        NumberOfBGMIDs: 210,

        USStringTable: 232,
        Moves: 248,
        NumberOfMoves: 250,
        TutorMoves: 252,
        NumberOfTutorMoves: 254,
        Types: 260,
        NumberOfTypes: 262,
    }

    class Deck {
        private sections: { [key: string]: { entries: number, data: Buffer } } = {};

        public get TrainerData() {
            return this.sections['DTNR'];
        }
        public get TrainerPokemonData() {
            return this.sections['DPKM'];
        }
        public get TrainerAIData() {
            return this.sections['DTAI'];
        }
        public get TrainerStringData() {
            return this.sections['DSTR'];
        }
        public get ShadowPokemonData() {
            return this.sections['DDPK'];
        }

        constructor(data: Buffer) {
            let sectionAddr = 0x10;
            while (sectionAddr < data.length) {
                let sectionName = data.toString('ascii', sectionAddr, sectionAddr + 4);
                let sectionSize = data.readUInt32BE(sectionAddr + 4);
                this.sections[sectionName] = {
                    entries: data.readUInt32BE(sectionAddr + 8),
                    data: data.slice(sectionAddr + 0x10, sectionAddr + sectionSize)
                };
                sectionAddr = sectionAddr + sectionSize;
            }
        }
    }

}