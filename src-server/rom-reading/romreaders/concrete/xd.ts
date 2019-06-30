/// <reference path="../gcn.ts" />

namespace RomReader {

    export class XD extends GCNReader {

        // protected unlabeledMaps: { [key: number]: string } = {
        //     19: "Orre Region"
        // }

        constructor(basePath: string, ) {
            super(basePath, CommonRelIndexes);
        }
    }

    const CommonRelIndexes: CommonRelIndex = {
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
        Rooms: 116,  // same as maps
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
        Items: 140,
        NumberOfItems: 142,
        CharacterModels: 168,
        NumberOfCharacterModels: 170,
        PokemonStats: 176,
        NumberOfPokemon: 178,
        Natures: 188,
        NumberOfNatures: 190,
        SoundsMetaData: 204,
        NumberOfSounds: 206,
        BGM: 208,
        NumberOfBGMIDs: 210,


        USStringTable: 232,
        StringTableB: 233,
        StringTableC: 234,
        Moves: 248,
        NumberOfMoves: 250,
        TutorMoves: 252,
        NumberOfTutorMoves: 254,
        Types: 260,
        NumberOfTypes: 262,
    }

}