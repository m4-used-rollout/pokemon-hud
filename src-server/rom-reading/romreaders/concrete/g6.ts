/// <reference path="generic.ts" />

namespace RomReader {
    const moveCategories = ["Status", "Physical", "Special"];
    const types = ["Normal", "Fighting", "Flying", "Poison", "Ground", "Rock", "Bug", "Ghost", "Steel", "Fire", "Water", "Grass", "Electric", "Psychic", "Ice", "Dragon", "Dark", "Fairy"];
    const expCurves = [Pokemon.ExpCurve.MediumFast, Pokemon.ExpCurve.Erratic, Pokemon.ExpCurve.Fluctuating, Pokemon.ExpCurve.MediumSlow, Pokemon.ExpCurve.Fast, Pokemon.ExpCurve.Slow];
    const expCurveNames = ["Medium Fast", "Erratic", "Fluctuating", "Medium Slow", "Fast", "Slow"];

    const dexMax = 721;

    export class Gen6 extends Generic {

        constructor() {
            super("gen6");
            this.maps = require('./data/gen6/maps.json');
            this.maps.forEach(m => Object.keys(m.encounters || {}).forEach(k => Object.keys(m.encounters[k]).forEach(j => {
                m.encounters[k][j].forEach(e => {
                    e.species = this.GetSpecies(e.speciesId);
                    e.requiredItem = this.GetItem(e.requiredItem as any as number);
                });
                m.encounters[k][j] = this.CombineDuplicateEncounters(m.encounters[k][j]);
            })));
            this.trainers = require('./data/gen6/trainers.json');
            require('./data/gen6/movelearns.json').forEach((entry: { speciesId: number, moveLearns:{level: number, id: number}[]})=> {
                this.moveLearns[entry.speciesId] = entry.moveLearns.map(ml=>{
                    const move = this.GetMove(ml.id);
                    const movelearn:Pokemon.MoveLearn = {} as Pokemon.MoveLearn;
                    Object.keys(move).forEach(k=>movelearn[k] = move[k]);
                    movelearn.level = ml.level;
                    return movelearn;
                });
            });
        }

        CheckIfCanSurf(runState: TPP.RunStatus) {
            return (runState.badges & 8) > 0;
        }

        GetItemSprite(id: number) {
            return `./img/items/gen6/item_${id}.png`;
        }

    }
}