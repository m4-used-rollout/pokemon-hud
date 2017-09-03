namespace Pokemon {
    export interface Trainer {
        classId: number;
        className: string;
        id: number;
        name: string;
        spriteId: number;
        gender?: string;
    }
}