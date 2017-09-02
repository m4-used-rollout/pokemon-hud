namespace Pokemon {
    export interface Move {
        name: string;
        id: number;
        basePower: number;
        basePP: number;
        accuracy: number;
        type: string;
        contestData?: ContestData;
    }
    
    export interface ContestData {
        effect: string;
        type: string;
        appeal: string;
        jamming: string;
    }
}