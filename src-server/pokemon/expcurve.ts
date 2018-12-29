namespace Pokemon {
    export namespace ExpCurve {
        //based on http://bulbapedia.bulbagarden.net/wiki/Experience

        export interface CalcExp {
            (level: number): number;
        }

        function FloorWrapper(expFunc: CalcExp): CalcExp {
            return level => Math.floor(expFunc(level));
        }

        //(a/b)*n**3 + c*n**2 + d*n - e
        function BaseGrowthFunc(a: number, b: number, c: number, d: number, e: number) {
            return FloorWrapper(n => (a / b) * n * n * n + c * n * n + d * n - e);
        }

        export const MediumFast = BaseGrowthFunc(1, 1, 0, 0, 0);

        export const SlightlyFast = BaseGrowthFunc(3, 4, 10, 0, 30);

        export const SlightlySlow = BaseGrowthFunc(3, 4, 20, 0, 70);

        export const MediumSlow = BaseGrowthFunc(6, 5, -15, 100, 140);

        export const Fast = BaseGrowthFunc(4, 5, 0, 0, 0);

        export const Slow = BaseGrowthFunc(5, 4, 0, 0, 0);

        // export const Fast = FloorMe(level => 4 * level * level * level / 5);

        // export const MediumFast = FloorMe(level => level * level * level);

        // export const MediumSlow = FloorMe(level => ((6 / 5) * level * level * level) - (15 * level * level) + (100 * level) - 140);

        // export const Slow = FloorMe(level => 5 * level * level * level / 4);


        export const Erratic = FloorWrapper(level => {
            if (level < 50)
                return level * level * level * (100 - level) / 50;
            if (level < 68)
                return level * level * level * (150 - level) / 100;
            if (level < 98)
                return level * level * level * Math.floor((1911 - (10 * level)) / 3) / 500;
            return level * level * level * (160 - level) / 100;
        })

        export var Fluctuating = FloorWrapper(level => {
            if (level < 15)
                return level * level * level * ((Math.floor((level + 1) / 3) + 24) / 50);
            if (level < 36)
                return level * level * level * ((level + 14) / 50);
            return level * level * level * ((Math.floor(level / 2) + 32) / 50);
        });

        export function ExpToLevel(exp: number, expFunc: CalcExp) {
            if (!expFunc)
                return 0;
            for (let level = 1; level <= 100; level++)
                if (expFunc(level) > exp)
                    return level - 1;
            return 100;
        }
    }
}