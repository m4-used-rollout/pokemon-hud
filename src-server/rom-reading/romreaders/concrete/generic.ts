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
            this.formBackMapping = {};
            this.pokemon.forEach(s => {
                s.expFunction = expCurves[parseInt(s.growthRate)];
                s.growthRate = expCurveNames[parseInt(s.growthRate)] || s.growthRate;
                if (s.id != s.baseSpeciesId) {
                    this.formBackMapping[s.id] = s.baseSpeciesId;
                }
            });
            this.items = require(`./data/${dataFolder}/items.json`);
            this.moves = require(`./data/${dataFolder}/moves.json`);
            this.moveLearns = {};
            const evos = (require(`./data/${dataFolder}/evolutions.json`) as Record<number, Array<Pokemon.Evolution & { formId?: number, itemId?: number; moveId?: number }>>);
            Object.keys(evos).map(k => parseInt(k)).forEach(k => this.pokemon[k].evolutions = evos[k].map(({ itemId, moveId, formId, ...evo }) => ({
                ...evo,
                form: formId,
                item: itemId && this.GetItem(itemId),
                move: moveId && this.GetMove(moveId)
            })));
        }

        GetPokemonSprite(id: number, form = 0, gender = "", shiny = false, generic = false) {
            const spriteFolder = TPP.Server.getConfig().spriteFolder;
            let possibleSpriteUrls: string[] = [];
            if (!generic && spriteFolder) {
                possibleSpriteUrls.push(((this.pokemonSprites[id] || [])[form] || { base: null, shiny: null })[shiny ? "shiny" : "base"] || `./img/sprites/${spriteFolder}/${shiny ? "shiny/" : ""}${gender == "Female" ? "female/" : ""}${this.ZeroPad(id, 3)}${form ? `-${form}` : ''}.png`);
            }
            possibleSpriteUrls.push(`./img/generic/pokemon/${shiny ? "shiny/" : ""}${gender == "Female" ? "female/" : ""}${id}${form ? `-${form}` : ''}.png`);
            possibleSpriteUrls.push(`./img/generic/pokemon/${shiny ? "shiny/" : ""}${gender == "Female" ? "female/" : ""}${id}${form ? `-${form}` : '-0'}.png`);
            possibleSpriteUrls.push(`./img/generic/pokemon/${shiny ? "shiny/" : ""}${id}${form ? `-${form}` : ''}.png`);
            possibleSpriteUrls.push(`./img/generic/pokemon/${shiny ? "shiny/" : ""}${id}${form ? `-${form}` : '-0'}.png`);
            possibleSpriteUrls.push(`./img/generic/pokemon/${shiny ? "shiny/" : ""}${id}.png`);
            possibleSpriteUrls.push(`./img/generic/pokemon/${id}.png`);
            for (let i = 0; i < possibleSpriteUrls.length; i++) {
                if (fs.existsSync(__dirname + '/' + possibleSpriteUrls[i]))
                    return possibleSpriteUrls[i];
            }
            return './img/empty-sprite.png'; //whatever
        }
        GetItemSprite(id: number) {
            return `./img/generic/item//item_${id}.png`;
        }

        GetCurrentMapEncounters(map: Pokemon.Map, state: TPP.TrainerData): Pokemon.EncounterSet {
            return (map.encounters || {})["all"];
        }

        CollapseSeenForms(seen: number[]) {
            return seen.map(s => this.formBackMapping[s] || s);//.filter((s, i, arr) => arr.indexOf[s] == i);
        }
    }
}