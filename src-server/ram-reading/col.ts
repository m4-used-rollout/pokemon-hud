/// <reference path="./dwbase.ts" />
/// <reference path="../rom-reading/romreaders/concrete/col.ts" />

namespace RamReader {

    export class Col extends DolphinWatchBase<RomReader.Col> {
        protected saveCountOffset = 0x10;

        protected partyOffset = 0xA0;
        protected partySize = 0x750;
        protected partyPokeBytes = 0x138;
        protected trainerDataOffset = 0x70;
        protected trainerDataSize = 0xAC2 + 0x14;
        protected pokedexOffset = 0x82A8;
        protected pokedexSize = 0x1774;
        protected pcOffset = 0xB88;
        protected pcSize = 0x6DEC;
        protected pcBoxes = 3;
        protected pcBoxBytes = 0x24A4;
        protected bagSize = 0x300;
        protected itemPCSize = 0x3AC;
        protected daycareOffset = null;
        protected battlePartyPokeBytes = 0x154;
        protected enemyTrainerBytes = 0x1A;

        protected battleBagAddress = 0x8046E58C;
        protected battlePartyAddress = 0x8046E928;
        protected enemyTrainerAddress = 0x80473038;
        protected enemyPartyAddress = 0x80473B58;
        protected baseAddrPtr = 0x8047ADB8;
        protected musicIdAddress = 0x8047B0AC;
        protected musicIdBytes = 4;

        //protected fsysStartAddress = 0x807602E0;
        protected fsysStartAddress = 0x807250E0; // Grand Colosseum 2.0
        protected fsysSlots = 16;
        protected fsysStructBytes = 0x40;

        protected evoFsysId = 1572;

    }

}