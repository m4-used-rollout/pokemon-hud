/// <reference path="../../pokemon/map.ts" />
/// <reference path="../../pokemon/move.ts" />
/// <reference path="../../pokemon/item.ts" />
/// <reference path="../../pokemon/trainer.ts" />
/// <reference path="../tools/sprites.ts" />
/// <reference path="../../../ref/runstatus.d.ts" />

namespace RomReader {
    export abstract class RomReaderBase {
        protected pokemon: Pokemon.Species[] = [];
        protected moves: Pokemon.Move[] = [];
        protected items: Pokemon.Item[] = [];
        protected maps: Pokemon.Map[] = [];
        protected pokemonSprites: { base: string, shiny: string }[][] = [];
        protected trainerSprites: string[] = [];
        protected frameBorders: string[] = [];
        protected trainers: Pokemon.Trainer[] = [];
        protected areas: string[] = [];
        protected abilities: string[] = [];
        protected levelCaps = [100];  //some romhacks have these
        protected ballIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 492, 493, 494, 495, 496, 497, 498, 499, 500, 576, 851];
        protected natures = ["Hardy", "Lonely", "Brave", "Adamant", "Naughty", "Bold", "Docile", "Relaxed", "Impish", "Lax", "Timid", "Hasty", "Serious", "Jolly", "Naive", "Modest", "Mild", "Quiet", "Bashful", "Rash", "Calm", "Gentle", "Sassy", "Careful", "Quirky"];
        protected characteristics = {
            hp: ["Loves to eat", "Takes plenty of siestas", "Nods off a lot", "Scatters things often", "Likes to relax"],
            atk: ["Proud of its power", "Likes to thrash about", "A little quick tempered", "Likes to fight", "Quick tempered"],
            def: ["Sturdy body", "Capable of taking hits", "Highly persistent", "Good endurance", "Good perseverance"],
            speed: ["Likes to run", "Alert to sounds", "Impetuous and silly", "Somewhat of a clown", "Quick to flee"],
            spatk: ["Highly curious", "Mischievous", "Thoroughly cunning", "Often lost in thought", "Very finicky"],
            spdef: ["Strong willed", "Somewhat vain", "Strongly defiant", "Hates to lose", "Somewhat stubborn"]
        }

        abstract ConvertText(text: string | Buffer | number[]): string;
        abstract GetCurrentMapEncounters(map: Pokemon.Map, state: TPP.TrainerData): Pokemon.EncounterSet;
        abstract GetForm(pokemon: TPP.Pokemon): number;

        GetSpecies(id: number) {
            return this.pokemon.filter(p => p.id == id).pop() || <Pokemon.Species>{};
        }
        GetMove(id: number) {
            return this.moves.filter(m => m.id == id).pop() || <Pokemon.Move>{};
        }
        GetMap(id: number, bank = 0) {
            return this.maps.filter(m => id == m.id && (!bank || bank == m.bank)).pop() || <Pokemon.Map>{};
        }
        GetItem(id: number) {
            return this.items.filter(i => i.id == id).pop() || <Pokemon.Item>{};
        }
        GetAbility(id: number) {
            return this.abilities[id] || '';
        }
        GetAreaName(id: number) {
            return this.areas[id] || '';
        }
        ItemIsBall(id: number | Pokemon.Item) {
            if ((<Pokemon.Item>id).id) {
                id = (<Pokemon.Item>id).id;
            }
            return this.ballIds.indexOf(<number>id) >= 0;
        }
        GetCurrentLevelCap(badges: number) {
            if (this.levelCaps.length < 2) {
                return this.levelCaps.map(l => l).pop() || 100;
            }
            let badgeCount = 0;
            while (badges) {
                badges &= badges - 1;
                badgeCount++;
            }
            if (badgeCount >= this.levelCaps.length) {
                return this.levelCaps.map(l => l).pop();
            }
            return this.levelCaps[badgeCount];
        }
        GetNature(id: number) {
            return this.natures[id];
        }
        GetCharacteristic(stats: Pokemon.Stats, pv: number) {
            //derived from http://bulbapedia.bulbagarden.net/wiki/Characteristic
            if (this.characteristics) {
                let highestStat = Math.max.apply(Math, Object.keys(stats).map(s => stats[s]));
                let winningCategories = Object.keys(stats).filter(s => stats[s] == highestStat);
                let winningCategory: string;
                if (winningCategories.length == 1) {
                    winningCategory = winningCategories.pop();
                }
                else { //resolve tie
                    let categories = Object.keys(this.characteristics);
                    for (let i = pv; i < pv + 6; i++) {
                        if (winningCategories.indexOf(categories[i % 6]) >= 0) {
                            winningCategory = categories[i % 6];
                            break;
                        }
                    }
                }
                if (winningCategory) {
                    return this.characteristics[winningCategory][highestStat % 5];
                }
            }
            return null;
        }
        GetAllMapEncounters(map: Pokemon.Map) {
            //Collapse all encounter sets for a map into a single encounterset
            let encounters: Pokemon.EncounterSet = {};
            if (map && map.encounters) {
                Object.keys(map.encounters).forEach(timeOfDay => Object.keys(map.encounters[timeOfDay])
                    .forEach(group => encounters[group] = Array.prototype.concat.apply(encounters[group] || [], map.encounters[timeOfDay][group] || [])));
            }
            return encounters;
        }
        GetTrainer(id: number, classId: number = null) {
            return this.trainers.filter(t => t.classId == classId && t.id == id).shift() || this.trainers.filter(t => t.classId == classId).shift() || <Pokemon.Trainer>{};
        }
        GetPokemonSprite(id: number, form = 0, shiny = false) {
            return ((this.pokemonSprites[id] || [])[form] || { base: null, shiny: null })[shiny ? "shiny" : "base"] || `./img/sprites/${TPP.Server.getConfig().spriteFolder}/${id}.gif`;
        }
        GetTrainerSprite(id: number) {
            return this.trainerSprites[id] || "./img/empty-sprite.png";
        }
        GetFrameBorder(id: number) {
            return this.frameBorders[id % this.frameBorders.length];
        }
        CachePokemonSprite(id: number, data: string, form = 0, shiny = false) {
            ((this.pokemonSprites[id] || [])[form] || { base: '', shiny: '' })[shiny ? "shiny" : "base"] = data;
        }
        CacheTrainerSprite(id: number, data: string) {
            this.trainerSprites[id] = data;
        }
        CacheFrameBorder(id: number, data: string) {
            this.frameBorders[id] = data;
        }
        CheckIfCanSurf(runState: TPP.RunStatus) {
            //check all PC and Party pokemon for anyone who knows Surf
            return (runState.pc.boxes || []).map(b => b.box_contents).reduce((arr: TPP.Pokemon[], val: TPP.Pokemon[]) => val, runState.party || [])
                .some(p => !!p && p.moves.some(m => !!m && this.surfExp.test(m.name)));
        }
        CheckIfCanFish(runState: TPP.RunStatus) {
            return true;
            //DexNav will filter out any fishing encounters that require a specific rod
            //Override this if there's another restriction.
        }
        CalcHiddenPowerType(stats: TPP.Stats) {
            const types = ['Fighting', 'Flying', 'Poison', 'Ground', 'Rock', 'Bug', 'Ghost', 'Steel', 'Fire', 'Water', 'Grass', 'Electric', 'Psychic', 'Ice', 'Dragon', 'Dark'];
            return types[Math.floor(((stats.hp % 2) + ((stats.attack % 2) << 1) + ((stats.defense % 2) << 2) + ((stats.speed % 2) << 3) + ((stats.special_attack % 2) << 4) + ((stats.special_defense % 2) << 5)) * 15 / 63)];
        }
        CalcHiddenPowerPower(stats: TPP.Stats) {
            return Math.floor((((stats.hp >> 1) % 2) + (((stats.attack >> 1) % 2) << 1) + (((stats.defense >> 1) % 2) << 2) + (((stats.speed >> 1) % 2) << 3) + (((stats.special_attack >> 1) % 2) << 4) + (((stats.special_defense >> 1) % 2) << 5)) * 40 / 63) + 30;
        }
        private surfExp = /^surf$/i;
    }
}