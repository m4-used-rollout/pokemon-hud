/// <reference path="../base.ts" />

namespace RomReader {
    const moveCategories = ["Status", "Physical", "Special"];
    const types = ["Normal", "Fighting", "Flying", "Poison", "Ground", "Rock", "Bug", "Ghost", "Steel", "Fire", "Water", "Grass", "Electric", "Psychic", "Ice", "Dragon", "Dark", "Fairy"];
    const expCurves = [Pokemon.ExpCurve.MediumFast, Pokemon.ExpCurve.Erratic, Pokemon.ExpCurve.Fluctuating, Pokemon.ExpCurve.MediumSlow, Pokemon.ExpCurve.Fast, Pokemon.ExpCurve.Slow];
    const expCurveNames = ["Medium Fast", "Erratic", "Fluctuating", "Medium Slow", "Fast", "Slow"];

    export class Generic extends RomReaderBase {

        constructor(dataFolder="generic") {
            super();
            // this.trainers = this.ReadTrainerData(romData, config);
            // this.areas = this.ReadMapLabels(romData, config);
            // this.maps = this.ReadMaps(romData, config);
            this.abilities = require(`./data/${dataFolder}/abilities.json`).map(a => a.name);
            this.pokemon = require(`./data/${dataFolder}/species.json`);
            this.pokemon.forEach(s=>{
                s.expFunction = expCurves[parseInt(s.growthRate)];
                s.growthRate = expCurveNames[parseInt(s.growthRate)] || s.growthRate;
            });
            this.items = require(`./data/${dataFolder}/items.json`);
            this.moves = require(`./data/${dataFolder}/moves.json`);
        }

        GetPokemonSprite(id: number, form = 0, shiny = false) {
            return `./img/generic/pokemon/${shiny ? "shiny/" : ""}${id}${form ? `-${form}` : ''}.png`;
        }
        GetItemSprite(id: number) {
            return `./img/generic/item//item_${id}.png`;
        }

        GetCurrentMapEncounters(map: Pokemon.Map, state: TPP.TrainerData): Pokemon.EncounterSet {
            return null; //TODO: Figure out how to load encounter data from something
        }
    }
}