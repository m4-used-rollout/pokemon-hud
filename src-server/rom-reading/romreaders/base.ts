/// <reference path="../../pokemon/map.ts" />
/// <reference path="../../pokemon/move.ts" />
/// <reference path="../../pokemon/item.ts" />

namespace RomReader {
    export abstract class RomReaderBase {
        protected pokemon: Pokemon.Species[] = [];
        protected moves: Pokemon.Move[] = [];
        protected items: Pokemon.Item[] = [];
        protected maps: Pokemon.Map[] = [];
        protected areas: string[] = [];
        protected abilities: string[] = [];
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

        GetSpecies(id: number) {
            return this.pokemon.filter(p => p.id == id).pop() || <Pokemon.Species>{};
        }
        GetMove(id: number) {
            return this.moves.filter(m => m.id == id).pop() || <Pokemon.Move>{};
        }
        GetMap(id: number, bank = 0) {
            return this.maps.filter(m => id == m.id && bank == 0 || bank == m.bank).pop() || <Pokemon.Map>{};
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

    }
}