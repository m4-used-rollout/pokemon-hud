declare interface SplitEvent {
    Group: "Badges" | "Elite Four" | "Champions",
    Name: string;
    Image: string;
    Time: string;
    Attempts?: number;
    ClassId?: number;
    TrainerId?: number;
}

declare interface Splits extends Array<SplitEvent> { }