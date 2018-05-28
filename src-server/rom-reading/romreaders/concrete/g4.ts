/// <reference path="../../config/g4.ts" />
/// <reference path="../nds.ts" />
/// <reference path="../../tools/poketext.ts" />

namespace RomReader {

    const config = gen4FilesOffsets;

    const fs = require('fs');

    const moveCategories = ["Status", "Physical", "Special"];
    const types = ["Normal", "Fighting", "Flying", "Poison", "Ground", "Rock", "Bug", "Ghost", "Steel", "Fairy", "Fire", "Water", "Grass", "Electric", "Psychic", "Ice", "Dragon", "Dark"];
    const eggGroups = ["???", "Monster", "Water 1", "Bug", "Flying", "Field", "Fairy", "Grass", "Human-Like", "Water 3", "Mineral", "Amorphous", "Water 2", "Ditto", "Dragon", "Undiscovered"];
    const expCurves = [Pokemon.ExpCurve.MediumFast, Pokemon.ExpCurve.Erratic, Pokemon.ExpCurve.Fluctuating, Pokemon.ExpCurve.MediumSlow, Pokemon.ExpCurve.Fast, Pokemon.ExpCurve.Slow];
    const expCurveNames = ["Medium Fast", "Erratic", "Fluctuating", "Medium Slow", "Fast", "Slow"];

    const bagPockets = ["Items", "Medicine", "Balls", "Tms", "Berries", "Mail", "Battle", "Key"];

    const timeThresholdHours = [4, 10, 20];

    const encounterRatesGrass = [20, 20, 10, 10, 10, 10, 5, 5, 4, 4, 1, 1];
    const encounterRatesRockSmash = [90, 10];
    const encounterRatesWater = [60, 30, 5, 4, 1];

    const emptyEncounterSet: Pokemon.EncounterSet = { grass: [], hidden_grass: [], surfing: [], fishing: [] };
    const emptyEncounters: Pokemon.Encounters = { morn: emptyEncounterSet, day: emptyEncounterSet, nite: emptyEncounterSet };


    const dpptTMDataPrefix = "D100D200D300D400", hgssTMDataPrefix = "1E003200";
    const tmCount = 92, hmCount = 8;

    interface Gen4Item extends Pokemon.Item {
        bagPocket: string;
    }

    export class Gen4 extends NDSReader {

        private tmHmMoves: string[];

        public CheckIfCanSurf(runState: TPP.RunStatus) { //HGSS
            return (runState.badges & 8) == 8; //Fog Badge
        }

        GetPokemonSprite(id: number, form = 0, gender = "", shiny = false, generic = false) {
            const spriteFolder = TPP.Server.getConfig().spriteFolder;
            let possibleSpriteUrls: string[] = [];
            possibleSpriteUrls.push(`./img/sprites/${spriteFolder}/${shiny ? "shiny/" : ""}${gender == "Female" ? "female/" : ""}${id}${form ? `-${form}` : ''}.png`);
            possibleSpriteUrls.push(`./img/sprites/${spriteFolder}/${shiny ? "shiny/" : ""}${gender == "Female" ? "female/" : ""}${id}${form ? `-${form}` : '-0'}.png`);
            possibleSpriteUrls.push(`./img/sprites/${spriteFolder}/${shiny ? "shiny/" : ""}${id}${form ? `-${form}` : ''}.png`);
            possibleSpriteUrls.push(`./img/sprites/${spriteFolder}/${shiny ? "shiny/" : ""}${id}${form ? `-${form}` : '-0'}.png`);
            possibleSpriteUrls.push(`./img/sprites/${spriteFolder}/${shiny ? "shiny/" : ""}${id}.png`);
            possibleSpriteUrls.push(`./img/sprites/${spriteFolder}/${id}.png`);
            for (let i = 0; i < possibleSpriteUrls.length; i++) {
                if (fs.existsSync(__dirname + '/' + possibleSpriteUrls[i]))
                    return possibleSpriteUrls[i];
            }
            return './img/generic/pokemon/0.png'; //whatever
        }

        GetItemSprite(id: number) {
            return `./img/items/blackwhite/${id}.png`;
        }

        ConvertText(text: string) {
            return text || '';
        }

        GetCurrentMapEncounters(map: Pokemon.Map, state: TPP.TrainerData) {
            if (!map.encounters) return emptyEncounterSet;
            const hour = new Date().getHours();
            if (hour > timeThresholdHours[0]) {
                if (hour > timeThresholdHours[1]) {
                    if (hour > timeThresholdHours[2]) {
                        return map.encounters.nite;
                    }
                    return map.encounters.day;
                }
                return map.encounters.morn;
            }
            return map.encounters.nite;
        }

        constructor(basePath: string) {
            super(basePath);

            const arm9 = this.readArm9();
            const stringsNarc = this.readNARC(config.TextStrings);
            const pokeNarc = this.readNARC(config.PokemonStats);
            const moveNarc = this.readNARC(config.MoveData);
            const itemNarc = this.readNARC(config.ItemData);
            const encounterNarc = this.readNARC(config.EncounterData);
            // const pokegrNarc = this.readNARC(config.PokemonGraphics);
            // const badgesgrNarc = this.readNARC(config.BadgeGraphics);
            // const itemgrNarc = this.readNARC(config.ItemGraphics);

            function getStrings(index: number) {
                return Tools.PokeText.GetStrings(stringsNarc.files[index]);
            }

            const moveNames = getStrings(config.TextOffsets.MoveNames);
            const pokemonNames = getStrings(config.TextOffsets.PokemonNames);
            const abilityNames = getStrings(config.TextOffsets.AbilityNames);
            const itemNames = getStrings(config.TextOffsets.ItemNames);
            const mapNames = getStrings(config.TextOffsets.MapNames);

            this.abilities = abilityNames;

            this.moves = moveNarc.files.map((data, i) => (<Pokemon.Move>{
                name: moveNames[i],
                id: i,
                accuracy: data[5],
                basePower: data[3],
                basePP: data[6],
                type: types[data[4]],
                category: moveCategories[data[2]]
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
                genderRatio: stats[16] & 0xFF,
                eggCycles: (stats[17] & 0xFF) - 1, //eggs hatch upon hitting 0 in gen 4, not ticking past 0.
                growthRate: expCurveNames[stats[19] & 0xFF],
                expFunction: expCurves[stats[19] & 0xFF],
                eggGroup1: eggGroups[stats[20] & 0xFF],
                eggGroup2: eggGroups[stats[21] & 0xFF],
                abilities: [abilityNames[stats[22] & 0xFF], abilityNames[stats[23] & 0xFF]],
                baseExp: stats[9] & 0xFF,
            }));

            const missingNo: Pokemon.Species = {
                name: "-----",
                id: 0,
                dexNumber: 0,
                type1: "Normal",
                type2: "Normal"
            } as Pokemon.Species;
            pokemon.unshift(missingNo);
            this.pokemon = pokemon;

            let tmHmMoves: number[] = (function GetTMHMMapping(tmDataPrefix = hgssTMDataPrefix) {
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

            const getItemPocket = (data: Buffer) => bagPockets[(data.readUInt16LE(8) & 0x3FF) >> 7] || "???";

            this.items = itemNarc.files.map((data, i) => (<Gen4Item>{
                id: i,
                name: itemNames[i],
                bagPocket: getItemPocket(data),
                isKeyItem: getItemPocket(data) == "Key",
                //data: data.toString('hex')
            }));
            itemNames.forEach((n, i) => this.items.some(i => i.name == n) || this.items.push({ id: i, name: n, isKeyItem: true }));

            this.tmHmMoves = tmHmMoves.map(n => this.moves[n] ? this.moves[n].name : n.toString());

            //Give TMs and HMs their move names TODO: Fix this
            this.items.filter(i => i.name.indexOf("TM") >= 0 || i.name.indexOf("HM") >= 0).forEach((tm, index) => tm.name += " " + (this.moves[tmHmMoves[index]] || { name: "???" }).name);

            const speciesToEncounter = (id: number, rate = 1, requiredItem = null) => (<Pokemon.EncounterMon>{ rate: rate, speciesId: id, species: this.GetSpecies(id) || missingNo, requiredItem: requiredItem && this.GetItem(requiredItem) });
            const rodExp = /.* Rod$/;

            //HGSS
            const encounters = encounterNarc.files.map(data => {
                const rates = data.slice(0, 5).map(i => i);
                const surfMons = rates[1] ? this.CombineDuplicateEncounters(
                    this.ReadStridedData(data, 100, 4, 5).map((s, r) => speciesToEncounter(s.readUInt16LE(2), encounterRatesWater[r]))
                ) : new Array<Pokemon.EncounterMon>();
                const fishMons = new Array<Pokemon.EncounterMon>().concat(
                    ...this.items.filter(i => rodExp.test(i.name))
                        .map((rod, i) => rates[2 + i] ? this.CombineDuplicateEncounters(
                            this.ReadStridedData(data, 128 + (4 * 5 * i), 4, 5).map((s, r) => speciesToEncounter(s.readInt16LE(2), encounterRatesWater[r], rod.id))
                        ) : [])
                );
                const hiddenMons = this.CombineDuplicateEncounters(new Array<Pokemon.EncounterMon>().concat(
                    //radio encounters
                    this.ReadStridedData(data, 92, 2, 4).map(s => s.readUInt16LE(0)).filter(s => s > 0).map(s => speciesToEncounter(s)),
                    //rock smash (also stores level)
                    rates[2] ? this.ReadStridedData(data, 120, 4, 2).map((s, r) => speciesToEncounter(s.readUInt16LE(2), encounterRatesRockSmash[r])) : [],
                    //swarm
                    this.ReadStridedData(data, 188, 2, 4).map(s => s.readUInt16LE(0)).filter(s => s > 0).map(s => speciesToEncounter(s)),
                ));
                return <Pokemon.Encounters>{
                    morn: <Pokemon.EncounterSet>{
                        grass: rates[0] ? this.CombineDuplicateEncounters(this.ReadStridedData(data, 20, 2, 12).map((s, r) => speciesToEncounter(s.readUInt16LE(0), encounterRatesGrass[r]))) : [],
                        hidden_grass: hiddenMons,
                        surfing: surfMons,
                        fishing: fishMons
                    },
                    day: <Pokemon.EncounterSet>{
                        grass: rates[0] ? this.CombineDuplicateEncounters(this.ReadStridedData(data, 44, 2, 12).map((s, r) => speciesToEncounter(s.readUInt16LE(0), encounterRatesGrass[r]))) : [],
                        hidden_grass: hiddenMons,
                        surfing: surfMons,
                        fishing: fishMons
                    },
                    nite: <Pokemon.EncounterSet>{
                        grass: rates[0] ? this.CombineDuplicateEncounters(this.ReadStridedData(data, 68, 2, 12).map((s, r) => speciesToEncounter(s.readUInt16LE(0), encounterRatesGrass[r]))) : [],
                        hidden_grass: hiddenMons,
                        surfing: surfMons,
                        fishing: fishMons
                    }
                };
            });

            const numMapHeaders = this.readFile(config.MapTableFile).byteLength / 16;
            for (let m = 0; m < numMapHeaders; m++) {
                const baseOffset = config.MapTableARM9Offset + m * 24;
                const mapNameIndex = (config.MapTableNameIndexSize == 2)
                    ? arm9.readUInt16LE(baseOffset + 18)
                    : arm9[baseOffset + 18];
                const wildSet = arm9[baseOffset]; //HGSS
                this.maps.push(<Pokemon.Map>{
                    id: m,
                    name: mapNames[mapNameIndex],
                    encounters: wildSet < 0xFF ? encounters[wildSet] : emptyEncounters
                });
            }

            this.areas = mapNames;

            //this.ballIds = this.items.filter((i: Gen4Item) => i.bagPocket == "Balls").map(i => i.id); //too many false positives

            console.log(`Loaded ${this.moves.length} moves with ${moveNames.length} names.`);
            console.log(`Loaded ${this.pokemon.length} pokemon with ${pokemonNames.length} names.`);
            console.log(`Loaded ${this.abilities.length} abilites with ${abilityNames.length} names.`);
            console.log(`Loaded ${this.items.length} items with ${itemNames.length} names.`);
            console.log(`Loaded ${this.maps.length} maps with ${mapNames.length} names.`);
        }
    }
}