/// <reference path="../gcn.ts" />

namespace RomReader {

    export class Col extends GCNReader {

        protected unlabeledMaps: { [key: number]: string } = {
            19: "Orre Region"
        }

        constructor(basePath: string, ) {
            super(basePath, ColCommonRelIndexes);
        }

        protected ReadPokeData(commonRel: RelTable, names: StringTable = this.strings) {
            return this.ReadStridedData(commonRel.GetRecordEntry(this.commonIndex.PokemonStats), 0, 0x11C, commonRel.GetValueEntry(this.commonIndex.NumberOfPokemon)).map((data, i) => { //0x12336C
                this.moveLearns[i] = this.ReadStridedData(data, 0xBA, 4, 20, true, 0)
                    .map(mData => Object.assign({
                        level: mData[0]
                    }, this.GetMove(mData.readUInt16BE(2))) as Pokemon.MoveLearn);
                return <Pokemon.Species>{
                    id: i,
                    growthRate: this.expCurveNames[data[0]],
                    expFunction: this.expCurves[data[0]],
                    catchRate: data[1],
                    genderRatio: data[2],
                    baseExp: data[7],
                    dexNumber: data.readUInt16BE(0x10),
                    eggCycles: data[0x17],
                    name: names[data.readInt32BE(0x18)],
                    type1: this.typeNames[data[0x30]],
                    type2: this.typeNames[data[0x31]],
                    abilities: [this.abilities[data[0x32]], this.abilities[data[0x33]]].filter(a => a != '-'),
                    tmCompat: this.ReadStridedData(data, 0x34, 1, 58)
                        .map((c, i) => c[0] ? i + 1 : 0)
                        .filter(i => !!i)
                        .map(tm => `${tm < 51 ? "T" : "H"}M${tm > 50 || tm < 10 ? "0" : ""}${tm > 50 ? tm - 50 : tm}`),
                    eggGroup1: this.eggGroups[data[0x6E]],
                    eggGroup2: this.eggGroups[data[0x6F]],
                    baseStats: {
                        hp: data.readUInt16BE(0x84),
                        atk: data.readUInt16BE(0x86),
                        def: data.readUInt16BE(0x88),
                        spatk: data.readUInt16BE(0x8A),
                        spdef: data.readUInt16BE(0x8C),
                        speed: data.readUInt16BE(0x8E),
                    },
                    evolutions: this.ReadStridedData(data, 0x9C, 6, 5)
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
            return this.ReadStridedData(commonRel.GetRecordEntry(this.commonIndex.Rooms), 0, 0x4C, commonRel.GetValueEntry(this.commonIndex.NumberOfRooms)).map(data => (<Pokemon.Map>{ //0x8D540
                id: data.readUInt32BE(0x4),
                name: names[data.readUInt32BE(0x24)] || this.unlabeledMaps[data.readUInt32BE(0x4)]
            }));
        }
    }

    const ColCommonRelIndexes: CommonRelIndex = {
        // NumberOfItems: -1, // items are in dol in colosseum
        // not found in col yet
        // BGM: -3,
        // NumberOfBGMIDs: -4,
        // BattleFields: -5,


        LegendaryPokemon: 4,
        NumberOfLegendaryPokemon: 6,

        PokefaceTextures: 8,

        PeopleIDs: 12, // 2 bytes at offset 0 person id 4 bytes at offset 4 string id for character name
        NumberOfPeopleIDs: 14,

        TrainerClasses: 48,
        NumberOfTrainerClasses: 50,

        Doors: 60,
        NumberOfDoors: 62,

        Trainers: 88,
        NumberOfTrainers: 90,
        TrainerAIData: 92,
        NumberOfTrainerAIData: 94,
        TrainerPokemonData: 96,
        NumberOfTrainerPokemonData: 98,

        Battles: 100,
        NumberOfBattles: 102,

        MusicSamples: 104, // 8bytes each. 0-3 file identifier, 6-7 unknown identifier
        NumberOfMusicSamples: 106,

        BattleDebugScenarios: 112,
        NumberOfBattleDebugScenarios: 114,
        AIDebugScenarios: 116,
        NumberOfAIDebugScenarios: 118,

        StoryDebugOptions: 64,
        NumberOfStoryDebugOptions: 66,

        KeyboardCharacters: 72,
        NumberOfKeyboardCharacters: 74,
        Keyboard2Characters: 76,
        NumberOfKeyboard2Characters: 78,
        Keyboard3Characters: 80, // main keyboard
        NumberOfKeyboard3Characters: 82,

        BattleStyles: 84,
        NumberOfBattleStyles: 86,

        Rooms: 28,
        NumberOfRooms: 30,

        RoomData: 56,
        NumberOfRoomData: 58,


        TreasureBoxData: 120,
        NumberTreasureBoxes: 122,

        CharacterModels: 144,
        NumberOfCharacterModels: 146,

        ShadowData: 160,
        NumberOfShadowPokemon: 162,

        PokemonMetLocations: 164,
        NumberOfMetLocations: 166,

        InteractionPoints: 172, // warps and inanimate objects
        NumberOfInteractionPoints: 174,

        USStringTable: 201,
        StringTableB: 202,
        StringTableC: 203,

        PokemonStats: 136,
        NumberOfPokemon: 138,

        Natures: 128,
        NumberOfNatures: 130,


        Moves: 124,
        NumberOfMoves: 126,
    }


}