/// <reference path="../../config/g5.ts" />
/// <reference path="../nds.ts" />
/// <reference path="../../tools/pptxt.ts" />

namespace RomReader {

    const config = gen5FilesOffsets;

    const moveCategories = ["Status", "Physical", "Special"];
    const types = ["Normal", "Fighting", "Flying", "Poison", "Ground", "Rock", "Bug", "Ghost", "Steel", "Fire", "Water", "Grass", "Electric", "Psychic", "Ice", "Dragon", "Dark"];
    const eggGroups = ["???", "Monster", "Water 1", "Bug", "Flying", "Field", "Fairy", "Grass", "Human-Like", "Water 3", "Mineral", "Amorphous", "Water 2", "Ditto", "Dragon", "Undiscovered"];
    const expCurves = [Pokemon.ExpCurve.MediumFast, Pokemon.ExpCurve.Erratic, Pokemon.ExpCurve.Fluctuating, Pokemon.ExpCurve.MediumSlow, Pokemon.ExpCurve.Fast, Pokemon.ExpCurve.Slow];
    const expCurveNames = ["Medium Fast", "Erratic", "Fluctuating", "Medium Slow", "Fast", "Slow"];

    const perSeasonEncounterDataLength = 232, bw2AreaDataEntryLength = 345, bw2EncounterAreaCount = 85;
    const encountersOfEachType = [12, 12, 12, 5, 5, 5, 5];
    const encounterTypeNames = ["Grass/Cave", "Doubles Grass", "Shaking Spots", "Surfing", "Surfing Spots", "Fishing", "Fishing Spots"];
    const habitatClassificationOfEachType = ["grass", "grass", "hidden_grass", "surfing", "hidden_surfing", "fishing", "hidden_fishing"];

    const tmDataPrefix = "87038803";
    const tmCount = 95, hmCount = 6, tmBlockOneCount = 92, tmBlockOneOffset = 328, tmBlockTwoOffset = 618;

    export class Gen5 extends NDSReader {

        ConvertText(text: string) {
            return Tools.PPTxt.PokeToText(text || "");
        }

        GetCurrentMapEncounters(map: Pokemon.Map, state: TPP.TrainerData) {
            return map.encounters.all; //TODO: Seasons
        }

        constructor(basePath: string) {
            super(basePath);

            let arm9 = this.readArm9();
            let stringsNarc = this.readNARC(config.TextStrings);
            let pokeNarc = this.readNARC(config.PokemonStats);
            let moveNarc = this.readNARC(config.MoveData);
            let itemNarc = this.readNARC(config.ItemData);
            let mapNarc = this.readNARC(config.MapTableFile);
            let encounterNarc = this.readNARC(config.EncounterData);
            let pokegrNarc = this.readNARC(config.PokemonGraphics);
            let badgesgrNarc = this.readNARC(config.BadgeGraphics);
            let itemgrNarc = this.readNARC(config.ItemGraphics);

            function getStrings(index: number) {
                return Tools.PPTxt.GetStrings(stringsNarc.files[index]);
            }

            let moveNames = getStrings(config.TextOffsets.MoveNames);
            let pokemonNames = getStrings(config.TextOffsets.PokemonNames);
            let abilityNames = getStrings(config.TextOffsets.AbilityNames);
            let itemNames = getStrings(config.TextOffsets.ItemNames);
            let mapNames = getStrings(config.TextOffsets.MapNames);

            this.abilities = abilityNames;

            this.moves = moveNarc.files.map((data, i) => (<Pokemon.Move>{
                name: moveNames[i],
                id: i,
                accuracy: data[4] % 255,
                basePower: data[3] % 255,
                basePP: data[5] % 255,
                type: types[data[0] % 255],
                category: moveCategories[data[2] % 255]
            }));

            let pokemon = pokeNarc.files.map((stats, i) => (<Pokemon.Species>{
                id: i,
                dexNumber: i,
                name: pokemonNames[i],
                baseStats: {
                    hp: stats[0] & 0xFF,
                    atk: stats[1] & 0xFF,
                    def: stats[2] & 0xFF,
                    speed: stats[3] & 0xFF,
                    spatk: stats[4] & 0xFF,
                    spdef: stats[5] & 0xFF
                },
                type1: types[stats[6] & 0xFF],
                type2: types[stats[7] & 0xFF],
                catchRate: stats[8] & 0xFF,
                genderRatio: stats[18] & 0xFF,
                eggCycles: (stats[19] & 0xFF) - 1, //eggs hatch upon hitting 0 in gen 5, not ticking past 0.
                growthRate: expCurveNames[stats[21] & 0xFF],
                expFunction: expCurves[stats[21] & 0xFF],
                eggGroup1: eggGroups[stats[22] & 0xFF],
                eggGroup2: eggGroups[stats[23] & 0xFF],
                abilities: [abilityNames[stats[24] & 0xFF], abilityNames[stats[25] & 0xFF], abilityNames[stats[26] & 0xFF]],
                baseExp: stats[32] & 0xFF,
            }));

            this.pokemon = pokemon;

            let tmHmMoves: number[] = (function GetTMHMMapping() {
                let tmhm: number[] = [];
                let offset = arm9.indexOf(tmDataPrefix, 0, 'hex');
                offset += tmDataPrefix.length / 2; //skip the prefix
                if (offset > 0) {
                    for (let i = 0; i < tmCount + hmCount; i++) {
                        tmhm.push(arm9.readInt16LE(offset + i * 2));
                    }
                }
                return tmhm;
            })();

            this.items = itemNarc.files.map((data, i) => (<Pokemon.Item>{
                id: i,
                name: itemNames[i],
                isKeyItem: (data[8] & 32) > 0,
                // data: data
            }));

            //Give TMs and HMs their move names
            this.items.filter(i => i.name.indexOf("TM") >= 0 || i.name.indexOf("HM") >= 0).forEach((tm, index) => tm.name += " " + (this.moves[tmHmMoves[index]] || { name: "???" }).name);

            let encounters: { rate: number; encounters: Pokemon.Species[]; type: string; offset: number }[] = [];

            function readEncounters(data: Buffer, offset: number, number: number) {
                let encs = new Array<Pokemon.Species>();
                for (let i = 0; i < number; i++) {
                    let mon = pokemon[((data[offset + i * 4] & 0xFF) + ((data[offset + 1 + i * 4] & 0x03) << 8))];
                    encs.push(mon);
                }
                return encs;
            }

            function processEncounterEntry(entry: Buffer, startOffset: number, index: number) {
                let amounts = encountersOfEachType;
                let offset = 8;
                for (let i = 0; i < 7; i++) {
                    let rate = entry[startOffset + i] & 0xFF;
                    if (rate != 0) {
                        let encs = readEncounters(entry, startOffset + offset, amounts[i]);
                        let area = {
                            rate: rate,
                            encounters: encs,
                            type: habitatClassificationOfEachType[i],
                            offset: index
                        }
                        encounters.push(area);
                    }
                    offset += amounts[i] * 4;
                }

            }

            encounterNarc.files.forEach((entry, i) => {
                // if (entry.length > perSeasonEncounterDataLength) {
                //     for (let s = 0; s < 4; s++) {
                //         processEncounterEntry(entry, s * perSeasonEncounterDataLength, i);
                //     }
                // } 
                // else {
                processEncounterEntry(entry, 0, i);
                // }
            });

            this.maps = []
            let mapHeaderData = mapNarc.files[0];
            let numMapHeaders = mapHeaderData.length / 48;
            for (let m = 0; m < numMapHeaders; m++) {
                let baseOffset = m * 48;
                let mapNameIndex = mapHeaderData[baseOffset + 26] & 0xFF;
                let map: Pokemon.Map = {
                    id: m,
                    name: mapNames[mapNameIndex],
                    encounters: null
                }

                let wildSet = mapHeaderData[baseOffset + 20] & 0xFF; //this is for BW2. For BW, wildSet is a word, not a byte
                if (wildSet != 255 && wildSet != 65535) {
                    map.encounters = {
                        all: {
                            grass: [],
                            hidden_grass: [],
                            surfing: [],
                            hidden_surfing: [],
                            fishing: [],
                            hidden_fishing: []
                        }
                    };
                    encounters.filter(e => e.offset == wildSet).forEach(e => map.encounters.all[e.type] = Array.prototype.concat.apply(map.encounters.all[e.type], e.encounters.map(enc => (<Pokemon.EncounterMon>{ species: enc, rate: e.rate }))));
                }
                this.maps.push(map);
            }
        }
    }
}