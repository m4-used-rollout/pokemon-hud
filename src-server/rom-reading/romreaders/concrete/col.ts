/// <reference path="../gcn.ts" />

namespace RomReader {

    export class Col extends GCNReader {

        protected unlabeledMaps: { [key: number]: string } = {
            19: "Orre Region"
        }

        constructor(basePath: string, ) {
            super(basePath, CommonRelIndexes);
        }
    }

    const CommonRelIndexes:CommonRelIndex = {
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