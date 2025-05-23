/// <reference path="generic.ts" />

namespace RomReader {
    const moveCategories = ["Status", "Physical", "Special"];
    const types = ["Normal", "Fighting", "Flying", "Poison", "Ground", "Rock", "Bug", "Ghost", "Steel", "Fire", "Water", "Grass", "Electric", "Psychic", "Ice", "Dragon", "Dark", "Fairy"];
    const expCurves = [Pokemon.ExpCurve.MediumFast, Pokemon.ExpCurve.Erratic, Pokemon.ExpCurve.Fluctuating, Pokemon.ExpCurve.MediumSlow, Pokemon.ExpCurve.Fast, Pokemon.ExpCurve.Slow];
    const expCurveNames = ["Medium Fast", "Erratic", "Fluctuating", "Medium Slow", "Fast", "Slow"];

    const formSeenMap: { [key: number]: number[] } = { 3: [808], 6: [809, 810], 9: [811], 15: [812], 18: [813], 19: [814], 20: [815, 816], 25: [817, 818, 819, 820, 821, 822, 823], 26: [824], 27: [825], 28: [826], 37: [827], 38: [828], 50: [829], 51: [830], 52: [831], 53: [832], 65: [833], 74: [834], 75: [835], 76: [836], 80: [837], 88: [838], 89: [839], 94: [840], 103: [841], 105: [842, 843], 115: [844], 127: [845], 130: [846], 142: [847], 150: [848, 849], 181: [850], 201: [851, 852, 853, 854, 855, 856, 857, 858, 859, 860, 861, 862, 863, 864, 865, 866, 867, 868, 869, 870, 871, 872, 873, 874, 875, 876, 877], 208: [878], 212: [879], 214: [880], 229: [881], 248: [882], 254: [883], 257: [884], 260: [885], 282: [886], 302: [887], 303: [888], 306: [889], 308: [890], 310: [891], 319: [892], 323: [893], 334: [894], 351: [895, 896, 897], 354: [898], 359: [899], 362: [900], 373: [901], 376: [902], 380: [903], 381: [904], 382: [905], 383: [906], 384: [907], 386: [908, 909, 910], 412: [911, 912], 413: [913, 914], 414: [915, 916], 421: [917], 422: [918], 423: [919], 428: [920], 445: [921], 448: [922], 460: [923], 475: [924], 479: [925, 926, 927, 928, 929], 487: [930], 492: [931], 493: [932, 933, 934, 935, 936, 937, 938, 939, 940, 941, 942, 943, 944, 945, 946, 947, 948], 531: [949], 550: [950], 555: [951], 585: [952, 953, 954], 586: [955, 956, 957], 641: [958], 642: [959], 645: [960], 646: [961, 962], 647: [963], 648: [964], 649: [965, 966, 967, 968], 658: [969, 970], 664: [971, 972, 973, 974, 975, 976, 977, 978, 979, 980, 981, 982, 983, 984, 985, 986, 987, 988, 989], 665: [990, 991, 992, 993, 994, 995, 996, 997, 998, 999, 1000, 1001, 1002, 1003, 1004, 1005, 1006, 1007, 1008], 666: [1009, 1010, 1011, 1012, 1013, 1014, 1015, 1016, 1017, 1018, 1019, 1020, 1021, 1022, 1023, 1024, 1025, 1026, 1027], 669: [1028, 1029, 1030, 1031], 670: [1032, 1033, 1034, 1035, 1036], 671: [1037, 1038, 1039, 1040], 676: [1041, 1042, 1043, 1044, 1045, 1046, 1047, 1048, 1049], 678: [1050], 681: [1051], 710: [1052, 1053, 1054], 711: [1055, 1056, 1057], 716: [1058], 718: [1059, 1060, 1061, 1062], 719: [1063], 720: [1064], 735: [1065], 738: [1066], 741: [1067, 1068, 1069], 743: [1070], 744: [1071], 745: [1072, 1073], 746: [1074], 752: [1075], 754: [1076], 758: [1077], 773: [1078, 1079, 1080, 1081, 1082, 1083, 1084, 1085, 1086, 1087, 1088, 1089, 1090, 1091, 1092, 1093, 1094], 774: [1095, 1096, 1097, 1098, 1099, 1100, 1101, 1102, 1103, 1104, 1105, 1106, 1107], 777: [1108], 778: [1109, 1110, 1111], 784: [1112], 800: [1113, 1114, 1115], 801: [1116] };

    interface SearchableTrainer extends Pokemon.Trainer {
        partySize: number;
        partySpecies: number[];
        partyLevels: number[];
    }

    export class Gen7 extends Generic {

        protected trainers: SearchableTrainer[] = [];

        constructor() {
            super("gen7");
            this.textAdjust["\ue08e"] = "♂";
            this.textAdjust["\ue08f"] = "♀";
            this.pokemon.forEach(s => {
                s.name = this.ConvertText(s.name);
            });
            this.maps = require('./data/gen7/maps.json');
            this.maps.forEach(m => Object.keys(m.encounters).forEach(k => Object.keys(m.encounters[k] || {}).forEach(j => (m.encounters[k][j] || []).forEach(e => e.species = this.GetSpecies(e.speciesId)))));
            this.trainers = require('./data/gen7/trainers.json');
            require('./data/gen7/movelearns.json').forEach((entry: { speciesId: number, moveLearns: { level: number, id: number }[] }) => {
                this.moveLearns[entry.speciesId] = entry.moveLearns.map(ml => {
                    const move = this.GetMove(ml.id);
                    const movelearn: Pokemon.MoveLearn = {} as Pokemon.MoveLearn;
                    Object.keys(move).forEach(k => movelearn[k] = move[k]);
                    movelearn.level = ml.level;
                    return movelearn;
                });
            });
        }

        GetCurrentMapEncounters(map: Pokemon.Map, state: TPP.TrainerData): Pokemon.EncounterSet {
            if (!map || (!map.id && map.id !== 0))
                return null;
            let dayTime = new Date().getHours() >= 6 && new Date().getHours() < 18;
            return map.encounters[dayTime ? "day" : "night"]; //Sun
            //return map.encounters[dayTime ? "night" : "day"]; //Moon
        }

        CollapseSeenForms(seen: number[]) {
            seen.filter(s => s > 807).map(s => Object.keys(formSeenMap).filter(k => formSeenMap[parseInt(k)].some(e => e == s)).map(parseInt).pop() || s).forEach(s => seen.indexOf(s) < 0 && seen.push(s));
            return seen.filter(s => s <= 807).filter((s, i, arr) => arr.indexOf(s) == i);
        }

        CalculateShiny(pkmn: TPP.Pokemon) {
            pkmn.shiny = (((pkmn.personality_value >>> 16) ^ (pkmn.personality_value & 0xFFFF)) >>> 4) == (pkmn.original_trainer.id ^ pkmn.original_trainer.secret) >> 4;
        }

        TrainerSearch(name: string, className: string, partySize: number, partySpecies: number[], partyLevels: number[]) {
            let trainers = this.trainers.filter(t => t.name == name);
            if (trainers.length == 1)
                return trainers.shift();
            trainers = trainers.filter(t => t.className == className);
            if (trainers.length == 1)
                return trainers.shift();
            trainers = trainers.filter(t => t.partySize = partySize);
            if (trainers.length == 1)
                return trainers.shift();
            trainers = trainers.filter(t => t.partySpecies.sort().join() == partySpecies.sort().join());
            if (trainers.length == 1)
                return trainers.shift();
            trainers = trainers.filter(t => t.partyLevels.sort().join() == partyLevels.sort().join());
            return trainers.shift();
        }
    }
}