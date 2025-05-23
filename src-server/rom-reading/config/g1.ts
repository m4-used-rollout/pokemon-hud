const gen1Charmap = new Array<string>();
gen1Charmap[0x6D] = ':';
gen1Charmap[0x7F] = ' ';

gen1Charmap[0x80] = 'A';
gen1Charmap[0x81] = 'B';
gen1Charmap[0x82] = 'C';
gen1Charmap[0x83] = 'D';
gen1Charmap[0x84] = 'E';
gen1Charmap[0x85] = 'F';
gen1Charmap[0x86] = 'G';
gen1Charmap[0x87] = 'H';
gen1Charmap[0x88] = 'I';
gen1Charmap[0x89] = 'J';
gen1Charmap[0x8A] = 'K';
gen1Charmap[0x8B] = 'L';
gen1Charmap[0x8C] = 'M';
gen1Charmap[0x8D] = 'N';
gen1Charmap[0x8E] = 'O';
gen1Charmap[0x8F] = 'P';
gen1Charmap[0x90] = 'Q';
gen1Charmap[0x91] = 'R';
gen1Charmap[0x92] = 'S';
gen1Charmap[0x93] = 'T';
gen1Charmap[0x94] = 'U';
gen1Charmap[0x95] = 'V';
gen1Charmap[0x96] = 'W';
gen1Charmap[0x97] = 'X';
gen1Charmap[0x98] = 'Y';
gen1Charmap[0x99] = 'Z';
gen1Charmap[0x9A] = '(';
gen1Charmap[0x9B] = ')';
gen1Charmap[0x9C] = ':';
gen1Charmap[0x9D] = ';';
gen1Charmap[0x9E] = '[';
gen1Charmap[0x9F] = ']';
gen1Charmap[0xA0] = 'a';
gen1Charmap[0xA1] = 'b';
gen1Charmap[0xA2] = 'c';
gen1Charmap[0xA3] = 'd';
gen1Charmap[0xA4] = 'e';
gen1Charmap[0xA5] = 'f';
gen1Charmap[0xA6] = 'g';
gen1Charmap[0xA7] = 'h';
gen1Charmap[0xA8] = 'i';
gen1Charmap[0xA9] = 'j';
gen1Charmap[0xAA] = 'k';
gen1Charmap[0xAB] = 'l';
gen1Charmap[0xAC] = 'm';
gen1Charmap[0xAD] = 'n';
gen1Charmap[0xAE] = 'o';
gen1Charmap[0xAF] = 'p';
gen1Charmap[0xB0] = 'q';
gen1Charmap[0xB1] = 'r';
gen1Charmap[0xB2] = 's';
gen1Charmap[0xB3] = 't';
gen1Charmap[0xB4] = 'u';
gen1Charmap[0xB5] = 'v';
gen1Charmap[0xB6] = 'w';
gen1Charmap[0xB7] = 'x';
gen1Charmap[0xB8] = 'y';
gen1Charmap[0xB9] = 'z';
gen1Charmap[0xBA] = 'é';
gen1Charmap[0xBB] = "'d";
gen1Charmap[0xBC] = "'l";
gen1Charmap[0xBD] = "'s";
gen1Charmap[0xBE] = "'t";
gen1Charmap[0xBF] = "'v";

gen1Charmap[0xE0] = "'";
gen1Charmap[0xE1] = 'π'; //Pk
gen1Charmap[0xE2] = 'µ'; //Mn
gen1Charmap[0xE3] = '-';
gen1Charmap[0xE4] = "'r";
gen1Charmap[0xE5] = "'m";
gen1Charmap[0xE6] = '?';
gen1Charmap[0xE7] = '!';
gen1Charmap[0xE8] = '.';

gen1Charmap[0xEF] = '♂';
gen1Charmap[0xF0] = '$';
gen1Charmap[0xF1] = '×';
gen1Charmap[0xF2] = '.'; //'_';
gen1Charmap[0xF3] = '/';
gen1Charmap[0xF4] = ',';
gen1Charmap[0xF5] = '♀';
gen1Charmap[0xF6] = '0';
gen1Charmap[0xF7] = '1';
gen1Charmap[0xF8] = '2';
gen1Charmap[0xF9] = '3';
gen1Charmap[0xFA] = '4';
gen1Charmap[0xFB] = '5';
gen1Charmap[0xFC] = '6';
gen1Charmap[0xFD] = '7';
gen1Charmap[0xFE] = '8';
gen1Charmap[0xFF] = '9';

// const gen1MapNames = [
//     "Pallet Town",
//     "Viridian City",
//     "Pewter City",
//     "Cerulean City",
//     "Lavender Town",
//     "Vermilion City",
//     "Celadon City",
//     "Fuchsia City",
//     "Cinnabar Island",
//     "Pokémon League",
//     "Saffron City",
//     "Unknown",
//     "Route 1",
//     "Route 2",
//     "Route 3",
//     "Route 4",
//     "Route 5",
//     "Route 6",
//     "Route 7",
//     "Route 8",
//     "Route 9",
//     "Route 10",
//     "Route 11",
//     "Route 12",
//     "Route 13",
//     "Route 14",
//     "Route 15",
//     "Route 16",
//     "Route 17",
//     "Route 18",
//     "Route 19",
//     "Route 20",
//     "Route 21",
//     "Route 22",
//     "Route 23",
//     "Route 24",
//     "Route 25",
//     "Mom's House 1F",
//     "Mom's House 2F",
//     "Rival's House",
//     "Professor Oak's Lab",
//     "Viridian Pokémon Center",
//     "Viridian Poké Mart",
//     "Viridian School",
//     "Viridian House",
//     "Viridian Gym",
//     "Diglett's Cave",
//     "Route 2 Gate",
//     "Route 2 House",
//     "Route 2 Gate",
//     "Route 2 Gate",
//     "Viridian Forest",
//     "Pewter Museum 1F",
//     "Pewter Museum 2F",
//     "Pewter Gym",
//     "Pewter House",
//     "Pewter Poké Mart",
//     "Pewter House",
//     "Pewter Pokémon Center",
//     "Mt. Moon",
//     "Mt. Moon",
//     "Mt. Moon",
//     "Cerulean House",
//     "Cerulean House",
//     "Cerulean Pokémon Center",
//     "Cerulean Gym",
//     "Cerulean Bike Shop",
//     "Cerulean Poké Mart",
//     "Mt. Moon Pokémon Center",
//     "Cerulean House",
//     "Saffron City Gate",
//     "Underground Path",
//     "Daycare Center",
//     "Saffron City Gate",
//     "Underground Path",
//     "Underground Path",
//     "Saffron City Gate",
//     "Underground Path",
//     "Underground Path",
//     "Saffron City Gate",
//     "Underground Path",
//     "Rock Tunnel Pokémon Center",
//     "Rock Tunnel",
//     "Power Plant",
//     "Route 11 Gate 1F",
//     "Diglett's Cave",
//     "Route 11 Gate 2F",
//     "Route 12 Gate 1F",
//     "Sea Cottage",
//     "Vermilion Pokémon Center",
//     "Vermilion Pokémon Fan Club",
//     "Vermilion Poké Mart",
//     "Vermilion Pokémon Gym ",
//     "Pidgey House",
//     "Vermilion Harbor",
//     "S.S. Anne 1F",
//     "S.S. Anne 2F",
//     "S.S. Anne 3F",
//     "S.S. Anne B1F",
//     "S.S. Anne Deck",
//     "S.S. Anne Kitchen",
//     "S.S. Anne Cabin",
//     "S.S. Anne 1F",
//     "S.S. Anne 2F",
//     "S.S. Anne B1F",
//     "Victory Road",
//     "Victory Road",
//     "Victory Road",
//     "Victory Road",
//     "Pokémon League",
//     "Pokémon League",
//     "Pokémon League",
//     "Pokémon League",
//     "Lance's Hall",
//     "Pokémon League",
//     "Pokémon League",
//     "Pokémon League",
//     "Pokémon League",
//     "Hall of Fame",
//     "Underground Path",
//     "Champion's Hall",
//     "Underground Path",
//     "Celadon Department Store 1F",
//     "Celadon Department Store 2F",
//     "Celadon Department Store 3F",
//     "Celadon Department Store 4F",
//     "Celadon Department Store 5F",
//     "Celadon Department Store Lift",
//     "Celadon Mansion 1F",
//     "Celadon Mansion 2F",
//     "Celadon Mansion 3F",
//     "Celadon Mansion 4F",
//     "Celadon Mansion 4F",
//     "Celadon Pokémon Center",
//     "Celadon Gym",
//     "Rocket Game Corner",
//     "Celadon Department Store 5F",
//     "Rocket Prize Corner",
//     "Celadon Restaurant",
//     "Celadon House",
//     "Celadon Hotel",
//     "Lavender Pokémon Center",
//     "Pokémon Tower 1F",
//     "Pokémon Tower 2F",
//     "Pokémon Tower 3F",
//     "Pokémon Tower 4F",
//     "Pokémon Tower 5F",
//     "Pokémon Tower 6F",
//     "Pokémon Tower 7F",
//     "Mr. Fuji's House",
//     "Lavender Poké Mart",
//     "Lavender House",
//     "Fuchsia Poké Mart",
//     "Bill's House",
//     "Fuchsia Pokémon Center",
//     "Warden's House",
//     "Safari Zone Gate",
//     "Fuchsia Gym ",
//     "Fuchsia House",
//     "Seafoam Islands",
//     "Seafoam Islands",
//     "Seafoam Islands",
//     "Seafoam Islands",
//     "Vermilion House",
//     "Fuchsia House",
//     "Pokémon Mansion 1F",
//     "Cinnabar Gym",
//     "Pokémon Lab",
//     "Pokémon Lab",
//     "Pokémon Lab",
//     "Pokémon Lab",
//     "Cinnabar Pokémon Center",
//     "Cinnabar Poké Mart",
//     "Cinnabar Poké Mart",
//     "Indigo Plateau",
//     "Copycat's House 1F",
//     "Copycat's House 2F",
//     "Saffron Dojo",
//     "Saffron Gym",
//     "Saffron House",
//     "Saffron Poké Mart",
//     "Silph Co. 1F",
//     "Saffron Pokémon Center",
//     "Mr. Psychic's House",
//     "Route 15 Gate 1F",
//     "Route 15 Gate 2F",
//     "Route 16 Gate 1F",
//     "Route 16 Gate 2F",
//     "Route 16 House",
//     "Route 12 House",
//     "Route 18 Gate 1F",
//     "Route 18 Gate 2F",
//     "Seafoam Islands",
//     "Route 22 Gate",
//     "Victory Road",
//     "Route 12 Gate 2F",
//     "Vermilion House",
//     "Diglett's Cave",
//     "Victory Road",
//     "Rocket Hideout B1F",
//     "Rocket Hideout B2F",
//     "Rocket Hideout B3F",
//     "Rocket Hideout B4F",
//     "Rocket Hideout Lift",
//     "Rocket Hideout",
//     "Rocket Hideout",
//     "Rocket Hideout",
//     "Silph Co. 2F",
//     "Silph Co. 3F",
//     "Silph Co. 4F",
//     "Silph Co. 5F",
//     "Silph Co. 6F",
//     "Silph Co. 7F",
//     "Silph Co. 8F",
//     "Pokémon Mansion 2F",
//     "Pokémon Mansion 3F",
//     "Pokémon Mansion B1F",
//     "Safari Zone 1",
//     "Safari Zone 2",
//     "Safari Zone 3",
//     "Safari Zone Gate",
//     "Safari Zone House",
//     "Safari Zone House",
//     "Safari Zone House",
//     "Safari Zone House",
//     "Safari Zone House",
//     "Unknown Dungeon",
//     "Unknown Dungeon 1F",
//     "Unknown Dungeon B1F",
//     "Name Rater's House",
//     "Cerulean House",
//     "Rock Tunnel",
//     "Rock Tunnel",
//     "Silph Co. 9F",
//     "Silph Co. 10F",
//     "Silph Co. 11F",
//     "Silph Co. Lift",
//     "Unknown",
//     "Unknown",
//     "Trade Center",
//     "Colosseum",
//     "Unknown",
//     "Unknown",
//     "Unknown",
//     "Unknown",
//     "Lorelei's Hall",
//     "Bruno's Hall",
//     "Agatha's Hall",
//     "Beach House",
//     "Unknown",
//     "Unknown",
//     "Unknown",
//     "Unknown",
//     "Unknown",
//     "Unknown",
//     "Unknown"
// ];

// Cramorant
// const gen1MapNames = [
//     "Pallet Town",
//     "Viridian City",
//     "Pewter City",
//     "Cerulean City",
//     "Lavender Town",
//     "Vermilion City",
//     "Celadon City",
//     "Fuchsia City",
//     "Cinnabar Island",
//     "Pokémon League",
//     "Saffron City",
//     "Route 4",
//     "Route 10",
//     "Unknown",
//     "Route 1",
//     "Route 2",
//     "Route 3",
//     "Route 5",
//     "Route 6",
//     "Route 7",
//     "Route 8",
//     "Route 9",
//     "Route 11",
//     "Route 12",
//     "Route 13",
//     "Route 14",
//     "Route 15",
//     "Route 16",
//     "Route 17",
//     "Route 18",
//     "Route 19",
//     "Route 20",
//     "Route 21",
//     "Route 22",
//     "Route 23",
//     "Route 24",
//     "Route 25",
//     "Mom's House 1F",
//     "Mom's House 2F",
//     "Rival's House",
//     "Professor Oak's Lab",
//     "Viridian Pokémon Center",
//     "Viridian Poké Mart",
//     "Viridian School",
//     "Viridian House",
//     "Viridian Gym",
//     "Diglett's Cave",
//     "Route 2 Gate",
//     "Route 2 House",
//     "Route 2 Gate",
//     "Route 2 Gate",
//     "Viridian Forest",
//     "Pewter Museum 1F",
//     "Pewter Museum 2F",
//     "Pewter Gym",
//     "Pewter House",
//     "Pewter Poké Mart",
//     "Pewter House",
//     "Pewter Pokémon Center",
//     "Mt. Moon",
//     "Mt. Moon",
//     "Mt. Moon",
//     "Cerulean House",
//     "Cerulean House",
//     "Cerulean Pokémon Center",
//     "Cerulean Gym",
//     "Cerulean Bike Shop",
//     "Cerulean Poké Mart",
//     "Mt. Moon Pokémon Center",
//     "Cerulean House",
//     "Saffron City Gate",
//     "Underground Path",
//     "Daycare Center",
//     "Saffron City Gate",
//     "Underground Path",
//     "Underground Path",
//     "Saffron City Gate",
//     "Underground Path",
//     "Underground Path",
//     "Saffron City Gate",
//     "Underground Path",
//     "Rock Tunnel Pokémon Center",
//     "Rock Tunnel",
//     "Power Plant",
//     "Route 11 Gate 1F",
//     "Diglett's Cave",
//     "Route 11 Gate 2F",
//     "Route 12 Gate 1F",
//     "Sea Cottage",
//     "Vermilion Pokémon Center",
//     "Vermilion Pokémon Fan Club",
//     "Vermilion Poké Mart",
//     "Vermilion Pokémon Gym ",
//     "Vermilion House",
//     "Vermilion Harbor",
//     "S.S. Anne 1F",
//     "S.S. Anne 2F",
//     "S.S. Anne 3F",
//     "S.S. Anne B1F",
//     "S.S. Anne Deck",
//     "S.S. Anne Kitchen",
//     "S.S. Anne Cabin",
//     "S.S. Anne 1F",
//     "S.S. Anne 2F",
//     "S.S. Anne B1F",
//     "TM Place",
//     "Victory Road",
//     "Victory Road",
//     "Victory Road",
//     "Way of Fish",
//     "Way of Fish",
//     "Shady House",
//     "Route 21 House",
//     "Lance's Hall",
//     "Pokémon League",
//     "Pokémon League",
//     "Pokémon League",
//     "Pokémon League",
//     "Hall of Fame",
//     "Underground Path",
//     "Champion's Hall",
//     "Underground Path",
//     "Celadon Department Store 1F",
//     "Celadon Department Store 2F",
//     "Celadon Department Store 3F",
//     "Celadon Department Store 4F",
//     "Celadon Department Store 5F",
//     "Celadon Department Store Lift",
//     "Celadon Mansion 1F",
//     "Celadon Mansion 2F",
//     "Celadon Mansion 3F",
//     "Celadon Mansion 4F",
//     "Celadon Mansion 4F",
//     "Celadon Pokémon Center",
//     "Celadon Gym",
//     "Rocket Game Corner",
//     "Celadon Department Store 5F",
//     "Rocket Prize Corner",
//     "Celadon Restaurant",
//     "Celadon House",
//     "Celadon Hotel",
//     "Lavender Pokémon Center",
//     "Pokémon Tower 1F",
//     "Pokémon Tower 2F",
//     "Pokémon Tower 3F",
//     "Pokémon Tower 4F",
//     "Pokémon Tower 5F",
//     "Pokémon Tower 6F",
//     "Pokémon Tower 7F",
//     "Mr. Fuji's House",
//     "Lavender Poké Mart",
//     "Lavender House",
//     "Fuchsia Poké Mart",
//     "Bill's House",
//     "Fuchsia Pokémon Center",
//     "Warden's House",
//     "Safari Zone Gate",
//     "Fuchsia Gym ",
//     "Fuchsia House",
//     "Seafoam Islands",
//     "Seafoam Islands",
//     "Seafoam Islands",
//     "Seafoam Islands",
//     "Vermilion House",
//     "Fuchsia House",
//     "Pokémon Mansion 1F",
//     "Cinnabar Gym",
//     "Pokémon Lab",
//     "Pokémon Lab",
//     "Pokémon Lab",
//     "Pokémon Lab",
//     "Cinnabar Pokémon Center",
//     "Cinnabar Poké Mart",
//     "Cinnabar Poké Mart",
//     "Indigo Plateau",
//     "Copycat's House 1F",
//     "Copycat's House 2F",
//     "Saffron Dojo",
//     "Saffron Gym",
//     "Saffron House",
//     "Saffron Poké Mart",
//     "Silph Co. 1F",
//     "Saffron Pokémon Center",
//     "Mr. Psychic's House",
//     "Route 15 Gate 1F",
//     "Route 15 Gate 2F",
//     "Route 16 Gate 1F",
//     "Route 16 Gate 2F",
//     "Route 16 House",
//     "Route 12 House",
//     "Route 18 Gate 1F",
//     "Route 18 Gate 2F",
//     "Seafoam Islands",
//     "Route 22 Gate",
//     "Victory Road",
//     "Route 12 Gate 2F",
//     "Vermilion House",
//     "Diglett's Cave",
//     "Victory Road",
//     "Rocket Hideout B1F",
//     "Rocket Hideout B2F",
//     "Rocket Hideout B3F",
//     "Rocket Hideout B4F",
//     "Rocket Hideout Lift",
//     "Rocket Hideout",
//     "Rocket Hideout",
//     "Rocket Hideout",
//     "Silph Co. 2F",
//     "Silph Co. 3F",
//     "Silph Co. 4F",
//     "Silph Co. 5F",
//     "Silph Co. 6F",
//     "Silph Co. 7F",
//     "Silph Co. 8F",
//     "Pokémon Mansion 2F",
//     "Pokémon Mansion 3F",
//     "Pokémon Mansion B1F",
//     "Safari Zone 1",
//     "Safari Zone 2",
//     "Safari Zone 3",
//     "Safari Zone Gate",
//     "Safari Zone House",
//     "Safari Zone House",
//     "Safari Zone House",
//     "Safari Zone House",
//     "Safari Zone House",
//     "Unknown Dungeon",
//     "Unknown Dungeon 1F",
//     "Unknown Dungeon B1F",
//     "Name Rater's House",
//     "Cerulean House",
//     "Rock Tunnel",
//     "Rock Tunnel",
//     "Silph Co. 9F",
//     "Silph Co. 10F",
//     "Silph Co. 11F",
//     "Silph Co. Lift",
//     "Unknown",
//     "Unknown",
//     "Trade Center",
//     "Colosseum",
//     "Viridian Forest House",
//     "Vermilion House",
//     "Cramorant Fan Club",
//     "Unknown Dungeon B4F",
//     "Lorelei's Hall",
//     "Bruno's Hall",
//     "Agatha's Hall",
//     "Beach House",
//     "Unknown",
//     "Unknown",
//     "Unknown",
//     "Unknown",
//     "Unknown",
//     "Unknown",
//     "Unknown"
// ];

// KEP
const gen1MapNames = [
    "Pallet Town",
    "Viridian City",
    "Pewter City",
    "Cerulean City",
    "Vermilion City",
    "Lavender Town",
    "Celadon City",
    "Celadon University",
    "Fuchsia City",
    "Saffron City",
    "Cinnabar Island",
    "Pokémon League",
    "Citrine City",
    "Route 1",
    "Route 2",
    "Route 3",
    "Route 4",
    "Route 5",
    "Route 6",
    "Route 7",
    "Route 8",
    "Route 9",
    "Route 10",
    "Route 11",
    "Route 12",
    "Route 13",
    "Route 14",
    "Route 15",
    "Route 16",
    "Route 17",
    "Route 18",
    "Route 19",
    "Route 20",
    "Route 21",
    "Route 22",
    "Route 23",
    "Route 24",
    "Route 25",
    "Brunswick Trail",
    "Bill's Garden",
    "Mom's House 1F",
    "Mom's House 2F",
    "Rival's House",
    "Professor Oak's Lab",
    "Viridian Pokémon Center",
    "Viridian Poké Mart",
    "Viridian School",
    "Viridian House",
    "Viridian Gym",
    "Diglett's Cave",
    "Route 2 Gate",
    "Route 2 House",
    "Route 2 Gate",
    "Route 2 Gate",
    "Viridian Forest",
    "Pewter Museum 1F",
    "Pewter Museum 2F",
    "Pewter Gym",
    "Pewter House",
    "Pewter Poké Mart",
    "Pewter House",
    "Pewter Pokémon Center",
    "Mt. Moon",
    "Mt. Moon",
    "Mt. Moon",
    "Cerulean House",
    "Cerulean House",
    "Cerulean Pokémon Center",
    "Cerulean Gym",
    "Cerulean Bike Shop",
    "Cerulean Poké Mart",
    "Mt. Moon Pokémon Center",
    "Viridian City Pre-Gym",
    "Saffron City Gate",
    "Underground Path",
    "Daycare Center",
    "Saffron City Gate",
    "Underground Path",
    "Celeste Hill",
    "Saffron City Gate",
    "Underground Path",
    "Citrine City Rocket House",
    "Saffron City Gate",
    "Underground Path",
    "Rock Tunnel Pokémon Center",
    "Rock Tunnel",
    "Power Plant",
    "Route 11 Gate 1F",
    "Diglett's Cave",
    "Route 11 Gate 2F",
    "Route 12 Gate 1F",
    "Sea Cottage",
    "Vermilion Pokémon Center",
    "Vermilion Pokémon Fan Club",
    "Vermilion Poké Mart",
    "Vermilion Pokémon Gym ",
    "Pidgey House",
    "Vermilion Harbor",
    "S.S. Anne 1F",
    "S.S. Anne 2F",
    "S.S. Anne 3F",
    "S.S. Anne B1F",
    "S.S. Anne Deck",
    "S.S. Anne Kitchen",
    "S.S. Anne Cabin",
    "S.S. Anne 1F",
    "S.S. Anne 2F",
    "S.S. Anne B1F",
    "Silph Gauntlet 1F",
    "Silph Gauntlet 2F",
    "Silph Gauntlet 3F",
    "Victory Road 1F",
    "Brunswick Grotto",
    "Silph Gauntlet 5F",
    "Silph Gauntlet 6F",
    "Silph Gauntlet 7F",
    "Lance's Hall",
    "Faraway Island",
    "Faraway Island",
    "Pokémon Mansion B2F",
    "Mt. Moon Crater",
    "Hall of Fame",
    "Underground Path",
    "Champion's Hall",
    "Underground Path",
    "Celadon Department Store 1F",
    "Celadon Department Store 2F",
    "Celadon Department Store 3F",
    "Celadon Department Store 4F",
    "Celadon Department Store 5F",
    "Celadon Department Store Lift",
    "Celadon Mansion 1F",
    "Celadon Mansion 2F",
    "Celadon Mansion 3F",
    "Celadon Mansion 4F",
    "Celadon Mansion 4F",
    "Celadon Pokémon Center",
    "Celadon Gym",
    "Rocket Game Corner",
    "Celadon Department Store 5F",
    "Rocket Prize Corner",
    "Celadon Diner",
    "Celadon House",
    "Celadon Hotel",
    "Lavender Pokémon Center",
    "Pokémon Tower 1F",
    "Pokémon Tower 2F",
    "Silph Gauntlet 4F",
    "Celeste Hill Gate",
    "Pokémon Tower 3F",
    "Pokémon Tower 4F",
    "Pokémon Tower 5F",
    "Mr. Fuji's House",
    "Lavender Poké Mart",
    "Lavender House",
    "Fuchsia Poké Mart",
    "Bill's House",
    "Fuchsia Pokémon Center",
    "Warden's House",
    "Safari Zone Gate",
    "Fuchsia Gym",
    "Fuchsia House",
    "Seafoam Islands B1F",
    "Seafoam Islands B2F",
    "Seafoam Islands B3F",
    "Seafoam Islands B4F",
    "Citrine Tradeback House",
    "Citrine Pokémon Center",
    "Pokémon Mansion 1F",
    "Cinnabar Gym",
    "Pokémon Lab",
    "Pokémon Lab",
    "Pokémon Lab",
    "Pokémon Lab",
    "Cinnabar Pokémon Center",
    "Cinnabar Poké Mart",
    "Indigo Plateau",
    "Copycat's House 1F",
    "Copycat's House 2F",
    "Saffron Dojo",
    "Saffron Gym",
    "Saffron Pidgey House",
    "Saffron Poké Mart",
    "Silph Co. 1F",
    "Saffron Pokémon Center",
    "Mr. Psychic's House",
    "Route 15 Gate 1F",
    "Route 15 Gate 2F",
    "Route 16 Gate 1F",
    "Route 16 Gate 2F",
    "Route 16 House",
    "Route 12 House",
    "Route 18 Gate 1F",
    "Route 18 Gate 2F",
    "Seafoam Islands 1F",
    "Route 22 Gate",
    "Victory Road 2F",
    "Route 12 Gate 2F",
    "Vermilion House",
    "Diglett's Cave",
    "Victory Road 3F",
    "Rocket Hideout B1F",
    "Rocket Hideout B2F",
    "Rocket Hideout B3F",
    "Rocket Hideout B4F",
    "Rocket Hideout Lift",
    "Citrine Poké Mart",
    "Garnet Cavern 1F",
    "Garnet Cavern B1F",
    "Vermilion Dock",
    "Silph Co. 2F",
    "Citrine Dock",
    "Silph Co. 3F",
    "Seagallop Ferry",
    "Silph Co. 4F",
    "Pokémon Mansion 2F",
    "Pokémon Mansion 3F",
    "Pokémon Mansion B1F",
    "Safari Zone East",
    "Safari Zone North",
    "Safari Zone West",
    "Safari Zone Center",
    "Safari Zone House",
    "Safari Zone House",
    "Safari Zone House",
    "Safari Zone House",
    "Safari Zone House",
    "Cerulean Cave 2F",
    "Cerulean Cave B1F",
    "Cerulean Cave 1F",
    "Name Rater's House",
    "Cerulean House",
    "Cinnabar Volcano",
    "Cinnabar Volcano",
    "Route 10 Gate",
    "Silph Co. 5F",
    "Faraway Island",
    "Garnet Cavern 2F",
    "Underwater Tunnel",
    "Trade Center",
    "Colosseum",
    "Celadon University",
    "Celadon University",
    "Lorelei's Hall",
    "Bruno's Hall",
    "Agatha's Hall",
    "Rock Tunnel B1F",
    "Giovanni's Lair",
    "Battle Tent",
    "Mt. Moon Square",
    "Mt. Moon Square",
    "Celeste Hill",
    "Celeste Hill",
    "Brunswick Glade",
    "Mt. Silver"
];