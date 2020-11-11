namespace Pokemon {
    export interface Item {
        id: number;
        name: string;
        isKeyItem: boolean;
        isCandy?:boolean; //TTH
        pluralName?:string; //TTH
    }
}