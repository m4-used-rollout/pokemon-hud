/// <reference path="../gba.ts" />

namespace RomReader {

    const typeNames = ["Normal", "Fighting", "Flying", "Poison", "Ground", "Rock", "Bug", "Ghost", "Steel", "???", "Fire", "Water", "Grass", "Electric", "Psychic", "Ice", "Dragon", "Dark"];
    const eggGroups = ["???", "Monster", "Water 1", "Bug", "Flying", "Field", "Fairy", "Grass", "Human-Like", "Water 3", "Mineral", "Amorphous", "Water 2", "Ditto", "Dragon", "Undiscovered"];
    const expCurves = [Pokemon.ExpCurve.MediumFast, Pokemon.ExpCurve.Erratic, Pokemon.ExpCurve.Fluctuating, Pokemon.ExpCurve.MediumSlow, Pokemon.ExpCurve.Fast, Pokemon.ExpCurve.Slow];
    const expCurveNames = ["Medium Fast", "Erratic", "Fluctuating", "Medium Slow", "Fast", "Slow"];

    export class Gen3 extends GBAReader {
        constructor(romFileLocation: string, iniFileLocation: string = "pge.ini") {
            super(romFileLocation, iniFileLocation);
            let romData = this.loadROM();
            let config = this.LoadConfig(romData);
            this.abilities = this.ReadAbilities(romData, config);
            this.pokemon = this.ReadPokeData(romData, config);
            console.log(JSON.stringify(this.pokemon));
            // this.pokemonSprites = this.ReadPokemonSprites(romData, config);
            // this.trainers = this.ReadTrainerData(romData, config);
            // this.trainerSprites = this.ReadTrainerSprites(romData, config);
            // this.frameBorders = this.ReadFrameBorders(romData, config);
            // this.items = this.ReadItemData(romData, config);
            // this.ballIds = this.items.filter((i: Gen2Item) => i.pocket == "Ball").map(i => i.id);
            // this.moves = this.ReadMoveData(romData, config);
            // this.areas = this.ReadAreaNames(romData, config);
            // this.maps = this.ReadMaps(romData, config);
            // this.FindMapEncounters(romData, config);
            // this.GetTMHMNames(romData, config);
        }
        GetCurrentMapEncounters(map: Pokemon.Map, state: TPP.TrainerData): Pokemon.EncounterSet {
            return null;
        }

        private ReadAbilities(romData: Buffer, config: PGEINI) {
            return this.ReadStridedData(romData, parseInt(config.AbilityNames, 16), 13, parseInt(config.NumberOfAbilities)).map(a => this.FixAllCaps(this.ConvertText(a)));
        }

        private ReadPokeData(romData: Buffer, config: PGEINI) {
            let pokemonNames = this.ReadStridedData(romData, parseInt(config.PokemonNames, 16), 11, parseInt(config.NumberOfPokemon)).map(p => this.FixAllCaps(this.ConvertText(p)));
            let dexMapping = this.ReadStridedData(romData, parseInt(config.NationalDexTable, 16), 2, parseInt(config.NumberOfPokemon)).map(n => n.readInt16LE(0));
            dexMapping.unshift(0);
            return this.ReadStridedData(romData, parseInt(config.PokemonData, 16), 28, parseInt(config.NumberOfPokemon)).map((data, i) => (<Pokemon.Species>{
                name: pokemonNames[i],
                id: i,
                dexNumber: dexMapping[i],
                baseStats: {
                    hp: data[0],
                    atk: data[1],
                    def: data[2],
                    speed: data[3],
                    spatk: data[4],
                    spdef: data[5]
                },
                type1: typeNames[data[6]],
                type2: typeNames[data[7]],
                catchRate: data[8],
                baseExp: data[9],
                //effortYield: data.readInt16LE(10),
                //item1: data.readInt16LE(12),
                //item2: data.readInt16LE(14),
                genderRatio: data[16],
                eggCycles: data[17],
                //baseFriendship: data[18],
                growthRate: expCurveNames[data[19]],
                expFunction: expCurves[data[19]],
                eggGroup1: eggGroups[data[20]],
                eggGroup2: eggGroups[data[21]],
                abilities: [this.abilities[data[22]], this.abilities[data[23]]],
                //safariZoneRate: data[24],
                //dexColor: data[25] % 128,
                //flipSprite: !!(data[25] & 128)
            }));
        }
    }

}