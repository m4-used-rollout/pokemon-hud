/// <reference path="../../config/g2.ts" />
/// <reference path="../../tools/lz-gsc.ts" />
/// <reference path="../gb.ts" />

namespace RomReader {

    const config = gen2Offsets;

    // const defaultTypes = ["Normal", "Fighting", "Flying", "Poison", "Ground", "Rock", "Bird", "Bug", "Ghost", "Steel", "Fairy", "Gas", "", "Sound", "Tri", "Prism", "", "", "", "???", "Fire", "Water", "Grass", "Electric", "Psychic", "Ice", "Dragon", "Dark", "Fairy"];
    const defaultTypes = ["Normal", "Fighting", "Flying", "Poison", "Ground", "Rock", "Bird", "Bug", "Ghost", "Steel", "", "", "", "", "", "", "", "", "", "???", "Fire", "Water", "Grass", "Electric", "Psychic", "Ice", "Dragon", "Dark"]
    const eggGroups = ["???", "Monster", "Water 1", "Bug", "Flying", "Ground", "Fairy", "Plant", "Humanshape", "Water 3", "Mineral", "Indeterminate", "Water 2", "Ditto", "Dragon", "Undiscovered"];
    const expCurves = [Pokemon.ExpCurve.MediumFast, Pokemon.ExpCurve.SlightlyFast, Pokemon.ExpCurve.SlightlySlow, Pokemon.ExpCurve.MediumSlow, Pokemon.ExpCurve.Fast, Pokemon.ExpCurve.Slow];
    const expCurveNames = ["Medium Fast", "Slightly Fast", "Slightly Slow", "Medium Slow", "Fast", "Slow"];
    const bagPockets = ["???", "Item", "Key Item", "Ball", "TM/HM"];

    const trainerTypes = ["Normal", "Moves", "Item", "Moves/Item"];

    // const grassEncounterRates = [30, 30, 20, 10, 5, 4, 1];
    const grassEncounterRates = [20, 15, 15, 15, 10, 10, 5, 5, 4, 1]; // BW3
    const surfEncounterRates = [60, 30, 10];
    const encounterTimesOfDay = ['morning', 'day', 'night'];
    const fishingRods = ['oldRod', 'goodRod', 'superRod'];
    const fishingRodIds = { oldRod: 58, goodRod: 59, superRod: 61 };

    // const tmCount = 50, hmCount = 7, moveTutor = 3, itemCount = 256, dexCount = 256, moveCount = 256; //251;
    const tmCount = 50, hmCount = 5, moveTutor = 25, itemCount = 256, dexCount = 256, moveCount = 256; //BW3
    const abilityCount = 99; //Prism

    interface ClearFix { [key: number]: { start?: number[][], stop?: number[][], clearDiagonal?: boolean } };
    const pokeSpriteClearFix: ClearFix = {};

    // Gold/Bronze
    // pokeSpriteClearFix[5] = { start: [[28, 22], [36, 27]] }; //Charmeleon
    // pokeSpriteClearFix[6] = { start: [[36, 27], [37, 28], [38, 29], [39, 30]] }; //Charizard
    // pokeSpriteClearFix[8] = { start: [[36, 36]] }; //Wartortle
    // pokeSpriteClearFix[10] = { start: [[23, 35]] }; //Caterpie
    // pokeSpriteClearFix[15] = { start: [[15, 27], [16, 26]] }; //Beedrill
    // pokeSpriteClearFix[17] = { start: [[29, 42]] }; //Pidgeotto
    // pokeSpriteClearFix[18] = { start: [[16, 47], [34, 48], [39, 50], [24, 4]] }; //Pidgeot
    // pokeSpriteClearFix[21] = { start: [[40, 36]] }; //Spearow
    // pokeSpriteClearFix[24] = { start: [[15, 43]] }; //Arbok
    // pokeSpriteClearFix[25] = { start: [[36, 34]] }; //Pikachu
    // pokeSpriteClearFix[26] = { start: [[35, 21], [42, 42]] }; //Raichu
    // pokeSpriteClearFix[30] = { start: [[39, 23]] }; //Nidorina
    // pokeSpriteClearFix[32] = { start: [[37, 20]] }; //Nidoran♂
    // pokeSpriteClearFix[33] = { start: [[24, 13]] }; //Nidorino
    // pokeSpriteClearFix[34] = { start: [[13, 12]] }; //Nidoking
    // pokeSpriteClearFix[37] = { start: [[27, 29], [21, 44], [22, 43]] }; //Vulpix
    // pokeSpriteClearFix[43] = { start: [[35, 22]] }; //Oddish
    // pokeSpriteClearFix[44] = { start: [[19, 28], [18, 29]] }; //Gloom
    // pokeSpriteClearFix[46] = { start: [[27, 22]] }; //Paras
    // pokeSpriteClearFix[47] = { start: [[18, 30], [51, 49]] }; //Parasect
    // pokeSpriteClearFix[48] = { start: [[21, 15]] }; //Venonat
    // pokeSpriteClearFix[50] = { start: [[35, 45], [43, 43]] }; //Diglett
    // pokeSpriteClearFix[51] = { start: [[6, 52], [10, 52], [11, 53], [12, 52], [13, 53], [14, 52], [19, 52], [23, 52], [30, 53], [32, 53], [33, 52], [33, 54], [35, 54], [37, 54]] }; //Dugtrio
    // pokeSpriteClearFix[52] = { start: [[42, 25], [42, 30], [37, 34]] }; //Meowth
    // pokeSpriteClearFix[54] = { start: [[39, 11]] }; //Psyduck
    // pokeSpriteClearFix[55] = { start: [[12, 17]] }; //Golduck
    // pokeSpriteClearFix[56] = { start: [[40, 21]] }; //Mankey
    // pokeSpriteClearFix[57] = { start: [[16, 16]] }; //Primeape
    // pokeSpriteClearFix[58] = { stop: [[22, 8]] }; //Growlithe
    // pokeSpriteClearFix[63] = { start: [[38, 31], [39, 32]] }; //Abra
    // pokeSpriteClearFix[64] = { start: [[34, 43]] }; //Kadabra
    // pokeSpriteClearFix[65] = { start: [[40, 16], [40, 36]] }; //Alakazam
    // pokeSpriteClearFix[68] = { start: [[42, 15], [15, 30], [17, 33]] }; //Machamp
    // pokeSpriteClearFix[69] = { start: [[31, 30], [31, 23], [32, 27], [33, 29]] }; //Bellsprout
    // pokeSpriteClearFix[71] = { start: [[21, 29], [38, 5], [36, 46], [44, 17]] }; //Victreebel
    // pokeSpriteClearFix[72] = { start: [[20, 36]] }; //Tentacool
    // pokeSpriteClearFix[73] = { start: [[23, 44], [27, 43], [32, 41]] }; //Tentacruel
    // pokeSpriteClearFix[74] = { start: [[35, 38]] }; //Geodude
    // pokeSpriteClearFix[75] = { start: [[16, 43]] }; //Graveler
    // pokeSpriteClearFix[77] = { start: [[22, 42], [37, 44]] }; //Ponyta
    // pokeSpriteClearFix[78] = { start: [[35, 35]] }; //Rapidash
    // pokeSpriteClearFix[79] = { start: [[24, 25]] }; //Slowpoke
    // pokeSpriteClearFix[81] = { start: [[32, 25]] }; //Magnemite
    // pokeSpriteClearFix[82] = { start: [[23, 12], [35, 11], [41, 10], [46, 12], [47, 11], [48, 10], [22, 29], [24, 28], [26, 26], [33, 27]] }; //Magneton
    // pokeSpriteClearFix[85] = { start: [[26, 3], [28, 10], [35, 12]] }; //Archeops
    // pokeSpriteClearFix[86] = { start: [[22, 19]] }; //Seel
    // pokeSpriteClearFix[92] = { clearDiagonal: true }; //Gastly
    // pokeSpriteClearFix[93] = { start: [[14, 35], [39, 39]] }; //Haunter
    // pokeSpriteClearFix[97] = { start: [[11, 26], [12, 28]] }; //Hypno
    // pokeSpriteClearFix[98] = { start: [[34, 27], [35, 28]] }; //Krabby
    // pokeSpriteClearFix[99] = { start: [[36, 20], [37, 21], [35, 27], [8, 40], [48, 42]] }; //Kingler
    // pokeSpriteClearFix[104] = { start: [[24, 26]] }; //Cubone
    // pokeSpriteClearFix[106] = { start: [[45, 41]] }; //Hitmonlee
    // pokeSpriteClearFix[107] = { start: [[27, 37]] }; //Hitmonchan
    // pokeSpriteClearFix[109] = { clearDiagonal: true, stop: [[33, 15]], start: [[13, 12]] }; //Koffing
    // pokeSpriteClearFix[110] = { clearDiagonal: true, stop: [[7, 16], [8, 20], [9, 26], [10, 24], [21, 38], [36, 43], [36, 43], [50, 38]], start: [[30, 39]] }; //Weezing
    // pokeSpriteClearFix[115] = { stop: [[36, 1], [36, 2], [36, 3], [36, 4], [36, 13], [36, 14], [36, 21], [36, 23], [28, 25], [28, 27], [28, 28], [28, 31], [28, 34], [28, 38], [28, 25], [28, 41], [28, 42], [28, 43], [28, 44], [28, 46], [28, 47], [28, 48], [28, 51], [28, 55], [29, 55], [30, 55], [31, 55], [34, 55], [35, 55], [40, 55], [43, 55], [44, 55], [46, 55], [47, 55], [48, 55], [49, 55], [50, 55], [51, 54], [51, 51], [51, 48], [51, 45], [51, 44], [51, 38], [51, 35], [51, 34], [51, 31], [51, 30], [51, 28], [51, 24], [51, 19], [51, 18], [51, 16], [51, 11], [51, 8], [51, 7], [51, 6], [51, 4], [51, 0], [48, 0], [47, 0], [44, 0], [42, 0], [39, 0], [38, 0], [37, 0]] }; //Missingno.
    // pokeSpriteClearFix[116] = { start: [[34, 25], [36, 24]] }; //Horsea
    // pokeSpriteClearFix[117] = { start: [[30, 26]] }; //Seadra
    // pokeSpriteClearFix[122] = { start: [[16, 30], [17, 29], [19, 33], [35, 42]] }; //Mr. Mime
    // pokeSpriteClearFix[123] = { start: [[34, 37], [36, 38], [37, 39], [41, 42], [44, 40]] }; //Scyther
    // pokeSpriteClearFix[124] = { start: [[7, 32]] }; //Jynx
    // pokeSpriteClearFix[125] = { start: [[38, 10], [37, 12], [40, 21], [41, 32], [31, 44]] }; //Electabuzz
    // pokeSpriteClearFix[126] = { start: [[25, 21]] }; //Magmar
    // pokeSpriteClearFix[127] = { start: [[12, 32]] }; //Pinsir
    // pokeSpriteClearFix[128] = { start: [[9, 24]] }; //Tauros
    // pokeSpriteClearFix[130] = { start: [[31, 36], [37, 44], [16, 45], [19, 40], [20, 42]], stop: [[20, 44]] }; //Gyarados
    // pokeSpriteClearFix[134] = { start: [[39, 34]] }; //Vaporeon
    // pokeSpriteClearFix[140] = { start: [[15, 34], [34, 38], [38, 40]] }; //Kabuto
    // pokeSpriteClearFix[141] = { start: [[43, 29]] }; //Kabutops
    // pokeSpriteClearFix[144] = { start: [[40, 44]] }; //Articuno
    // pokeSpriteClearFix[145] = { start: [[11, 9], [3, 14]] }; //Zapdos
    // pokeSpriteClearFix[146] = { clearDiagonal: true, stop: [[4, 35], [5, 34], [6, 32], [7, 26], [27, 24], [29, 25], [30, 26]] }; //Moltres
    // pokeSpriteClearFix[148] = { start: [[35, 21]] }; //Dragonair
    // pokeSpriteClearFix[149] = { start: [[16, 13], [17, 7], [28, 5], [32, 7]] }; //Dragonite
    // pokeSpriteClearFix[150] = { start: [[13, 33], [14, 32], [24, 32], [35, 17]] }; //Mewtwo
    // pokeSpriteClearFix[153] = { start: [[33, 25]] }; //Bayleef
    // pokeSpriteClearFix[154] = { start: [[48, 46]] }; //Meganium
    // pokeSpriteClearFix[155] = { start: [[39, 17]] }; //Cyndiquil
    // pokeSpriteClearFix[156] = { start: [[46, 22]] }; //Quilava
    // pokeSpriteClearFix[157] = { start: [[12, 30], [30, 5], [22, 52], [36, 24], [50, 45]] }; //Typhlosion
    // pokeSpriteClearFix[161] = { start: [[31, 31]] }; //Sentret
    // pokeSpriteClearFix[163] = { start: [[39, 15], [40, 33]] }; //Hoothoot
    // pokeSpriteClearFix[165] = { start: [[18, 41], [19, 42]] }; //Ledyba
    // pokeSpriteClearFix[166] = { start: [[17, 25], [18, 26], [16, 30], [19, 43], [32, 39]] }; //Ledian
    // pokeSpriteClearFix[167] = { start: [[12, 33], [13, 32]] }; //Spinarak
    // pokeSpriteClearFix[168] = { start: [[11, 35], [13, 28], [44, 26]] }; //Ariados
    // pokeSpriteClearFix[176] = { start: [[32, 15], [34, 23], [32, 25]] }; //Togetic
    // pokeSpriteClearFix[179] = { start: [[38, 18]] }; //Mareep
    // pokeSpriteClearFix[180] = { start: [[42, 34]] }; //Flaafy
    // pokeSpriteClearFix[183] = { start: [[13, 21], [35, 41], [40, 38]] }; //Marill
    // pokeSpriteClearFix[184] = { start: [[37, 49]] }; //Azumarill
    // pokeSpriteClearFix[185] = { start: [[11, 15], [19, 21], [37, 25]] }; //Sudowoodo
    // pokeSpriteClearFix[186] = { start: [[19, 36], [45, 22]] }; //Polito
    // pokeSpriteClearFix[189] = { start: [[3, 36], [14, 30], [18, 16], [51, 14], [47, 22], [46, 44], [29, 50]] }; //Jumpluff
    // pokeSpriteClearFix[190] = { start: [[37, 31]] }; //Aipom
    // pokeSpriteClearFix[193] = { start: [[11, 32], [14, 34], [15, 33], [17, 37], [26, 26], [29, 29], [30, 28]] }; //Yanma
    // pokeSpriteClearFix[198] = { start: [[21, 42], [27, 46]] }; //Murkrow
    // pokeSpriteClearFix[200] = { start: [[32, 17], [18, 36], [22, 36], [23, 37], [31, 44]] }; //Misdreavus
    // pokeSpriteClearFix[203] = { start: [[32, 42]] }; //Girafarig
    // pokeSpriteClearFix[207] = { start: [[35, 39]] }; //Gligar
    // pokeSpriteClearFix[208] = { start: [[35, 10]] }; //Steelix
    // pokeSpriteClearFix[212] = { start: [[41, 38], [44, 43], [45, 44]], stop: [[20, 17]] }; //Scizor
    // pokeSpriteClearFix[213] = { start: [[14, 40], [42, 40]] }; //Shuckle
    // pokeSpriteClearFix[217] = { start: [[17, 9], [44, 32]] }; //Ursaring
    // pokeSpriteClearFix[227] = { start: [[44, 9], [45, 25]] }; //Skarmory
    // pokeSpriteClearFix[230] = { start: [[35, 8]] }; //Kingdra
    // pokeSpriteClearFix[234] = { start: [[7, 9], [7, 15], [11, 11], [11, 15], [28, 12], [28, 16], [32, 16], [11, 19], [12, 20]] }; //Stantler
    // pokeSpriteClearFix[235] = { start: [[12, 29], [24, 29], [19, 41]] }; //Smeargle
    // pokeSpriteClearFix[236] = { start: [[37, 27]] }; //Tyrogue
    // pokeSpriteClearFix[238] = { start: [[34, 33]] }; //Smoochum
    // pokeSpriteClearFix[239] = { start: [[26, 10], [38, 12], [40, 36], [37, 43]] }; //Elekid
    // pokeSpriteClearFix[242] = { start: [[9, 31]], stop: [[14, 46]] }; //Blissey
    // pokeSpriteClearFix[243] = { start: [[51, 17]] }; //Raikou
    // pokeSpriteClearFix[245] = { start: [[7, 25], [5, 39], [7, 26], [28, 38], [33, 19], [42, 17]] }; //Suicune
    // pokeSpriteClearFix[249] = { start: [[49, 30]] }; //Lugia
    // pokeSpriteClearFix[250] = { start: [[41, 13], [42, 11], [50, 29], [50, 31], [44, 40]] }; //Ho-oh
    // pokeSpriteClearFix[251] = { start: [[19, 39], [31, 31]] }; //Celebi

    // Crystal
    // pokeSpriteClearFix[5] = { start: [[16, 37], [41, 23]] }; //Charmeleon
    // pokeSpriteClearFix[6] = { start: [[36, 27], [37, 28], [38, 29], [39, 30]] }; //Charizard
    // pokeSpriteClearFix[15] = { start: [[11, 30]] }; //Beedrill
    // pokeSpriteClearFix[26] = { start: [[37, 22], [39, 22]] }; //Raichu
    // pokeSpriteClearFix[34] = { start: [[13, 12]] }; //Nidoking
    // pokeSpriteClearFix[52] = { start: [[35, 35]] }; //Meowth
    // pokeSpriteClearFix[56] = { start: [[18, 18], [37, 18], [39, 31], [16, 25]] }; //Mankey
    // pokeSpriteClearFix[57] = { start: [[15, 15]] }; //Primeape
    // pokeSpriteClearFix[58] = { stop: [[22, 9]] }; //Growlithe
    // pokeSpriteClearFix[65] = { start: [[42, 15]] }; //Alakazam
    // pokeSpriteClearFix[69] = { start: [[31, 31], [31, 27], [32, 28], [33, 30]] }; //Bellsprout
    // pokeSpriteClearFix[71] = { start: [[37, 5], [38, 6]] }; //Victreebel
    // pokeSpriteClearFix[73] = { start: [[37, 41], [38, 42], [37, 48], [45, 43], [46, 44]] }; //Tentacruel
    // pokeSpriteClearFix[78] = { start: [[39, 10]] }; //Rapidash
    // pokeSpriteClearFix[81] = { start: [[19, 33], [20, 32], [24, 34]] }; //Magnemite
    // pokeSpriteClearFix[82] = { start: [[23, 29], [24, 28], [25, 27], [33, 27]] }; //Magneton
    // pokeSpriteClearFix[84] = { start: [[33, 35], [34, 36]] }; //Doduo
    // pokeSpriteClearFix[85] = { start: [[19, 15], [20, 14], [26, 17]] }; //Dodrio
    // pokeSpriteClearFix[86] = { start: [[22, 19]] }; //Seel
    // pokeSpriteClearFix[92] = { clearDiagonal: true }; //Gastly
    // pokeSpriteClearFix[93] = { start: [[14, 35], [39, 39]] }; //Haunter
    // pokeSpriteClearFix[99] = { start: [[36, 19], [37, 20], [35, 27], [8, 39]] }; //Kingler
    // pokeSpriteClearFix[104] = { start: [[24, 26]] }; //Cubone
    // pokeSpriteClearFix[107] = { start: [[27, 37]] }; //Hitmonchan
    // pokeSpriteClearFix[116] = { start: [[25, 34], [24, 35]] }; //Horsea
    // pokeSpriteClearFix[118] = { start: [[23, 44]], stop: [[23, 46]] }; //Goldeen
    // pokeSpriteClearFix[125] = { start: [[13, 23], [42, 23], [42, 30], [31, 42]] }; //Electabuzz
    // pokeSpriteClearFix[126] = { start: [[42, 18]] }; //Magmar
    // pokeSpriteClearFix[141] = { start: [[22, 30], [42, 30]] }; //Kabutops
    // pokeSpriteClearFix[144] = { start: [[16, 45], [17, 46], [40, 11], [40, 27], [45, 23], [49, 11]] }; //Articuno
    // pokeSpriteClearFix[148] = { start: [[38, 34]] }; //Dragonair
    // pokeSpriteClearFix[149] = { start: [[17, 8], [17, 12], [17, 22], [31, 5], [32, 6]] }; //Dragonite
    // pokeSpriteClearFix[150] = { start: [[13, 33], [14, 32], [24, 32], [35, 17]] }; //Mewtwo
    // pokeSpriteClearFix[165] = { start: [[14, 41], [15, 42]], stop: [[14, 20]] }; //Ledyba
    // pokeSpriteClearFix[166] = { start: [[16, 25], [17, 26], [15, 30], [31, 39], [18, 43]] }; //Ledian
    // pokeSpriteClearFix[167] = { start: [[12, 33], [13, 32]] }; //Spinarak
    // pokeSpriteClearFix[168] = { start: [[11, 34], [12, 30], [44, 25]] }; //Ariados
    // pokeSpriteClearFix[183] = { start: [[44, 44]] }; //Marill
    // pokeSpriteClearFix[185] = { start: [[21, 24], [36, 24]] }; //Sudowoodo
    // pokeSpriteClearFix[190] = { start: [[15, 33], [16, 34], [26, 34]] }; //Aipom
    // pokeSpriteClearFix[191] = { start: [[30, 21], [31, 20], [33, 21]] }; //Sunkern
    // pokeSpriteClearFix[198] = { start: [[11, 16], [8, 25], [12, 34], [21, 29], [22, 30], [21, 27], [22, 26], [43, 33], [45, 46], [45, 15]] }; //Murkrow
    // pokeSpriteClearFix[200] = { start: [[32, 17], [19, 36], [22, 36], [23, 37], [31, 44]] }; //Misdreavus
    // pokeSpriteClearFix[203] = { start: [[32, 42]] }; //Girafarig
    // pokeSpriteClearFix[207] = { start: [[35, 37]] }; //Gligar
    // pokeSpriteClearFix[212] = { start: [[42, 42], [43, 43], [44, 44], [34, 30], [7, 37]] }; //Scizor
    // pokeSpriteClearFix[228] = { start: [[18, 35], [20, 41], [21, 40], [22, 39]] }; //Houndour
    // pokeSpriteClearFix[229] = { start: [[34, 43], [35, 42]] }; //Houndoom
    // pokeSpriteClearFix[234] = { start: [[9, 13], [40, 41]] }; //Stantler
    // pokeSpriteClearFix[235] = { start: [[21, 25], [21, 41], [12, 29]] }; //Smeargle
    // pokeSpriteClearFix[236] = { start: [[39, 29]] }; //Tyrogue
    // pokeSpriteClearFix[239] = { start: [[39, 38], [40, 37]] }; //Elekid
    // pokeSpriteClearFix[242] = { start: [[9, 31]], stop: [[14, 46]] }; //Blissey

    // Black and White 3: Genesis
    pokeSpriteClearFix[1] = { start: [[27, 30]] }; //Snivy
    pokeSpriteClearFix[3] = { start: [[38, 27], [16, 39]] }; //Serperior
    pokeSpriteClearFix[20] = { start: [[35, 30]] }; //Azurill
    pokeSpriteClearFix[21] = { start: [[44, 44]] }; //Marill
    pokeSpriteClearFix[34] = { start: [[13, 28], [13, 26], [46, 22]] }; //Palpitoad
    pokeSpriteClearFix[47] = { start: [[39, 6], [12, 11], [46, 41], [35, 46], [34, 48]], stop: [[39, 11]] };
    pokeSpriteClearFix[53] = { start: [[16, 33], [17, 34], [35, 35], [33, 38], [21, 29], [23, 30]] }; //Roselia
    pokeSpriteClearFix[54] = { start: [[18, 15], [18, 20]] }; //Roserade
    pokeSpriteClearFix[58] = { start: [[39, 8], [38, 11], [21, 23], [29, 38]] };
    pokeSpriteClearFix[59] = { start: [[31, 26]] };
    pokeSpriteClearFix[60] = { start: [[36, 27], [24, 29]] };
    pokeSpriteClearFix[66] = { stop: [[18, 15], [20, 16], [22, 17], [13, 22], [14, 24], [11, 28], [10, 29], [9, 31], [8, 34]], clearDiagonal: true };
    pokeSpriteClearFix[67] = { start: [[37, 37]], stop: [[11, 2], [13, 2], [10, 4], [14, 4], [30, 4], [5, 7], [7, 7], [34, 7], [4, 9], [35, 9], [8, 23], [44, 26], [2, 27], [48, 27], [52, 36]], clearDiagonal: true };
    pokeSpriteClearFix[70] = { start: [[30, 27]], stop: [[39, 25], [40, 26], [10, 27]], clearDiagonal: true };
    pokeSpriteClearFix[74] = { start: [[16, 34], [37, 34]] };
    pokeSpriteClearFix[82] = { start: [[32, 15]] };
    pokeSpriteClearFix[92] = { start: [[35, 2], [41, 12], [45, 31], [14, 35], [14, 39], [5, 31], [15, 43]], clearDiagonal: true }; // Cofagrigus
    pokeSpriteClearFix[93] = { clearDiagonal: true }; //Gastly
    pokeSpriteClearFix[94] = { start: [[14, 35], [39, 39]] }; //Haunter
    pokeSpriteClearFix[97] = { start: [[31, 36]] };
    pokeSpriteClearFix[98] = { start: [[6, 36], [46, 37]], clearDiagonal: true };
    pokeSpriteClearFix[109] = { clearDiagonal: true };
    pokeSpriteClearFix[111] = { start: [[23, 27], [13, 29]] };
    pokeSpriteClearFix[113] = { start: [[35, 12], [39, 15], [13, 23], [12, 28], [11, 29], [9, 34], [44, 34], [46, 40]] };
    pokeSpriteClearFix[114] = { start: [[19, 33], [20, 32], [24, 34]] }; //Magnemite
    pokeSpriteClearFix[115] = { start: [[23, 29], [24, 28], [25, 27], [33, 27]] }; //Magneton
    pokeSpriteClearFix[118] = { start: [[17, 22], [23, 32]] };
    pokeSpriteClearFix[128] = { start: [[51, 22], [33, 23], [13, 47]] };
    pokeSpriteClearFix[130] = { start: [[6, 14], [14, 16], [9, 18], [27, 21], [24, 22], [33, 22], [44, 27]] };
    pokeSpriteClearFix[136] = { start: [[39, 38], [40, 37]] }; //Elekid
    pokeSpriteClearFix[137] = { start: [[13, 23], [42, 23], [42, 30], [31, 42]] }; //Electabuzz
    pokeSpriteClearFix[140] = { start: [[42, 18]] }; //Magmar
    pokeSpriteClearFix[155] = { start: [[35, 37]] }; //Gligar
    pokeSpriteClearFix[166] = { start: [[22, 36], [44, 26]] }; //Frillish
    pokeSpriteClearFix[167] = { start: [[16, 37], [38, 43], [39, 42]] }; //Jellicent
    pokeSpriteClearFix[184] = { start: [[36, 36], [43, 21]] }; //Sylveon
    pokeSpriteClearFix[188] = { start: [[8, 47], [26, 47]] }; //Durant
    pokeSpriteClearFix[241] = { start: [[21, 48], [37, 44], [42, 44]] }; //Cryogonal
    pokeSpriteClearFix[247] = { start: [[38, 34]] }; //Dragonair
    pokeSpriteClearFix[248] = { start: [[17, 8], [17, 12], [17, 22], [31, 5], [32, 6]] }; //Dragonite


    //Prism
    // pokeSpriteClearFix[15] = { start: [[14, 19]] };
    // pokeSpriteClearFix[20] = { start: [[22, 18], [30, 46]] };
    // pokeSpriteClearFix[21] = { start: [[41, 33]] };
    // pokeSpriteClearFix[24] = { start: [[30, 22], [29, 23], [21, 24]] };
    // pokeSpriteClearFix[25] = { start: [[36, 34]] };
    // pokeSpriteClearFix[29] = { start: [[39, 44]] };
    // pokeSpriteClearFix[31] = { start: [[25, 41]] };
    // pokeSpriteClearFix[37] = { start: [[24, 25]] };
    // pokeSpriteClearFix[47] = { start: [[29, 35]] };
    // pokeSpriteClearFix[49] = { start: [[14, 15], [23, 19]] };
    // pokeSpriteClearFix[51] = { start: [[25, 12], [44, 25]] };
    // pokeSpriteClearFix[52] = { start: [[37, 30], [38, 31], [36, 38]] };
    // pokeSpriteClearFix[53] = { start: [[35, 50]] };
    // pokeSpriteClearFix[61] = { start: [[32, 17], [41, 24]] };
    // pokeSpriteClearFix[62] = { start: [[31, 12], [11, 32], [10, 39], [9, 40]] };
    // pokeSpriteClearFix[68] = { start: [[15, 30], [16, 31]] };
    // pokeSpriteClearFix[86] = { start: [[39, 34]] };
    // pokeSpriteClearFix[91] = { start: [[12, 29]] };
    // pokeSpriteClearFix[98] = { start: [[27, 26], [32, 32], [20, 35], [24, 37]] };
    // pokeSpriteClearFix[99] = { start: [[23, 12], [24, 15], [32, 22], [33, 28]] };
    // pokeSpriteClearFix[110] = { start: [[29, 39]] };
    // pokeSpriteClearFix[112] = { start: [[39, 16]] };
    // pokeSpriteClearFix[114] = { start: [[17, 12], [41, 19], [42, 21]] };
    // pokeSpriteClearFix[117] = { start: [[32, 13], [33, 15], [32, 30]] };
    // pokeSpriteClearFix[121] = { start: [[20, 40], [31, 40], [19, 41], [18, 42], [32, 42], [17, 44], [33, 44]] };
    // pokeSpriteClearFix[122] = { start: [[38, 18], [40, 22]] };
    // pokeSpriteClearFix[123] = { start: [[35, 26], [34, 40], [32, 32], [39, 34], [40, 35]] };
    // pokeSpriteClearFix[125] = { start: [[38, 10], [37, 11]] };
    // pokeSpriteClearFix[127] = { start: [[14, 12], [43, 26]] };
    // pokeSpriteClearFix[128] = { start: [[9, 31]] };
    // pokeSpriteClearFix[130] = { stop: [[27, 44]] };
    // pokeSpriteClearFix[140] = { start: [[36, 21], [37, 22], [33, 28], [32, 30]] };
    // pokeSpriteClearFix[145] = { start: [[27, 15], [34, 35]] };
    // pokeSpriteClearFix[146] = { stop: [[28, 23], [30, 24], [31, 25], [5, 31], [4, 33], [3, 34]], clearDiagonal: true };
    // pokeSpriteClearFix[148] = { start: [[16, 21], [42, 28], [41, 29]] };
    // pokeSpriteClearFix[153] = { start: [[35, 29]] };
    // pokeSpriteClearFix[161] = { start: [[27, 31]] };
    // pokeSpriteClearFix[163] = { start: [[24, 41], [23, 42]] };
    // pokeSpriteClearFix[164] = { start: [[22, 28], [29, 41]] };
    // pokeSpriteClearFix[165] = { start: [[37, 27]] };
    // pokeSpriteClearFix[166] = { start: [[32, 27]] };
    // pokeSpriteClearFix[176] = { start: [[31, 26]] };
    // pokeSpriteClearFix[184] = { start: [[37, 49]] };
    // pokeSpriteClearFix[194] = { start: [[30, 33]] };
    // pokeSpriteClearFix[201] = { start: [[25, 31]] };
    // pokeSpriteClearFix[203] = { start: [[26, 7], [46, 51]] };
    // pokeSpriteClearFix[210] = { start: [[35, 12], [34, 15]] };
    // pokeSpriteClearFix[211] = { start: [[12, 43], [40, 43]] };
    // pokeSpriteClearFix[213] = { start: [[26, 30], [32, 30]] };
    // pokeSpriteClearFix[214] = { start: [[33, 21], [34, 22], [38, 22], [42, 22]] };
    // pokeSpriteClearFix[218] = { stop: [[20, 8]] };
    // pokeSpriteClearFix[228] = { start: [[36, 26], [37, 27]] };
    // pokeSpriteClearFix[227] = { start: [[15, 33]] };
    // pokeSpriteClearFix[235] = { start: [[17, 44]] };
    // pokeSpriteClearFix[238] = { start: [[13, 21], [22, 24], [42, 28], [16, 33]] };
    // pokeSpriteClearFix[241] = { start: [[28, 6], [26, 25], [23, 30]] };
    // pokeSpriteClearFix[243] = { start: [[14, 32]] };
    // pokeSpriteClearFix[244] = { start: [[42, 22]] };
    // pokeSpriteClearFix[245] = { start: [[25, 22], [19, 25], [29, 36], [12, 39]] };
    // pokeSpriteClearFix[250] = { start: [[41, 11], [40, 13], [43, 40], [28, 45]] };
    // pokeSpriteClearFix[251] = { start: [[47, 43]] };
    // pokeSpriteClearFix[252] = { start: [[17, 25], [31, 37], [50, 51]] };

    // Fused Crystal
    // pokeSpriteClearFix[218] = { start: [[1, 1]], stop: [[24, 7]] }; //Sluineco
    // pokeSpriteClearFix[214] = { start: [[15, 28]] }; //Herapras
    // pokeSpriteClearFix[213] = { start: [[14, 48], [44, 48]] }; //Shucsir
    // pokeSpriteClearFix[212] = { start: [[42, 42], [43, 43], [44, 44], [34, 30], [7, 37]] }; //Scizeton
    // pokeSpriteClearFix[207] = { start: [[35, 37], [17, 18], [18, 17]] }; //Gligala
    // pokeSpriteClearFix[204] = { start: [[40, 33]] }; //Pinehoot
    // pokeSpriteClearFix[198] = { start: [[11, 16], [8, 25], [12, 34], [21, 29], [22, 30], [21, 27], [22, 26], [43, 33], [45, 46], [45, 15]] }; //Murfish
    // pokeSpriteClearFix[194] = { start: [[35, 37]] }; //Woochum
    // pokeSpriteClearFix[193] = { start: [[26, 26], [11, 32], [17, 37], [14, 34], [15, 33]] }; //Yamnasola
    // pokeSpriteClearFix[192] = { start: [[16, 34], [23, 34], [37, 33]] }; //Sunfersian
    // pokeSpriteClearFix[191] = { start: [[30, 21], [31, 20], [26, 19]] }; //Sunowth
    // pokeSpriteClearFix[189] = { start: [[18, 38], [27, 22], [14, 31], [33, 18]] }; //Jumpganium
    // pokeSpriteClearFix[185] = { start: [[21, 24], [36, 24]] }; //Sudoditto
    // pokeSpriteClearFix[181] = { start: [[23, 22], [25, 23], [31, 25]] }; //Amphiqueen
    // pokeSpriteClearFix[177] = { start: [[40, 36]] }; //Natarill
    // pokeSpriteClearFix[176] = { start: [[31, 26]] }; //Togetape
    // pokeSpriteClearFix[169] = { start: [[21, 24], [36, 24]] }; //Sudoditto
    // pokeSpriteClearFix[168] = { start: [[11, 34], [12, 30], [44, 25]] }; //Arislash
    // pokeSpriteClearFix[167] = { start: [[12, 33], [13, 32], [13, 39]] }; //Spinshrew
    // pokeSpriteClearFix[166] = { start: [[16, 25], [17, 26], [15, 30], [31, 39], [18, 43]] }; //Ledinine
    // pokeSpriteClearFix[165] = { start: [[16, 38]], stop: [[28, 8]] }; //Ledithe
    // pokeSpriteClearFix[164] = { start: [[26, 20]] }; //Noctdrio
    // pokeSpriteClearFix[163] = { start: [[33, 35], [35, 40]] }; //Hootduo
    // pokeSpriteClearFix[161] = { start: [[26, 36]] }; //Sentubone
    // pokeSpriteClearFix[160] = { start: [[19, 4]] }; //Feralgeot
    // pokeSpriteClearFix[159] = { start: [[29, 14]] }; //Crocotto
    // pokeSpriteClearFix[156] = { start: [[27, 33], [24, 35]] }; //Quileadra
    // pokeSpriteClearFix[153] = { start: [[18, 29], [35, 29]] }; //Baytortle
    // pokeSpriteClearFix[149] = { start: [[16, 13], [47, 28]] }; //Dragonbell
    // pokeSpriteClearFix[148] = { start: [[20, 40], [40, 35]] }; //Dragonbell
    // pokeSpriteClearFix[147] = { start: [[24, 32]] }; //Dratsprout
    // pokeSpriteClearFix[144] = { start: [[16, 45], [17, 46], [40, 11], [40, 27], [45, 23], [49, 11]] }; //Articou
    // pokeSpriteClearFix[141] = { start: [[16, 40], [44, 37]] }; //Kabutillary
    // pokeSpriteClearFix[135] = { start: [[33, 11]] }; //Joltuckle
    // pokeSpriteClearFix[134] = { start: [[40, 32]] }; //Vapordoom
    // pokeSpriteClearFix[133] = { start: [[21, 26], [22, 28]] }; //Eevdour
    // pokeSpriteClearFix[128] = { start: [[14, 14]] }; //Taurtler
    // pokeSpriteClearFix[127] = { start: [[12, 16], [16, 22], [39, 37], [43, 38], [45, 41], [48, 43]] }; //Pinsicross
    // pokeSpriteClearFix[126] = { start: [[18, 31]] }; //Magmastar
    // pokeSpriteClearFix[125] = { start: [[13, 23], [42, 23], [42, 30], [31, 42]] }; //Electadian
    // pokeSpriteClearFix[123] = { start: [[32, 32], [34, 31], [39, 34], [40, 35]] }; //Scythemite
    // pokeSpriteClearFix[122] = { start: [[16, 30], [17, 29], [35, 42]] }; //Mr. Tank
    // pokeSpriteClearFix[116] = { start: [[31, 27]] }; //Seaodude
    // pokeSpriteClearFix[110] = { start: [[30, 37]] }; //Weezomoth
    // pokeSpriteClearFix[107] = { start: [[25, 41]] }; //Hitmoneon
    // pokeSpriteClearFix[107] = { start: [[44, 40]] }; //Hitmonossom
    // pokeSpriteClearFix[102] = { start: [[25, 20]] }; //Exeggyta
    // pokeSpriteClearFix[99] = { start: [[36, 19], [37, 20], [35, 27], [8, 39]] }; //Kingler
    // pokeSpriteClearFix[96] = { start: [[17, 20]] }; //Drowticool
    // pokeSpriteClearFix[93] = { start: [[14, 35], [39, 39]] }; //Hauntchoke
    // pokeSpriteClearFix[92] = { clearDiagonal: true }; //Gastchop
    // pokeSpriteClearFix[87] = { start: [[31, 8], [22, 22]] }; //Dewgizor
    // pokeSpriteClearFix[84] = { start: [[41, 24], [42, 25]] }; //Dougby
    // pokeSpriteClearFix[82] = { start: [[8, 10], [15, 31], [24, 27], [30, 24], [48, 9], [47, 10], [46, 11]] }; //Magnearow
    // pokeSpriteClearFix[81] = { start: [[16, 34], [18, 33], [21, 29]] }; //Dougby
    // pokeSpriteClearFix[78] = { clearDiagonal: true, stop: [[53, 33], [18, 7], [20, 30], [19, 31], [24, 41]] }; //Rapidgon2
    // pokeSpriteClearFix[77] = { start: [[27, 42], [42, 45]] }; //Ponygon
    // pokeSpriteClearFix[75] = { start: [[25, 46]] }; //Gravitar
    // pokeSpriteClearFix[74] = { start: [[17, 23], [35, 38]] }; //Geoditar
    // pokeSpriteClearFix[73] = { start: [[12, 44], [15, 39], [21, 40]] }; //Tenarbok
    // pokeSpriteClearFix[72] = { start: [[22, 38]] }; //Tentekans
    // pokeSpriteClearFix[69] = { start: [[31, 31], [31, 27], [32, 28], [33, 30]] }; //Bellmander
    // pokeSpriteClearFix[68] = { start: [[17, 33], [15, 30], [43, 14]] }; //Macharos
    // pokeSpriteClearFix[65] = { start: [[42, 15], [36, 13], [32, 11], [29, 10], [17, 11]] }; //Alakonite
    // pokeSpriteClearFix[64] = { start: [[34, 43]] }; //Kadabonair
    // pokeSpriteClearFix[63] = { start: [[38, 32], [39, 33], [11, 23]] }; //Abratini
    // pokeSpriteClearFix[56] = { start: [[18, 18], [37, 18], [39, 31], [16, 25], [19, 36], [16, 26]] }; //Mankey
    // pokeSpriteClearFix[55] = { start: [[42, 25]] }; //Golsire
    // pokeSpriteClearFix[52] = { start: [[35, 35], [37, 18], [35, 15]] }; //Meowth
    // pokeSpriteClearFix[47] = { start: [[51, 45]] }; //Paracissy
    // pokeSpriteClearFix[44] = { start: [[18, 29], [19, 28]] }; //Paracissy
    // pokeSpriteClearFix[42] = { start: [[31, 44]] }; //Goliwhirl
    // pokeSpriteClearFix[40] = { start: [[42, 21]] }; //Wigglychu
    // pokeSpriteClearFix[38] = { start: [[24, 20]] }; //Ninetwine
    // pokeSpriteClearFix[30] = { start: [[39, 23]] }; //Nidorlava
    // pokeSpriteClearFix[25] = { start: [[36, 38], [35, 42]] }; //Pikakuna
    // pokeSpriteClearFix[24] = { start: [[41, 37], [45, 24], [46, 12], [16, 42]] }; //Paracissy
    // pokeSpriteClearFix[23] = { start: [[42, 42]] }; //Ekanicute
    // pokeSpriteClearFix[21] = { start: [[20, 36]] }; //Spearmer
    // pokeSpriteClearFix[20] = { clearDiagonal: true, stop: [[46, 24], [9, 23], [7, 17], [8, 17], [9, 18], [10, 18], [7, 36], [9, 23], [10, 35], [9, 35], [10, 35], [11, 34], [13, 31], [17, 16], [14, 17], [13, 18], [13, 37]] }; //Ratitrio
    // pokeSpriteClearFix[18] = { start: [[41, 50]] }; //Pidgigator
    // pokeSpriteClearFix[17] = { start: [[29, 42]] }; //Pidginaw
    // pokeSpriteClearFix[15] = { start: [[11, 30], [40, 12]] }; //Beetuff
    // pokeSpriteClearFix[8] = { start: [[16, 25], [36, 25], [37, 24]] }; //Wortuff
    // pokeSpriteClearFix[7] = { start: [[14, 15], [37, 24], [36, 44]], stop: [[10, 34]] }; //Squirthip
    // pokeSpriteClearFix[6] = { start: [[6, 26], [8, 24], [34, 7], [14, 29], [29, 20], [32, 19], [40, 30], [45, 35], [33, 13]] }; //Charikazam
    // pokeSpriteClearFix[5] = { start: [[14, 29]] }; //Chardabra
    // pokeSpriteClearFix[248] = { stop: [[54, 32]] }; //Pupitoom
    // pokeSpriteClearFix[245] = { start: [[6, 26], [32, 18], [42, 17], [28, 38]] }; //Suitwo
    // pokeSpriteClearFix[243] = { start: [[23, 13]] }; //Rai-oh
    // pokeSpriteClearFix[239] = { start: [[39, 38], [40, 37]], stop: [[21, 2]] }; //Elekediba
    // pokeSpriteClearFix[236] = { start: [[39, 29]] }; //Tyroffing
    // pokeSpriteClearFix[235] = { start: [[21, 25], [21, 41], [12, 29]] }; //Smeargma
    // pokeSpriteClearFix[229] = { start: [[34, 43], [35, 42], [45, 12]] }; //Houndmie
    // pokeSpriteClearFix[228] = { start: [[18, 35], [20, 41], [21, 40], [22, 39]] }; //Houndyu
    // pokeSpriteClearFix[227] = { start: [[28, 8], [10, 44]], stop: [[25, 55]] }; //Skarvious
    // pokeSpriteClearFix[226] = { start: [[45, 41], [24, 28], [23, 26]] }; //Mantitoad
    // pokeSpriteClearFix[50] = { clearDiagonal: true }; //Digvee
    // pokeSpriteClearFix[118] = { start: [[23, 44]], stop: [[23, 46]] }; //Goldatu
    // pokeSpriteClearFix[119] = { start: [[48, 35]] };
    // pokeSpriteClearFix[139] = { start: [[43, 43]] };
    // pokeSpriteClearFix[150] = { start: [[35, 17]] };
    // pokeSpriteClearFix[242] = { start: [[9, 31]], stop: [[14, 46]] };

    // Silver97 Reforged
    // pokeSpriteClearFix[5] = { start: [[36, 27]] }; //Charmeleon
    // pokeSpriteClearFix[6] = { start: [[9, 22], [40, 40], [37, 28], [44, 25]] }; //Charizard
    // pokeSpriteClearFix[12] = { start: [[20, 23], [28, 15]] }; //Butterfree
    // pokeSpriteClearFix[15] = { start: [[17, 15], [30, 15]] }; //Beedrill
    // pokeSpriteClearFix[19] = { start: [[36, 28]] }; //Rattata
    // pokeSpriteClearFix[37] = { start: [[26, 26],] }; //Vulpix
    // pokeSpriteClearFix[52] = { start: [[23, 34], [38, 28]] }; //Meowth
    // pokeSpriteClearFix[55] = { start: [[43, 27], [40, 48]] }; //Golduck
    // pokeSpriteClearFix[56] = { start: [[18, 18], [40, 22], [19, 15], [16, 26], [39, 32]] }; //Mankey
    // pokeSpriteClearFix[57] = { start: [[14, 14], [44, 17]] }; //Primeape
    // pokeSpriteClearFix[65] = { start: [[13, 13], [13, 30], [42, 11], [44, 29]] }; //Alakazam
    // pokeSpriteClearFix[67] = { start: [[41, 27]] }; //Machoke
    // pokeSpriteClearFix[68] = { start: [[15, 24], [16, 25], [16, 29], [46, 21], [48, 25], [41, 38]] }; //Machamp
    // pokeSpriteClearFix[69] = { start: [[32, 24]] }; //Bellsprout
    // pokeSpriteClearFix[71] = { start: [[21, 9], [36, 24]] }; //Victreebel
    // pokeSpriteClearFix[73] = { start: [[13, 21], [15, 36], [22, 36], [20, 42], [29, 39], [35, 42], [35, 31], [36, 32]] }; //Tentacruel
    // pokeSpriteClearFix[85] = { start: [[18, 9], [35, 4], [40, 17], [23, 24], [17, 28], [12, 28], [11, 30]] }; //Dodrio
    // pokeSpriteClearFix[87] = { start: [[28, 33]] }; //Dewgong
    // pokeSpriteClearFix[92] = { clearDiagonal: true, start: [[38, 33], [39, 35]] }; //Gastly
    // pokeSpriteClearFix[93] = { start: [[14, 29]] }; //Haunter
    // pokeSpriteClearFix[94] = { clearDiagonal: true, }; //Gengar
    // pokeSpriteClearFix[98] = { start: [[17, 27], [18, 26], [19, 25], [30, 21]] }; //Krabby
    // pokeSpriteClearFix[99] = { start: [[36, 20], [37, 21], [35, 27], [8, 40], [48, 42]] }; //Kingler
    // pokeSpriteClearFix[109] = { clearDiagonal: true, stop: [[7, 25], [8, 24], [9, 24], [14, 20], [16, 19], [17, 19], [20, 20], [22, 20], [24, 20], [12, 42], [13, 43], [14, 44], [16, 44], [18, 45]], start: [[17, 10], [17, 12], [28, 16], [39, 25], [47, 39], [43, 42], [35, 46], [34, 48]] }; //Koffing
    // pokeSpriteClearFix[110] = { clearDiagonal: true, stop: [[12, 19]], start: [[38, 31]] }; //Weezing
    // pokeSpriteClearFix[114] = { start: [[29, 10], [30, 11]] }; //Tangela
    // pokeSpriteClearFix[118] = { start: [[23, 44]], stop: [[23, 46]] }; //Goldeen
    // pokeSpriteClearFix[123] = { start: [[32, 32], [33, 31], [39, 34], [40, 35]] }; //Scyther
    // pokeSpriteClearFix[125] = { start: [[35, 43], [42, 33]] }; //Electabuzz
    // pokeSpriteClearFix[126] = { start: [[46, 22]] }; //Magmar
    // pokeSpriteClearFix[128] = { start: [[4, 22], [42, 3]] }; //Tauros
    // pokeSpriteClearFix[130] = { stop: [[27, 44]] }; //Gyarados
    // pokeSpriteClearFix[141] = { start: [[11, 31], [12, 32], [37, 42], [40, 37]] }; //Kabutops
    // pokeSpriteClearFix[142] = { start: [[31, 20], [29, 21]] }; //Aerodactyl
    // pokeSpriteClearFix[144] = { start: [[32, 18], [45, 23], [40, 27], [16, 45], [17, 46]] }; //Articuno
    // pokeSpriteClearFix[146] = { clearDiagonal: true, stop: [[18, 16], [33, 12], [28, 29], [27, 30], [27, 33]], start: [[33, 18], [14, 30], [33, 39], [46, 27]] }; //Moltres
    // pokeSpriteClearFix[148] = { start: [[42, 37]] }; //Dragonair
    // pokeSpriteClearFix[150] = { start: [[25, 11], [21, 22], [40, 22]] }; //Mewtwo
    // pokeSpriteClearFix[154] = { start: [[6, 2], [12, 2], [12, 4], [22, 2], [18, 5], [27, 4]] }; //Meganium
    // pokeSpriteClearFix[162] = { start: [[17, 9], [37, 9]] }; //Jungela
    // pokeSpriteClearFix[170] = { start: [[42, 21], [41, 23], [41, 27]] }; //Kotora
    // pokeSpriteClearFix[176] = { start: [[17, 24], [41, 17], [32, 37]] }; //Kolta
    // pokeSpriteClearFix[178] = { start: [[21, 20], [34, 17], [37, 32]] }; //Xatu
    // pokeSpriteClearFix[183] = { start: [[42, 39]] }; //Marill
    // pokeSpriteClearFix[189] = { start: [[14, 38]] }; //Jumpluff
    // pokeSpriteClearFix[194] = { start: [[12, 42], [28, 41]] }; //Angore
    // pokeSpriteClearFix[198] = { start: [[8, 25], [12, 34], [25, 24], [26, 25], [43, 33], [45, 15], [45, 46]] }; //Murkrow
    // pokeSpriteClearFix[200] = { start: [[30, 19]] }; //Vulpiii
    // pokeSpriteClearFix[202] = { clearDiagonal: true, stop: [[16, 12], [28, 11]], start: [[34, 29]] }; //Bipulla
    // pokeSpriteClearFix[208] = { start: [[17, 35], [34, 30]] }; //Steelix
    // pokeSpriteClearFix[209] = { start: [[41, 31]] }; //Snubbull
    // pokeSpriteClearFix[210] = { start: [[41, 25], [42, 26], [43, 27], [44, 29]] }; //Quagsire
    // pokeSpriteClearFix[211] = { start: [[38, 44], [39, 45]] }; //Heracross
    // pokeSpriteClearFix[214] = { start: [[27, 20]] }; //Belledam
    // pokeSpriteClearFix[215] = { start: [[23, 28], [35, 28]] }; //Sneasel
    // pokeSpriteClearFix[224] = { start: [[45, 39]] }; //Octillery
    // pokeSpriteClearFix[226] = { start: [[36, 26]] }; //Mantine
    // pokeSpriteClearFix[227] = { start: [[12, 15], [20, 29], [28, 37], [45, 9]] }; //Skarmory
    // pokeSpriteClearFix[233] = { clearDiagonal: true, start: [[45, 19], [44, 21]] }; //Porygon2
    // pokeSpriteClearFix[235] = { start: [[28, 39]] }; //Smeargle
    // pokeSpriteClearFix[237] = { start: [[39, 26], [45, 42]] }; //Hitmontop
    // pokeSpriteClearFix[242] = { start: [[45, 41], [46, 40]] }; //Miltank
    // pokeSpriteClearFix[244] = { start: [[22, 26]] }; //Entei
    // pokeSpriteClearFix[245] = { start: [[8, 40], [33, 40]] }; //Suicune
    // pokeSpriteClearFix[251] = { start: [[16, 34], [17, 33], [27, 45], [35, 51], [36, 49], [42, 12], [47, 15], [48, 45]] }; //Ho-oh
    // pokeSpriteClearFix[252] = { start: [[25, 46], [37, 43], [43, 34]] }; //Leafeon
    // pokeSpriteClearFix[253] = { start: [[6, 30], [8, 20], [10, 23], [11, 25], [46, 32], [43, 26], [44, 25], [45, 23]] }; //Azumarill


    const unownSpriteClearFix: ClearFix = {};
    unownSpriteClearFix[0] = { start: [[28, 38]] }; //A
    unownSpriteClearFix[1] = { start: [[28, 38]] }; //B
    unownSpriteClearFix[2] = { start: [[25, 20]] }; //C
    unownSpriteClearFix[5] = { start: [[38, 27]] }; //F
    unownSpriteClearFix[6] = { start: [[27, 17]] }; //G
    unownSpriteClearFix[14] = { start: [[25, 25]] }; //O
    unownSpriteClearFix[20] = { start: [[29, 41], [34, 41]] }; //U
    unownSpriteClearFix[21] = { start: [[24, 24]] }; //V

    const trainerSpriteClearFix: ClearFix = {};
    trainerSpriteClearFix[2] = { start: [[22, 16], [33, 12], [22, 25]] }; //Girl1
    trainerSpriteClearFix[3] = { start: [[22, 32], [32, 32], [33, 35], [33, 40]] }; //Bugsy
    trainerSpriteClearFix[4] = { start: [[33, 30]] }; //Morty
    trainerSpriteClearFix[6] = { start: [[35, 23], [34, 24], [33, 25], [32, 36]] }; //Girl2
    trainerSpriteClearFix[7] = { start: [[18, 18], [17, 21]] }; //Scruff Guy
    trainerSpriteClearFix[8] = { start: [[27, 17]] }; //Clair
    trainerSpriteClearFix[9] = { start: [[22, 23]] }; //Girl3
    trainerSpriteClearFix[10] = { start: [[28, 52]] }; //Pokemon Prof
    trainerSpriteClearFix[11] = { start: [[22, 47]] }; //Old Guy
    trainerSpriteClearFix[13] = { start: [[16, 36], [36, 36]] }; //Bruno
    // trainerSpriteClearFix[15] = { start: [[22, 32], [22, 40]] }; //Koga
    trainerSpriteClearFix[16] = { start: [[22, 23]] }; //Girl3
    trainerSpriteClearFix[17] = { start: [[28, 44]] }; //Brock
    trainerSpriteClearFix[20] = { start: [[39, 27], [16, 37], [40, 36]] }; //Science Guy
    trainerSpriteClearFix[23] = { start: [[32, 37], [33, 39], [35, 42], [40, 41], [32, 46], [33, 48]] }; //Schoolboy
    // trainerSpriteClearFix[24] = { start: [[33, 35], [44, 44], [42, 36]], stop: [[39, 54], [17, 53], [17, 20], [20, 14], [21, 11], [22, 9], [23, 8]], clearDiagonal: true }; //Bird Keeper
    trainerSpriteClearFix[25] = { start: [[16, 14]] }; //Lass
    trainerSpriteClearFix[28] = { start: [[40, 28], [41, 27]] }; //Cooltrainer F
    trainerSpriteClearFix[29] = { start: [[32, 36]] }; //Beauty
    trainerSpriteClearFix[32] = { start: [[26, 18], [34, 40]] }; //Gentleman
    trainerSpriteClearFix[33] = { start: [[24, 26], [33, 29]] }; //Skier
    trainerSpriteClearFix[34] = { start: [[17, 25], [18, 24]] }; //Teacher
    trainerSpriteClearFix[36] = { start: [[33, 25], [38, 45]] }; //Bug Catcher
    // trainerSpriteClearFix[37] = { start: [[12, 17], [14, 18], [16, 19], [17, 20], [19, 21], [20, 22], [22, 23], [24, 24], [25, 25], [26, 26]] }; //Fisher
    trainerSpriteClearFix[38] = { start: [[33, 13]] }; //Swimmer M
    trainerSpriteClearFix[40] = { start: [[40, 17], [41, 18], [42, 19]] }; //Sailor
    trainerSpriteClearFix[42] = { start: [[22, 23]] }; //Girl3
    trainerSpriteClearFix[43] = { start: [[26, 40], [38, 23], [36, 17]] }; //Guitarist
    trainerSpriteClearFix[44] = { stop: [[30, 46]] }; //Hiker
    trainerSpriteClearFix[45] = { start: [[43, 34], [47, 34]] }; //Biker
    trainerSpriteClearFix[47] = { start: [[39, 35]] }; //Burglar
    trainerSpriteClearFix[48] = { start: [[14, 32], [21, 29], [22, 31]] }; //Firebreather
    trainerSpriteClearFix[51] = { start: [[27, 45]] }; //Rocket Executive
    trainerSpriteClearFix[56] = { start: [[21, 18], [20, 19]] }; //Trainer Guy
    trainerSpriteClearFix[57] = { start: [[21, 18], [33, 17]] }; //Trainer Gal
    trainerSpriteClearFix[59] = { start: [[19, 39], [20, 38]] }; //Pokefan0
    trainerSpriteClearFix[61] = { start: [[8, 29], [10, 35], [22, 37], [23, 38], [42, 37], [27, 23]] }; //Twins /*36 in Chatty Crystal*/
    // trainerSpriteClearFix[63] = { start: [[18, 23], [19, 22], [35, 29], [36, 28], [28, 43]] }; //Azure (TPP Red replacement for Pyrite)
    trainerSpriteClearFix[64] = { start: [[19, 21], [20, 20]] }; //Blue
    trainerSpriteClearFix[65] = { stop: [[19, 33], [19, 34], [20, 34]] }; //Officer /*39 in Chatty Crystal*/

    // Black and White 3: Genesis
    trainerSpriteClearFix[25] = trainerSpriteClearFix[26] = { start: [[12, 17], [14, 18], [16, 19], [17, 20], [19, 21], [20, 22], [22, 23], [24, 24], [25, 25], [26, 26]] };
    trainerSpriteClearFix[42] = { start: [[19, 39], [20, 38]] };
    trainerSpriteClearFix[95] = { start: [[24, 13], [24, 16], [32, 45], [32, 48]] };


    // Prism
    // trainerSpriteClearFix[20] = { start: [[32, 37], [33, 39], [35, 42], [40, 41], [32, 46], [33, 48]] }; //Schoolboy
    // trainerSpriteClearFix[21] = { start: [[33, 35], [44, 44], [42, 36]], stop: [[39, 54], [17, 53], [17, 20], [20, 14], [21, 11], [22, 9], [23, 8]], clearDiagonal: true }; //Bird Keeper
    // trainerSpriteClearFix[22] = { start: [[16, 14]] }; //Lass
    // trainerSpriteClearFix[25] = { start: [[40, 28], [41, 27]] }; //Cooltrainer F
    // trainerSpriteClearFix[26] = { start: [[32, 36]] }; //Beauty
    // trainerSpriteClearFix[29] = { start: [[26, 18], [34, 40]] }; //Gentleman
    // trainerSpriteClearFix[30] = { start: [[24, 26], [33, 29]] }; //Skier
    // trainerSpriteClearFix[31] = { start: [[17, 25], [18, 24]] }; //Teacher
    // trainerSpriteClearFix[33] = { start: [[33, 25], [38, 45]] }; //Bug Catcher
    // trainerSpriteClearFix[34] = { start: [[12, 17], [14, 18], [16, 19], [17, 20], [19, 21], [20, 22], [22, 23], [24, 24], [25, 25], [26, 26]] }; //Fisher
    // trainerSpriteClearFix[35] = { start: [[33, 13]] }; //Swimmer M
    // trainerSpriteClearFix[37] = { start: [[40, 17], [41, 18], [42, 19]] }; //Sailor
    // trainerSpriteClearFix[40] = { start: [[26, 40], [38, 23], [36, 17]] }; //Guitarist
    // trainerSpriteClearFix[41] = { stop: [[30, 46]] }; //Hiker
    // trainerSpriteClearFix[42] = { start: [[43, 34], [47, 34]] }; //Biker
    // trainerSpriteClearFix[44] = { start: [[39, 35]] }; //Burglar
    // trainerSpriteClearFix[45] = { start: [[14, 32], [21, 29], [22, 31]] }; //Firebreather
    // trainerSpriteClearFix[54] = { start: [[19, 39], [20, 38]] }; //Pokefan M
    // trainerSpriteClearFix[56] = { start: [[8, 29], [10, 35], [22, 37], [23, 38], [42, 37], [27, 23]] }; //Twins
    // trainerSpriteClearFix[60] = { stop: [[19, 33], [19, 34], [20, 34]] }; //Officer
    // trainerSpriteClearFix[72] = { start: [[22, 32], [32, 32], [33, 35], [33, 40]] }; //Bugsy


    interface Gen2Item extends Pokemon.Item {
        price: number;
        pocket: string;
    }

    interface Gen2Map extends Pokemon.Map {
        fishingGroup: number;
    }

    interface Gen2Trainer extends Pokemon.Trainer {
        party: { level: number, species: Pokemon.Species, moves?: Pokemon.Move[], item?: Gen2Item }[],
        trainerType?: string;
    }

    interface EncounterSummary { rate?: number, level: number, species: number };
    interface GrassSummary { mapGroup: number, mapId; number, rates: number[], encounters: { morning: EncounterSummary[], day: EncounterSummary[], night: EncounterSummary[] } };
    interface SurfSummary { mapGroup: number, mapId: number, rate: number, encounters: EncounterSummary[] }
    interface TreeSummary { common: EncounterSummary[], rare?: EncounterSummary[] }
    interface FishingSummary { fishGroup: number, encounters: { oldRod: EncounterSummary[], goodRod: EncounterSummary[], superRod: EncounterSummary[] } };
    interface TrainerSummary { name: string, type: number, party: { level: number, species: number, moves?: number[], item?: number }[] };

    export class Gen2 extends GBReader {
        private timeOfDay = new Array<string>(24);
        private tmMapping: Pokemon.Move[];
        private johtoGrassSummary = new Array<GrassSummary>();
        private johtoSurfSummary = new Array<SurfSummary>();
        private kantoGrassSummary = new Array<GrassSummary>();
        private kantoSurfSummary = new Array<SurfSummary>();
        private treeSummary = new Array<TreeSummary>();
        private fishingSummary = { fishGroups: new Array<FishingSummary>(), timeFishGroups: new Array<{ day: EncounterSummary, night: EncounterSummary }>() };
        private trainerSummary = new Array<TrainerSummary[]>();
        private phoneContacts = new Array<string>();

        constructor(romFileLocation: string) {
            super(romFileLocation, config.charmap);
            this.natures = [];

            const hudConfig = TPP.Server.getConfig();

            let romData = this.loadROM();
            const sym = this.LoadSymbolFile(romFileLocation.replace(/\.[^.]*$/, '.sym'));
            this.symTable = sym.symTable;
            this.symDomains = sym.symDomains;

            //if (this.isCrystal16)
            this.types = hudConfig.typeTable || defaultTypes;

            this.abilities = this.GetAbilityNames(romData);

            this.CalculateTimesOfDay(romData);
            this.items = this.ReadItemData(romData);
            this.moves = this.ReadMoveData(romData);
            this.tmMapping = this.GetTMHMNames(romData);
            this.pokemon = this.ReadPokeData(romData);
            this.trainers = this.isCrystal16 ? this.ReadCrystal16TrainerData(romData) : this.ReadBW3TrainerData(romData);
            this.ballIds = this.items.filter((i: Gen2Item) => i.pocket == "Ball").map(i => i.id);
            this.areas = this.ReadAreaNames(romData);
            this.maps = this.ReadMaps(romData);
            this.FindMapEncounters(romData);
            this.FindFishingEncounters(romData);
            this.FindTreeEncounters(romData);
            this.ReadMoveLearns(romData);

            this.pokemonSprites = this.ReadPokemonSprites(romData);
            this.trainerSprites = this.ReadTrainerSprites(romData);
            this.frameBorders = this.ReadFrameBorders(romData);
            this.phoneContacts = this.ReadPhoneContacts(romData);
            // this.levelCaps = this.ReadPyriteLevelCaps(romData);
        }

        public get isCrystal16() {
            return !!this.symTable["wPokemonIndexTable"];
        }

        public get isPrism() {
            return !!this.symTable["NaljoGrassWildMons"];
        }

        private NearToFarPointer(ptrAddress: number, nearPtr: Buffer) {
            const bank = this.LinearAddressToBanked(ptrAddress).bank;
            const farAddr = this.BankAddressToLinear(bank, nearPtr.readUInt16LE(0));
            const farBuf = Buffer.alloc(4);
            farBuf.writeUInt32LE(farAddr, 0);
            return farBuf;
        }

        public ReadCrystal16IndirectionTable(romData: Buffer, address: number, skipEmptyZero = false) {
            let entryBytes = romData.readInt16LE(address);
            const noZeroRecord = (entryBytes & 0x8000) == 0x8000;
            entryBytes &= 0x7FFF;
            const entries = new Array<Buffer>();
            if (noZeroRecord && !skipEmptyZero)
                entries.push(Buffer.alloc(entryBytes == 2 ? 4 : entryBytes, 0));
            for (let i = address + 2; i < romData.length; i += 4) {
                let batchCount = romData[i];
                if (!batchCount) // Table terminator
                    return entries;
                let batchAddress = this.BankAddressToLinear(romData[i + 1], romData.readUInt16LE(i + 2));
                if (!batchAddress) // Batch does not exist (table is sparse)
                    for (let e = 0; e < batchCount; e++)
                        entries.push(Buffer.alloc(entryBytes == 2 ? 4 : entryBytes, 0));
                else
                    this.ReadArray(romData, batchAddress, entryBytes, batchCount).forEach((e, i) => entryBytes == 2
                        ? entries.push(this.NearToFarPointer(batchAddress + (i * entryBytes), e)) // double indirection table (table points to near pointers that need to be converted to far pointers)
                        : entries.push(e) // single indirection table (table points to data)
                    );
            }
            return entries;
        }

        public ReadCrystal16ListItems(romData: Buffer, address: number) {
            const entries = new Array<Buffer>();
            for (let a = address; romData[a] != 0; a += romData[a])
                entries.push(romData.slice(a + 1, a + romData[a])); //remove List Item byte
            //TODO: There is no terminator for list items. Need to find a way to figure out when a list has ended.
            return entries;
        }

        public GetCurrentMapEncounters(map: Pokemon.Map, state: TPP.TrainerData) {
            if (!map) return {};
            let time = state.time && state.time.tod || this.timeOfDay[(state.time || { h: 9 }).h] || "morning";
            return (map.encounters || {})[time.toLowerCase()];
        }

        public CheckIfCanSurf(runState: TPP.RunStatus) {
            return (runState.badges & 8) == 8; //Fog Badge
        }

        public GetTMsHMs() {
            let tmExp = /^[TH]M\d\d.*$/i;
            return this.items.filter((tm, i, arr) => tmExp.test(tm.name) && arr.indexOf(tm) == i);
        }

        public GetPhoneContact(id: number): string | undefined {
            return this.phoneContacts[id];
        }

        private ReadPyriteLevelCaps(romData: Buffer) {
            return this.ReadArray(romData, 0x3fef, 1, 17).map(l => l[0]).filter(l => l > 0);
        }

        public get NumPokemon() {
            return this.pokemon.length;
        }

        private ReadPhoneContacts(romData: Buffer) {
            if (!this.symTable['NonTrainerCallerNames'])
                return [];
            const contactNameBank = this.LinearAddressToBanked(this.symTable['NonTrainerCallerNames']).bank;
            const nonTrainerContactNames = this.ReadArray(romData.slice(this.symTable['NonTrainerCallerNames'], this.symTable['NonTrainerCallerNames.none']), 0, 2, 255)
                .map(ptr => this.FixAllCaps(this.ConvertText(romData.slice(this.BankAddressToLinear(contactNameBank, ptr.readUInt16LE(0))))));
            return this.ReadArray(romData.slice(this.symTable['PhoneContacts'], this.symTable['SpecialPhoneCallList']), 0, 12, 255).map((data) => {
                const trainerClass = data[0];
                if (trainerClass == 0)
                    return (nonTrainerContactNames[data[1]] || "").replace(':', '').replace('\n', ':').replace(/\s+/g, ' ');
                const trainer = this.GetTrainer(data[1], trainerClass);
                if (trainer)
                    return `${trainer.name}: ${trainer.className}`;
                return nonTrainerContactNames[0];
            });
        }

        private FindFishingEncounters(romData: Buffer) {
            let switchFish = this.symTable[config.TimeFishGroups] ? this.ReadArray(romData, this.symTable[config.TimeFishGroups], this.isCrystal16 ? 6 : 4, 255, true).map(fish => ({ day: this.isCrystal16 ? fish.readUInt16LE(1) : fish[0], night: this.isCrystal16 ? fish.readUInt16LE(4) : fish[2] })) : [];
            this.fishingSummary.timeFishGroups = this.symTable[config.TimeFishGroups] ? this.ReadArray(romData, this.symTable[config.TimeFishGroups], this.isCrystal16 ? 6 : 4, 22, true).map(fish => ({ day: { species: this.isCrystal16 ? fish.readUInt16LE(1) : fish[0], level: this.isCrystal16 ? fish[0] : fish[1] }, night: { species: this.isCrystal16 ? fish.readUInt16LE(4) : fish[2], level: fish[3] } })) : [];
            // switchFish.unshift({ day: 0, night: 0 });
            const fishGroupHeaderBytes = 8; // 7 BW3
            const fishBank = this.LinearAddressToBanked(this.symTable[config.FishingWildsOffset]).bank, fishEncounterGroupsStartAddr = this.BankAddressToLinear(fishBank, romData.readUInt16LE(this.symTable[config.FishingWildsOffset] + 1));
            let fishEncounterGroups = this.ReadArray(romData.slice(this.symTable[config.FishingWildsOffset], fishEncounterGroupsStartAddr), 0, fishGroupHeaderBytes).map((header, i, arr) => {
                let nibbleRate = header[0] / 255;
                let fishEncs = Array<{ id: number; rate: number; level: number, rodType: string; }>();
                let summary = { fishGroup: i, encounters: { oldRod: [], goodRod: [], superRod: [] } } as FishingSummary;
                let processFishEncs = (addr: number, nextAddr: number, rodType: string) => {
                    this.ReadArray(romData.slice(addr, nextAddr < addr ? addr + 255 : nextAddr), 0, this.isCrystal16 ? 4 : 3, 4)
                        .map(enc => ({ rate: Math.round(enc[0] * 100 / 255), id: this.isCrystal16 ? enc.readUInt16LE(2) : enc[1], level: enc[this.isCrystal16 ? 1 : 2], rodType: rodType }))
                        .reverse().map((enc, i, arr) => {
                            enc.rate -= (arr[i + 1] || { rate: 0 }).rate; //fishing rate is progressive, needs to be calculated based on previous encounters
                            enc.rate = Math.round(nibbleRate * enc.rate); //also make fishing encounters take into account how likely it is to get a nibble at all
                            return enc;
                        }).reverse().forEach(e => fishEncs.push(e));
                    summary.encounters[rodType] = this.ReadArray(romData.slice(addr, nextAddr < addr ? addr + 255 : nextAddr), 0, this.isCrystal16 ? 4 : 3, 4)
                        .map(enc => ({ rate: Math.round(enc[0] * 100 / 255), species: this.isCrystal16 ? enc.readUInt16LE(2) : enc[1], level: enc[this.isCrystal16 ? 1 : 2] }));
                }
                let oldRod = this.BankAddressToLinear(fishBank, header.readUInt16LE(2)),// 1 Bw3
                    goodRod = this.BankAddressToLinear(fishBank, header.readUInt16LE(4)), // 3 BW3
                    superRod = this.BankAddressToLinear(fishBank, header.readUInt16LE(6)), // 5 BW3
                    next = (arr[i + 1] ? this.BankAddressToLinear(fishBank, arr[i + 1].readUInt16LE(1)) : null);
                processFishEncs(oldRod, goodRod, "oldRod");
                processFishEncs(goodRod, superRod, "goodRod");
                processFishEncs(superRod, next, "superRod");
                this.fishingSummary.fishGroups.push(summary);
                return fishEncs;
            });
            fishEncounterGroups.unshift([]); //group 0
            this.maps.forEach((map: Gen2Map) => {
                //every map has a fishing group.
                //only give a map fishing encounters if it has surfing encounters
                if (!map.encounters || !map.encounters['day'] || !map.encounters['day'].surfing) return;
                map.encounters.fishing = {};
                encounterTimesOfDay.forEach(time => {
                    map.encounters[time].fishing = fishingRods.map(rod => (fishEncounterGroups[map.fishingGroup] || []).filter(fish => rod == fish.rodType).map(fish => (<Pokemon.EncounterMon>{
                        species: this.GetSpecies(fish.id || (switchFish[fish.level] || {})[time == 'night' ? time : 'day']),
                        rate: fish.rate,
                        requiredItem: this.GetItem(fishingRodIds[fish.rodType])
                    }))).reduce((allFish, theseFish) => Array.prototype.concat.apply(allFish, this.CombineDuplicateEncounters(theseFish)), []);
                });
            });
        }

        private FindTreeEncounters(romData: Buffer) {
            const startAddr = this.symTable["TreeMons"];
            const endAddr = this.symTable["GetTreeMon"];
            const treeMapAddr = this.symTable["TreeMonMaps"];
            const rockMapAddr = this.symTable["RockMonMaps"];
            const bank = this.LinearAddressToBanked(startAddr).bank;
            const structBytes = this.isCrystal16 ? 4 : 3;
            this.treeSummary = this.ReadArray(romData, startAddr, 2, 9).map(ptr => {
                const summary = {} as TreeSummary;
                let addr = this.BankAddressToLinear(bank, ptr.readUInt16LE(0));
                summary.common = this.ReadArray(romData, addr, structBytes).map(data => ({ rate: data[0], species: this.isCrystal16 ? data.readUInt16LE(2) : data[1], level: data[this.isCrystal16 ? 1 : 2] }));
                addr += summary.common.length * structBytes + 1;
                if (addr < endAddr)
                    summary.rare = this.ReadArray(romData, addr, structBytes).map(data => ({ rate: data[0], species: this.isCrystal16 ? data.readUInt16LE(2) : data[1], level: data[this.isCrystal16 ? 1 : 2] }));
                return summary;
            });
        }

        private FindMapEncounters(romData: Buffer) {
            const encounterBytes = this.isCrystal16 ? 3 : 2;
            const grassBytes = 2 + 3 + (encounterBytes * grassEncounterRates.length * 3); // Map + Rates + Morn/Day/Night (7 encounters each)
            const surfBytes = 2 + 1 + (encounterBytes * surfEncounterRates.length); // Map + Rate + 3 encounters

            // Prism
            const naljoGrassGroups = this.symTable["NaljoGrassWildMons"] ? this.ReadArray(romData, this.symTable["NaljoGrassWildMons"], grassBytes) : [];
            const naljoSurfGroups = this.symTable["NaljoWaterWildMons"] ? this.ReadArray(romData, this.symTable["NaljoWaterWildMons"], surfBytes) : [];
            const rijonGrassGroups = this.symTable["RijonGrassWildMons"] ? this.ReadArray(romData, this.symTable["RijonGrassWildMons"], grassBytes) : [];
            const rijonSurfGroups = this.symTable["RijonWaterWildMons"] ? this.ReadArray(romData, this.symTable["RijonWaterWildMons"], surfBytes) : [];
            const seviiGrassGroups = this.symTable["SeviiGrassWildMons"] ? this.ReadArray(romData, this.symTable["SeviiGrassWildMons"], grassBytes) : [];
            const seviiSurfGroups = /*this.symTable["SeviiWaterWildMons"] ? this.ReadArray(romData, this.symTable["SeviiWaterWildMons"], surfBytes) :*/[];
            const tunodGrassGroups = this.symTable["TunodGrassWildMons"] ? this.ReadArray(romData, this.symTable["TunodGrassWildMons"], grassBytes) : [];
            const tunodSurfGroups = this.symTable["TunodWaterWildMons"] ? this.ReadArray(romData, this.symTable["TunodWaterWildMons"], surfBytes) : [];
            const mysteryGrassGroups = /*this.symTable["MysteryGrassWildMons"] ? this.ReadArray(romData, this.symTable["MysteryGrassWildMons"], grassBytes) :*/[];
            const mysterySurfGroups = this.symTable["MysteryWaterWildMons"] ? this.ReadArray(romData, this.symTable["MysteryWaterWildMons"], surfBytes) : [];
            const prismGrassGroups = [...naljoGrassGroups, ...rijonGrassGroups, ...seviiGrassGroups, ...tunodGrassGroups, ...mysteryGrassGroups];
            const prismWaterGroups = [...naljoSurfGroups, ...rijonSurfGroups, ...seviiSurfGroups, ...tunodSurfGroups, ...mysterySurfGroups];

            const johtoGrassGroups = this.ReadArray(romData, this.symTable["JohtoGrassWildMons"], grassBytes);
            const johtoSurfGroups = this.ReadArray(romData, this.symTable["JohtoWaterWildMons"], surfBytes);
            const kantoGrassGroups = this.ReadArray(romData, this.symTable["KantoGrassWildMons"], grassBytes);
            const kantoSurfGroups = this.ReadArray(romData, this.symTable["KantoWaterWildMons"], surfBytes);
            const grassGroups = [...johtoGrassGroups, ...kantoGrassGroups, ...prismGrassGroups];
            const surfGroups = [...johtoSurfGroups, ...kantoSurfGroups, ...prismWaterGroups];

            const species = (data: Buffer, offset: number) => (this.isCrystal16 ? data.readUInt16LE(offset) : data[offset]);

            function summarizeEncounters(raw: Buffer[]): GrassSummary[];
            function summarizeEncounters(raw: Buffer[], surfing: true): SurfSummary[];
            function summarizeEncounters(raw: Buffer[], surfing = false) {
                return raw.map(data => {
                    const summary = surfing ? {} as SurfSummary : {} as GrassSummary;
                    summary.mapGroup = data[0];
                    summary.mapId = data[1];
                    if (surfing) {
                        const surfSummary = summary as SurfSummary;
                        surfSummary.rate = Math.round(data[2] * 100 / 255);
                        surfSummary.encounters = surfEncounterRates.map((rate, r) => ({ level: data[3 + (r * encounterBytes)], species: species(data, 4 + (r * encounterBytes)), rate }));
                    }
                    else {
                        const grassSummary = summary as GrassSummary;
                        grassSummary.rates = [Math.round(data[2] * 100 / 255), Math.round(data[3] * 100 / 255), Math.round(data[4] * 100 / 255)];
                        grassSummary.encounters = { morning: [], day: [], night: [] };
                        const grassStride = grassEncounterRates.length * encounterBytes;
                        encounterTimesOfDay.forEach((time, t) => {
                            grassSummary.encounters[time] = grassEncounterRates.map((rate, r) => ({ level: data[5 + (t * grassStride) + (r * encounterBytes)], species: species(data, 6 + (t * grassStride) + (r * encounterBytes)), rate }));
                        });
                    }
                    return summary;
                });
            }
            this.johtoGrassSummary = summarizeEncounters(johtoGrassGroups);
            this.kantoGrassSummary = summarizeEncounters(kantoGrassGroups);
            this.johtoSurfSummary = summarizeEncounters(johtoSurfGroups, true);
            this.kantoSurfSummary = summarizeEncounters(kantoSurfGroups, true);

            let prepMap = (id: number, bank: number) => {
                let map = this.GetMap(id, bank);
                map.encounters = map.encounters || {};
                encounterTimesOfDay.forEach(time => map.encounters[time] = map.encounters[time] || {});
                return map;
            }
            grassGroups.forEach(data => {
                let map = prepMap(data[1], data[0]);
                if (!map) return;
                encounterTimesOfDay.forEach((time, t) => {
                    let areaRate = data[2 + t];
                    map.encounters[time].grass = this.CombineDuplicateEncounters(
                        grassEncounterRates.map((rate, r) => (<Pokemon.EncounterMon>{
                            species: this.GetSpecies(species(data, 3 + encounterTimesOfDay.length + (t * grassEncounterRates.length * encounterBytes) + (r * encounterBytes))),
                            rate: rate
                        }))
                    );
                });
            });
            surfGroups.forEach(data => {
                let map = prepMap(data[1], data[0]);
                if (!map) return;
                let areaRate = data[2];
                let encounters = this.CombineDuplicateEncounters(
                    surfEncounterRates.map((rate, r) => (<Pokemon.EncounterMon>{
                        species: this.GetSpecies(species(data, 4 + (r * encounterBytes))),
                        rate: rate
                    }))
                );
                encounterTimesOfDay.forEach(time => map.encounters[time].surfing = encounters);
            });
            if (this.symTable[config.BugContestWilds]) {
                let bugCatchingContest = prepMap(0x10, 3);
                let bugCatchingEncounters = this.CombineDuplicateEncounters(this.ReadArray(romData, this.symTable[config.BugContestWilds], this.isCrystal16 ? 5 : 4, 11).filter(data => data[0] <= 100).map(data => (<Pokemon.EncounterMon>{
                    rate: data[0],
                    species: this.GetSpecies(species(data, 1))
                })));
                encounterTimesOfDay.forEach(time => bugCatchingContest.encounters[time].grass = bugCatchingContest.encounters[time].grass || bugCatchingEncounters)
            }
            //Not present: Headbutt/Rock Smash (another function), Swarms (unhandled), Fishing (another function)
        }

        private get NumMapGroups() {
            if (this.isPrism)
                return Math.ceil((this.symTable["MapGroup1"] - this.symTable["MapGroupPointers"]) / 2);
            return ((this.symTable["Roofs"] || this.symTable["MapGroup_Olivine"]) - (this.symTable["MapGroupRoofs"] || this.symTable["MapGroupPointers"])) - 1
        }

        private ReadMaps(romData: Buffer) {
            const mapHeaderBytes = 9;
            return this.ReadArray(romData, this.symTable[config.MapHeaders], 2, this.NumMapGroups)
                .map(bankPtr => this.SameBankPtrToLinear(this.symTable[config.MapHeaders], bankPtr.readUInt16LE(0)))
                .map((ptr, b, arr) => this.ReadArray(romData, ptr, mapHeaderBytes, ((arr[b + 1] - ptr) / mapHeaderBytes) || 12)
                    .map((mapHeader, m) => (<Gen2Map>{
                        bank: b + 1,
                        id: m + 1,
                        name: this.areas[mapHeader[5]], //((config.mapNames[b + 1] || [])[m + 1] || { name: '???' }).name,
                        areaId: mapHeader[5],
                        areaName: this.areas[mapHeader[5]],
                        fishingGroup: mapHeader[8],
                        encounters: {}
                    }))
                ).reduce((allMaps, currBank) => Array.prototype.concat.apply(allMaps, currBank), []);
        }

        private ReadAreaNames(romData: Buffer) {
            const landmarksAddr = this.symTable[config.AreaNamesOffset] || this.symTable["LandmarkNames"];
            return this.ReadArray(romData, landmarksAddr, 4, this.GetSymbolSize(config.AreaNamesOffset, "LandmarkNames") / 4)
                .map(data => this.FixAllCaps(this.ConvertText(romData.slice(this.SameBankPtrToLinear(landmarksAddr, data.readUInt16LE(2)), this.SameBankPtrToLinear(landmarksAddr, data.readUInt16LE(2)) + 20)) || ''));
            // Prism
            // return this.ReadArray(romData, this.symTable["LandmarkNames"], 2, this.GetSymbolSize("LandmarkNames") / 2)
            //     .map(data => this.FixAllCaps(this.ConvertText(romData.slice(this.SameBankPtrToLinear(this.symTable["LandmarkNames"], data.readUInt16LE(0)))) || ''));

        }

        private GetTMHMNames(romData: Buffer) {
            let tmExp = /^[TH]M\d\d$/i;
            let tms = this.items.filter(i => tmExp.test(i.name));
            const mapping = this.ReadArray(romData, this.symTable[config.TMMovesOffset], this.isCrystal16 ? 2 : 1, null, null, 0).map(m => this.moves[this.isCrystal16 ? m.readUInt16LE(0) : m[0]]);
            mapping.forEach((m, i) => m && tms[i] && (tms[i].name = tms[i].name.toUpperCase() + ' ' + m.name));
            mapping.unshift(null);
            return mapping;
        }

        public GetTMById(id: number) {
            if (id > (this.isPrism ? 96 : tmCount))
                return `HM${(id - (this.isPrism ? 96 : tmCount)).toString().padStart(2, '0')} ${(this.tmMapping[id] || { name: "???" }).name}`;
            return `TM${(id).toString().padStart(2, '0')} ${(this.tmMapping[id] || { name: "???" }).name}`;
        }

        private ReadMoveData(romData: Buffer) {
            const dataBytes = 7;
            const movesOffset = this.symTable[config.MoveDataOffset] - (this.isCrystal16 ? 0 : dataBytes); //include 00
            const moveData = this.isCrystal16 ? this.ReadCrystal16IndirectionTable(romData, movesOffset) : this.ReadArray(romData, movesOffset, dataBytes, moveCount + 1)
            const moveNames = this.ReadStringBundle(romData, this.symTable[config.MoveNamesOffset], moveData.length - 1).map(m => this.FixAllCaps(m));
            moveNames.unshift(''); //move 0
            return moveData.map((data, i) => (<Pokemon.Move>{
                id: i,
                name: moveNames[i],
                basePower: data[this.isCrystal16 ? 1 : 2],
                type: this.types[data[this.isCrystal16 ? 2 : 3] & 0x3F],
                accuracy: data[this.isCrystal16 ? 3 : 4],
                basePP: data[this.isCrystal16 ? 4 : 5],
                // Prism
                // physical: (data[3] & 0xC0) == 0,
                // special: (data[3] & 0x40) > 0,
                // status: (data[3] & 0x80) > 0
            }));
        }

        private ReadItemData(romData: Buffer) {
            const dataBytes = 7;
            let itemsOffset = this.symTable[config.ItemAttributesOffset] - dataBytes; //include 00
            let itemNames = this.ReadStringBundle(romData, this.symTable[config.ItemNamesOffset], itemCount - 1).map(i => this.FixAllCaps(i));
            itemNames.unshift(''); //item 0
            return this.ReadArray(romData, itemsOffset, dataBytes, itemCount).map((data, i) => (<Gen2Item>{
                id: i,
                name: itemNames[i],
                price: data.readUInt16BE(0x00),
                pocket: bagPockets[data[0x05]],
                isKeyItem: data[0x05] == 2
            }));
        }

        private ReadCrystal16TrainerData(romData: Buffer) {
            const trainerClasses = this.TrainerClassCount(romData);
            let classNames = this.ReadStringBundle(romData, this.symTable[config.TrainerClassNamesOffset], trainerClasses).map(n => this.FixAllCaps(n));
            classNames.unshift(""); //trainer class 0
            let trainers: Pokemon.Trainer[] = [];
            this.ReadArray(romData, this.symTable[config.TrainerGroupsOffset], 3, trainerClasses).forEach((ptr, cId) => {
                cId++;
                const addr = this.BankAddressToLinear(ptr[0], ptr.readUInt16LE(1));
                //const trainerGroup = new Array<TrainerSummary>();
                this.ReadCrystal16ListItems(romData, addr).forEach((tData, tId) => {
                    const partyStart = this.FindTerminator(tData) + 2;
                    const trainerType = tData[partyStart - 1] || 0;

                    const name = this.ConvertText(tData);

                    //TODO: Party

                    //trainerGroup.push({ name: name, type: trainerType, party: (party || []).map(p => ({ level: p.level, species: p.species.id, moves: p.moves ? p.moves.map(m => (m || { id: 0 }).id) : undefined, item: (p.item || { id: undefined }).id })) });
                    trainers.push({
                        classId: cId,
                        spriteId: cId,
                        id: tId + 1,
                        className: classNames[cId],
                        name: this.FixAllCaps(name),
                        trainerType: trainerTypes[trainerType] || trainerType.toString(),
                        //party: party
                    } as Gen2Trainer);
                });
                //this.trainerSummary.push(trainerGroup);
            });
            return trainers;
        }

        private TrainerClassCount(romData: Buffer) {
            return Math.floor(this.GetSymbolSize("TrainerPicPointers") / 3);
        }

        private ReadTrainerData(romData: Buffer) {
            const trainerClasses = this.TrainerClassCount(romData);
            let classNames = this.ReadStringBundle(romData, this.symTable[config.TrainerClassNamesOffset], trainerClasses).map(n => this.FixAllCaps(n));
            classNames.unshift(""); //trainer class 0
            let trainers: Pokemon.Trainer[] = [];
            let bank = this.LinearAddressToBanked(this.symTable[config.TrainerGroupsOffset]).bank;
            this.ReadArray(romData, this.symTable[config.TrainerGroupsOffset], 2, trainerClasses).forEach((ptr, cId, ptrArr) => {
                cId++;
                if (!ptr.readUInt16LE(0)) // Handle Nulls
                    return;
                let thisAddr = this.BankAddressToLinear(bank, ptr.readUInt16LE(0));
                let nextAddr = this.BankAddressToLinear(bank, ptrArr.map(p => p.readUInt16LE(0)).sort((a, b) => a - b).find(p => p > ptr.readUInt16LE(0)) || 0);
                const trainerGroup = new Array<TrainerSummary>();
                this.ReadBundledData(romData, thisAddr, 0xFF, 255, nextAddr).forEach((tData, tId) => {
                    const partyStart = this.FindTerminator(tData) + 2;
                    const trainerType = tData[partyStart - 1] || 0;
                    let party: { level: number, species: Pokemon.Species, moves?: Pokemon.Move[], item?: Pokemon.Item }[] = undefined;
                    switch (trainerType & 3) {
                        case 0: //TRAINERTYPE_NORMAL:     db level, species
                            party = this.ReadArray(tData, partyStart, 2).map(p => ({ level: p[0], species: this.GetSpecies(p[1]) }));
                            break;
                        case 1: //TRAINERTYPE_MOVES:      db level, species, 4 moves
                            party = this.ReadArray(tData, partyStart, 6).map(p => ({ level: p[0], species: this.GetSpecies(p[1]), moves: [this.GetMove(p[2]), this.GetMove(p[3]), this.GetMove(p[4]), this.GetMove(p[5])] }));
                            break;
                        case 2: //TRAINERTYPE_ITEM:       db level, species, item
                            party = this.ReadArray(tData, partyStart, 3).map(p => ({ level: p[0], species: this.GetSpecies(p[1]), item: p[2] ? this.GetItem(p[2]) : undefined }));
                            break;
                        case 3: //TRAINERTYPE_ITEM_MOVES: db level, species, item, 4 moves
                            party = this.ReadArray(tData, partyStart, 7).map(p => ({ level: p[0], species: this.GetSpecies(p[1]), item: p[2] ? this.GetItem(p[2]) : undefined, moves: [this.GetMove(p[3]), this.GetMove(p[4]), this.GetMove(p[5]), this.GetMove(p[6])].filter(m => m && m.id) }));
                            break;
                    }
                    const name = this.ConvertText(tData);
                    trainerGroup.push({ name: name, type: trainerType, party: (party || []).map(p => ({ level: p.level, species: p.species.id, moves: p.moves ? p.moves.map(m => (m || { id: 0 }).id) : undefined, item: (p.item || { id: undefined }).id })) });
                    trainers.push({
                        classId: cId,
                        spriteId: cId,
                        id: tId + 1,
                        className: classNames[cId],
                        name: this.FixAllCaps(name),
                        trainerType: trainerTypes[trainerType] || trainerType.toString(),
                        party: party
                    } as Gen2Trainer);
                });
                this.trainerSummary.push(trainerGroup);
            });
            return trainers;
        }

        private ReadBW3TrainerData(romData: Buffer) {
            const trainerClasses = this.GetSymbolSize(config.TrainerClassNamesOffset) / 3;
            let classNames = this.ReadStringBundle(romData, this.symTable[config.TrainerClassNamesOffset], trainerClasses).map(n => this.FixAllCaps(n));
            classNames.unshift(""); //trainer class 0
            let trainers: Pokemon.Trainer[] = [];
            this.ReadArray(romData, this.symTable[config.TrainerGroupsOffset], 3, trainerClasses).map(dba => this.BankAddressToLinear(dba[0], dba.readUInt16LE(1))).forEach((ptr, cId, ptrArr) => {
                cId++;
                const thisAddr = ptr;
                const symbolName = Object.keys(this.symTable).find(k => this.symTable[k] == thisAddr) || "Bad Ptr";
                if (symbolName == "Bad Ptr")
                    return;
                //console.log(symbolName);
                // let nextAddr = [...ptrArr].sort((a, b) => a - b).find(p => p > thisAddr);
                const trainerGroup = new Array<TrainerSummary>();
                const tData = romData.slice(thisAddr, thisAddr + this.GetSymbolSize(symbolName));
                let offset = 0;
                for (let tId = 1; offset < tData.length; tId++) {
                    const addr = offset + thisAddr;
                    // ; Trainer data structure:
                    // ; - db "NAME@", TRAINERTYPE_* constants |ed together
                    // ; - 1 to 6 Pokémon:
                    // ;    * in all cases:              db level, species
                    // ;    * with TRAINERTYPE_DVS:      db atk|def dv, spd|spc dv
                    // ;    * with TRAINERTYPE_STAT_EXP: dw hp, atk, def, spd, spc
                    // ;    * with TRAINERTYPE_ITEM:     db item
                    // ;    * with TRAINERTYPE_MOVES:    db move 1, move 2, move 3, move 4
                    // ; - db -1 ; end
                    const name = this.ConvertText(tData.slice(offset));
                    while (tData[offset] != 0x50 && offset < tData.length)
                        offset++;
                    offset++;
                    const trainerType = (tData[offset] || 0) & 0xF;
                    offset++;
                    const party: { level: number, species: Pokemon.Species }[] = [];
                    while (tData[offset] != 0xFF && offset < tData.length) {
                        party.push({ level: tData[offset], species: this.GetSpecies(tData[offset + 1]) });
                        offset += 2;                        // TRAINERTYPE_NORMAL
                        offset += trainerType & 1 ? 4 : 0;  // TRAINERTYPE_MOVES
                        offset += trainerType & 2 ? 1 : 0;  // TRAINERTYPE_ITEM
                        offset += trainerType & 4 ? 2 : 0;  // TRAINERTYPE_DVS
                        offset += trainerType & 8 ? 10 : 0; // TRAINERTYPE_STAT_EXP
                    }
                    offset++;
                    const trainer = {
                        classId: cId,
                        spriteId: cId,
                        addr: addr.toString(16),
                        id: tId,
                        className: classNames[cId],
                        name: this.FixAllCaps(name),
                        trainerType: trainerType.toString(),
                        party: party
                    } as Gen2Trainer;
                    trainerGroup.push({ name: name, type: trainerType, party: (party || []).map(p => ({ level: p.level, species: p.species.id })) });
                    trainers.push(trainer);
                }
                this.trainerSummary.push(trainerGroup);
            });
            return trainers;
        }

        private ReadPokeData(romData: Buffer) {
            const nameBytes = 10;
            const dataBytes = this.isPrism ? 0x18 : 34; // Prism excludes TM bytes // BW3 adds more move tutors
            const namesOffset = this.symTable[config.PokemonNamesOffset] - nameBytes; //include 00
            const statsOffset = this.symTable[config.PokemonStatsOffset] - (this.isCrystal16 ? 0 : dataBytes); //include 00
            const baseData = this.isCrystal16 ? this.ReadCrystal16IndirectionTable(romData, statsOffset) : this.ReadArray(romData, statsOffset, dataBytes, dexCount);
            const pokeNames = this.ReadArray(romData, namesOffset, nameBytes, baseData.length).map(b => this.FixAllCaps(this.ConvertText(b)));

            const getCrystal16DexNum = (id: number) => (this.symTable["HOFNationalDexNumbers"] && id > 0) ? romData.readInt16LE(this.symTable["HOFNationalDexNumbers"] + ((id - 1) * 2)) : id;

            return baseData.map((data, i) => (<Pokemon.Species>{
                id: i,
                dexNumber: i, // this.isCrystal16 ? (getCrystal16DexNum(i) || 2001 /*TPP Phancero for Chatty Crystal*/) : (i > 0 ? data[0x00] : 0), // BW3
                name: pokeNames[i],
                baseStats: {
                    hp: data[0x01],
                    atk: data[0x02],
                    def: data[0x03],
                    speed: data[0x04],
                    spatk: data[0x05],
                    spdef: data[0x06]
                },
                type1: this.types[data[0x07]],
                type2: this.types[data[0x08]],
                catchRate: data[0x09],
                baseExp: data[0x0A],
                heldItem1: data[0x0B] ? this.GetItem(data[0x0B]) : undefined,
                heldItem2: data[0x0C] ? this.GetItem(data[0x0C]) : undefined,
                genderRatio: data[0x0D],
                eggCycles: data[0x0F],
                spriteSize: data[0x11] % 16, //sprites are always square
                abilities: this.abilities.length > 0 ? [this.abilities[data[0x12]], this.abilities[data[0x13]]] : undefined,
                growthRate: expCurveNames[data[0x16]],
                expFunction: expCurves[data[0x16]],
                eggGroup1: eggGroups[data[0x17] >> 4],
                eggGroup2: eggGroups[data[0x17] % 16],
                //tmMoves: this.GetSetFlags(data.slice(0x18)).map(i => this.tmMapping[i])
            }));
        }

        private ReadMoveLearns(romData: Buffer) {
            this.moveLearns = {};
            const eaPointers = this.isCrystal16
                ? this.ReadCrystal16IndirectionTable(romData, this.symTable["EvosAttacksPointers"], true)
                : this.ReadArray(romData, this.symTable["EvosAttacksPointers"], 2, dexCount)
                    .map((addr, i) => this.NearToFarPointer(this.symTable["EvosAttacksPointers"] + (i * 2), addr));

            eaPointers.forEach((ptr, i) => {
                let addr = ptr.readUInt32LE(0);
                const moves = new Array<Pokemon.MoveLearn>();
                const evos = new Array<Pokemon.Evolution>();
                for (addr = addr; romData[addr] != 0; addr++) { //evolution data
                    switch (romData[addr]) {
                        case 1: //db EVOLVE_LEVEL, level, species
                            evos.push({ speciesId: this.isCrystal16 ? romData.readUInt16LE(addr + 2) : romData[addr + 2], level: romData[addr + 1] });
                            addr += this.isCrystal16 ? 3 : 2;
                            break;
                        case 2: //db EVOLVE_ITEM, used item, species
                            evos.push({ speciesId: this.isCrystal16 ? romData.readUInt16LE(addr + 2) : romData[addr + 2], item: this.GetItem(romData[addr + 1]) });
                            addr += this.isCrystal16 ? 3 : 2;
                            break;
                        case 3: //db EVOLVE_TRADE, held item (or -1 for none), species
                            evos.push({ speciesId: this.isCrystal16 ? romData.readUInt16LE(addr + 2) : romData[addr + 2], isTrade: true, item: romData[addr + 1] < 0 ? undefined : this.GetItem(romData[addr + 1]) });
                            addr += this.isCrystal16 ? 3 : 2;
                            break;
                        case 4: //db EVOLVE_HAPPINESS, TR_* constant (ANYTIME, MORNDAY, NITE), species
                            evos.push({ speciesId: this.isCrystal16 ? romData.readUInt16LE(addr + 2) : romData[addr + 2], happiness: 220, timeOfDay: [undefined, undefined, "MornDay", "Night"][romData[addr + 1]] as any });
                            addr += this.isCrystal16 ? 3 : 2;
                            break;
                        case 5: //EVOLVE_STAT 5, level, ATK_*_DEF constant (LT, GT, EQ), species
                            evos.push({ speciesId: this.isCrystal16 ? romData.readUInt16LE(addr + 3) : romData[addr + 3], level: romData[addr + 1], specialCondition: ["Attack > Defense", "Attack < Defense", "Attack = Defense"][romData[addr + 2]] });
                            addr += this.isCrystal16 ? 4 : 3;
                            break;
                    }
                }
                this.GetSpeciesById(i + 1).evolutions = evos;
                for (addr++; romData[addr] != 0; addr += this.isCrystal16 ? 3 : 2) {
                    const move = this.GetMove(this.isCrystal16 ? romData.readUInt16LE(addr + 1) : romData[addr + 1]);
                    if (move && romData[addr]) {
                        moves.push({
                            level: romData[addr],
                            name: move.name,
                            accuracy: move.accuracy,
                            basePower: move.basePower,
                            basePP: move.basePP,
                            contestData: move.contestData,
                            id: move.id,
                            type: move.type
                        });
                    }
                }
                this.moveLearns[i + 1] = moves;
            });
        }

        private ReadFrameBorders(romData: Buffer) {
            let framePal = ["white", "black"];
            return this.ReadArray(romData, this.symTable[config.FrameBordersOffset], 48, 9).map(frameData =>
                JSON.stringify(
                    Sprites.FloodClear(
                        Sprites.ParseTilesToLayout(frameData, framePal, 6, [
                            [6, 4, 4, 4, 4, 4, 4, 3],
                            [2, 0, 0, 0, 0, 0, 0, 2],
                            [2, 0, 0, 0, 0, 0, 0, 2],
                            [2, 0, 0, 0, 0, 0, 0, 2],
                            [2, 0, 0, 0, 0, 0, 0, 2],
                            [2, 0, 0, 0, 0, 0, 0, 2],
                            [2, 0, 0, 0, 0, 0, 0, 2],
                            [5, 4, 4, 4, 4, 4, 4, 1]
                        ], 1), 0, [], [[20, 20]])
                )
            );
        }

        private TranslatePicBank(bank: number) {
            //Crystal
            return bank;//+ (this.isCrystal16 || this.isPrism ? 0 : config.CrystalPicBankOffset); // BW3
            //Gold/Silver
            // if (bank == 0x13) {
            //     return 0x1F;
            // }
            // if (bank == 0x14) {
            //     return 0x20;
            // }
            // if (bank == 0x1F) {
            //     return 0x2E;
            // }
            // return bank
        }

        private ProcessPalette(palData: Buffer) {
            return ['white', Sprites.Convert16BitColorToRGB(palData.readUInt16LE(2)), Sprites.Convert16BitColorToRGB(palData.readUInt16LE(0)), 'black'];
        }

        private ReadTrainerSprites(romData: Buffer) {
            const trainerClasses = this.TrainerClassCount(romData);
            let palettes = this.ReadArray(romData, this.symTable[config.TrainerPalettes], 4, trainerClasses).map(data => this.ProcessPalette(data));
            return new Array(trainerClasses + 1).fill(0).map((x, classId) => {
                if (classId < 1)
                    return ""
                try {
                    let ptrAddr = this.symTable[config.TrainerPicPointers] + ((classId - 1) * 3);
                    let spriteAddr = this.BankAddressToLinear(this.TranslatePicBank(romData[ptrAddr]), romData.readInt16LE(ptrAddr + 1));
                    let spriteData = Tools.LZGSC.Decompress(romData.slice(spriteAddr));
                    let imgData = Sprites.ParseTilesToImageMap(spriteData, palettes[classId], 7, 7);
                    let clearFix = trainerSpriteClearFix[classId] || {};
                    Sprites.FloodClear(imgData, 0, clearFix.stop, clearFix.start, clearFix.clearDiagonal);
                    return JSON.stringify(imgData);
                }
                catch {
                    return null;
                }
            });
        }

        private ReadPokemonSprites(romData: Buffer): PokeSprite[][] {
            let palettes = this.ReadArray(romData, this.symTable[config.PokemonPalettes], 8, this.pokemon.length)
                .map(data => ({ base: this.ProcessPalette(data), shiny: this.ProcessPalette(data.slice(4)) }));
            const readPokeSprite = (ptrAddr: number, mon: Pokemon.Species, clearFix: { start?: number[][], stop?: number[][], clearDiagonal?: boolean } = {}): PokeSprite => {
                try {
                    let spriteAddr = this.BankAddressToLinear(this.TranslatePicBank(romData[ptrAddr]), romData.readInt16LE(ptrAddr + 1));
                    let spriteData = Tools.LZGSC.Decompress(romData.slice(spriteAddr));
                    let imgData = Sprites.ParseTilesToImageMap(spriteData, palettes[mon.id].base, mon.spriteSize, mon.spriteSize);
                    Sprites.FloodClear(imgData, 0, clearFix.stop || [], clearFix.start || [], clearFix.clearDiagonal);
                    return {
                        base: JSON.stringify(imgData),
                        shiny: JSON.stringify({ palette: palettes[mon.id].shiny, pixels: imgData.pixels })
                    };
                }
                catch {
                    return null;
                }
            }
            const forms: { [key: number]: PokeSprite[] } = {};

            // if (this.isCrystal16 && this.symTable["Formes"])
            //     this.ReadArray(romData, this.symTable["Formes"], 104, 0, false, 0xFF).forEach(entry=>
            //         forms[entry.readUInt16LE(0)] = this.ReadArray(entry, 2, 17, 6)
            //             .filter((f,i,arr)=>arr.findIndex(g=>g.slice(0,7).toString('hex') == f.slice(0,7).toString('hex')) == i) //remove duplicate forms
            //             .map(f=>Sprites.ParseTilesToImageMap(Tools.LZGSC.Decompress(romData.slice(this.BankAddressToLinear(f[0], f.readUInt16LE(1))), this.ProcessPalette(romData.slice()) )
            //             .map(imgData=>)

            return this.pokemon.map(mon => {
                let ptrAddr = (this.symTable[config.PokemonPicPointers] || this.symTable["PicPointers" /*Prism*/]) + ((mon.id - (this.isCrystal16 ? 0 : 1)) * 6); //front and back pointer, 3 bytes each
                if (mon.id < 1 || (!this.isCrystal16 && mon.id > this.pokemon.length)) return;
                if (mon.id == 201 && this.symTable[config.UnownPicPointers]) { //Unown
                    ptrAddr = this.symTable[config.UnownPicPointers];
                    return new Array(26).fill(0).map((x, unown) => readPokeSprite.call(this, ptrAddr + (unown * 6), mon, unownSpriteClearFix[unown] || {}));
                }
                if (forms[mon.id])
                    return forms[mon.id];
                return [readPokeSprite.call(this, ptrAddr, mon, pokeSpriteClearFix[mon.id] || {})];
            });
        }

        GetForm(pokemon: TPP.Pokemon) {
            if (pokemon.species.id == 201 && !this.isPrism) {
                return Math.floor((((pokemon.ivs.attack & 6) << 5) | ((pokemon.ivs.defense & 6) << 3) | ((pokemon.ivs.speed & 6) << 1) | ((pokemon.ivs.special_attack & 6) >> 1)) / 10);
            }
            return 0;
        }

        private CalculateTimesOfDay(romData: Buffer) {
            let hour = 0;
            if (!this.symTable[config.TimeOfDayOffset])
                return encounterTimesOfDay;
            this.ReadArray(romData, this.symTable[config.TimeOfDayOffset], 2).forEach(tod => {
                let until = tod[0], todStr = encounterTimesOfDay[tod[1]];
                for (hour = hour; hour < until && hour < 24; hour++) {
                    this.timeOfDay[hour] = todStr;
                }
            });
        }

        private GetAbilityNames(romData: Buffer) {
            if (!!this.symTable["AbilityNames"])
                return ["-", ...this.ReadStringBundle(romData, this.symTable["AbilityNames"], abilityCount)];
            return [];
        }

        protected ReadStringBundle(romData: Buffer, startOffset: number, numStrings: number, endOffset?: number) {
            if (this.isPrism)
                return this.ReadPrismStringBundle(romData, startOffset, numStrings, endOffset);
            return super.ReadStringBundle(romData, startOffset, numStrings, endOffset);
        }

        private ReadPrismStringBundle(romData: Buffer, startOffset: number, numStrings: number, endOffset?: number) {
            // Prism's add_name macro puts a length byte (that includes the length byte) before each string and doesn't use terminators
            const romSlice = romData.slice(startOffset, endOffset);
            const collectedStrings = new Array<string>();
            for (let i = 0; i < romSlice.length && collectedStrings.length < numStrings; i += romSlice[i])
                collectedStrings.push(this.ConvertText(romSlice.slice(i + 1, i + romSlice[i])));
            return collectedStrings;
        }
    }
}