/// <reference path="base.ts" />

namespace RamReader {

    const NUM_POKEMON = 807;
    const DEX_FLAG_BYTES = Math.floor((NUM_POKEMON + 7) / 8);
    const NUM_POKEMON_FORMS = 1120;
    const DEX_SEEN_FLAG_BYTES = Math.floor((NUM_POKEMON_FORMS + 7) / 8);


    const partyLocation = "33F7F9B8"; //USUM
    const pcLocation = "33015408"; //USUM
    const battleLocation = "33000000"; //USUM
    const saveBlock1Location = "33011934"; //USUM
    const saveBlock2Location = "33F6D748"; //USUM
    const daycareLocation = "3307B010"; //USUM


    interface Gen7Pokemon extends TPP.Pokemon {
        encryption_constant: number;
        sanity: number;
        scramble_value: number;
        checksum: number;
        pelago_event_status: number;
        is_nicknamed: boolean;
        affection: number;
        fullness: number;
        enjoyment: number;
    }

    export class Gen7 extends RamReaderBase<RomReader.Gen7> {
        public ReadParty = this.CachedEmulatorCaller(`ReadByteRange/${partyLocation}/BA4`, this.WrapBytes(data => this.ParseParty(data)));
        public ReadPC = this.CachedEmulatorCaller(`ReadByteRange/${pcLocation}/36CA8`, this.WrapBytes(data => this.ParsePC(data)));
        public ReadBattle = this.CachedEmulatorCaller(`ReadByteRange/${battleLocation}/4000`, this.WrapBytes(data => this.ParseBattle(data)));
        protected TrainerChunkReaders = [
            this.CachedEmulatorCaller(`ReadByteRange/${saveBlock1Location}/4000`, this.WrapBytes(data => this.ParseSaveBlock1(data))),
            this.CachedEmulatorCaller(`ReadByteRange/${saveBlock2Location}/10`, this.WrapBytes(data => this.ParseSaveBlock2(data))),
            //this.CachedEmulatorCaller(`ReadByteRange/${daycareLocation}/200`, this.WrapBytes(data => this.ParseDaycare(data))),
        ];

        protected partyPollingIntervalMs = 320;
        protected pcPollingIntervalMs = 1510;
        protected trainerPollingIntervalMs = 550;
        protected battlePollingIntervalMs = 530;

        //     Battle_style = 0x50, bit 3, set = "Set", reset = "Switch"
        //     Battle_scene = 0x50, bit 2, set = "Off", reset = "On"
        //     Text_speed = 0x50 bits 0 & 1, 0 = "Slow", 1 = "Med", 2 or 3 = "Fast"
        //     Box_mode = 0x51 bit 7, set = "Automatic", reset = "Manual"

        protected OptionsSpec = {
            text_speed: {
                2: "Fast",
                1: "Med",
                0: "Slow"
            },
            battle_style: {
                0: "Shift",
                0x4: "Set"
            },
            battle_scene: {
                0: "On",
                0x8: "Off"
            },
            button_mode: {
                0: "Normal",
                0x2000: "L=A",
            },
            box_mode: {
                0: "Manual",
                0x8000: "Automatic"
            }
        }
        protected ParseBattle(data: Buffer): TPP.BattleStatus {
            const in_battle = false;
            return { in_battle };
        }

        protected ParseSaveBlock1(data: Buffer): Partial<TPP.TrainerData> {
            const itemData = data.slice(0, 0xE28);
            const trainerData = data.slice(0xEE4, 0xEE4 + 0xC0);
            const pokedexData = data.slice(0x23D4, 0x23D4 + 0xF78);
            const miscData = data.slice(0x38D8, 0x38D8 + 0x200);
            const optionsData = data.slice(0x3AD8, 0x3AD8 + 0x60);

            const caught_list = this.GetSetFlags(pokedexData.slice(0x88, 0x88 + DEX_FLAG_BYTES));
            const seenListMale = this.GetSetFlags(pokedexData.slice(0x88 + 0x68, 0x88 + 0x68 + DEX_SEEN_FLAG_BYTES));
            const seenListFemale = this.GetSetFlags(pokedexData.slice(0x88 + 0x68 + DEX_SEEN_FLAG_BYTES, 0x88 + 0x68 + DEX_SEEN_FLAG_BYTES * 2));
            const seenListShinyMale = this.GetSetFlags(pokedexData.slice(0x88 + 0x68 + DEX_SEEN_FLAG_BYTES * 2, 0x88 + 0x68 + DEX_SEEN_FLAG_BYTES * 3));
            const seenListShinyFemale = this.GetSetFlags(pokedexData.slice(0x88 + 0x68 + DEX_SEEN_FLAG_BYTES * 3, 0x88 + 0x68 + DEX_SEEN_FLAG_BYTES * 4));
            const seen_list = [...seenListMale, ...seenListFemale, ...seenListShinyMale, ...seenListShinyFemale]
                .filter((mon, i, arr) => arr.indexOf(mon) == i).sort((mon1, mon2) => mon2 - mon1).filter(mon => mon <= NUM_POKEMON);

            const rawOptions = optionsData.readUInt16LE(0x50);
            const options = this.ParseOptions(rawOptions);
            if (this.ShouldForceOptions(options)) {
                this.CallEmulator(`WriteU16LE/${parseInt(saveBlock2Location, 16) + 0x3AD8 + 0x50}/${this.SetOptions(rawOptions, this.config.forceOptions).toString(16)}`);
            }

            // Ultra space control mode = 0x1FD1, bit 2, set = circle pad, reset = gyro
            const ultraSpaceControlMode = data[0x1FD1];
            if (!(ultraSpaceControlMode & 0x4)) {
                this.CallEmulator(`WriteByte/${parseInt(saveBlock2Location, 16) + 0x1FD1}/${(ultraSpaceControlMode | 0x4).toString(16)}`);
                console.log("Set Ultra Space control method to Circle Pad");
            }

            return {
                id: trainerData.readUInt16LE(0),
                secret: trainerData.readUInt16LE(2),
                gender: trainerData[5] == 1 ? "Female" : "Male",
                name: this.rom.ConvertText(trainerData.slice(0x38, 0x38 + 0x18)),
                caught_list,
                caught: caught_list.length,
                seen_list,
                seen: seen_list.length,
                items: this.ParseItems(itemData),
                money: miscData.readUInt32LE(4),
                options,
            };
        }

        protected itemPocketOffsets = [0x0, 0x6AC, 0x9C4, 0xB74, 0xC64, 0xD70, 0xDFC];

        protected ParseItems(data: Buffer): TPP.TrainerData["items"] {
            const free_space = new Array<TPP.Item>();

            const pockets = new Array(7).fill(0).map((_, i) => {
                const itemData = this.rom.ReadStridedData(data, this.itemPocketOffsets[i], 4, 0, false, item => (item.readUInt32LE(0) >> 10 & 0x3FF) == 0).map(i => i.readUInt32LE(0));
                itemData.filter(i => (i >> 20 & 0x3FF) > 0)
                    .forEach(i => free_space.push(Pokemon.Convert.ItemToRunStatus(this.rom.GetItem(i & 0x3FF), i >> 10 & 0x3FF)));
                return itemData.filter(i => (i >> 20 & 0x3FF) == 0).map(i => Pokemon.Convert.ItemToRunStatus(this.rom.GetItem(i & 0x3FF), i >> 10 & 0x3FF))
            });

            return {
                items: pockets[0],
                key: pockets[1],
                tms: pockets[2],
                medicine: pockets[3],
                berries: pockets[4],
                z_crystals: pockets[5],
                rotom_powers: pockets[6],
                free_space
            };
        }


        protected ParseSaveBlock2(data: Buffer): Partial<TPP.TrainerData> {
            const mapId = data.readInt16LE(0x2)
            const map = this.rom.GetMap(mapId);
            return {
                map_id: mapId,
                x: data.readFloatLE(0x4),
                z: data.readFloatLE(0x8),
                y: data.readFloatLE(0xC),
                map_name: map.name,
                area_id: map.areaId,
                area_name: map.areaName
            }
        }

        // protected ParseDaycare(data: Buffer): Partial<TPP.TrainerData> {

        // }

        protected ParsePC(data: Buffer): TPP.CombinedPCData {
            // wCurrentBoxNum
            // const currentBox = data[0] + 15; //pbr
            // // Active Box
            // // sBox1-12
            // const pc = this.rom.ReadStridedData(data.slice(1), 0, this.PCBoxSize(), NUM_BOXES + 1).map(b => this.ParsePCBox(b));
            // const active = pc.shift();
            // pc[currentBox - 15] = active; //pbr
            return {
                // current_box_number: currentBox,
                // boxes: pc.map((box, i) => (<TPP.BoxData>{
                //     box_contents: box,
                //     box_name: ``,
                //     box_number: i
                // }))
            } as TPP.CombinedPCData;
        }

        protected ParsePCBox(data: Buffer) {
            const box = [];
            return box;
        }

        protected ParseParty(data: Buffer) {
            return this.rom.ReadStridedData(data, 0, 4, data[0x18]).map(ptr => ptr.readUInt32LE(0) - parseInt(partyLocation, 16)).filter(ptr => ptr > 0)
                .map(ptr => this.ParsePartyMon(data.slice(ptr + 0x40, ptr + 0x1E4), 0x158));
        }

        protected ParsePartyMon(data: Buffer, battleDataOffset = 0xE8) {
            const pkmn = this.ParsePokemon(data) as any as TPP.PartyPokemon & Gen7Pokemon;
            if (!pkmn)
                return pkmn;

            const decrypted = Buffer.from([...new Array<number>(0xE8).fill(0), ...this.Decrypt(data.slice(battleDataOffset), pkmn.encryption_constant)]);

            pkmn.status = [null, "PAR", "SLP", "FRZ", "BRN", "PSN"][decrypted[0xE8]];
            pkmn.level = decrypted[0xEC];
            pkmn.health = [decrypted.readUInt16LE(0xF0), decrypted.readUInt16LE(0xF2)];
            pkmn.stats = {
                hp: decrypted.readUInt16LE(0xF2),
                attack: decrypted.readUInt16LE(0xF4),
                defense: decrypted.readUInt16LE(0xF6),
                speed: decrypted.readUInt16LE(0xF8),
                special_attack: decrypted.readUInt16LE(0xFA),
                special_defense: decrypted.readUInt16LE(0xFC),
            }

            return pkmn;
        }

        protected ParsePokemon(pkmdata: Buffer) {
            const pkmn = {} as Gen7Pokemon;
            pkmn.encryption_constant = pkmdata.readUInt32LE(0);
            pkmn.sanity = pkmdata.readUInt16LE(4);
            pkmn.scramble_value = (pkmn.encryption_constant >> 0xD & 0x1F);
            pkmn.sanity = pkmdata.readUInt16LE(0x4);
            pkmn.checksum = pkmdata.readUInt16LE(0x6);
            const sections = this.Descramble(this.Decrypt(pkmdata.slice(0x8, 0xE8), pkmn.encryption_constant, pkmn.checksum), pkmn.scramble_value);
            if (!sections)
                return null;
            const decrypted = Buffer.from([...pkmdata.slice(0, 0x8), ...sections.A, ...sections.B, ...sections.C, ...sections.D]);

            //Block A
            pkmn.form = decrypted[0x1D] >>> 3;
            pkmn.species = Pokemon.Convert.SpeciesToRunStatus(this.rom.GetSpecies(decrypted.readUInt16LE(0x8), pkmn.form));
            const itemId = decrypted.readUInt16LE(0xA);
            pkmn.held_item = itemId ? Pokemon.Convert.ItemToRunStatus(this.rom.GetItem(itemId)) : null;
            pkmn.original_trainer = {
                id: decrypted.readUInt16LE(0xC),
                secret: decrypted.readUInt16LE(0xE),
                name: this.rom.ConvertText(decrypted.slice(0xB0, 0xC8)),
                gender: decrypted[0xDD] >>> 7 ? "Female" : "Male"
            };
            pkmn.experience = { current: decrypted.readUInt32LE(0x10) };
            pkmn.ability = this.rom.GetAbility(decrypted[0x14]);
            pkmn.personality_value = decrypted.readUInt32LE(0x18);
            pkmn.nature = this.rom.GetNature(decrypted[0x1C]);
            //pkmn.fateful_encounter = !!(decrypted[0x1D] & 1)
            pkmn.gender = ["Male", "Female"][(decrypted[0x1D] >>> 1) & 0x3];
            pkmn.evs = {
                hp: decrypted[0x1E],
                attack: decrypted[0x1F],
                defense: decrypted[0x20],
                speed: decrypted[0x21],
                special_attack: decrypted[0x22],
                special_defense: decrypted[0x23]
            };
            pkmn.condition = {
                coolness: decrypted[0x24],
                beauty: decrypted[0x25],
                cuteness: decrypted[0x26],
                smartness: decrypted[0x27],
                toughness: decrypted[0x28],
                feel: decrypted[0x29]
            };
            pkmn.pelago_event_status = decrypted[0x2A];
            pkmn.pokerus = this.ParsePokerus(decrypted[0x2B]);
            //Super Training and Ribbons
            {
                // private byte ST1 { get => Data[0x2C]; set => Data[0x2C] = value; }
                // public bool Unused0 { get => (ST1 & (1 << 0)) == 1 << 0; set => ST1 = (byte)(ST1 & ~(1 << 0) | (value ? 1 << 0 : 0)); }
                // public bool Unused1 { get => (ST1 & (1 << 1)) == 1 << 1; set => ST1 = (byte)(ST1 & ~(1 << 1) | (value ? 1 << 1 : 0)); }
                // public bool SuperTrain1_SPA { get => (ST1 & (1 << 2)) == 1 << 2; set => ST1 = (byte)(ST1 & ~(1 << 2) | (value ? 1 << 2 : 0)); }
                // public bool SuperTrain1_HP  { get => (ST1 & (1 << 3)) == 1 << 3; set => ST1 = (byte)(ST1 & ~(1 << 3) | (value ? 1 << 3 : 0)); }
                // public bool SuperTrain1_ATK { get => (ST1 & (1 << 4)) == 1 << 4; set => ST1 = (byte)(ST1 & ~(1 << 4) | (value ? 1 << 4 : 0)); }
                // public bool SuperTrain1_SPD { get => (ST1 & (1 << 5)) == 1 << 5; set => ST1 = (byte)(ST1 & ~(1 << 5) | (value ? 1 << 5 : 0)); }
                // public bool SuperTrain1_SPE { get => (ST1 & (1 << 6)) == 1 << 6; set => ST1 = (byte)(ST1 & ~(1 << 6) | (value ? 1 << 6 : 0)); }
                // public bool SuperTrain1_DEF { get => (ST1 & (1 << 7)) == 1 << 7; set => ST1 = (byte)(ST1 & ~(1 << 7) | (value ? 1 << 7 : 0)); }
                // private byte ST2 { get => Data[0x2D]; set => Data[0x2D] = value; }
                // public bool SuperTrain2_SPA { get => (ST2 & (1 << 0)) == 1 << 0; set => ST2 = (byte)(ST2 & ~(1 << 0) | (value ? 1 << 0 : 0)); }
                // public bool SuperTrain2_HP  { get => (ST2 & (1 << 1)) == 1 << 1; set => ST2 = (byte)(ST2 & ~(1 << 1) | (value ? 1 << 1 : 0)); }
                // public bool SuperTrain2_ATK { get => (ST2 & (1 << 2)) == 1 << 2; set => ST2 = (byte)(ST2 & ~(1 << 2) | (value ? 1 << 2 : 0)); }
                // public bool SuperTrain2_SPD { get => (ST2 & (1 << 3)) == 1 << 3; set => ST2 = (byte)(ST2 & ~(1 << 3) | (value ? 1 << 3 : 0)); }
                // public bool SuperTrain2_SPE { get => (ST2 & (1 << 4)) == 1 << 4; set => ST2 = (byte)(ST2 & ~(1 << 4) | (value ? 1 << 4 : 0)); }
                // public bool SuperTrain2_DEF { get => (ST2 & (1 << 5)) == 1 << 5; set => ST2 = (byte)(ST2 & ~(1 << 5) | (value ? 1 << 5 : 0)); }
                // public bool SuperTrain3_SPA { get => (ST2 & (1 << 6)) == 1 << 6; set => ST2 = (byte)(ST2 & ~(1 << 6) | (value ? 1 << 6 : 0)); }
                // public bool SuperTrain3_HP { get => (ST2 & (1 << 7)) == 1 << 7; set => ST2 = (byte)(ST2 & ~(1 << 7) | (value ? 1 << 7 : 0)); }
                // private byte ST3 { get => Data[0x2E]; set => Data[0x2E] = value; }
                // public bool SuperTrain3_ATK { get => (ST3 & (1 << 0)) == 1 << 0; set => ST3 = (byte)(ST3 & ~(1 << 0) | (value ? 1 << 0 : 0)); }
                // public bool SuperTrain3_SPD { get => (ST3 & (1 << 1)) == 1 << 1; set => ST3 = (byte)(ST3 & ~(1 << 1) | (value ? 1 << 1 : 0)); }
                // public bool SuperTrain3_SPE { get => (ST3 & (1 << 2)) == 1 << 2; set => ST3 = (byte)(ST3 & ~(1 << 2) | (value ? 1 << 2 : 0)); }
                // public bool SuperTrain3_DEF { get => (ST3 & (1 << 3)) == 1 << 3; set => ST3 = (byte)(ST3 & ~(1 << 3) | (value ? 1 << 3 : 0)); }
                // public bool SuperTrain4_1 { get => (ST3 & (1 << 4)) == 1 << 4; set => ST3 = (byte)(ST3 & ~(1 << 4) | (value ? 1 << 4 : 0)); }
                // public bool SuperTrain5_1 { get => (ST3 & (1 << 5)) == 1 << 5; set => ST3 = (byte)(ST3 & ~(1 << 5) | (value ? 1 << 5 : 0)); }
                // public bool SuperTrain5_2 { get => (ST3 & (1 << 6)) == 1 << 6; set => ST3 = (byte)(ST3 & ~(1 << 6) | (value ? 1 << 6 : 0)); }
                // public bool SuperTrain5_3 { get => (ST3 & (1 << 7)) == 1 << 7; set => ST3 = (byte)(ST3 & ~(1 << 7) | (value ? 1 << 7 : 0)); }
                // private byte ST4 { get => Data[0x2F]; set => Data[0x2F] = value; }
                // public bool SuperTrain5_4 { get => (ST4 & (1 << 0)) == 1 << 0; set => ST4 = (byte)(ST4 & ~(1 << 0) | (value ? 1 << 0 : 0)); }
                // public bool SuperTrain6_1 { get => (ST4 & (1 << 1)) == 1 << 1; set => ST4 = (byte)(ST4 & ~(1 << 1) | (value ? 1 << 1 : 0)); }
                // public bool SuperTrain6_2 { get => (ST4 & (1 << 2)) == 1 << 2; set => ST4 = (byte)(ST4 & ~(1 << 2) | (value ? 1 << 2 : 0)); }
                // public bool SuperTrain6_3 { get => (ST4 & (1 << 3)) == 1 << 3; set => ST4 = (byte)(ST4 & ~(1 << 3) | (value ? 1 << 3 : 0)); }
                // public bool SuperTrain7_1 { get => (ST4 & (1 << 4)) == 1 << 4; set => ST4 = (byte)(ST4 & ~(1 << 4) | (value ? 1 << 4 : 0)); }
                // public bool SuperTrain7_2 { get => (ST4 & (1 << 5)) == 1 << 5; set => ST4 = (byte)(ST4 & ~(1 << 5) | (value ? 1 << 5 : 0)); }
                // public bool SuperTrain7_3 { get => (ST4 & (1 << 6)) == 1 << 6; set => ST4 = (byte)(ST4 & ~(1 << 6) | (value ? 1 << 6 : 0)); }
                // public bool SuperTrain8_1 { get => (ST4 & (1 << 7)) == 1 << 7; set => ST4 = (byte)(ST4 & ~(1 << 7) | (value ? 1 << 7 : 0)); }
                // private byte RIB0 { get => Data[0x30]; set => Data[0x30] = value; } // Ribbons are read as uints, but let's keep them per byte.
                // private byte RIB1 { get => Data[0x31]; set => Data[0x31] = value; }
                // private byte RIB2 { get => Data[0x32]; set => Data[0x32] = value; }
                // private byte RIB3 { get => Data[0x33]; set => Data[0x33] = value; }
                // private byte RIB4 { get => Data[0x34]; set => Data[0x34] = value; }
                // private byte RIB5 { get => Data[0x35]; set => Data[0x35] = value; }
                // private byte RIB6 { get => Data[0x36]; set => Data[0x36] = value; } // Unused
                // private byte RIB7 { get => Data[0x37]; set => Data[0x37] = value; } // Unused
                // public bool RibbonChampionKalos         { get => (RIB0 & (1 << 0)) == 1 << 0; set => RIB0 = (byte)(RIB0 & ~(1 << 0) | (value ? 1 << 0 : 0)); }
                // public bool RibbonChampionG3Hoenn       { get => (RIB0 & (1 << 1)) == 1 << 1; set => RIB0 = (byte)(RIB0 & ~(1 << 1) | (value ? 1 << 1 : 0)); }
                // public bool RibbonChampionSinnoh        { get => (RIB0 & (1 << 2)) == 1 << 2; set => RIB0 = (byte)(RIB0 & ~(1 << 2) | (value ? 1 << 2 : 0)); }
                // public bool RibbonBestFriends           { get => (RIB0 & (1 << 3)) == 1 << 3; set => RIB0 = (byte)(RIB0 & ~(1 << 3) | (value ? 1 << 3 : 0)); }
                // public bool RibbonTraining              { get => (RIB0 & (1 << 4)) == 1 << 4; set => RIB0 = (byte)(RIB0 & ~(1 << 4) | (value ? 1 << 4 : 0)); }
                // public bool RibbonBattlerSkillful       { get => (RIB0 & (1 << 5)) == 1 << 5; set => RIB0 = (byte)(RIB0 & ~(1 << 5) | (value ? 1 << 5 : 0)); }
                // public bool RibbonBattlerExpert         { get => (RIB0 & (1 << 6)) == 1 << 6; set => RIB0 = (byte)(RIB0 & ~(1 << 6) | (value ? 1 << 6 : 0)); }
                // public bool RibbonEffort                { get => (RIB0 & (1 << 7)) == 1 << 7; set => RIB0 = (byte)(RIB0 & ~(1 << 7) | (value ? 1 << 7 : 0)); }
                // public bool RibbonAlert                 { get => (RIB1 & (1 << 0)) == 1 << 0; set => RIB1 = (byte)(RIB1 & ~(1 << 0) | (value ? 1 << 0 : 0)); }
                // public bool RibbonShock                 { get => (RIB1 & (1 << 1)) == 1 << 1; set => RIB1 = (byte)(RIB1 & ~(1 << 1) | (value ? 1 << 1 : 0)); }
                // public bool RibbonDowncast              { get => (RIB1 & (1 << 2)) == 1 << 2; set => RIB1 = (byte)(RIB1 & ~(1 << 2) | (value ? 1 << 2 : 0)); }
                // public bool RibbonCareless              { get => (RIB1 & (1 << 3)) == 1 << 3; set => RIB1 = (byte)(RIB1 & ~(1 << 3) | (value ? 1 << 3 : 0)); }
                // public bool RibbonRelax                 { get => (RIB1 & (1 << 4)) == 1 << 4; set => RIB1 = (byte)(RIB1 & ~(1 << 4) | (value ? 1 << 4 : 0)); }
                // public bool RibbonSnooze                { get => (RIB1 & (1 << 5)) == 1 << 5; set => RIB1 = (byte)(RIB1 & ~(1 << 5) | (value ? 1 << 5 : 0)); }
                // public bool RibbonSmile                 { get => (RIB1 & (1 << 6)) == 1 << 6; set => RIB1 = (byte)(RIB1 & ~(1 << 6) | (value ? 1 << 6 : 0)); }
                // public bool RibbonGorgeous              { get => (RIB1 & (1 << 7)) == 1 << 7; set => RIB1 = (byte)(RIB1 & ~(1 << 7) | (value ? 1 << 7 : 0)); }
                // public bool RibbonRoyal                 { get => (RIB2 & (1 << 0)) == 1 << 0; set => RIB2 = (byte)(RIB2 & ~(1 << 0) | (value ? 1 << 0 : 0)); }
                // public bool RibbonGorgeousRoyal         { get => (RIB2 & (1 << 1)) == 1 << 1; set => RIB2 = (byte)(RIB2 & ~(1 << 1) | (value ? 1 << 1 : 0)); }
                // public bool RibbonArtist                { get => (RIB2 & (1 << 2)) == 1 << 2; set => RIB2 = (byte)(RIB2 & ~(1 << 2) | (value ? 1 << 2 : 0)); }
                // public bool RibbonFootprint             { get => (RIB2 & (1 << 3)) == 1 << 3; set => RIB2 = (byte)(RIB2 & ~(1 << 3) | (value ? 1 << 3 : 0)); }
                // public bool RibbonRecord                { get => (RIB2 & (1 << 4)) == 1 << 4; set => RIB2 = (byte)(RIB2 & ~(1 << 4) | (value ? 1 << 4 : 0)); }
                // public bool RibbonLegend                { get => (RIB2 & (1 << 5)) == 1 << 5; set => RIB2 = (byte)(RIB2 & ~(1 << 5) | (value ? 1 << 5 : 0)); }
                // public bool RibbonCountry               { get => (RIB2 & (1 << 6)) == 1 << 6; set => RIB2 = (byte)(RIB2 & ~(1 << 6) | (value ? 1 << 6 : 0)); }
                // public bool RibbonNational              { get => (RIB2 & (1 << 7)) == 1 << 7; set => RIB2 = (byte)(RIB2 & ~(1 << 7) | (value ? 1 << 7 : 0)); }
                // public bool RibbonEarth                 { get => (RIB3 & (1 << 0)) == 1 << 0; set => RIB3 = (byte)(RIB3 & ~(1 << 0) | (value ? 1 << 0 : 0)); }
                // public bool RibbonWorld                 { get => (RIB3 & (1 << 1)) == 1 << 1; set => RIB3 = (byte)(RIB3 & ~(1 << 1) | (value ? 1 << 1 : 0)); }
                // public bool RibbonClassic               { get => (RIB3 & (1 << 2)) == 1 << 2; set => RIB3 = (byte)(RIB3 & ~(1 << 2) | (value ? 1 << 2 : 0)); }
                // public bool RibbonPremier               { get => (RIB3 & (1 << 3)) == 1 << 3; set => RIB3 = (byte)(RIB3 & ~(1 << 3) | (value ? 1 << 3 : 0)); }
                // public bool RibbonEvent                 { get => (RIB3 & (1 << 4)) == 1 << 4; set => RIB3 = (byte)(RIB3 & ~(1 << 4) | (value ? 1 << 4 : 0)); }
                // public bool RibbonBirthday              { get => (RIB3 & (1 << 5)) == 1 << 5; set => RIB3 = (byte)(RIB3 & ~(1 << 5) | (value ? 1 << 5 : 0)); }
                // public bool RibbonSpecial               { get => (RIB3 & (1 << 6)) == 1 << 6; set => RIB3 = (byte)(RIB3 & ~(1 << 6) | (value ? 1 << 6 : 0)); }
                // public bool RibbonSouvenir              { get => (RIB3 & (1 << 7)) == 1 << 7; set => RIB3 = (byte)(RIB3 & ~(1 << 7) | (value ? 1 << 7 : 0)); }
                // public bool RibbonWishing               { get => (RIB4 & (1 << 0)) == 1 << 0; set => RIB4 = (byte)(RIB4 & ~(1 << 0) | (value ? 1 << 0 : 0)); }
                // public bool RibbonChampionBattle        { get => (RIB4 & (1 << 1)) == 1 << 1; set => RIB4 = (byte)(RIB4 & ~(1 << 1) | (value ? 1 << 1 : 0)); }
                // public bool RibbonChampionRegional      { get => (RIB4 & (1 << 2)) == 1 << 2; set => RIB4 = (byte)(RIB4 & ~(1 << 2) | (value ? 1 << 2 : 0)); }
                // public bool RibbonChampionNational      { get => (RIB4 & (1 << 3)) == 1 << 3; set => RIB4 = (byte)(RIB4 & ~(1 << 3) | (value ? 1 << 3 : 0)); }
                // public bool RibbonChampionWorld         { get => (RIB4 & (1 << 4)) == 1 << 4; set => RIB4 = (byte)(RIB4 & ~(1 << 4) | (value ? 1 << 4 : 0)); }
                // public bool RIB4_5                      { get => (RIB4 & (1 << 5)) == 1 << 5; set => RIB4 = (byte)(RIB4 & ~(1 << 5) | (value ? 1 << 5 : 0)); } // Unused
                // public bool RIB4_6                      { get => (RIB4 & (1 << 6)) == 1 << 6; set => RIB4 = (byte)(RIB4 & ~(1 << 6) | (value ? 1 << 6 : 0)); } // Unused
                // public bool RibbonChampionG6Hoenn       { get => (RIB4 & (1 << 7)) == 1 << 7; set => RIB4 = (byte)(RIB4 & ~(1 << 7) | (value ? 1 << 7 : 0)); }
                // public bool RibbonContestStar           { get => (RIB5 & (1 << 0)) == 1 << 0; set => RIB5 = (byte)(RIB5 & ~(1 << 0) | (value ? 1 << 0 : 0)); }
                // public bool RibbonMasterCoolness        { get => (RIB5 & (1 << 1)) == 1 << 1; set => RIB5 = (byte)(RIB5 & ~(1 << 1) | (value ? 1 << 1 : 0)); }
                // public bool RibbonMasterBeauty          { get => (RIB5 & (1 << 2)) == 1 << 2; set => RIB5 = (byte)(RIB5 & ~(1 << 2) | (value ? 1 << 2 : 0)); }
                // public bool RibbonMasterCuteness        { get => (RIB5 & (1 << 3)) == 1 << 3; set => RIB5 = (byte)(RIB5 & ~(1 << 3) | (value ? 1 << 3 : 0)); }
                // public bool RibbonMasterCleverness      { get => (RIB5 & (1 << 4)) == 1 << 4; set => RIB5 = (byte)(RIB5 & ~(1 << 4) | (value ? 1 << 4 : 0)); }
                // public bool RibbonMasterToughness       { get => (RIB5 & (1 << 5)) == 1 << 5; set => RIB5 = (byte)(RIB5 & ~(1 << 5) | (value ? 1 << 5 : 0)); }
                // public bool RibbonChampionAlola         { get => (RIB5 & (1 << 6)) == 1 << 6; set => RIB5 = (byte)(RIB5 & ~(1 << 6) | (value ? 1 << 6 : 0)); }
                // public bool RibbonBattleRoyale          { get => (RIB5 & (1 << 7)) == 1 << 7; set => RIB5 = (byte)(RIB5 & ~(1 << 7) | (value ? 1 << 7 : 0)); }
                // public bool RibbonBattleTreeGreat       { get => (RIB6 & (1 << 0)) == 1 << 0; set => RIB6 = (byte)(RIB6 & ~(1 << 0) | (value ? 1 << 0 : 0)); }
                // public bool RibbonBattleTreeMaster      { get => (RIB6 & (1 << 1)) == 1 << 1; set => RIB6 = (byte)(RIB6 & ~(1 << 1) | (value ? 1 << 1 : 0)); }
                // public bool RIB6_2                      { get => (RIB6 & (1 << 2)) == 1 << 2; set => RIB6 = (byte)(RIB6 & ~(1 << 2) | (value ? 1 << 2 : 0)); } // Unused
                // public bool RIB6_3                      { get => (RIB6 & (1 << 3)) == 1 << 3; set => RIB6 = (byte)(RIB6 & ~(1 << 3) | (value ? 1 << 3 : 0)); } // Unused
                // public bool RIB6_4                      { get => (RIB6 & (1 << 4)) == 1 << 4; set => RIB6 = (byte)(RIB6 & ~(1 << 4) | (value ? 1 << 4 : 0)); } // Unused
                // public bool RIB6_5                      { get => (RIB6 & (1 << 5)) == 1 << 5; set => RIB6 = (byte)(RIB6 & ~(1 << 5) | (value ? 1 << 5 : 0)); } // Unused
                // public bool RIB6_6                      { get => (RIB6 & (1 << 6)) == 1 << 6; set => RIB6 = (byte)(RIB6 & ~(1 << 6) | (value ? 1 << 6 : 0)); } // Unused
                // public bool RIB6_7                      { get => (RIB6 & (1 << 7)) == 1 << 7; set => RIB6 = (byte)(RIB6 & ~(1 << 7) | (value ? 1 << 7 : 0)); } // Unused
                // public int RibbonCountMemoryContest { get => Data[0x38]; set => Data[0x38] = (byte)value; }
                // public int RibbonCountMemoryBattle { get => Data[0x39]; set => Data[0x39] = (byte)value; }
                // private ushort DistByte { get => BitConverter.ToUInt16(Data, 0x3A); set => BitConverter.GetBytes(value).CopyTo(Data, 0x3A); }
                // public bool DistSuperTrain1 { get => (DistByte & (1 << 0)) == 1 << 0; set => DistByte = (byte)(DistByte & ~(1 << 0) | (value ? 1 << 0 : 0)); }
                // public bool DistSuperTrain2 { get => (DistByte & (1 << 1)) == 1 << 1; set => DistByte = (byte)(DistByte & ~(1 << 1) | (value ? 1 << 1 : 0)); }
                // public bool DistSuperTrain3 { get => (DistByte & (1 << 2)) == 1 << 2; set => DistByte = (byte)(DistByte & ~(1 << 2) | (value ? 1 << 2 : 0)); }
                // public bool DistSuperTrain4 { get => (DistByte & (1 << 3)) == 1 << 3; set => DistByte = (byte)(DistByte & ~(1 << 3) | (value ? 1 << 3 : 0)); }
                // public bool DistSuperTrain5 { get => (DistByte & (1 << 4)) == 1 << 4; set => DistByte = (byte)(DistByte & ~(1 << 4) | (value ? 1 << 4 : 0)); }
                // public bool DistSuperTrain6 { get => (DistByte & (1 << 5)) == 1 << 5; set => DistByte = (byte)(DistByte & ~(1 << 5) | (value ? 1 << 5 : 0)); }
                // public bool Dist7 { get => (DistByte & (1 << 6)) == 1 << 6; set => DistByte = (byte)(DistByte & ~(1 << 6) | (value ? 1 << 6 : 0)); }
                // public bool Dist8 { get => (DistByte & (1 << 7)) == 1 << 7; set => DistByte = (byte)(DistByte & ~(1 << 7) | (value ? 1 << 7 : 0)); }
                // public uint FormDuration { get => BitConverter.ToUInt32(Data, 0x3C); set => BitConverter.GetBytes(value).CopyTo(Data, 0x3C); }
            }

            //Block B
            pkmn.name = this.rom.ConvertText(decrypted.slice(0x40, 0x58));
            pkmn.moves = [
                Pokemon.Convert.MoveToRunStatus(this.rom.GetMove(decrypted.readUInt16LE(0x5A)), decrypted[0x62], decrypted[0x66]),
                Pokemon.Convert.MoveToRunStatus(this.rom.GetMove(decrypted.readUInt16LE(0x5C)), decrypted[0x63], decrypted[0x67]),
                Pokemon.Convert.MoveToRunStatus(this.rom.GetMove(decrypted.readUInt16LE(0x5E)), decrypted[0x64], decrypted[0x68]),
                Pokemon.Convert.MoveToRunStatus(this.rom.GetMove(decrypted.readUInt16LE(0x60)), decrypted[0x65], decrypted[0x69]),
            ].filter(m => !!(m && m.id));

            const ivs = decrypted.readUInt32LE(0x74);
            pkmn.ivs = {
                hp: ivs % 32,
                attack: (ivs >>> 5) % 32,
                defense: (ivs >>> 10) % 32,
                speed: (ivs >>> 15) % 32,
                special_attack: (ivs >>> 20) % 32,
                special_defense: (ivs >>> 25) % 32
            }
            pkmn.is_egg = (ivs >>> 30) % 2 > 0;
            pkmn.is_nicknamed = (ivs >>> 31) > 0;

            //Block C
            const isOt = !decrypted[0x93];
            pkmn.friendship = !isOt ? decrypted[0xA2] : decrypted[0xCA];
            pkmn.affection = !isOt ? decrypted[0xA3] : decrypted[0xCB];
            // pkmn.intensity = !isOt ? decrypted[0xA4] : decrypted[0xCC];
            // pkmn.memory = !isOt ? decrypted[0xA5] : decrypted[0xCD];
            // pkmn.feeling = !isOt ? decrypted[0xA6] : decrypted[0xD0];
            pkmn.fullness = decrypted[0xAE];
            pkmn.enjoyment = decrypted[0xAF];

            pkmn.met = {
                game: decrypted[0xDF].toString(),
                date_egg_received: decrypted[0xD1] ? `20${decrypted[0xD1]}-${decrypted[0xD2]}-${decrypted[0xD3]}` : undefined,
                date: decrypted[0xD4] ? `20${decrypted[0xD4]}-${decrypted[0xD5]}-${decrypted[0xD6]}` : undefined,
                area_id_egg: decrypted.readUInt16LE(0xD8) || undefined,
                area_id: decrypted.readUInt16LE(0xDA) || undefined,
                caught_in: this.rom.GetItem(decrypted[0xDC]).name,
                level: decrypted[0xDD] & 0x7F
            };
            pkmn.language = decrypted[0xE3].toString();

            this.rom.CalculateShiny(pkmn);
            return pkmn;
        }

        protected ParseBattlePokemon(data: Buffer) {
        }

        protected Decrypt(data: Buffer, key: number, checksum?: number) {
            if (typeof (checksum) == "number" && checksum == this.CalcChecksum(data)) {
                return data; //already decrypted
            }
            for (let i = 0; i < data.length; i += 2) {
                key = this.PokeRNG(key);
                data.writeInt16LE(data.readInt16LE(i) ^ (key >> 16), i);
            }
            if (typeof (checksum) == "number" && this.CalcChecksum(data) != checksum) {
                console.error(`Checksum ${checksum} does not match calculated sum ${this.CalcChecksum(data)}`);
                return null;
            }
            return data;
        }
    }
}
