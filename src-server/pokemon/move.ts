namespace Pokemon {
    export interface Move {
        name: string;
        id: number;
        basePower: number;
        basePP: number;
        accuracy: number;
        type: string;
    }
}