namespace Pokemon {
    export interface Move {
        name: string;
        id: number;
        basePower: number;
        basePP: number;
        accuracy: number;
        type: string;
        physical?:boolean;
        special?:boolean;
        status?:boolean;
        contestData?: ContestData;
    }

    export interface ContestData {
        effect: string;
        type: string;
        appeal: string;
        jamming: string;
    }

    export interface MoveLearn extends Move {
        level: number;
    }
}