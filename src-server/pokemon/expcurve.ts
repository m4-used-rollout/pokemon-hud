namespace Pokemon {
    export namespace ExpCurve {
        //based on http://bulbapedia.bulbagarden.net/wiki/Experience

        export interface CalcExp {
            (level: number): number;
        }

        function FloorMe(expFunc:CalcExp):CalcExp {
            return level => Math.floor(expFunc(level));
        }

        export var Erratic = FloorMe(level => {
            if (level < 50)
                return level * level * level * (100 - level) / 50;
            if (level < 68)
                return level * level * level * (150 - level) / 100;
            if (level < 98)
                return level * level * level * Math.floor((1911 - (10 * level)) / 3) / 500;
            return level * level * level * (160 - level) / 100;
        })
        
        export var Fast = FloorMe(level => 4 * level * level * level / 5);

        export var MediumFast = FloorMe(level => level * level * level);

        export var MediumSlow = FloorMe(level => ((6 / 5) * level * level * level) - (15 * level * level) + (100 * level) - 140);

        export var Slow = FloorMe(level => 5 * level * level * level / 4);

        export var Fluctuating = FloorMe(level => {
            if (level < 15)
                return level * level * level * ((Math.floor((level + 1) / 3) + 24) / 50);
            if (level < 36)
                return level * level * level * ((level + 14) / 50);
            return level * level * level * ((Math.floor(level / 2) + 32) / 50);
        });

        export function ExpToLevel(exp: number, expFunc: CalcExp) {
            for (let level = 1; level <= 100; level++)
                if (expFunc(level) >= exp)
                    return level - 1;
            return 100;
        }
    }
}