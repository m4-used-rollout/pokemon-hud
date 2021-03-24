declare interface Emote {
    id: string;
    name: string;
}

declare interface EmoteEffects {
    [key: string]: {
        moveName: string;
        moveId: number;
        badges: number
        hpTypeName: string;
        hpTypeId: number;
        enemyMoveName?: string;
        enemyMoveId?: number;
    },
}

declare interface TPPTrendingEmotes extends Array<[Emote, number]> { }

declare interface TrendingEmote extends Emote {
    weight: number;
    locked: boolean;
}