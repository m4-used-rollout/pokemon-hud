declare namespace JoyPad {
    export interface Generic {
        left?: boolean;
        right?: boolean;
        down?: boolean;
        up?: boolean;
        A?: boolean;
        B?: boolean;
        select?: boolean;
        start?: boolean;
    }
    export interface BizHawk {
        Left?: boolean;
        Right?: boolean;
        Down?: boolean;
        Up?: boolean;
        A?: boolean;
        B?: boolean;
        Select?: boolean;
        Start?: boolean;
        L?: boolean;
        R?: boolean;
        Power?: boolean;
        "Light Sensor"?: number;
        "Tilt X"?: number;
        "Tilt Y"?: number;
        "Tilt Z"?: number;
    }
}