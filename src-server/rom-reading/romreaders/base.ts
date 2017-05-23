/// <reference path="../../pokemon/map.ts" />
/// <reference path="../../pokemon/move.ts" />
/// <reference path="../../pokemon/item.ts" />

namespace RomReader {
    export abstract class RomReaderBase {
        protected pokemon: Pokemon.Species[] = [];
        protected moves: Pokemon.Move[] = [];
        protected items: Pokemon.Item[] = [];
        protected maps: Pokemon.Map[] = [];
        protected ballIds = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,492,493,494,495,496,497,498,499,500,576,851];

        abstract ConvertText(text: string): string;

        GetSpecies(id: number) {
            return this.pokemon.filter(p => p.id == id).pop() || <Pokemon.Species>{};
        }
        GetMove(id: number) {
            return this.moves.filter(m => m.id == id).pop() || <Pokemon.Move>{};
        }
        GetMap(id: number) {
            return this.maps.filter(m => m.id == id).pop() || <Pokemon.Map>{};
        }
        GetItem(id: number) {
            return this.items.filter(i => i.id == id).pop() || <Pokemon.Item>{};
        }
        ItemIsBall(id:number|Pokemon.Item) {
            if ((<Pokemon.Item>id).id) {
                id = (<Pokemon.Item>id).id;
            }
            return this.ballIds.indexOf(<number>id) >= 0;
        }

    }
}