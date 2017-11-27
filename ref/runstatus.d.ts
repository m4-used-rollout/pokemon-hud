declare namespace TPP {

    //whole structure
    export interface RunStatus extends TrainerData {
        party: PartyData;
        pc: CombinedPCData;
        in_battle: boolean;
        battle_kind?: string;
        wild_species?: PokemonSpecies;
        enemy_trainers?: EnemyTrainer[];
        enemy_party?: EnemyParty;
    }

    //sent from lua
    export interface TrainerData extends OverlayData {
        ball_count: number;
        caught: number;
        caught_list: number[];
        coins?: number;
        daycare?: Pokemon[];
        extra?: { [key: string]: any };
        id: number;
        items: {
            [key: string]: Item[];
            items?: Item[];
            free_space?: Item[];
            key?: Item[];
            balls?: Item[];
            medicine?: Item[];
            berries?: Item[];
            tms?: Item[];
            z_crystals?: Item[];
            rotom_powers?: Item[];
            pc?: Item[];
        };
        level_cap?: number;
        money: number;
        name: string;
        options: Options;
        seen: number;
        seen_list: number[];
        secret: number;
        rival_name?: string;
        time?: {
            d: string;
            h: number;
            m: number;
            s: number;
        };
    }

    export interface OverlayData {
        map_bank?: number;
        map_id?: number;
        map_name?: string;
        area_id?: number;
        area_name?: string;
        x: number;
        y: number;
        evolution_is_happening: boolean;
        badges: number;
    }

    export interface PartyData extends Array<PartyPokemon> { }

    export interface PCData {
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

    export interface PokemonSpecies {
        id: number;
        name: string;
        type1?: string;
        type2?: string;
        catch_rate?: number;
        egg_cycles?: number;
        egg_type1?: string;
        egg_type2?: string;
        gender_ratio?: number;
        growth_rate?: string;
        national_dex?: number;
        abilities?: string[];
        do_not_flip_sprite?: boolean;
    }

    export interface Pokemon {
        personality_value: number;
        original_trainer: Trainer;
        name: string;
        held_item: Item;
        gender: string;
        shiny: boolean;
        form?: number;
        species: PokemonSpecies;
        experience: {
            current: number;
            next_level?: number;
            this_level?: number;
            remaining?: number;
        };
        level: number;
        moves: Move[];
        language?: number;
        ability?: string;
        nature?: string;
        characteristic?: string;
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
            map_id?: number;
            area_id?: number;
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
        status: string;
        sleep_turns?: number;
        stats: Stats;
        pokerus_remaining?: number;
        is_evolving?: boolean;
    }

    export interface Item {
        id: number;
        name: string;
        count?: number;
    }

    export interface EnemyParty extends Array<{
        species: PokemonSpecies;
        health: number[];
        active?: boolean;
    }> { }

    export interface EnemyTrainer extends Trainer {
        class_id?: number;
        class_name?: string;
        pic_id?: number;
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
        pp_up?: number;
        max_pp?: number;
        type?: string;
        accuracy?: number;
        base_power?: number;
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

    export interface Options {
        [key: string]: string;
        box_mode?: string;
        button_mode?: string;
        frame?: string;
        text_speed: string;
        sound: string;
        battle_style: string;
        battle_scene: string;
    }
}
