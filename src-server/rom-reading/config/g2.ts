const gen2Offsets = {  //symbols annotated with Crystal addresses
    ItemAttributesOffset: 'ItemAttributes', // 0x67C1,
    PokemonPalettes: 'PokemonPalettes', //0xA8CE,
    TrainerPalettes: 'TrainerPalettes', //0xB0CE,
    TMMovesOffset: 'TMHMMoves', //0x1167A,
    TimeOfDayOffset: 'TimesOfDay', //0x14044,
    WildPokemonOffset: 'JohtoGrassWildMons', //0x2A5E9,
    TrainerClassNamesOffset: 'TrainerClassNames', //0x2C1EF,
    TrainerGroupsOffset: 'TrainerGroups', //0x39999,
    MoveDataOffset: 'Moves', //0x41AFB,
    PokemonStatsOffset: 'BaseData', //0x51424,
    PokemonNamesOffset: 'PokemonNames', //0x53384,
    FishingWildsOffset: 'FishGroups', //0x92488,
    TimeFishGroups: 'TimeFishGroups', //0x9266f,
    MapHeaders: 'MapGroupPointers', //0x94000,
    BugContestWilds: 'ContestMons', //0x97D87,
    HeadbuttWildsOffset: 'TreeMons', //0xB82FA,
    FrameBordersOffset: 'Frames', //0xF8800,
    PokemonPicPointers: 'PokemonPicPointers', //0x120000,
    UnownPicPointers: 'UnownPicPointers', //0x124000,
    TrainerPicPointers: 'TrainerPicPointers', //0x128000,
    ItemNamesOffset: 'ItemNames', //0x1C8000,
    MoveNamesOffset: 'MoveNames', //0x1C9F29,
    AreaNamesOffset: 'Landmarks', //0x1CA8C3,
    CrystalPicBankOffset: 0x36,
    charmap: [],
    mapNames: <{ [key: number]: { [key: number]: { name: string } } }>{}
}

gen2Offsets.charmap[0x4A] = 'πµ';//PkMn
gen2Offsets.charmap[0x54] = "POKé";
gen2Offsets.charmap[0x5B] = "PC";
gen2Offsets.charmap[0x5C] = "TM";
gen2Offsets.charmap[0x5D] = "TRAINER";
gen2Offsets.charmap[0x5E] = "ROCKET";
gen2Offsets.charmap[0x80] = 'A';
gen2Offsets.charmap[0x81] = 'B';
gen2Offsets.charmap[0x82] = 'C';
gen2Offsets.charmap[0x83] = 'D';
gen2Offsets.charmap[0x84] = 'E';
gen2Offsets.charmap[0x85] = 'F';
gen2Offsets.charmap[0x86] = 'G';
gen2Offsets.charmap[0x87] = 'H';
gen2Offsets.charmap[0x88] = 'I';
gen2Offsets.charmap[0x89] = 'J';
gen2Offsets.charmap[0x8A] = 'K';
gen2Offsets.charmap[0x8B] = 'L';
gen2Offsets.charmap[0x8C] = 'M';
gen2Offsets.charmap[0x8D] = 'N';
gen2Offsets.charmap[0x8E] = 'O';
gen2Offsets.charmap[0x8F] = 'P';
gen2Offsets.charmap[0x90] = 'Q';
gen2Offsets.charmap[0x91] = 'R';
gen2Offsets.charmap[0x92] = 'S';
gen2Offsets.charmap[0x93] = 'T';
gen2Offsets.charmap[0x94] = 'U';
gen2Offsets.charmap[0x95] = 'V';
gen2Offsets.charmap[0x96] = 'W';
gen2Offsets.charmap[0x97] = 'X';
gen2Offsets.charmap[0x98] = 'Y';
gen2Offsets.charmap[0x99] = 'Z';
gen2Offsets.charmap[0x9A] = '(';
gen2Offsets.charmap[0x9B] = ')';
gen2Offsets.charmap[0x9C] = ':';
gen2Offsets.charmap[0x9D] = ';';
gen2Offsets.charmap[0x9E] = '[';
gen2Offsets.charmap[0x9F] = ']';
// gen2Offsets.charmap[0xA0] = 'a';
// gen2Offsets.charmap[0xA1] = 'b';
// gen2Offsets.charmap[0xA2] = 'c';
// gen2Offsets.charmap[0xA3] = 'd';
// gen2Offsets.charmap[0xA4] = 'e';
// gen2Offsets.charmap[0xA5] = 'f';
// gen2Offsets.charmap[0xA6] = 'g';
// gen2Offsets.charmap[0xA7] = 'h';
// gen2Offsets.charmap[0xA8] = 'i';
// gen2Offsets.charmap[0xA9] = 'j';
// gen2Offsets.charmap[0xAA] = 'k';
// gen2Offsets.charmap[0xAB] = 'l';
// gen2Offsets.charmap[0xAC] = 'm';
// gen2Offsets.charmap[0xAD] = 'n';
// gen2Offsets.charmap[0xAE] = 'o';
// gen2Offsets.charmap[0xAF] = 'p';
// gen2Offsets.charmap[0xB0] = 'q';
// gen2Offsets.charmap[0xB1] = 'r';
// gen2Offsets.charmap[0xB2] = 's';
// gen2Offsets.charmap[0xB3] = 't';
// gen2Offsets.charmap[0xB4] = 'u';
// gen2Offsets.charmap[0xB5] = 'v';
// gen2Offsets.charmap[0xB6] = 'w';
// gen2Offsets.charmap[0xB7] = 'x';
// gen2Offsets.charmap[0xB8] = 'y';
// gen2Offsets.charmap[0xB9] = 'z';
// gen2Offsets.charmap[0xBA] = '_'; // Chatty Crystal
// gen2Offsets.charmap[0xC0] = 'Ä';
// gen2Offsets.charmap[0xC1] = 'Ö';
// gen2Offsets.charmap[0xC2] = 'Ü';
// gen2Offsets.charmap[0xC3] = 'ä';
// gen2Offsets.charmap[0xC4] = 'ö';
// gen2Offsets.charmap[0xC5] = 'ü';
// gen2Offsets.charmap[0xC6] = 'C'; // Chatty Crystal
// gen2Offsets.charmap[0xC7] = 'R'; // Chatty Crystal
// gen2Offsets.charmap[0xC8] = 'AB'; //Chatty Crystal
// gen2Offsets.charmap[0xC9] = 'O'; // Chatty Crystal
// gen2Offsets.charmap[0xCA] = 'M'; // Chatty Crystal
// gen2Offsets.charmap[0xCB] = 'IN'; //Chatty Crystal
// gen2Offsets.charmap[0xCC] = 'A'; // Chatty Crystal
// gen2Offsets.charmap[0xCD] = 'B'; // Chatty Crystal
// gen2Offsets.charmap[0xCE] = 'L'; // Chatty Crystal
// gen2Offsets.charmap[0xCF] = 'E'; // Chatty Crystal
// gen2Offsets.charmap[0xD0] = "'d";
// gen2Offsets.charmap[0xD1] = '|';
// gen2Offsets.charmap[0xD2] = '~';
// gen2Offsets.charmap[0xD3] = '%';
// gen2Offsets.charmap[0xD4] = '&';
// gen2Offsets.charmap[0xD5] = '}';
// gen2Offsets.charmap[0xD6] = '@';
// gen2Offsets.charmap[0xD7] = '☂'; // Chatty Crystal
// gen2Offsets.charmap[0xD8] = '☀'; // Chatty Crystal
// gen2Offsets.charmap[0xD9] = ''; // Chatty Crystal
// gen2Offsets.charmap[0xDA] = '☺'; // Chatty Crystal
// gen2Offsets.charmap[0xDB] = '☹'; // Chatty Crystal
// gen2Offsets.charmap[0xDC] = '♛'; // Chatty Crystal
// gen2Offsets.charmap[0xDD] = '#'; // Chatty Crystal
// gen2Offsets.charmap[0xDE] = '~'; // Chatty Crystal
// gen2Offsets.charmap[0xDF] = '+'; // Chatty Crystal
// gen2Offsets.charmap[0xE0] = "'";
// gen2Offsets.charmap[0xE1] = 'π';//Pk
// gen2Offsets.charmap[0xE2] = 'µ';//Mn
// gen2Offsets.charmap[0xE3] = '-';
// gen2Offsets.charmap[0xE6] = '?';
// gen2Offsets.charmap[0xE7] = '!';
// gen2Offsets.charmap[0xE8] = '.';
// gen2Offsets.charmap[0xE9] = '+';//'&'; //literal ampersand
// gen2Offsets.charmap[0xEA] = 'é';
// gen2Offsets.charmap[0xEB] = '→';
// gen2Offsets.charmap[0xEF] = '♂';
// gen2Offsets.charmap[0xF0] = '$';
// gen2Offsets.charmap[0xF1] = '×';
// gen2Offsets.charmap[0xF2] = '.';
// gen2Offsets.charmap[0xF3] = '/';
// gen2Offsets.charmap[0xF4] = ',';
// gen2Offsets.charmap[0xF5] = '♀';
// gen2Offsets.charmap[0xF6] = '0';
// gen2Offsets.charmap[0xF7] = '1';
// gen2Offsets.charmap[0xF8] = '2';
// gen2Offsets.charmap[0xF9] = '3';
// gen2Offsets.charmap[0xFA] = '4';
// gen2Offsets.charmap[0xFB] = '5';
// gen2Offsets.charmap[0xFC] = '6';
// gen2Offsets.charmap[0xFD] = '7';
// gen2Offsets.charmap[0xFE] = '8';
// gen2Offsets.charmap[0xFF] = '9';

// Black and White 3: Genesis
gen2Offsets.charmap[0xa0] = "A";
gen2Offsets.charmap[0xa1] = "B";
gen2Offsets.charmap[0xa2] = "C";
gen2Offsets.charmap[0xa3] = "D";
gen2Offsets.charmap[0xa4] = "E";
gen2Offsets.charmap[0xa5] = "F";
gen2Offsets.charmap[0xa6] = "G";
gen2Offsets.charmap[0xa7] = "H";
gen2Offsets.charmap[0xa8] = "I";
gen2Offsets.charmap[0xa9] = "J";
gen2Offsets.charmap[0xaa] = "K";
gen2Offsets.charmap[0xab] = "L";
gen2Offsets.charmap[0xac] = "M";
gen2Offsets.charmap[0xad] = "N";
gen2Offsets.charmap[0xae] = "O";
gen2Offsets.charmap[0xaf] = "P";
gen2Offsets.charmap[0xb0] = "Q";
gen2Offsets.charmap[0xb1] = "R";
gen2Offsets.charmap[0xb2] = "S";
gen2Offsets.charmap[0xb3] = "T";
gen2Offsets.charmap[0xb4] = "U";
gen2Offsets.charmap[0xb5] = "V";
gen2Offsets.charmap[0xb6] = "W";
gen2Offsets.charmap[0xb7] = "X";
gen2Offsets.charmap[0xb8] = "Y";
gen2Offsets.charmap[0xb9] = "Z";

gen2Offsets.charmap[0xba] = "(";
gen2Offsets.charmap[0xbb] = ")";
gen2Offsets.charmap[0xbc] = ":";
gen2Offsets.charmap[0xbd] = "'s";
gen2Offsets.charmap[0xbe] = "'t";
gen2Offsets.charmap[0xbf] = "'d";

gen2Offsets.charmap[0xc0] = "a";
gen2Offsets.charmap[0xc1] = "b";
gen2Offsets.charmap[0xc2] = "c";
gen2Offsets.charmap[0xc3] = "d";
gen2Offsets.charmap[0xc4] = "e";
gen2Offsets.charmap[0xc5] = "f";
gen2Offsets.charmap[0xc6] = "g";
gen2Offsets.charmap[0xc7] = "h";
gen2Offsets.charmap[0xc8] = "i";
gen2Offsets.charmap[0xc9] = "j";
gen2Offsets.charmap[0xca] = "k";
gen2Offsets.charmap[0xcb] = "l";
gen2Offsets.charmap[0xcc] = "m";
gen2Offsets.charmap[0xcd] = "n";
gen2Offsets.charmap[0xce] = "o";
gen2Offsets.charmap[0xcf] = "p";
gen2Offsets.charmap[0xd0] = "q";
gen2Offsets.charmap[0xd1] = "r";
gen2Offsets.charmap[0xd2] = "s";
gen2Offsets.charmap[0xd3] = "t";
gen2Offsets.charmap[0xd4] = "u";
gen2Offsets.charmap[0xd5] = "v";
gen2Offsets.charmap[0xd6] = "w";
gen2Offsets.charmap[0xd7] = "x";
gen2Offsets.charmap[0xd8] = "y";
gen2Offsets.charmap[0xd9] = "z";

gen2Offsets.charmap[0xda] = "┌";
gen2Offsets.charmap[0xdb] = "─";
gen2Offsets.charmap[0xdc] = "┐";
gen2Offsets.charmap[0xdd] = "│";
gen2Offsets.charmap[0xde] = "└";
gen2Offsets.charmap[0xdf] = "┘";

gen2Offsets.charmap[0xe0] = "'";
gen2Offsets.charmap[0xe1] = "π";
gen2Offsets.charmap[0xe2] = "µ";
gen2Offsets.charmap[0xe3] = "-";
gen2Offsets.charmap[0xe4] = "■";
gen2Offsets.charmap[0xe5] = "▲";

gen2Offsets.charmap[0xe6] = "?";
gen2Offsets.charmap[0xe7] = "!";
gen2Offsets.charmap[0xe8] = ".";
gen2Offsets.charmap[0xe9] = "&";

gen2Offsets.charmap[0xea] = "é";
gen2Offsets.charmap[0xeb] = "'l";
gen2Offsets.charmap[0xec] = "▷";
gen2Offsets.charmap[0xed] = "▶";
gen2Offsets.charmap[0xee] = "▼";
gen2Offsets.charmap[0xef] = "♂";
gen2Offsets.charmap[0xf0] = "¥";
gen2Offsets.charmap[0xf1] = "'m";
gen2Offsets.charmap[0xf2] = "…";
gen2Offsets.charmap[0xf3] = "/";
gen2Offsets.charmap[0xf4] = ",";
gen2Offsets.charmap[0xf5] = "♀";

gen2Offsets.charmap[0xf6] = "0";
gen2Offsets.charmap[0xf7] = "1";
gen2Offsets.charmap[0xf8] = "2";
gen2Offsets.charmap[0xf9] = "3";
gen2Offsets.charmap[0xfa] = "4";
gen2Offsets.charmap[0xfb] = "5";
gen2Offsets.charmap[0xfc] = "6";
gen2Offsets.charmap[0xfd] = "7";
gen2Offsets.charmap[0xfe] = "8";
gen2Offsets.charmap[0xff] = "9";


gen2Offsets.mapNames = {
    1: {
        0x1: { "name": "Olivine Pokémon Center 1F" },
        0x2: { "name": "Olivine Gym" },
        0x3: { "name": "Olivine Voltorb House" },
        0x4: { "name": "Olivine House Beta" },
        0x5: { "name": "Olivine Punishment Speech House" },
        0x6: { "name": "Olivine Good Rod House" },
        0x7: { "name": "Olivine Cafe" },
        0x8: { "name": "Olivine Mart" },
        0x9: { "name": "Route 38 Ecruteak Gate" },
        0xA: { "name": "Route 39 Barn" },
        0xB: { "name": "Route 39 Farmhouse" },
        0xC: { "name": "Route 38" },
        0xD: { "name": "Route 39" },
        0xE: { "name": "Olivine City" },
    },
    2: {
        0x1: { "name": "Mahogany Red Gyarados Speech House" },
        0x2: { "name": "Mahogany Gym" },
        0x3: { "name": "Mahogany Pokémon Center 1F" },
        0x4: { "name": "Route 42 Ecruteak Gate" },
        0x5: { "name": "Route 42" },
        0x6: { "name": "Route 44" },
        0x7: { "name": "Mahogany Town" },
    },
    3: {
        0x1: { "name": "Sprout Tower 1F" },
        0x2: { "name": "Sprout Tower 2F" },
        0x3: { "name": "Sprout Tower 3F" },
        0x4: { "name": "Tin Tower 1F" },
        0x5: { "name": "Tin Tower 2F" },
        0x6: { "name": "Tin Tower 3F" },
        0x7: { "name": "Tin Tower 4F" },
        0x8: { "name": "Tin Tower 5F" },
        0x9: { "name": "Tin Tower 6F" },
        0xA: { "name": "Tin Tower 7F" },
        0xB: { "name": "Tin Tower 8F" },
        0xC: { "name": "Tin Tower 9F" },
        0xD: { "name": "Burned Tower 1F" },
        0xE: { "name": "Burned Tower B1F" },
        0xF: { "name": "National Park" },
        0x10: { "name": "National Park Bug Contest" },
        0x11: { "name": "Radio Tower 1F" },
        0x12: { "name": "Radio Tower 2F" },
        0x13: { "name": "Radio Tower 3F" },
        0x14: { "name": "Radio Tower 4F" },
        0x15: { "name": "Radio Tower 5F" },
        0x16: { "name": "Ruins of Alph Outside" },
        0x17: { "name": "Ruins of Alph Ho-oh Chamber" },
        0x18: { "name": "Ruins of Alph Kabuto Chamber" },
        0x19: { "name": "Ruins of Alph Omanyte Chamber" },
        0x1A: { "name": "Ruins of Alph Aerodactyl Chamber" },
        0x1B: { "name": "Ruins of Alph Inner Chamber" },
        0x1C: { "name": "Ruins of Alph Research Center" },
        0x1D: { "name": "Ruins of Alph Ho-oh Item Room" },
        0x1E: { "name": "Ruins of Alph Kabuto Item Room" },
        0x1F: { "name": "Ruins of Alph Omanyte Item Room" },
        0x20: { "name": "Ruins of Alph Aerodactyl Item Room" },
        0x21: { "name": "Ruins of Alph Ho-Oh Word Room" },
        0x22: { "name": "Ruins of Alph Kabuto Word Room" },
        0x23: { "name": "Ruins of Alph Omanyte Word Room" },
        0x24: { "name": "Ruins of Alph Aerodactyl Word Room" },
        0x25: { "name": "Union Cave 1F" },
        0x26: { "name": "Union Cave B1F" },
        0x27: { "name": "Union Cave B2F" },
        0x28: { "name": "Slowpoke Well B1F" },
        0x29: { "name": "Slowpoke Well B2F" },
        0x2A: { "name": "Olivine Lighthouse 1F" },
        0x2B: { "name": "Olivine Lighthouse 2F" },
        0x2C: { "name": "Olivine Lighthouse 3F" },
        0x2D: { "name": "Olivine Lighthouse 4F" },
        0x2E: { "name": "Olivine Lighthouse 5F" },
        0x2F: { "name": "Olivine Lighthouse 6F" },
        0x30: { "name": "Mahogany Mart 1F" },
        0x31: { "name": "Team Rocket Base B1F" },
        0x32: { "name": "Team Rocket Base B2F" },
        0x33: { "name": "Team Rocket Base B3F" },
        0x34: { "name": "Ilex Forest" },
        0x35: { "name": "Warehouse Entrance" },
        0x36: { "name": "Underground Path Switch Room Entrances" },
        0x37: { "name": "Goldenrod Dept Store B1F" },
        0x38: { "name": "Underground Warehouse" },
        0x39: { "name": "Mount Mortar 1F Outside" },
        0x3A: { "name": "Mount Mortar 1F Inside" },
        0x3B: { "name": "Mount Mortar 2F Inside" },
        0x3C: { "name": "Mount Mortar B1F" },
        0x3D: { "name": "Ice Path 1F" },
        0x3E: { "name": "Ice Path B1F" },
        0x3F: { "name": "Ice Path B2F Mahogany Side" },
        0x40: { "name": "Ice Path B2F Blackthorn Side" },
        0x41: { "name": "Ice Path B3F" },
        0x42: { "name": "Whirl Island NW" },
        0x43: { "name": "Whirl Island NE" },
        0x44: { "name": "Whirl Island SW" },
        0x45: { "name": "Whirl Island Cave" },
        0x46: { "name": "Whirl Island SE" },
        0x47: { "name": "Whirl Island B1F" },
        0x48: { "name": "Whirl Island B2F" },
        0x49: { "name": "Whirl Island Lugia Chamber" },
        0x4A: { "name": "Silver Cave Room 1" },
        0x4B: { "name": "Silver Cave Room 2" },
        0x4C: { "name": "Silver Cave Room 3" },
        0x4D: { "name": "Silver Cave Item Rooms" },
        0x4E: { "name": "Dark Cave Violet Entrance" },
        0x4F: { "name": "Dark Cave Blackthorn Entrance" },
        0x50: { "name": "Dragon's Den 1F" },
        0x51: { "name": "Dragon's Den B1F" },
        0x52: { "name": "Dragon Shrine" },
        0x53: { "name": "Tohjo Falls" },
        0x54: { "name": "Diglett's Cave" },
        0x55: { "name": "Mount Moon" },
        0x56: { "name": "Underground" },
        0x57: { "name": "Rock Tunnel 1F" },
        0x58: { "name": "Rock Tunnel B1F" },
        0x59: { "name": "Safari Zone Fuchsia Gate Beta" },
        0x5A: { "name": "Safari Zone Beta" },
        0x5B: { "name": "Victory Road" },
    },
    4: {
        0x1: { "name": "Ecruteak House" }, // passage to Tin Tower
        0x2: { "name": "Wise Trio's Room" },
        0x3: { "name": "Ecruteak Pokémon Center 1F" },
        0x4: { "name": "Ecruteak Lugia Speech House" },
        0x5: { "name": "Dance Theatre" },
        0x6: { "name": "Ecruteak Mart" },
        0x7: { "name": "Ecruteak Gym" },
        0x8: { "name": "Ecruteak Itemfinder House" },
        0x9: { "name": "Ecruteak City" },
    },
    5: {
        0x1: { "name": "Blackthorn Gym 1F" },
        0x2: { "name": "Blackthorn Gym 2F" },
        0x3: { "name": "Blackthorn Dragon Speech House" },
        0x4: { "name": "Blackthorn Dodrio Trade House" },
        0x5: { "name": "Blackthorn Mart" },
        0x6: { "name": "Blackthorn Pokémon Center 1F" },
        0x7: { "name": "Move Deleter's House" },
        0x8: { "name": "Route 45" },
        0x9: { "name": "Route 46" },
        0xA: { "name": "Blackthorn City" },
    },
    6: {
        0x1: { "name": "Cinnabar Pokémon Center 1F" },
        0x2: { "name": "Cinnabar Pokémon Center 2F Beta" },
        0x3: { "name": "Route 19 - Fuchsia Gate" },
        0x4: { "name": "Seafoam Gym" },
        0x5: { "name": "Route 19" },
        0x6: { "name": "Route 20" },
        0x7: { "name": "Route 21" },
        0x8: { "name": "Cinnabar Island" },
    },
    7: {
        0x1: { "name": "Cerulean Gym Badge Speech House" },
        0x2: { "name": "Cerulean Police Station" },
        0x3: { "name": "Cerulean Trade Speech House" },
        0x4: { "name": "Cerulean Pokémon Center 1F" },
        0x5: { "name": "Cerulean Pokémon Center 2F Beta" },
        0x6: { "name": "Cerulean Gym" },
        0x7: { "name": "Cerulean Mart" },
        0x8: { "name": "Route 10 Pokémon Center 1F" },
        0x9: { "name": "Route 10 Pokémon Center 2F Beta" },
        0xA: { "name": "Power Plant" },
        0xB: { "name": "Bill's House" },
        0xC: { "name": "Route 4" },
        0xD: { "name": "Route 9" },
        0xE: { "name": "Route 10 North" },
        0xF: { "name": "Route 24" },
        0x10: { "name": "Route 25" },
        0x11: { "name": "Cerulean City" },
    },
    8: {
        0x1: { "name": "Azalea Pokémon Center 1F" },
        0x2: { "name": "Charcoal Kiln" },
        0x3: { "name": "Azalea Mart" },
        0x4: { "name": "Kurt's House" },
        0x5: { "name": "Azalea Gym" },
        0x6: { "name": "Route 33" },
        0x7: { "name": "Azalea Town" },
    },
    9: {
        0x1: { "name": "Lake of Rage Hidden Power House" },
        0x2: { "name": "Lake of Rage Magikarp House" },
        0x3: { "name": "Route 43 Mahogany Gate" },
        0x4: { "name": "Route 43 Gate" },
        0x5: { "name": "Route 43" },
        0x6: { "name": "Lake of Rage" },
    },
    10: {
        0x1: { "name": "Route 32" },
        0x2: { "name": "Route 35" },
        0x3: { "name": "Route 36" },
        0x4: { "name": "Route 37" },
        0x5: { "name": "Violet City" },
        0x6: { "name": "Violet Mart" },
        0x7: { "name": "Violet Gym" },
        0x8: { "name": "Earl's Pokémon Academy" },
        0x9: { "name": "Violet Nickname Speech House" },
        0xA: { "name": "Violet Pokémon Center 1F" },
        0xB: { "name": "Violet Onix Trade House" },
        0xC: { "name": "Route 32 Ruins of Alph Gate" },
        0xD: { "name": "Route 32 Pokémon Center 1F" },
        0xE: { "name": "Route 35 Goldenrod gate" },
        0xF: { "name": "Route 35 National Park gate" },
        0x10: { "name": "Route 36 Ruins of Alph gate" },
        0x11: { "name": "Route 36 National Park gate" },
    },
    11: {
        0x1: { "name": "Route 34" },
        0x2: { "name": "Goldenrod City" },
        0x3: { "name": "Goldenrod Gym" },
        0x4: { "name": "Goldenrod Bike Shop" },
        0x5: { "name": "Goldenrod Happiness Rater" },
        0x6: { "name": "Goldenrod Bill's House" },
        0x7: { "name": "Goldenrod Magnet Train Station" },
        0x8: { "name": "Goldenrod Flower Shop" },
        0x9: { "name": "Goldenrod PP Speech House" },
        0xA: { "name": "Goldenrod Name Rater's House" },
        0xB: { "name": "Goldenrod Dept Store 1F" },
        0xC: { "name": "Goldenrod Dept Store 2F" },
        0xD: { "name": "Goldenrod Dept Store 3F" },
        0xE: { "name": "Goldenrod Dept Store 4F" },
        0xF: { "name": "Goldenrod Dept Store 5F" },
        0x10: { "name": "Goldenrod Dept Store 6F" },
        0x11: { "name": "Goldenrod Dept Store Elevator" },
        0x12: { "name": "Goldenrod Dept Store Roof" },
        0x13: { "name": "Goldenrod Game Corner" },
        0x14: { "name": "Goldenrod Pokémon Center 1F" },
        0x15: { "name": "Goldenrod PokéCom Center 2F Mobile" },
        0x16: { "name": "Ilex Forest Azalea Gate" },
        0x17: { "name": "Route 34 Ilex Forest Gate" },
        0x18: { "name": "Day Care" },
    },
    12: {
        0x1: { "name": "Route 6" },
        0x2: { "name": "Route 11" },
        0x3: { "name": "Vermilion City" },
        0x4: { "name": "Vermilion House Fishing Speech House" },
        0x5: { "name": "Vermilion Pokémon Center 1F" },
        0x6: { "name": "Vermilion Pokémon Center 2F Beta" },
        0x7: { "name": "Pokémon Fan Club" },
        0x8: { "name": "Vermilion Magnet Train Speech House" },
        0x9: { "name": "Vermilion Mart" },
        0xA: { "name": "Vermilion House Diglett's Cave Speech House" },
        0xB: { "name": "Vermilion Gym" },
        0xC: { "name": "Route 6 Saffron Gate" },
        0xD: { "name": "Route 6 Underground Entrance" },
    },
    13: {
        0x1: { "name": "Route 1" },
        0x2: { "name": "Pallet Town" },
        0x3: { "name": "Red's House 1F" },
        0x4: { "name": "Red's House 2F" },
        0x5: { "name": "Blue's House" },
        0x6: { "name": "Oak's Lab" },
    },
    14: {
        0x1: { "name": "Route 3" },
        0x2: { "name": "Pewter City" },
        0x3: { "name": "Pewter Nidoran Speech House" },
        0x4: { "name": "Pewter Gym" },
        0x5: { "name": "Pewter Mart" },
        0x6: { "name": "Pewter Pokémon Center 1F" },
        0x7: { "name": "Pewter Pokémon Center 2F Beta" },
        0x8: { "name": "Pewter Snooze Speech House" },
    },
    15: {
        0x1: { "name": "Olivine Port" },
        0x2: { "name": "Vermilion Port" },
        0x3: { "name": "Fast Ship 1F" },
        0x4: { "name": "Fast Ship Cabins NNW, NNE, NE" },
        0x5: { "name": "Fast Ship Cabins SW, SSW, NW" },
        0x6: { "name": "Fast Ship Cabins SE, SSE, Captain's Cabin" },
        0x7: { "name": "Fast Ship B1F" },
        0x8: { "name": "Olivine Port Passage" },
        0x9: { "name": "Vermilion Port Passage" },
        0xA: { "name": "Mount Moon Square" },
        0xB: { "name": "Mount Moon Gift Shop" },
        0xC: { "name": "Tin Tower Roof" },
    },
    16: {
        0x1: { "name": "Route 23" },
        0x2: { "name": "Indigo Plateau Pokémon Center 1F" },
        0x3: { "name": "Will's Room" },
        0x4: { "name": "Koga's Room" },
        0x5: { "name": "Bruno's Room" },
        0x6: { "name": "Karen's Room" },
        0x7: { "name": "Lance's Room" },
        0x8: { "name": "Hall of Fame" },
    },
    17: {
        0x1: { "name": "Route 13" },
        0x2: { "name": "Route 14" },
        0x3: { "name": "Route 15" },
        0x4: { "name": "Route 18" },
        0x5: { "name": "Fuchsia City" },
        0x6: { "name": "Fuchsia Mart" },
        0x7: { "name": "Safari Zone Main Office" },
        0x8: { "name": "Fuchsia Gym" },
        0x9: { "name": "Fuchsia Bill Speech House" },
        0xA: { "name": "Fuchsia Pokémon Center 1F" },
        0xB: { "name": "Fuchsia Pokémon Center 2F Beta" },
        0xC: { "name": "Safari Zone Warden's Home" },
        0xD: { "name": "Route 15 Fuchsia Gate" },
    },
    18: {
        0x1: { "name": "Route 8" },
        0x2: { "name": "Route 12" },
        0x3: { "name": "Route 10 South" },
        0x4: { "name": "Lavender Town" },
        0x5: { "name": "Lavender Pokémon Center 1F" },
        0x6: { "name": "Lavender Pokémon Center 2F Beta" },
        0x7: { "name": "Mr. Fuji's House" },
        0x8: { "name": "Lavender Town Speech House" },
        0x9: { "name": "Lavender Name Rater" },
        0xA: { "name": "Lavender Mart" },
        0xB: { "name": "Soul House" },
        0xC: { "name": "Lav Radio Tower 1F" },
        0xD: { "name": "Route 8 Saffron Gate" },
        0xE: { "name": "Route 12 Super Rod House" },
    },
    19: {
        0x1: { "name": "Route 28" },
        0x2: { "name": "Silver Cave Outside" },
        0x3: { "name": "Silver Cave Pokémon Center 1F" },
        0x4: { "name": "Route 28 Famous Speech House" },
    },
    20: {
        0x1: { "name": "Pokémon Center 2F" },
        0x2: { "name": "Trade Center" },
        0x3: { "name": "Colosseum" },
        0x4: { "name": "Time Capsule" },
        0x5: { "name": "Mobile Trade Room Mobile" },
        0x6: { "name": "Mobile Battle Room" },
    },
    21: {
        0x1: { "name": "Route 7" },
        0x2: { "name": "Route 16" },
        0x3: { "name": "Route 17" },
        0x4: { "name": "Celadon City" },
        0x5: { "name": "Celadon Dept Store 1F" },
        0x6: { "name": "Celadon Dept Store 2F" },
        0x7: { "name": "Celadon Dept Store 3F" },
        0x8: { "name": "Celadon Dept Store 4F" },
        0x9: { "name": "Celadon Dept Store 5F" },
        0xA: { "name": "Celadon Dept Store 6F" },
        0xB: { "name": "Celadon Dept Store Elevator" },
        0xC: { "name": "Celadon Mansion 1F" },
        0xD: { "name": "Celadon Mansion 2F" },
        0xE: { "name": "Celadon Mansion 3F" },
        0xF: { "name": "Celadon Mansion Roof" },
        0x10: { "name": "Celadon Mansion Roof House" },
        0x11: { "name": "Celadon Pokémon Center 1F" },
        0x12: { "name": "Celadon Pokémon Center 2F Beta" },
        0x13: { "name": "Celadon Game Corner" },
        0x14: { "name": "Celadon Game Corner Prize Room" },
        0x15: { "name": "Celadon Gym" },
        0x16: { "name": "Celadon Cafe" },
        0x17: { "name": "Route 16 Fuchsia Speech House" },
        0x18: { "name": "Route 16 Gate" },
        0x19: { "name": "Route 7 Saffron Gate" },
        0x1A: { "name": "Route 17 18 Gate" },
    },
    22: {
        0x1: { "name": "Route 40" },
        0x2: { "name": "Route 41" },
        0x3: { "name": "Cianwood City" },
        0x4: { "name": "Mania's House" },
        0x5: { "name": "Cianwood Gym" },
        0x6: { "name": "Cianwood Pokémon Center 1F" },
        0x7: { "name": "Cianwood Pharmacy" },
        0x8: { "name": "Cianwood City Photo Studio" },
        0x9: { "name": "Cianwood Lugia Speech House" },
        0xA: { "name": "Poke Seer's House" },
        0xB: { "name": "Battle Tower 1F" },
        0xC: { "name": "Battle Tower Battle Room" },
        0xD: { "name": "Battle Tower Elevator" },
        0xE: { "name": "Battle Tower Hallway" },
        0xF: { "name": "Route 40 Battle Tower Gate" },
        0x10: { "name": "Battle Tower Outside" },
    },
    23: {
        0x1: { "name": "Route 2" },
        0x2: { "name": "Route 22" },
        0x3: { "name": "Viridian City" },
        0x4: { "name": "Viridian Gym" },
        0x5: { "name": "Viridian Nickname Speech House" },
        0x6: { "name": "Trainer House 1F" },
        0x7: { "name": "Trainer House B1F" },
        0x8: { "name": "Viridian Mart" },
        0x9: { "name": "Viridian Pokémon Center 1F" },
        0xA: { "name": "Viridian Pokémon Center 2F Beta" },
        0xB: { "name": "Route 2 Nugget Speech House" },
        0xC: { "name": "Route 2 Gate" },
        0xD: { "name": "Victory Road Gate" },
    },
    24: {
        0x1: { "name": "Route 26" },
        0x2: { "name": "Route 27" },
        0x3: { "name": "Route 29" },
        0x4: { "name": "New Bark Town" },
        0x5: { "name": "Elm's Lab" },
        0x6: { "name": "Kris's House 1F" },
        0x7: { "name": "Kris's House 2F" },
        0x8: { "name": "Kris's Neighbor's House" },
        0x9: { "name": "Elm's House" },
        0xA: { "name": "Route 26 Heal Speech House" },
        0xB: { "name": "Route 26 Day of Week Siblings House" },
        0xC: { "name": "Route 27 Sandstorm House" },
        0xD: { "name": "Route 29 46 Gate" },
    },
    25: {
        0x1: { "name": "Route 5" },
        0x2: { "name": "Saffron City" },
        0x3: { "name": "Fighting Dojo" },
        0x4: { "name": "Saffron Gym" },
        0x5: { "name": "Saffron Mart" },
        0x6: { "name": "Saffron Pokémon Center 1F" },
        0x7: { "name": "Saffron Pokémon Center 2F Beta" },
        0x8: { "name": "Mr. Psychic's House" },
        0x9: { "name": "Saffron Train Station" },
        0xA: { "name": "Silph Co. 1F" },
        0xB: { "name": "Copycat's House 1F" },
        0xC: { "name": "Copycat's House 2F" },
        0xD: { "name": "Route 5 Underground Entrance" },
        0xE: { "name": "Route 5 Saffron City Gate" },
        0xF: { "name": "Route 5 Cleanse Tag Speech House" },
    },
    26: {
        0x1: { "name": "Route 30" },
        0x2: { "name": "Route 31" },
        0x3: { "name": "Cherrygrove City" },
        0x4: { "name": "Cherrygrove Mart" },
        0x5: { "name": "Cherrygrove Pokémon Center 1F" },
        0x6: { "name": "Cherrygrove Gym Speech House" },
        0x7: { "name": "Guide Gent's House" },
        0x8: { "name": "Cherrygrove Evolution Speech House" },
        0x9: { "name": "Route 30 Berry Speech House" },
        0xA: { "name": "Mr. Pokémon's House" },
        0xB: { "name": "Route 31 Violet Gate" },
    },
}