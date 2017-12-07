/// <reference path="../base.ts" />

namespace RomReader {
    const fs = require('fs');
    const moveCategories = ["Status", "Physical", "Special"];
    const types = ["Normal", "Fighting", "Flying", "Poison", "Ground", "Rock", "Bug", "Ghost", "Steel", "Fire", "Water", "Grass", "Electric", "Psychic", "Ice", "Dragon", "Dark", "Fairy"];
    const expCurves = [Pokemon.ExpCurve.MediumFast, Pokemon.ExpCurve.Erratic, Pokemon.ExpCurve.Fluctuating, Pokemon.ExpCurve.MediumSlow, Pokemon.ExpCurve.Fast, Pokemon.ExpCurve.Slow];
    const expCurveNames = ["Medium Fast", "Erratic", "Fluctuating", "Medium Slow", "Fast", "Slow"];

    export class Generic extends RomReaderBase {

        constructor(dataFolder = "generic") {
            super();
            // this.trainers = this.ReadTrainerData(romData, config);
            // this.areas = this.ReadMapLabels(romData, config);
            // this.maps = this.ReadMaps(romData, config);
            this.abilities = require(`./data/${dataFolder}/abilities.json`).map(a => a.name);
            this.pokemon = require(`./data/${dataFolder}/species.json`);
            this.pokemon.forEach(s => {
                s.expFunction = expCurves[parseInt(s.growthRate)];
                s.growthRate = expCurveNames[parseInt(s.growthRate)] || s.growthRate;
            });
            this.items = require(`./data/${dataFolder}/items.json`);
            this.moves = require(`./data/${dataFolder}/moves.json`);
        }

        GetPokemonSprite(id: number, form = 0, gender = "", shiny = false, generic = false) {
            const spriteFolder = TPP.Server.getConfig().spriteFolder;
            if (!generic && spriteFolder) {
                const spriteUrl = ((this.pokemonSprites[id] || [])[form] || { base: null, shiny: null })[shiny ? "shiny" : "base"] || `./img/sprites/${spriteFolder}/${shiny ? "shiny/" : ""}${gender == "Female" ? "female/" : ""}${this.ZeroPad(id, 3)}${form ? `-${form}` : ''}.png`;
                if (fs.existsSync(__dirname + '/' + spriteUrl))
                    return spriteUrl;
            }
            return `./img/generic/pokemon/${shiny ? "" : ""}${id}${form ? `-${form}` : ''}.png`; //TODO: better generic sprites
        }
        GetItemSprite(id: number) {
            return `./img/generic/item//item_${id}.png`;
        }

        GetCurrentMapEncounters(map: Pokemon.Map, state: TPP.TrainerData): Pokemon.EncounterSet {
            return null; //TODO: Figure out how to load encounter data from something
        }
    }
}