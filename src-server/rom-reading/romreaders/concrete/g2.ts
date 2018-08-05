/// <reference path="../../config/g2.ts" />
/// <reference path="../../tools/lz-gsc.ts" />
/// <reference path="../gb.ts" />

namespace RomReader {

    const config = gen2Offsets;

    const types = ["Normal", "Fighting", "Flying", "Poison", "Ground", "Rock", "Bird", "Bug", "Ghost", "Steel", "", "", "", "", "", "", "", "", "", "???", "Fire", "Water", "Grass", "Electric", "Psychic", "Ice", "Dragon", "Dark"];
    const eggGroups = ["???", "Monster", "Water 1", "Bug", "Flying", "Ground", "Fairy", "Plant", "Humanshape", "Water 3", "Mineral", "Indeterminate", "Water 2", "Ditto", "Dragon", "Undiscovered"];
    const expCurves = [Pokemon.ExpCurve.MediumFast, Pokemon.ExpCurve.Erratic, Pokemon.ExpCurve.Fluctuating, Pokemon.ExpCurve.MediumSlow, Pokemon.ExpCurve.Fast, Pokemon.ExpCurve.Slow];
    const expCurveNames = ["Medium Fast", "Erratic", "Fluctuating", "Medium Slow", "Fast", "Slow"];
    const bagPockets = ["???", "Item", "Key Item", "Ball", "TM/HM"];

    const grassEncounterRates = [30, 30, 20, 10, 5, 4, 1];
    const surfEncounterRates = [60, 30, 10];
    const encounterTimesOfDay = ['morning', 'day', 'night'];
    const fishingRods = ['oldRod', 'goodRod', 'superRod'];
    const fishingRodIds = { oldRod: 58, goodRod: 59, superRod: 61 };

    const tmCount = 50, hmCount = 7, itemCount = 256, dexCount = 256, moveCount = 251, mapBanks = 26, trainerClasses = 67;

    interface ClearFix { [key: number]: { start?: number[][], stop?: number[][], clearDiagonal?: boolean } };
    const pokeSpriteClearFix: ClearFix = {};
    // Gold/Bronze
    pokeSpriteClearFix[5] = { start: [[28, 22], [36, 27]] }; //Charmeleon
    pokeSpriteClearFix[6] = { start: [[36, 27], [37, 28], [38, 29], [39, 30]] }; //Charizard
    pokeSpriteClearFix[8] = { start: [[36, 36]] }; //Wartortle
    pokeSpriteClearFix[10] = { start: [[23, 35]] }; //Caterpie
    pokeSpriteClearFix[15] = { start: [[15, 27], [16, 26]] }; //Beedrill
    pokeSpriteClearFix[17] = { start: [[29, 42]] }; //Pidgeotto
    pokeSpriteClearFix[18] = { start: [[16, 47], [34, 48], [39, 50], [24, 4]] }; //Pidgeot
    pokeSpriteClearFix[21] = { start: [[40, 36]] }; //Spearow
    pokeSpriteClearFix[24] = { start: [[15, 43]] }; //Arbok
    pokeSpriteClearFix[25] = { start: [[36, 34]] }; //Pikachu
    pokeSpriteClearFix[26] = { start: [[35, 21], [42, 42]] }; //Raichu
    pokeSpriteClearFix[30] = { start: [[39, 23]] }; //Nidorina
    pokeSpriteClearFix[32] = { start: [[37, 20]] }; //Nidoran♂
    pokeSpriteClearFix[33] = { start: [[24, 13]] }; //Nidorino
    pokeSpriteClearFix[34] = { start: [[13, 12]] }; //Nidoking
    pokeSpriteClearFix[37] = { start: [[27, 29], [21, 44], [22, 43]] }; //Vulpix
    pokeSpriteClearFix[43] = { start: [[35, 22]] }; //Oddish
    pokeSpriteClearFix[44] = { start: [[19, 28], [18, 29]] }; //Gloom
    pokeSpriteClearFix[46] = { start: [[27, 22]] }; //Paras
    pokeSpriteClearFix[47] = { start: [[18, 30], [51, 49]] }; //Parasect
    pokeSpriteClearFix[48] = { start: [[21, 15]] }; //Venonat
    pokeSpriteClearFix[50] = { start: [[35, 45], [43, 43]] }; //Diglett
    pokeSpriteClearFix[51] = { start: [[6, 52], [10, 52], [11, 53], [12, 52], [13, 53], [14, 52], [19, 52], [23, 52], [30, 53], [32, 53], [33, 52], [33, 54], [35, 54], [37, 54]] }; //Dugtrio
    pokeSpriteClearFix[52] = { start: [[42, 25], [42, 30], [37, 34]] }; //Meowth
    pokeSpriteClearFix[54] = { start: [[39, 11]] }; //Psyduck
    pokeSpriteClearFix[55] = { start: [[12, 17]] }; //Golduck
    pokeSpriteClearFix[56] = { start: [[40, 21]] }; //Mankey
    pokeSpriteClearFix[57] = { start: [[16, 16]] }; //Primeape
    pokeSpriteClearFix[58] = { stop: [[22, 8]] }; //Growlithe
    pokeSpriteClearFix[63] = { start: [[38, 31], [39, 32]] }; //Abra
    pokeSpriteClearFix[64] = { start: [[34, 43]] }; //Kadabra
    pokeSpriteClearFix[65] = { start: [[40, 16], [40, 36]] }; //Alakazam
    pokeSpriteClearFix[68] = { start: [[42, 15], [15, 30], [17, 33]] }; //Machamp
    pokeSpriteClearFix[69] = { start: [[31, 30], [31, 23], [32, 27], [33, 29]] }; //Bellsprout
    pokeSpriteClearFix[71] = { start: [[21, 29], [38, 5], [36, 46], [44, 17]] }; //Victreebel
    pokeSpriteClearFix[72] = { start: [[20, 36]] }; //Tentacool
    pokeSpriteClearFix[73] = { start: [[23, 44], [27, 43], [32, 41]] }; //Tentacruel
    pokeSpriteClearFix[74] = { start: [[35, 38]] }; //Geodude
    pokeSpriteClearFix[75] = { start: [[16, 43]] }; //Graveler
    pokeSpriteClearFix[77] = { start: [[22, 42], [37, 44]] }; //Ponyta
    pokeSpriteClearFix[78] = { start: [[35, 35]] }; //Rapidash
    pokeSpriteClearFix[79] = { start: [[24, 25]] }; //Slowpoke
    pokeSpriteClearFix[81] = { start: [[32, 25]] }; //Magnemite
    pokeSpriteClearFix[82] = { start: [[23, 12], [35, 11], [41, 10], [46, 12], [47, 11], [48, 10], [22, 29], [24, 28], [26, 26], [33, 27]] }; //Magneton
    pokeSpriteClearFix[85] = { start: [[26, 3], [28, 10], [35, 12]] }; //Archeops
    pokeSpriteClearFix[86] = { start: [[22, 19]] }; //Seel
    pokeSpriteClearFix[92] = { clearDiagonal: true }; //Gastly
    pokeSpriteClearFix[93] = { start: [[14, 35], [39, 39]] }; //Haunter
    pokeSpriteClearFix[97] = { start: [[11, 26], [12, 28]] }; //Hypno
    pokeSpriteClearFix[98] = { start: [[34, 27], [35, 28]] }; //Krabby
    pokeSpriteClearFix[99] = { start: [[36, 20], [37, 21], [35, 27], [8, 40], [48, 42]] }; //Kingler
    pokeSpriteClearFix[104] = { start: [[24, 26]] }; //Cubone
    pokeSpriteClearFix[106] = { start: [[45, 41]] }; //Hitmonlee
    pokeSpriteClearFix[107] = { start: [[27, 37]] }; //Hitmonchan
    pokeSpriteClearFix[109] = { clearDiagonal: true, stop: [[33, 15]], start: [[13, 12]] }; //Koffing
    pokeSpriteClearFix[110] = { clearDiagonal: true, stop: [[7, 16], [8, 20], [9, 26], [10, 24], [21, 38], [36, 43], [36, 43], [50, 38]], start: [[30, 39]] }; //Weezing
    pokeSpriteClearFix[115] = { stop: [[36, 1], [36, 2], [36, 3], [36, 4], [36, 13], [36, 14], [36, 21], [36, 23], [28, 25], [28, 27], [28, 28], [28, 31], [28, 34], [28, 38], [28, 25], [28, 41], [28, 42], [28, 43], [28, 44], [28, 46], [28, 47], [28, 48], [28, 51], [28, 55], [29, 55], [30, 55], [31, 55], [34, 55], [35, 55], [40, 55], [43, 55], [44, 55], [46, 55], [47, 55], [48, 55], [49, 55], [50, 55], [51, 54], [51, 51], [51, 48], [51, 45], [51, 44], [51, 38], [51, 35], [51, 34], [51, 31], [51, 30], [51, 28], [51, 24], [51, 19], [51, 18], [51, 16], [51, 11], [51, 8], [51, 7], [51, 6], [51, 4], [51, 0], [48, 0], [47, 0], [44, 0], [42, 0], [39, 0], [38, 0], [37, 0]] }; //Missingno.
    pokeSpriteClearFix[116] = { start: [[34, 25], [36, 24]] }; //Horsea
    pokeSpriteClearFix[117] = { start: [[30, 26]] }; //Seadra
    pokeSpriteClearFix[122] = { start: [[16, 30], [17, 29], [19, 33], [35, 42]] }; //Mr. Mime
    pokeSpriteClearFix[123] = { start: [[34, 37], [36, 38], [37, 39], [41, 42], [44, 40]] }; //Scyther
    pokeSpriteClearFix[124] = { start: [[7, 32]] }; //Jynx
    pokeSpriteClearFix[125] = { start: [[38, 10], [37, 12], [40, 21], [41, 32], [31, 44]] }; //Electabuzz
    pokeSpriteClearFix[126] = { start: [[25, 21]] }; //Magmar
    pokeSpriteClearFix[127] = { start: [[12, 32]] }; //Pinsir
    pokeSpriteClearFix[128] = { start: [[9, 24]] }; //Tauros
    pokeSpriteClearFix[130] = { start: [[31, 36], [37, 44], [16, 45], [19, 40], [20, 42]], stop: [[20, 44]] }; //Gyarados
    pokeSpriteClearFix[134] = { start: [[39, 34]] }; //Vaporeon
    pokeSpriteClearFix[140] = { start: [[15, 34], [34, 38], [38, 40]] }; //Kabuto
    pokeSpriteClearFix[141] = { start: [[43, 29]] }; //Kabutops
    pokeSpriteClearFix[144] = { start: [[40, 44]] }; //Articuno
    pokeSpriteClearFix[145] = { start: [[11, 9], [3, 14]] }; //Zapdos
    pokeSpriteClearFix[146] = { clearDiagonal: true, stop: [[4, 35], [5, 34], [6, 32], [7, 26], [27, 24], [29, 25], [30, 26]] }; //Moltres
    pokeSpriteClearFix[148] = { start: [[35, 21]] }; //Dragonair
    pokeSpriteClearFix[149] = { start: [[16, 13], [17, 7], [28, 5], [32, 7]] }; //Dragonite
    pokeSpriteClearFix[150] = { start: [[13, 33], [14, 32], [24, 32], [35, 17]] }; //Mewtwo
    pokeSpriteClearFix[153] = { start: [[33, 25]] }; //Bayleef
    pokeSpriteClearFix[154] = { start: [[48, 46]] }; //Meganium
    pokeSpriteClearFix[155] = { start: [[39, 17]] }; //Cyndiquil
    pokeSpriteClearFix[156] = { start: [[46, 22]] }; //Quilava
    pokeSpriteClearFix[157] = { start: [[12, 30], [30, 5], [22, 52], [36, 24], [50, 45]] }; //Typhlosion
    pokeSpriteClearFix[161] = { start: [[31, 31]] }; //Sentret
    pokeSpriteClearFix[163] = { start: [[39, 15], [40, 33]] }; //Hoothoot
    pokeSpriteClearFix[165] = { start: [[18, 41], [19, 42]] }; //Ledyba
    pokeSpriteClearFix[166] = { start: [[17, 25], [18, 26], [16, 30], [19, 43], [32, 39]] }; //Ledian
    pokeSpriteClearFix[167] = { start: [[12, 33], [13, 32]] }; //Spinarak
    pokeSpriteClearFix[168] = { start: [[11, 35], [13, 28], [44, 26]] }; //Ariados
    pokeSpriteClearFix[176] = { start: [[32, 15], [34, 23], [32, 25]] }; //Togetic
    pokeSpriteClearFix[179] = { start: [[38, 18]] }; //Mareep
    pokeSpriteClearFix[180] = { start: [[42, 34]] }; //Flaafy
    pokeSpriteClearFix[183] = { start: [[13, 21], [35, 41], [40, 38]] }; //Marill
    pokeSpriteClearFix[184] = { start: [[37, 49]] }; //Azumaril
    pokeSpriteClearFix[185] = { start: [[11, 15], [19, 21], [37, 25]] }; //Sudowoodo
    pokeSpriteClearFix[186] = { start: [[19, 36], [45, 22]] }; //Polito
    pokeSpriteClearFix[189] = { start: [[3, 36], [14, 30], [18, 16], [51, 14], [47, 22], [46, 44], [29, 50]] }; //Jumpluff
    pokeSpriteClearFix[190] = { start: [[37, 31]] }; //Aipom
    pokeSpriteClearFix[193] = { start: [[11, 32], [14, 34], [15, 33], [17, 37], [26, 26], [29, 29], [30, 28]] }; //Yanma
    pokeSpriteClearFix[198] = { start: [[21, 42], [27, 46]] }; //Murkrow
    pokeSpriteClearFix[200] = { start: [[32, 17], [18, 36], [22, 36], [23, 37], [31, 44]] }; //Misdreavus
    pokeSpriteClearFix[203] = { start: [[32, 42]] }; //Girafarig
    pokeSpriteClearFix[207] = { start: [[35, 39]] }; //Gligar
    pokeSpriteClearFix[208] = { start: [[35, 10]] }; //Steelix
    pokeSpriteClearFix[212] = { start: [[41, 38], [44, 43], [45, 44]], stop: [[20, 17]] }; //Scizor
    pokeSpriteClearFix[213] = { start: [[14, 40], [42, 40]] }; //Shuckle
    pokeSpriteClearFix[217] = { start: [[17, 9], [44, 32]] }; //Ursaring
    pokeSpriteClearFix[227] = { start: [[44, 9], [45, 25]] }; //Skarmory
    pokeSpriteClearFix[230] = { start: [[35, 8]] }; //Kingdra
    pokeSpriteClearFix[234] = { start: [[7, 9], [7, 15], [11, 11], [11, 15], [28, 12], [28, 16], [32, 16], [11, 19], [12, 20]] }; //Stantler
    pokeSpriteClearFix[235] = { start: [[12, 29], [24, 29], [19, 41]] }; //Smeargle
    pokeSpriteClearFix[236] = { start: [[37, 27]] }; //Tyrogue
    pokeSpriteClearFix[238] = { start: [[34, 33]] }; //Smoochum
    pokeSpriteClearFix[239] = { start: [[26, 10], [38, 12], [40, 36], [37, 43]] }; //Elekid
    pokeSpriteClearFix[242] = { start: [[9, 31]], stop: [[14, 46]] }; //Blissey
    pokeSpriteClearFix[243] = { start: [[51, 17]] }; //Raikou
    pokeSpriteClearFix[245] = { start: [[7, 25], [5, 39], [7, 26], [28, 38], [33, 19], [42, 17]] }; //Suicune
    pokeSpriteClearFix[249] = { start: [[49, 30]] }; //Lugia
    pokeSpriteClearFix[250] = { start: [[41, 13], [42, 11], [50, 29], [50, 31], [44, 40]] }; //Ho-oh
    pokeSpriteClearFix[251] = { start: [[19, 39], [31, 31]] }; //Celebi

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
    // trainerSpriteClearFix[3] = { start: [[22, 32], [32, 32], [33, 35], [33, 40]] }; //Bugsy
    // trainerSpriteClearFix[4] = { start: [[33, 30]] }; //Morty
    trainerSpriteClearFix[6] = { start: [[35, 23], [34, 24], [33, 25], [32, 36]] }; //Girl2
    trainerSpriteClearFix[7] = { start: [[18, 18], [17, 21]] }; //Scruff Guy
    // trainerSpriteClearFix[8] = { start: [[27, 17]] }; //Clair
    trainerSpriteClearFix[9] = { start: [[22, 23]] }; //Girl3
    trainerSpriteClearFix[10] = { start: [[28, 52]] }; //Pokemon Prof
    trainerSpriteClearFix[11] = { start: [[22, 47]] }; //Old Guy
    trainerSpriteClearFix[13] = { start: [[16, 36], [36, 36]] }; //Bruno
    trainerSpriteClearFix[15] = { start: [[22, 32], [22, 40]] }; //Koga
    trainerSpriteClearFix[16] = { start: [[22, 23]] }; //Girl3
    trainerSpriteClearFix[17] = { start: [[28, 44]] }; //Brock
    trainerSpriteClearFix[20] = { start: [[39, 27], [16, 37], [40, 36]] }; //Science Guy
    trainerSpriteClearFix[23] = { start: [[32, 37], [33, 39], [35, 42], [40, 41], [32, 46], [33, 48]] }; //Schoolboy
    // trainerSpriteClearFix[24] = { start: [[33, 35], [44, 44], [42, 36]], stop: [[39, 54], [17, 53], [17, 20], [20, 14], [21, 11], [22, 9], [23, 8]], clearDiagonal: true }; //Bird Keeper
    trainerSpriteClearFix[25] = { start: [[16, 14]] }; //Lass
    trainerSpriteClearFix[28] = { start: [[40, 28], [41, 27]] }; //Cooltrainer F
    trainerSpriteClearFix[29] = { start: [[32, 36]] }; //Beauty
    trainerSpriteClearFix[32] = { start: [[26, 18], [34, 40]] }; //Gentleman
    // trainerSpriteClearFix[33] = { start: [[24, 26], [33, 29]] }; //Skier
    trainerSpriteClearFix[34] = { start: [[17, 25], [18, 24]] }; //Teacher
    trainerSpriteClearFix[36] = { start: [[33, 25], [38, 45]] }; //Bug Catcher
    trainerSpriteClearFix[37] = { start: [[12, 17], [14, 18], [16, 19], [17, 20], [19, 21], [20, 22], [22, 23], [24, 24], [25, 25], [26, 26]] }; //Fisher
    trainerSpriteClearFix[38] = { start: [[33, 13]] }; //Swimmer M
    trainerSpriteClearFix[40] = { start: [[40, 17], [41, 18], [42, 19]] }; //Sailor
    trainerSpriteClearFix[42] = { start: [[22, 23]] }; //Girl3
    trainerSpriteClearFix[43] = { start: [[26, 40], [38, 23], [36, 17]] }; //Guitarist
    trainerSpriteClearFix[44] = { stop: [[30, 46]] }; //Hiker
    // trainerSpriteClearFix[45] = { start: [[43, 34], [47, 34]] }; //Biker
    trainerSpriteClearFix[47] = { start: [[39, 35]] }; //Burglar
    trainerSpriteClearFix[48] = { start: [[14, 32], [21, 29], [22, 31]] }; //Firebreather
    // trainerSpriteClearFix[51] = { start: [[27, 45]] }; //Rocket Executive
    trainerSpriteClearFix[56] = { start: [[21, 18], [20, 19]] }; //Trainer Guy
    trainerSpriteClearFix[57] = { start: [[21, 18], [33, 17]] }; //Trainer Gal
    trainerSpriteClearFix[59] = { start: [[19, 39], [20, 38]] }; //Pokefan
    trainerSpriteClearFix[61] = { start: [[8, 29], [10, 35], [22, 37], [23, 38], [42, 37], [27, 23]] }; //Twins
    // trainerSpriteClearFix[63] = { start: [[18, 23], [19, 22], [35, 29], [36, 28], [28, 43]] }; //Azure (TPP Red replacement for Pyrite)
    trainerSpriteClearFix[64] = { start: [[19, 21], [20, 20]] }; //Blue
    trainerSpriteClearFix[65] = { stop: [[19, 33], [19, 34], [20, 34]] }; //Officer


    interface Gen2Item extends Pokemon.Item {
        price: number;
        pocket: string;
    }

    interface Gen2Map extends Pokemon.Map {
        fishingGroup: number;
    }

    export class Gen2 extends GBReader {
        private timeOfDay = new Array<string>(24);

        constructor(romFileLocation: string) {
            super(romFileLocation, config.charmap);
            this.natures = [];

            let romData = this.loadROM();
            this.symTable = this.LoadSymbolFile(romFileLocation.replace(/\.[^.]*$/, '.sym'));

            this.CalculateTimesOfDay(romData);
            this.pokemon = this.ReadPokeData(romData);
            this.pokemonSprites = this.ReadPokemonSprites(romData);
            this.trainers = this.ReadTrainerData(romData);
            this.trainerSprites = this.ReadTrainerSprites(romData);
            this.frameBorders = this.ReadFrameBorders(romData);
            this.items = this.ReadItemData(romData);
            this.ballIds = this.items.filter((i: Gen2Item) => i.pocket == "Ball").map(i => i.id);
            this.moves = this.ReadMoveData(romData)
            this.areas = this.ReadAreaNames(romData);
            this.maps = this.ReadMaps(romData);
            this.FindMapEncounters(romData);
            this.FindFishingEncounters(romData);
            this.GetTMHMNames(romData);
            this.ReadMoveLearns(romData);
            //this.levelCaps = this.ReadPyriteLevelCaps(romData);
        }

        public GetCurrentMapEncounters(map: Pokemon.Map, state: TPP.TrainerData) {
            if (!map) return {};
            let time = this.timeOfDay[(state.time || { h: 9 }).h] || "morning";
            return (map.encounters || {})[time];
        }

        public CheckIfCanSurf(runState: TPP.RunStatus) {
            return (runState.badges & 8) == 8; //Fog Badge
        }

        private ReadPyriteLevelCaps(romData: Buffer) {
            return this.ReadStridedData(romData, 0x3fef, 1, 17).map(l => l[0]).filter(l => l > 0);
        }

        private FindFishingEncounters(romData: Buffer) {
            let switchFish = this.ReadStridedData(romData, this.symTable[config.TimeFishGroups], 4, 255, true).map(fish => ({ day: fish[0], night: fish[2] }));
            // switchFish.unshift({ day: 0, night: 0 });
            const fishBank = this.LinearAddrToROMBank(this.symTable[config.FishingWildsOffset]).bank, fishEncounterGroupsStartAddr = this.ROMBankAddrToLinear(fishBank, romData.readUInt16LE(this.symTable[config.FishingWildsOffset] + 1));
            let fishEncounterGroups = this.ReadStridedData(romData.slice(this.symTable[config.FishingWildsOffset], fishEncounterGroupsStartAddr), 0, 7).map((header, i, arr) => {
                let nibbleRate = header[0] / 255;
                let fishEncs = Array<{ id: number; rate: number; level: number, rodType: string; }>();
                let processFishEncs = (addr: number, nextAddr: number, rodType: string) => {
                    this.ReadStridedData(romData.slice(addr, nextAddr < addr ? addr + 255 : nextAddr), 0, 3, 4)
                        .map(enc => ({ rate: Math.round(enc[0] * 100 / 255), id: enc[1], level: enc[2], rodType: rodType }))
                        .reverse().map((enc, i, arr) => {
                            enc.rate -= (arr[i + 1] || { rate: 0 }).rate; //fishing rate is progressive, needs to be calculated based on previous encounters
                            enc.rate = Math.round(nibbleRate * enc.rate); //also make fishing encounters take into account how likely it is to get a nibble at all
                            return enc;
                        }).reverse().forEach(e => fishEncs.push(e));
                }
                let oldRod = this.ROMBankAddrToLinear(fishBank, header.readUInt16LE(1)),
                    goodRod = this.ROMBankAddrToLinear(fishBank, header.readUInt16LE(3)),
                    superRod = this.ROMBankAddrToLinear(fishBank, header.readUInt16LE(5)),
                    next = (arr[i + 1] ? this.ROMBankAddrToLinear(fishBank, arr[i + 1].readUInt16LE(1)) : null);
                processFishEncs(oldRod, goodRod, "oldRod");
                processFishEncs(goodRod, superRod, "goodRod");
                processFishEncs(superRod, next, "superRod");
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

        private FindMapEncounters(romData: Buffer) {
            const grassBytes = 47;
            const surfBytes = 9;
            let grassGroups = this.ReadStridedData(romData, this.symTable[config.WildPokemonOffset], grassBytes);
            let surfGroups = this.ReadStridedData(romData, this.symTable[config.WildPokemonOffset] + (grassGroups.length * grassBytes) + 1, surfBytes);
            grassGroups = Array.prototype.concat.apply(grassGroups, this.ReadStridedData(romData, this.symTable[config.WildPokemonOffset] + (grassGroups.length * grassBytes) + (surfGroups.length * surfBytes) + 2, grassBytes)); //Kanto
            surfGroups = Array.prototype.concat.apply(surfGroups, this.ReadStridedData(romData, this.symTable[config.WildPokemonOffset] + (grassGroups.length * grassBytes) + (surfGroups.length * surfBytes) + 3, surfBytes)); //Kanto
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
                            species: this.GetSpecies(data[3 + encounterTimesOfDay.length + (t * grassEncounterRates.length * 2) + (r * 2)]),
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
                        species: this.GetSpecies(data[4 + (r * 2)]),
                        rate: rate
                    }))

                );
                encounterTimesOfDay.forEach(time => map.encounters[time].surfing = encounters);
            });
            let bugCatchingContest = prepMap(0x10, 3);
            let bugCatchingEncounters = this.CombineDuplicateEncounters(this.ReadStridedData(romData, this.symTable[config.BugContestWilds], 4, 11).filter(data => data[0] <= 100).map(data => (<Pokemon.EncounterMon>{
                rate: data[0],
                species: this.GetSpecies(data[1])
            })));
            encounterTimesOfDay.forEach(time => bugCatchingContest.encounters[time].grass = bugCatchingContest.encounters[time].grass || bugCatchingEncounters)
            //Not present: Headbutt (unhandled), Swarms (unhandled), Fishing (another function)
        }

        private ReadMaps(romData: Buffer) {
            const mapHeaderBytes = 9;
            return this.ReadStridedData(romData, this.symTable[config.MapHeaders], 2, mapBanks)
                .map(bankPtr => this.SameBankPtrToLinear(this.symTable[config.MapHeaders], bankPtr.readUInt16LE(0)))
                .map((ptr, b, arr) => this.ReadStridedData(romData, ptr, mapHeaderBytes, ((arr[b + 1] - ptr) / mapHeaderBytes) || 12)
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
            return this.ReadStridedData(romData, this.symTable[config.AreaNamesOffset], 4, 97)
                .map(data => this.FixAllCaps(this.ConvertText(romData.slice(this.SameBankPtrToLinear(this.symTable[config.AreaNamesOffset], data.readUInt16LE(2)))) || ''));
        }

        private GetTMHMNames(romData: Buffer) {
            let tmExp = /^[TH]M\d\d$/i;
            let tms = this.items.filter(i => tmExp.test(i.name));
            this.ReadStridedData(romData, this.symTable[config.TMMovesOffset], 1, tms.length)
                .forEach((m, i) => tms[i].name = tms[i].name.toUpperCase() + ' ' + this.moves[m[0]].name);
        }

        private ReadMoveData(romData: Buffer) {
            const dataBytes = 7;
            let movesOffset = this.symTable[config.MoveDataOffset] - dataBytes; //include 00
            let moveNames = this.ReadStringBundle(romData, this.symTable[config.MoveNamesOffset], moveCount).map(m => this.FixAllCaps(m));
            moveNames.unshift(''); //move 0
            return this.ReadStridedData(romData, movesOffset, dataBytes, moveCount + 1).map((data, i) => (<Pokemon.Move>{
                id: i,
                name: moveNames[i],
                basePower: data[0x02],
                type: types[data[0x03]],
                accuracy: data[0x04],
                basePP: data[0x05]
            }));
        }

        private ReadItemData(romData: Buffer) {
            const dataBytes = 7;
            let itemsOffset = this.symTable[config.ItemAttributesOffset] - dataBytes; //include 00
            let itemNames = this.ReadStringBundle(romData, this.symTable[config.ItemNamesOffset], itemCount - 1).map(i => this.FixAllCaps(i));
            itemNames.unshift(''); //item 0
            return this.ReadStridedData(romData, itemsOffset, dataBytes, itemCount).map((data, i) => (<Gen2Item>{
                id: i,
                name: itemNames[i],
                price: data.readUInt16BE(0x00),
                pocket: bagPockets[data[0x05]],
                isKeyItem: data[0x05] == 2
            }));
        }

        private ReadTrainerData(romData: Buffer) {
            let classNames = this.ReadStringBundle(romData, this.symTable[config.TrainerClassNamesOffset], trainerClasses).map(n => this.FixAllCaps(n));
            classNames.unshift(""); //trainer class 0
            let trainers: Pokemon.Trainer[] = [];
            let bank = this.LinearAddrToROMBank(this.symTable[config.TrainerGroupsOffset]).bank;
            this.ReadStridedData(romData, this.symTable[config.TrainerGroupsOffset], 2, trainerClasses).forEach((ptr, cId, ptrArr) => {
                cId++;
                let thisAddr = this.ROMBankAddrToLinear(bank, ptr.readUInt16LE(0));
                let nextAddr = ptrArr[cId] ? this.ROMBankAddrToLinear(bank, ptrArr[cId].readUInt16LE(0)) : 0;
                this.ReadBundledData(romData, thisAddr, 0xFF, nextAddr || 1, nextAddr).forEach((tData, tId) => {
                    trainers.push({
                        classId: cId,
                        spriteId: cId,
                        id: tId + 1,
                        className: classNames[cId],
                        name: this.FixAllCaps(this.ConvertText(tData))
                    });
                });
            });
            return trainers;
        }

        private ReadPokeData(romData: Buffer) {
            const nameBytes = 10;
            const dataBytes = 32;
            let namesOffset = this.symTable[config.PokemonNamesOffset] - nameBytes; //include 00
            let statsOffset = this.symTable[config.PokemonStatsOffset] - dataBytes; //include 00
            let pokeNames = this.ReadStridedData(romData, namesOffset, nameBytes, dexCount).map(b => this.FixAllCaps(this.ConvertText(b)));
            return this.ReadStridedData(romData, statsOffset, dataBytes, dexCount).map((data, i) => (<Pokemon.Species>{
                id: i,
                dexNumber: i > 0 ? data[0x00] : 0,
                name: pokeNames[i],
                baseStats: {
                    hp: data[0x01],
                    atk: data[0x02],
                    def: data[0x03],
                    speed: data[0x04],
                    spatk: data[0x05],
                    spdef: data[0x06]
                },
                type1: types[data[0x07]],
                type2: types[data[0x08]],
                catchRate: data[0x09],
                baseExp: data[0x0A],
                genderRatio: data[0x0D],
                eggCycles: data[0x0F],
                spriteSize: data[0x11] % 16, //sprites are always square
                growthRate: expCurveNames[data[0x16]],
                expFunction: expCurves[data[0x16]],
                eggGroup1: data[0x17] % 16,
                eggGroup2: data[0x17] >> 4
            }));
        }

        private ReadMoveLearns(romData: Buffer) {
            this.moveLearns = {};
            const bank = this.LinearAddrToROMBank(this.symTable["EvosAttacksPointers"]).bank;
            this.ReadStridedData(romData, this.symTable["EvosAttacksPointers"], 2, dexCount).forEach((ptr, i) => {
                let addr = this.ROMBankAddrToLinear(bank, ptr.readUInt16LE(0));
                const moves = new Array<Pokemon.MoveLearn>();
                for (addr = addr; romData[addr] != 0; addr++); //skip evolution data
                for (addr++; romData[addr] != 0; addr += 2) {
                    const move = this.GetMove(romData[addr + 1]);
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
            return this.ReadStridedData(romData, this.symTable[config.FrameBordersOffset], 48, 9).map(frameData =>
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
            // return bank + config.CrystalPicBankOffset
            //Gold/Silver
            if (bank == 0x13) {
                return 0x1F;
            }
            if (bank == 0x14) {
                return 0x20;
            }
            if (bank == 0x1F) {
                return 0x2E;
            }
            return bank
        }

        private ProcessPalette(palData: Buffer) {
            return ['white', Sprites.Convert16BitColorToRGB(palData.readUInt16LE(2)), Sprites.Convert16BitColorToRGB(palData.readUInt16LE(0)), 'black'];
        }

        private ReadTrainerSprites(romData: Buffer) {
            let palettes = this.ReadStridedData(romData, this.symTable[config.TrainerPalettes], 4, trainerClasses).map(data => this.ProcessPalette(data));
            return new Array(trainerClasses + 1).fill(0).map((x, classId) => {
                if (classId < 1)
                    return ""
                let ptrAddr = this.symTable[config.TrainerPicPointers] + ((classId - 1) * 3);
                let spriteAddr = this.ROMBankAddrToLinear(this.TranslatePicBank(romData[ptrAddr]), romData.readInt16LE(ptrAddr + 1));
                let spriteData = Tools.LZGSC.Decompress(romData.slice(spriteAddr));
                let imgData = Sprites.ParseTilesToImageMap(spriteData, palettes[classId], 7, 7);
                let clearFix = trainerSpriteClearFix[classId] || {};
                Sprites.FloodClear(imgData, 0, clearFix.stop, clearFix.start, clearFix.clearDiagonal);
                return JSON.stringify(imgData);
            });
        }

        private ReadPokemonSprites(romData: Buffer) {
            let palettes = this.ReadStridedData(romData, this.symTable[config.PokemonPalettes], 8, this.pokemon.length)
                .map(data => ({ base: this.ProcessPalette(data), shiny: this.ProcessPalette(data.slice(4)) }));
            function readPokeSprite(ptrAddr: number, mon: Pokemon.Species, clearFix: { start?: number[][], stop?: number[][], clearDiagonal?: boolean } = {}) {
                let spriteAddr = this.ROMBankAddrToLinear(this.TranslatePicBank(romData[ptrAddr]), romData.readInt16LE(ptrAddr + 1));
                let spriteData = Tools.LZGSC.Decompress(romData.slice(spriteAddr));
                let imgData = Sprites.ParseTilesToImageMap(spriteData, palettes[mon.id].base, mon.spriteSize, mon.spriteSize);
                Sprites.FloodClear(imgData, 0, clearFix.stop || [], clearFix.start || [], clearFix.clearDiagonal);
                return {
                    base: JSON.stringify(imgData),
                    shiny: JSON.stringify({ palette: palettes[mon.id].shiny, pixels: imgData.pixels })
                };
            }
            return this.pokemon.map(mon => {
                let ptrAddr = this.symTable[config.PokemonPicPointers] + ((mon.id - 1) * 6); //front and back pointer, 3 bytes each
                if (mon.id < 1 || mon.id > 251) return;
                if (mon.id == 201) { //Unown
                    ptrAddr = this.symTable[config.UnownPicPointers];
                    return new Array(26).fill(0).map((x, unown) => readPokeSprite.call(this, ptrAddr + (unown * 6), mon, unownSpriteClearFix[unown] || {}));
                }
                return [readPokeSprite.call(this, ptrAddr, mon, pokeSpriteClearFix[mon.id] || {})];
            });
        }

        private CalculateTimesOfDay(romData: Buffer) {
            let hour = 0;
            this.ReadStridedData(romData, this.symTable[config.TimeOfDayOffset], 2).forEach(tod => {
                let until = tod[0], todStr = encounterTimesOfDay[tod[1]];
                for (hour = hour; hour < until && hour < 24; hour++) {
                    this.timeOfDay[hour] = todStr;
                }
            });
        }
    }
}