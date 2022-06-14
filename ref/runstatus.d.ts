declare namespace TPP {

    //whole structure
    export interface RunStatus extends TrainerData, BattleStatus, RunSpecificItems {
        party: PartyData;
        pc: CombinedPCData;
        game?: string;
        generation?: number;
        updates_paused?: boolean;
        transitioning?: boolean;
    }

    //sent from lua
    export interface BattleStatus {
        in_battle: boolean;
        battle_party?: TPP.PartyData;
        battle_kind?: "Wild" | "Trainer";
        enemy_trainers?: EnemyTrainer[];
        enemy_party?: EnemyParty;
        battle_id?: number;
    }

    export interface TrainerData extends OverlayData {
        ball_count?: number;
        caught?: number;
        caught_list?: number[];
        coins?: number;
        daycare?: Pokemon[];
        extra?: { [key: string]: any };
        gender?: "Male" | "Female";
        last_caught_pokemon?: Pokemon;
        id?: number;
        items?: {
            [key: string]: Item[];
            items?: Item[];
            free_space?: Item[];
            key?: Item[];
            balls?: Item[];
            medicine?: Item[];
            mail?: Item[];
            battle?: Item[];
            berries?: Item[];
            tms?: Item[];
            z_crystals?: Item[];
            rotom_powers?: Item[];
            pc?: Item[];
        };
        level_cap?: number;
        money?: number;
        name?: string;
        nickname?: string;
        options?: Options;
        seen?: number;
        seen_list?: number[];
        secret?: number;
        stickers?: number;
        rival_name?: string;
        partner_name?: string;
        mom_name?: string;
        party_fitness?: number;
        phone_book?: string[];
        rematch_available?: number;
        time?: {
            d: string;
            h: number;
            m: number;
            s: number;
        };
    }

    export interface OverlayData extends Goals {
        map_bank?: number;
        map_id?: number;
        map_name?: string;
        area_id?: number;
        area_name?: string;
        x?: number;
        y?: number;
        z?: number;
        evolution_is_happening?: boolean;
        music_id?: number;
    }

    export interface Goals {
        badges?: number;
        frontier_symbols?: number;
        trick_house?: ("Incomplete" | "Found Scroll" | "Complete")[];
        hall_of_fame_entries?: number;
        game_stats?: { [key: string]: number };
        events?: Event[];
        puzzleTotal?: number;
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
        base_stats?: Stats;
        held_items?: Item[] | number[] | string[];
        tm_moves?: Move[] | number[] | string[];
        evolutions?: Evolution[];
    }

    export interface Evolution {
        level?: number;
        required_item?: Item;
        is_trade?: boolean;
        required_happiness?: number;
        required_map_id?: number;
        required_map_name?: string;
        required_time_of_day?: "Morn" | "Day" | "Night" | "MornDay";
        special_condition?: string;
    }

    export interface Pokemon {
        personality_value: number;
        encryption_constant?: number;
        original_trainer: Trainer;
        name: string;
        held_item: Item;
        gender: string;
        shiny: boolean;
        shiny_value?: number;
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
        language?: string;
        ability?: string;
        nature?: string;
        characteristic?: string;
        marking?: string;
        ivs?: Stats;
        evs?: Stats;
        condition?: ContestStats;
        friendship?: number;
        next_move?: MoveLearn;
        pokerus?: {
            infected: boolean;
            days_left: number;
            strain: number;
            cured: boolean;
        }
        met: {
            map_id?: number;
            area_id?: number;
            area_name?: string;
            area_id_egg?: number;
            area_name_egg?: string;
            level: number;
            game: string;
            date?: string;
            date_egg_received?: string;
            time_of_day?: string;
            caught_in?: string;
            caught?: string;
            evolved?: string[];
        }
        ribbons: string[]
        is_egg: boolean;
        cp?: number;
        fitness?: number;
    }

    export interface BoxedPokemon extends Pokemon {
        box_slot?: number;
    }

    export interface PartyPokemon extends Pokemon {
        health: number[];
        status: string;
        sleep_turns?: number;
        stats: Stats;
        pokerus_remaining?: number;
        is_evolving?: boolean;
        capsule?: number;
        buffs?: {
            accuracy: number;
            evasion: number;
        } & TPP.Stats;
    }

    export interface ShadowPokemon extends PartyPokemon {
        is_shadow?: boolean;
        shadow_id: number;
        purification: {
            current: number;
            initial?: number;
        };
        in_hyper_mode?: boolean;
        shadow_exp: number;
        catch_rate: number;
    }

    export interface Item {
        id: number;
        name: string;
        count?: number;
        isCandy?: boolean;
        pluralName?: string;
    }

    export interface EnemyParty extends Array<{
        species: PokemonSpecies;
        health: number[];
        active?: boolean;
        form?: number;
        shiny?: boolean;
        gender?: string;
        cp?: number;
        fitness?: number;
        personality_value?: number;
        is_shadow?: ShadowPokemon["is_shadow"];
        shadow_id?: ShadowPokemon["shadow_id"];
        purification?: ShadowPokemon["purification"];
        name?: string;
        buffs?: {
            accuracy: number;
            evasion: number;
        } & TPP.Stats;
    }> { }

    export interface EnemyTrainer extends Trainer {
        class_id?: number;
        class_name?: string;
        pic_id?: number;
        sequence_number?: number;
    }

    export interface Trainer {
        id: number;
        name: string;
        gender?: string;
        secret?: number;
        trainer_string?: string;
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
        contest?: ContestData;
    }

    export interface ShadowMove extends Move {
        is_shadow?: boolean;
    }

    export interface ContestData {
        type: string;
        effect: string;
        appeal: string;
        jamming: string;
    }

    export interface MoveLearn {
        level: number;
        id: number;
        name: string;
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

    export interface Event {
        group: string;
        name: string;
        time: string;
        attempts?: number;
    }

    export interface TrainerEvent extends Event {
        group: "Trainers Defeated" | "Trainers Undefeated";
        id: number;
        class_id: number;
    }

    export interface RunSpecificItems {
        //Chatty Crystal
        chatty_power_type: string;
        chatty_power: number;
    }
}
