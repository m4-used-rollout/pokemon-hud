/// <reference path="../gcn.ts" />

namespace RomReader {

    const typeNames = ["Normal", "Fighting", "Flying", "Poison", "Ground", "Rock", "Bug", "Ghost", "Steel", "???", "Fire", "Water", "Grass", "Electric", "Psychic", "Ice", "Dragon", "Dark"];
    const eggGroups = ["???", "Monster", "Water 1", "Bug", "Flying", "Field", "Fairy", "Grass", "Human-Like", "Water 3", "Mineral", "Amorphous", "Water 2", "Ditto", "Dragon", "Undiscovered"];
    const expCurves = [Pokemon.ExpCurve.MediumFast, Pokemon.ExpCurve.Erratic, Pokemon.ExpCurve.Fluctuating, Pokemon.ExpCurve.MediumSlow, Pokemon.ExpCurve.Fast, Pokemon.ExpCurve.Slow];
    const expCurveNames = ["Medium Fast", "Erratic", "Fluctuating", "Medium Slow", "Fast", "Slow"];
    const contestTypes = ['Cool', 'Beauty', 'Cute', 'Smart', 'Tough'];
    const contestEffects = ['The appeal effect of this move is constant.', 'Prevents the user from being startled.', 'Startles the previous appealer.', 'Startles all previous appealers.', 'Affects appealers other than startling them.', 'Appeal effect may change.', 'The appeal order changes for the next round.'];

    export class ColXD extends GCNReader {


        constructor(basePath: string) {
            super(basePath);
            const startDol = this.StartDol;
            const commonRel = this.CommonRel;
            const strings = this.ReadStringTable(commonRel, 0x59890);
            const pokemonNames = ["??????????", ...strings.filter(s => s.id > 1000 && s.id < 2000).map(s => s.string)];
            const moveNames = ["???", ...strings.filter(s => s.id > 2000 && s.id < 3000).map(s => s.string)];
            this.abilities = ["-", ...strings.filter(s => s.id > 3100 && s.id < 3200).map(s => s.string)];
            const trainerNames = ["???", ...strings.filter(s => s.id > 4000 && s.id < 5000).map(s => s.string)];
            const itemNames = ["???", ...strings.filter(s => s.id > 5000 && s.id < 6000).map(s => s.string)];

            this.moveLearns = {};
            this.evolutions = {};
            this.moves = this.ReadMoveData(commonRel, moveNames);
            this.pokemon = this.ReadPokeData(commonRel, pokemonNames);
            this.items = this.ReadItemData(startDol, itemNames);

        }

        public CheckIfCanSurf(runState: TPP.RunStatus) {
            return false; //no water in Orre
        }

        GetCurrentMapEncounters(map: Pokemon.Map, state: TPP.TrainerData): Pokemon.EncounterSet {
            return {}; //no encounters in Colosseum
        }

        private ReadPokeData(commonRel: Buffer, names: string[]) {
            return this.ReadStridedData(commonRel, 0x12336C, 0x11C, 411).map((data, i) => {
                this.moveLearns[i + 1] = this.ReadStridedData(data, 0xBA, 4, 20, true, 0)
                    .map(mData => Object.assign({
                        level: mData[0]
                    }, this.moves[mData.readUInt16BE(2)]) as Pokemon.MoveLearn);
                this.evolutions[i + 1] = this.ReadStridedData(data, 0x9C, 6, 5)
                    .filter(d => d.readUInt16BE(0) > 0).map(eData => {
                        const type = eData.readUInt16BE(0);
                        return {
                            level: type == 4 || type > 7 ? eData.readUInt16BE(2) : 0,
                            itemId: type == 6 || type == 7 ? eData.readUInt16BE(2) : 0,
                            speciesId: eData.readUInt16BE(4)
                        };
                    });
                return <Pokemon.Species>{
                    id: i + 1,
                    growthRate: expCurveNames[data[0]],
                    expFunction: expCurves[data[0]],
                    catchRate: data[1],
                    genderRatio: data[2],
                    baseExp: data[7],
                    dexNumber: data.readUInt16BE(0x10),
                    eggCycles: data[0x17],
                    name: names[data.readInt32BE(0x18) % 1000],
                    type1: typeNames[data[0x30]],
                    type2: typeNames[data[0x31]],
                    abilities: [this.abilities[data[0x32]], this.abilities[data[0x33]]],
                    eggGroup1: eggGroups[data[0x6E]],
                    eggGroup2: eggGroups[data[0x6F]],
                    baseStats: {
                        hp: data.readUInt16BE(0x84),
                        atk: data.readUInt16BE(0x86),
                        def: data.readUInt16BE(0x88),
                        spatk: data.readUInt16BE(0x8A),
                        spdef: data.readUInt16BE(0x8C),
                        speed: data.readUInt16BE(0x8E),
                    }
                };
            });
        }

        private ReadMoveData(commonRel: Buffer, names: string[]) {
            return this.ReadStridedData(commonRel, 0x11E048, 0x38, 357).map((data, i) => (<Pokemon.Move>{
                id: i + 1,
                basePP: data[1],
                type: typeNames[data[2]],
                accuracy: data[4],
                basePower: data[0x17],
                name: names[data.readUInt16BE(0x22) % 1000]
            }));
        }

        private ReadItemData(startDol: Buffer, names: string[]) {
            const tmMap = this.ReadTMHMMapping(startDol);
            const tmExp = /^TM([0-9]+)$/i;
            const mapTm = (name: string) => {
                const matches = tmExp.exec(name);
                if (matches) {
                    const tmNum = parseInt(matches[1]);
                    return `TM${tmNum < 10 ? "0" : ""}${tmNum} ${this.GetMove(tmMap[tmNum]).name}`;
                }
                return name;
            }
            return this.ReadStridedData(startDol, 0x360CE8, 0x28, 397).map((data, i) => (<Pokemon.Item>{
                id: i + 1,
                name: mapTm(names[data.readUInt32BE(0x10) % 1000]),
                isKeyItem: data[1] > 0
            }));
        }

        private ReadTMHMMapping(startDol: Buffer) {
            return [0, ...this.ReadStridedData(startDol, 0x365018, 0x8, 58).map(data => data.readUInt32BE(4))];
        }
    }

}