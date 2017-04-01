declare namespace TPP {

    //whole structure
    export interface RunStatus extends TrainerData {
        party: PartyData;
        pc: CombinedPCData;
    }

    //sent from lua
    export interface TrainerData {
        badges: number;
        caught: number;
        caught_list: number[];
        coins?: number;
        items?: Item[];
        items_key?: Item[];
        items_ball?: Item[];
        items_tm?: Item[];
        items_berry?: Item[];
        map_id: number;
        area_id: number;
        area_name: string;
        money: number;
        pc_items: Item[];
        seen: number;
        seen_list: number[];
        x: number;
        y: number;
    }

    export interface PartyData extends Array<PartyPokemon> { }

    export interface PCData {
        current_box_name: string;
        current_box_number: number;
    }

    export interface BoxData {
        box_number: number;
        box_name: string;
        box_contents: BoxedPokemon[];
    }


    //subtypes
    export interface CombinedPCData extends PCData {
        boxes: BoxData[];
    }

    export interface Pokemon {
        personality_value: number;
        original_trainer: Trainer;
        name: string;
        held_item: Item;
        gender: string;
        shiny: boolean;
        species: {
            id: number;
            name: string;
            type1?: string;
            type2?: string;
            egg_type1?: string;
            egg_type2?: string;
            growth_rate?: string;
            national_dex?: number;
        }
        experience: {
            current: number;
            next_level?: number;
            this_level?: number;
            remaining?: number;
        };
        moves: Move[];
        language?: number;
        ability?: string;
        nature?: string;
        marking?: string;
        ivs?: Stats;
        evs?: Stats;
        condition?: ContestStats;
        friendship?: number;
        pokerus?: {
            infected: boolean;
            days_left: number;
            strain: number;
            cured: boolean;
        }
        met: {
            area_id: number;
            area_name: string;
            level: number;
            game: string;
            caught_in: string;
        }
        ribbons: string[]
        is_egg: boolean;
    }

    export interface BoxedPokemon extends Pokemon {
        box_slot: number;
    }

    export interface PartyPokemon extends Pokemon {
        health: number[];
        level: number;
        status: number;
        stats: Stats;
        pokerus_remaining?: number;
    }

    export interface Item {
        id: number;
        name: string;
        count?: number;
    }

    export interface Trainer {
        id: number;
        name: string;
        gender?: string;
        secret?: number;
    }

    export interface Move {
        id: number;
        name: string;
        pp: number;
        pp_up ?: number;
        max_pp ?: number;
        type ?: string;
        accuracy ?: number;
        base_power ?: number;
    }

    export interface Stats {
        hp: number;
        attack: number;
        defense: number;
        speed: number;
        special_attack: number;
        special_defense: number;
    }

    export interface ContestStats {
        coolness: number;
        beauty: number;
        cuteness: number;
        smartness: number;
        toughness: number;
        feel: number;
    }

}
