/// <reference path="base.ts" />

namespace RamReader {

    const NUM_POKEMON = 807;
    const DEX_FLAG_BYTES = Math.floor((NUM_POKEMON + 7) / 8);
    const NUM_POKEMON_FORMS = 1120;
    const DEX_SEEN_FLAG_BYTES = Math.floor((NUM_POKEMON_FORMS + 7) / 8);


    const partyLocation = "33F7F9B8"; //USUM
    const pcLocation = "33015408"; //USUM
    const battleLocation = "30000000"; //USUM
    const saveBlock1Location = "33011934"; //USUM
    const saveBlock2Location = "33F6D748"; //USUM
    const daycareLocation = "3307B010"; //USUM
    const battleTrainerLocation = "30034B60"; //USUM

    // const partyLocation = "33F7FA38"; //Star (USUM + 0x80)
    // const pcLocation = "33015408"; //USUM
    // const battleLocation = "30000000"; //USUM
    // const saveBlock1Location = "33011934"; //Star
    // const saveBlock2Location = "33F6D7C8"; //Star?
    // const daycareLocation = "3307B090"; //Star?
    // const battleTrainerLocation = "30034B60"; //Star?


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

    interface Gen7BattleMon {
        baseMonPtr: number;
        level: number;
        health: [number, number];
        held_item: TPP.Item | null;
        ability: string;
        experience: { current: number };
        status: string | null;
        moves: TPP.Move[];
        active: boolean;
    }

    function Spy<T>(object: T, serialize: (obj: T) => string = obj => JSON.stringify(obj)) {
        console.log(serialize(object));
        return object;
    }

    export class Gen7 extends RamReaderBase<RomReader.Gen7> {
        public ReadParty = this.CachedEmulatorCaller(`ReadByteRange/${partyLocation}/BA4`, this.WrapBytes(data => this.ParseParty(data)));
        public ReadPC = this.CachedEmulatorCaller(`ReadByteRange/${pcLocation}/36CA8`, this.WrapBytes(data => this.ParsePC(data)));
        public ReadBattle = this.CachedEmulatorCaller(`ReadByteRange/${battleLocation}/10000`, this.WrapBytes(data => this.ParseBattle(data)));
        protected TrainerChunkReaders = [
            this.CachedEmulatorCaller(`ReadByteRange/${saveBlock1Location}/4000`, this.WrapBytes(data => this.ParseSaveBlock1(data))),
            this.CachedEmulatorCaller(`ReadByteRange/${saveBlock2Location}/10`, this.WrapBytes(data => this.ParseSaveBlock2(data))),
            this.CachedEmulatorCaller(`ReadByteRange/${daycareLocation}/200`, this.WrapBytes(data => this.ParseDaycare(data))),
        ];

        protected readerFunc = this.ReadSync;

        // protected partyPollingIntervalMs = 720;
        // protected pcPollingIntervalMs = 2010;
        // protected trainerPollingIntervalMs = 650;
        // protected battlePollingIntervalMs = 930;

        protected OptionsSpec = {
            text_speed: {
                2: "Fast",
                1: "Normal",
                0: "Slow"
            },
            battle_style: {
                0: "Switch",
                0x8: "Set"
            },
            battle_scene: {
                0: "On",
                0x4: "Off"
            },
            button_mode: {
                0: "Default",
                0x2000: "L=A",
            },
            box_mode: {
                0: "Manual",
                0x8000: "Automatic"
            }
        }

        private battleMonCache: { [key: number]: TPP.PartyPokemon } | null = null;
        private battleTrainerCache: TPP.EnemyTrainer[] | null = null;

        protected async ParseBattle(data: Buffer): Promise<TPP.BattleStatus> {
            const in_battle = data.slice(0x2738, 0x2738 + 0x10).toString('hex').toUpperCase() == "4455000020030000FC260030682A0030";
            if (in_battle) {
                if (!this.battleTrainerCache) {
                    const trainersAndClasses = await this.CallEmulator(`ReadByteRange/${battleTrainerLocation}/8000`, this.WrapBytes(data =>
                        this.ReadLinkedList(data, parseInt(battleTrainerLocation, 16))
                            .filter(node => node.readUInt32LE(4) == 0x3C || node.readUInt32LE(4) == 0x4C)
                            .map(node => this.rom.ConvertText(node.slice(0x30)))));
                    for (let i = 1; i < trainersAndClasses.length; i += 2) {
                        this.battleTrainerCache = [];
                        this.battleTrainerCache.push({
                            id: -1,
                            class_id: -1,
                            name: trainersAndClasses[i],
                            class_name: trainersAndClasses[i + 1]
                        } as TPP.EnemyTrainer);
                    }
                }
                const isDouble = this.battleTrainerCache && this.battleTrainerCache.length == 2; //two enemy trainers
                const baseAddr = parseInt(battleLocation, 16);
                const battleParties = this.rom.ReadArray(data, 0x404, 0x1C, 4).filter(p => p.readUInt32LE(0x18) > 0)
                    .map((party, pCount) => this.rom.ReadArray(party, 0, 0x4, party.readUInt32LE(0x18))
                        .map(p => p.readUInt32LE(0) - baseAddr).map(addr => data.slice(addr, addr + 0x330))
                        .map((btlMon, i) => (<Gen7BattleMon>{
                            baseMonPtr: btlMon.readUInt32LE(0x0),
                            level: btlMon[0x18],
                            health: [btlMon.readUInt16LE(0x10), btlMon.readUInt16LE(0xE)],
                            held_item: Pokemon.Convert.ItemToRunStatus(this.rom.GetItem(btlMon.readUInt16LE(0x12))),
                            species: Object.assign(Pokemon.Convert.SpeciesToRunStatus(this.rom.GetSpecies(btlMon.readUInt16LE(0xC))), { type1: this.rom.GetType(btlMon[0x1E4]), type2: this.rom.GetType(btlMon[0x1E5]) }),
                            ability: this.rom.GetAbility(btlMon[0x16]),
                            experience: { current: btlMon.readUInt32LE(0x8) },
                            status: ["PAR", "SLP", "FRZ", "BRN", "PSN"].filter((_, i) => (btlMon.readUInt32LE((0x28) + 8 * i) & 0x3) > 0).shift(),
                            moves: this.rom.ReadArray(btlMon, 0x1FC, 0xE, 4)
                                .map(mData => Pokemon.Convert.MoveToRunStatus(this.rom.GetMove(mData.readUInt16LE(0x6)), mData[0x8], undefined, mData[0x9])).filter(m => m && m.id > 0),
                            active: i == 0 || (isDouble && i == 1 && pCount == 0)
                        })));
                const allPartyCount = battleParties.reduce((sum, party) => sum + party.length, 0);
                if (!this.battleMonCache || Object.keys(this.battleMonCache).length < allPartyCount) {
                    const ptrs = battleParties.reduce((ptrArr, party) => ptrArr.concat(...party.map(m => m.baseMonPtr)), new Array<number>()).sort((p1, p2) => p1 - p2);
                    const lowestPtr = ptrs.shift();
                    const highestPtr = ptrs.pop();
                    const battleBlob = await this.CallEmulator(`ReadByteRange/${lowestPtr.toString(16)}/${((highestPtr - lowestPtr) + 0x1B4).toString(16)}`, this.WrapBytes(data => data));
                    this.battleMonCache = {};
                    [lowestPtr, ...ptrs, highestPtr].forEach(p => this.battleMonCache[p] = this.ParsePartyMon(battleBlob.slice((p - lowestPtr) + 0x40, (p - lowestPtr) + 0x1E4)));
                }
                const parties = battleParties.map(bp => bp.map(battleMon => (<TPP.PartyPokemon>Object.assign({}, this.battleMonCache[battleMon.baseMonPtr], battleMon))).filter(mon => !!mon.personality_value));
                (this.battleTrainerCache || []).forEach((t, i) => {
                    if (t.id < 0) {
                        const romTrainer = this.rom.TrainerSearch(t.name, t.class_name, parties[i + 1].length, parties[i + 1].map(p => p && p.species && p.species.id).filter(p => !!p), parties[i + 1].map(p => p && p.level).filter(p => !!p))
                        if (romTrainer) {
                            t.id = romTrainer.id;
                            t.class_id = romTrainer.classId;
                        }
                    }
                });

                return {
                    in_battle,
                    battle_kind: (this.battleTrainerCache || []).filter(t => t && t.class_name && t.name).length > 0 ? "Trainer" : "Wild",
                    battle_party: parties.shift(),
                    enemy_party: parties.reduce((arr, party) => arr.concat((party || [].filter(p => !!p))), []),
                    enemy_trainers: this.battleTrainerCache
                }
            }
            this.battleTrainerCache = null;
            this.battleMonCache = null;
            return { in_battle, battle_party: null, enemy_party: null, enemy_trainers: null };
        }

        protected async ParseSaveBlock1(data: Buffer): Promise<Partial<TPP.TrainerData>> {
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
            const seen_list = this.rom.CollapseSeenForms([...seenListMale, ...seenListFemale, ...seenListShinyMale, ...seenListShinyFemale].sort((mon1, mon2) => mon2 - mon1));

            const rawOptions = optionsData.readUInt16LE(0x50);
            const options = this.ParseOptions(rawOptions);
            if (this.ShouldForceOptions(options)) {
                await this.CallEmulator(`WriteU16LE/${(parseInt(saveBlock1Location, 16) + 0x3AD8 + 0x50).toString(16)}/${this.SetOptions(rawOptions, this.config.forceOptions).toString(16)}`)
                    .then(() => console.log(`Forced Options to ${Object.keys(this.config.forceOptions).map(o => `${o}: ${this.config.forceOptions[o]}`).join(', ')}`))
                    .catch(err => console.error(`Could not force options. Reason: ${err}`));
            }

            //Ultra space control mode = 0x1FD1, bit 2, set = circle pad, reset = gyro
            const ultraSpaceControlMode = data[0x1FD1];
            if (!(ultraSpaceControlMode & 0x4)) {
                await this.CallEmulator(`WriteByte/${(parseInt(saveBlock1Location, 16) + 0x1FD1).toString(16)}/${(ultraSpaceControlMode | 0x4).toString(16)}`)
                    .then(() => console.log("Set Ultra Space control method to Circle Pad"))
                    .catch(err => console.error(`Could not set Ultra Space control method to Circle Pad. Reason: ${err}`));
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
                stickers: data.readUInt16LE(0x1722), //may be related to 0x175C?
                options,
            };
        }

        protected itemPocketOffsets = [0x0, 0x6AC, 0x9C4, 0xB74, 0xC64, 0xD70, 0xDFC];

        protected ParseItems(data: Buffer): TPP.TrainerData["items"] {
            const free_space = new Array<TPP.Item>();

            const pockets = new Array(7).fill(0).map((_, i) => {
                const itemData = this.rom.ReadArray(data, this.itemPocketOffsets[i], 4, 0, false, item => (item.readUInt32LE(0) >> 10 & 0x3FF) == 0).map(i => i.readUInt32LE(0));
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

        protected ParseDaycare(data: Buffer): Partial<TPP.TrainerData> {
            return {}; //TODO
        }

        protected ParsePC(data: Buffer): TPP.CombinedPCData {
            const boxNames = this.rom.ReadArray(data, 0xBC, 0x22, 32).map(b => this.rom.ConvertText(b));

            return {
                current_box_number: data.readUInt32LE(0x69F),
                boxes: this.rom.ReadArray(data, 0x6A8, 0x1B30, 32).map((boxData, i) => (<TPP.BoxData>{
                    box_contents: this.ParsePCBox(boxData),
                    box_name: boxNames[i],
                    box_number: i + 1
                }))
            } as TPP.CombinedPCData;
        }

        protected ParsePCBox(data: Buffer) {
            return this.rom.ReadArray(data, 0, 0xE8, 30).map((p, i) => this.ParsePokemon(p, i + 1)).filter(p => !!p);
        }

        protected ParseParty(data: Buffer) {
            return this.rom.ReadArray(data, 0, 4, data[0x18]).map(ptr => ptr.readUInt32LE(0) - parseInt(partyLocation, 16)).filter(ptr => ptr > 0)
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

        protected ParsePokemon(pkmdata: Buffer, box_slot?: number) {
            const pkmn = { box_slot } as TPP.BoxedPokemon as Gen7Pokemon;
            pkmn.encryption_constant = pkmdata.readUInt32LE(0);
            if (!pkmn.encryption_constant) return null;
            pkmn.sanity = pkmdata.readUInt16LE(4);
            pkmn.scramble_value = (pkmn.encryption_constant >> 0xD & 0x1F);
            pkmn.sanity = pkmdata.readUInt16LE(0x4);
            pkmn.checksum = pkmdata.readUInt16LE(0x6);
            const sections = this.Descramble(this.Decrypt(pkmdata.slice(0x8, 0xE8), pkmn.encryption_constant, pkmn.checksum), pkmn.scramble_value);
            if (!sections) return null;
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
            pkmn.ribbons = this.ParseAlolanRibbons(pkmdata.slice(0x30, 0x38));
            //Super Training
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

            //Block D
            pkmn.met = {
                game: this.ParseOriginalGame(decrypted[0xDF]),
                date_egg_received: decrypted[0xD1] ? `20${decrypted[0xD1]}-${decrypted[0xD2]}-${decrypted[0xD3]}` : undefined,
                date: decrypted[0xD4] ? `20${decrypted[0xD4]}-${decrypted[0xD5]}-${decrypted[0xD6]}` : undefined,
                area_id_egg: decrypted.readUInt16LE(0xD8) || undefined,
                area_id: decrypted.readUInt16LE(0xDA) || undefined,
                caught_in: this.rom.GetItem(this.rom.MapCaughtBallId(decrypted[0xDC])).name,
                level: decrypted[0xDD] & 0x7F
            };
            pkmn.language = decrypted[0xE3].toString();

            this.rom.CalculateShiny(pkmn);
            return pkmn;
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
