const gen2Offsets = {  //Crystal only for now
    ItemAttributesOffset: 0x67C1,
    TMMovesOffset: 0x1167A,
    WildPokemonOffset: 0x2A5E9,
    MoveDataOffset: 0x41AFB,
    PokemonNamesOffset: 0x53384,
    PokemonStatsOffset: 0x51424,
    FishingWildsOffset: 0x924E3,
    HeadbuttWildsOffset: 0xB82FA,
    PicPointers: 0x120000,
    MoveNamesOffset: 0x1C9F29,
    ItemNamesOffset: 0x1C8000,
    charmap: []
}

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
gen2Offsets.charmap[0xA0] = 'a';
gen2Offsets.charmap[0xA1] = 'b';
gen2Offsets.charmap[0xA2] = 'c';
gen2Offsets.charmap[0xA3] = 'd';
gen2Offsets.charmap[0xA4] = 'e';
gen2Offsets.charmap[0xA5] = 'f';
gen2Offsets.charmap[0xA6] = 'g';
gen2Offsets.charmap[0xA7] = 'h';
gen2Offsets.charmap[0xA8] = 'i';
gen2Offsets.charmap[0xA9] = 'j';
gen2Offsets.charmap[0xAA] = 'k';
gen2Offsets.charmap[0xAB] = 'l';
gen2Offsets.charmap[0xAC] = 'm';
gen2Offsets.charmap[0xAD] = 'n';
gen2Offsets.charmap[0xAE] = 'o';
gen2Offsets.charmap[0xAF] = 'p';
gen2Offsets.charmap[0xB0] = 'q';
gen2Offsets.charmap[0xB1] = 'r';
gen2Offsets.charmap[0xB2] = 's';
gen2Offsets.charmap[0xB3] = 't';
gen2Offsets.charmap[0xB4] = 'u';
gen2Offsets.charmap[0xB5] = 'v';
gen2Offsets.charmap[0xB6] = 'w';
gen2Offsets.charmap[0xB7] = 'x';
gen2Offsets.charmap[0xB8] = 'y';
gen2Offsets.charmap[0xB9] = 'z';
//gen2Offsets.charmap[0xC0]='Ä';
//gen2Offsets.charmap[0xC1]='Ö';
//gen2Offsets.charmap[0xC2]='Ü,;
//gen2Offsets.charmap[0xC3]='ä,;
//gen2Offsets.charmap[0xC4]='ö';
//gen2Offsets.charmap[0xC5]='ü';
gen2Offsets.charmap[0xD0] = "'d";
gen2Offsets.charmap[0xD1] = '|';
gen2Offsets.charmap[0xD2] = '~';
gen2Offsets.charmap[0xD3] = '%';
gen2Offsets.charmap[0xD4] = '&';
gen2Offsets.charmap[0xD5] = '}';
gen2Offsets.charmap[0xD6] = '@';
gen2Offsets.charmap[0xE0] = "'";
gen2Offsets.charmap[0xE1] = 'Ê';
gen2Offsets.charmap[0xE2] = 'Ë';
gen2Offsets.charmap[0xE3] = '-';
gen2Offsets.charmap[0xE6] = '?';
gen2Offsets.charmap[0xE7] = '!';
gen2Offsets.charmap[0xE8] = '.';
//gen2Offsets.charmap[0xE9]='&';
gen2Offsets.charmap[0xEA] = 'é';
gen2Offsets.charmap[0xEB] = '→';
gen2Offsets.charmap[0xEF] = '♂';
gen2Offsets.charmap[0xF0] = '$';
gen2Offsets.charmap[0xF1] = '×';
gen2Offsets.charmap[0xF2] = '.';
gen2Offsets.charmap[0xF3] = '/';
gen2Offsets.charmap[0xF4] = ',';
gen2Offsets.charmap[0xF5] = '♀';
gen2Offsets.charmap[0xF6] = '0';
gen2Offsets.charmap[0xF7] = '1';
gen2Offsets.charmap[0xF8] = '2';
gen2Offsets.charmap[0xF9] = '3';
gen2Offsets.charmap[0xFA] = '4';
gen2Offsets.charmap[0xFB] = '5';
gen2Offsets.charmap[0xFC] = '6';
gen2Offsets.charmap[0xFD] = '7';
gen2Offsets.charmap[0xFE] = '8';
gen2Offsets.charmap[0xFF] = '9';