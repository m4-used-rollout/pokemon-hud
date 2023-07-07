/// <reference path="base.ts" />

namespace RamReader {

    const NUM_POKEMON = 721;
    const DEX_FLAG_BYTES = 0x60; //Math.floor((NUM_POKEMON + 7) / 8);
    // const NUM_POKEMON_FORMS = 1060;
    const DEX_SEEN_FLAG_BYTES = 0x60; //Math.floor((NUM_POKEMON_FORMS + 7) / 8);
    const BOX_STRUCT_BYTES = 0xE8;

    // 8C64D34 X save block base?
    const partyLocation = 0x8CE1C5C; //X
    const pcMetadataLocation = 0x8C6A7D8; //X
    const pcDataLocation = 0x8C861B8; //X
    const battleBlockLocation = 0x81F0000; //X
    const battleBlockSize = 0x20000; //X
    const battleInfoOffset = 0xB280; //X
    const optionsLocation = 0x8C7B6C4; //X
    const locationLocation = 0x8C6709E; //X
    const pokedexLocation = 0x8C7A8D8; //X
    const itemsLocation = 0x8C67554; //X
    const trainerDataLocation = 0x8C79C2C; //X
    const trainerMiscLocation = 0x8C6A69C; //X
    const daycareLocation = 0x8C7FF34; //X
    const statsLocation = 0x8C83134; //X?

    // const partyLocation = 0x8CF71F0; //Omega Ruby
    // const battleInfoOffset = 0xB588; //Omega Ruby
    // const pcMetadataLocation = 0x8C6DEFC; //Omega Ruby
    // const pcDataLocation = 0x8C9A144; //Omega Ruby
    // const optionsLocation = 0x8C7F914; //Omega Ruby
    // const locationLocation = 0x8C6A7B2; //Omega Ruby
    // const pokedexLocation = 0x8C7DFFC; //Omega Ruby
    // const itemsLocation = 0x8C6AC80; //Omega Ruby
    // const trainerDataLocation = 0x8C7D350; //Omega Ruby
    // const trainerMiscLocation = 0x8C6DDD0; //Omega Ruby
    // const daycareLocation = 0x8C84188; //Omega Ruby
    // const statsLocation = 0x8C87280; //Omega Ruby

    // const partyLocation = 0x8CE1C5C + 0x10; //X 1.5
    // const pcMetadataLocation = 0x8C6A7D8 + 0x10; //X 1.5
    // const pcDataLocation = 0x8C861B8 + 0x10; //X 1.5
    // const optionsLocation = 0x8C7B6C4 + 0x10; //X 1.5
    // const locationLocation = 0x8C6709E + 0x10; //X 1.5
    // const pokedexLocation = 0x8C7A8D8 + 0x10; //X 1.5
    // const itemsLocation = 0x8C67554 + 0x10; //X 1.5
    // const trainerDataLocation = 0x8C79C2C + 0x10; //X 1.5
    // const trainerMiscLocation = 0x8C6A69C + 0x10; //X 1.5
    // const daycareLocation = 0x8C7FF34 + 0x10; //X 1.5

    const pcBoxSize = BOX_STRUCT_BYTES * 30;
    const pcDataSize = pcBoxSize * 31;

    interface Gen6Pokemon extends TPP.Pokemon {
        encryption_constant: number;
        sanity: number;
        scramble_value: number;
        checksum: number;
        is_nicknamed: boolean;
        affection: number;
        fullness: number;
        enjoyment: number;
    }

    interface Gen6DaycareMon extends Gen6Pokemon {
        steps: number;
    }

    interface Gen6BattleMon extends Gen6Pokemon, TPP.PartyPokemon {
        encryption_constant: number;
        active: boolean;
    }

    function Spy<T>(object: T, serialize: (obj: T) => string = obj => JSON.stringify(obj)) {
        console.log(serialize(object));
        return object;
    }

    export class Gen6 extends RamReaderBase<RomReader.Gen6> {
        public ReadParty = this.CachedEmulatorCaller(`ReadByteRange/${partyLocation.toString(16)}/BA4`, this.WrapBytes(data => this.ParseParty(data)));
        public ReadPC = this.CachedEmulatorCaller(`ReadByteRange/${pcDataLocation.toString(16)}/${pcDataSize.toString(16)}`, this.WrapBytes(data => this.ParsePC(data)));
        public ReadBattle = this.CachedEmulatorCaller(`ReadByteRange/${battleBlockLocation.toString(16)}/${battleBlockSize.toString(16)}`, this.WrapBytes(data => this.ParseBattle(data)));
        protected TrainerChunkReaders = [
            this.CachedEmulatorCaller(`ReadByteRange/${optionsLocation.toString(16)}/2`, this.WrapBytes(data => this.HandleOptions(data))),
            this.CachedEmulatorCaller(`ReadByteRange/${locationLocation.toString(16)}/20`, this.WrapBytes(data => this.ParseLocation(data))),
            this.CachedEmulatorCaller(`ReadByteRange/${pokedexLocation.toString(16)}/360`, this.WrapBytes(data => this.ProcessDex(data))),
            this.CachedEmulatorCaller(`ReadByteRange/${itemsLocation.toString(16)}/C00`, this.WrapBytes(data => this.ParseItems(data))),
            this.CachedEmulatorCaller(`ReadByteRange/${trainerDataLocation.toString(16)}/7C`, this.WrapBytes(data => this.ParseTrainerData(data))),
            this.CachedEmulatorCaller(`ReadByteRange/${trainerMiscLocation.toString(16)}/30`, this.WrapBytes(data => this.ParseTrainerMisc(data))),
            this.CachedEmulatorCaller(`ReadByteRange/${daycareLocation.toString(16)}/200`, this.WrapBytes(data => this.ParseDaycare(data))),
            this.CachedEmulatorCaller(`ReadByteRange/${statsLocation.toString(16)}/25C`, this.WrapBytes(data => this.ParseStats(data))),
        ];

        protected readerFunc = this.ReadSync;

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
                0x4000: "No L/R Button",
            },
            forced_save: {
                0: "Save",
                0x8000: "Don't Save"
            },
            battle_bg: {
                0: "Default",
                0x100: "Red",
                0x200: "Blue",
                0x300: "Pikachu",
                0x400: "Starters",
                0x500: "Eevee",
                0x600: "Monochrome",
                0x700: "Stickers",
                0x800: "Tatami",
                0x900: "Floral Print",
                0xA00: "Elegant",
                0xB00: "Tall Grass",
                0xC00: "Polka Balls",
                0xD00: "Cockpit",
                0xE00: "Carbon",
            }
        }

        protected async ParseBattle(data: Buffer): Promise<TPP.BattleStatus> {
            const battlePartiesPointers = this.rom.ReadArray(data, battleInfoOffset + 4, 0x1C, 4)
                .map(party => party.readUInt32LE(0x18) > 0
                    ? this.rom.ReadArray(party, 0, 4, party.readUInt32LE(0x18))
                        .map(p => p.readUInt32LE(0) - battleBlockLocation)
                    : [])
                .filter(p => p.length > 0);

            // check to see if all of the parties' pointers point to battle memory
            const in_battle = battlePartiesPointers.every(p => p.every(p => p >= 0 && p < battleBlockSize));
            if (in_battle) {
                // const battleType = data.readUInt32LE(battleInfoOffset + 0x8C18 + 4);
                // let battle_kind: ("Wild" | "Trainer") = battleType == 0x234 ? "Wild" : "Trainer";
                //const isDouble = this.battleTrainerCache && this.battleTrainerCache.length == 2; //two enemy trainers
                let battle_kind: "Wild" | "Trainer" = "Wild";
                const enemyTrainers: TPP.EnemyTrainer[] = [];
                const enemyTrainerId = data.readUInt16LE(battleInfoOffset + 0x7FC);
                const enemyTrainerClass = data.readUInt16LE(battleInfoOffset + 0x7FE);
                if (enemyTrainerId + enemyTrainerClass > 0) {
                    battle_kind = "Trainer";
                    enemyTrainers.push(this.rom.GetTrainer(enemyTrainerId, enemyTrainerClass));
                }
                const parties = battlePartiesPointers.map(p => p.map(addr => data.slice(addr, addr + 0x200))
                    .map((btlMon, i) => {
                        const baseMonPtrPtr = btlMon.readUInt32LE(0) - battleBlockLocation + 4;
                        const baseMonPtr = baseMonPtrPtr >= 0 ? data.readUInt32LE(baseMonPtrPtr) - battleBlockLocation : baseMonPtrPtr;
                        if (baseMonPtr < 0 || baseMonPtr >= battleBlockSize) {
                            console.log(`Could not find base mon for party slot ${i}: ${(baseMonPtr + battleBlockLocation).toString(16)}`);
                            return null;
                        }
                        return (<Gen6BattleMon>{
                            ...(this.ParsePokemon(data.slice(baseMonPtr, baseMonPtr + 0xE8)) || {}),
                            level: btlMon[0x18],
                            health: [btlMon.readUInt16LE(0x10), btlMon.readUInt16LE(0xE)],
                            held_item: Pokemon.Convert.ItemToRunStatus(this.rom.GetItem(btlMon.readUInt16LE(0x12))),
                            species: Object.assign(Pokemon.Convert.SpeciesToRunStatus(this.rom.GetSpecies(btlMon.readUInt16LE(0xC))), { type1: this.rom.GetType(btlMon[0x1E4]), type2: this.rom.GetType(btlMon[0x1E5]) }),
                            ability: this.rom.GetAbility(btlMon[0x16]),
                            experience: { current: btlMon.readUInt32LE(0x8) },
                            stats: {
                                attack: btlMon.readUInt16LE(0xF6),
                                defense: btlMon.readUInt16LE(0xF8),
                                special_attack: btlMon.readUInt16LE(0xFA),
                                special_defense: btlMon.readUInt16LE(0xFC),
                                speed: btlMon.readUInt16LE(0xFE)
                            },
                            status: ["PAR", "SLP", "FRZ", "BRN", "PSN"].filter((_, i) => (btlMon.readUInt32LE((0x20) + 4 * i) & 0x3) > 0).shift(),
                            moves: this.rom.ReadArray(btlMon, 0x116, 0xE, 4)
                                .map(mData => Pokemon.Convert.MoveToRunStatus(this.rom.GetMove(mData.readUInt16LE(0x6)), mData[0x8], undefined, mData[0x9])).filter(m => m && m.id > 0),
                            active: battle_kind == "Wild" || i == 0//|| (isDouble && i == 1 && pCount == 0)
                        });
                    }).filter(p => !!p)).filter(p => p.length > 0);

                if (parties.length > 1) {

                    return {
                        in_battle,
                        battle_kind,
                        battle_party: parties.shift(),
                        enemy_party: parties.reduce((arr, party) => arr.concat((party || [].filter(p => !!p))), []),
                        enemy_trainers: enemyTrainers.filter(t => !!t)
                    }
                }
            }
            let party = this.currentState.party;
            if (this.currentState.in_battle && !in_battle)
                party = await this.CallEmulator(`ReadByteRange/${partyLocation.toString(16)}/BA4`, this.WrapBytes(data => this.ParseParty(data)));
            return { in_battle: false, battle_party: null, enemy_party: null, enemy_trainers: null, party } as TPP.BattleStatus;
        }

        protected ParseTrainerMisc(data: Buffer): Partial<TPP.TrainerData> {
            // if (data[0x24] & 8) { // EXP Share on (ORAS)
            //     const emuUrl = `WriteByte/${trainerMiscLocation.toString(16)}+24/${(data[0x24] & 0xF7).toString(16)}`;
            //     console.log("Disabling exp share: " + emuUrl);
            //     this.CallEmulator(emuUrl); // Shut it off
            // }
            return {
                money: data.readUInt32LE(0),
                badges: data[4],
                rival_name: this.rom.ConvertText(data.slice(8))
            };
        }

        protected ParseTrainerData(data: Buffer): Partial<TPP.TrainerData> {
            return {
                id: data.readUInt16LE(0),
                secret: data.readUInt16LE(2),
                gender: data[5] == 1 ? "Female" : "Male",
                name: this.rom.ConvertText(data.slice(0x48)),
                nickname: this.rom.ConvertText(data.slice(0x62)),
            };
        }

        protected ProcessDex(data: Buffer): Partial<TPP.TrainerData> {
            let offset = 0;
            let nextOffset = offset + DEX_FLAG_BYTES;
            const caught_list = this.GetSetFlags(data.slice(offset, nextOffset));
            const seenListMale = this.GetSetFlags(data.slice(offset = nextOffset, nextOffset += DEX_SEEN_FLAG_BYTES));
            const seenListFemale = this.GetSetFlags(data.slice(offset = nextOffset, nextOffset += DEX_SEEN_FLAG_BYTES));
            const seenListShinyMale = this.GetSetFlags(data.slice(offset = nextOffset, nextOffset += DEX_SEEN_FLAG_BYTES));
            const seenListShinyFemale = this.GetSetFlags(data.slice(offset = nextOffset, nextOffset += DEX_SEEN_FLAG_BYTES));
            const seen_list = this.rom.CollapseSeenForms([...seenListMale, ...seenListFemale, ...seenListShinyMale, ...seenListShinyFemale].sort((mon1, mon2) => mon2 - mon1));
            return {
                caught_list,
                seen_list,
            };
        }

        protected async HandleOptions(data: Buffer): Promise<Partial<TPP.TrainerData>> {
            const rawOptions = data.readUInt16LE(0);
            const options = this.ParseOptions(rawOptions);
            if (this.ShouldForceOptions(options)) {
                await this.CallEmulator(`WriteU16LE/${optionsLocation.toString(16)}/${this.SetOptions(rawOptions, this.config.forceOptions).toString(16)}`)
                    .then(() => console.log(`Forced Options to ${Object.keys(this.config.forceOptions).map(o => `${o}: ${this.config.forceOptions[o]}`).join(', ')}`))
                    .catch(err => console.error(`Could not force options. Reason: ${err}`));
            }
            return { options };
        }

        protected itemPocketOffsets = [0x0, 0x640, 0x7C0, 0x968, 0xA68]; //XY?
        // protected itemPocketOffsets = [0x0, 0x640, 0x7C0, 0x970, 0xA70]; //ORAS

        protected ParseItems(data: Buffer): Partial<TPP.TrainerData> {
            const pockets = new Array(5).fill(0).map((_, i) => this.rom.ReadArray(data, this.itemPocketOffsets[i], 4, 0, false, item => item.readUInt16LE(0) == 0)
                .map(item => Pokemon.Convert.ItemToRunStatus(this.rom.GetItem(item.readUInt16LE(0)), item.readUInt16LE(2))));
            return {
                items: {
                    items: pockets[0],
                    key: pockets[1],
                    tms: pockets[2],
                    medicine: pockets[3],
                    berries: pockets[4]
                }
            };
        }


        protected ParseLocation(data: Buffer): Partial<TPP.TrainerData> {
            const mapId = data.readInt16LE(0)
            const map = this.rom.GetMap(mapId);
            return {
                map_id: mapId,
                x: data.readFloatLE(0xE),
                z: data.readFloatLE(0x12),
                y: data.readFloatLE(0x16),
                map_name: map.name,
                area_id: map.areaId,
                area_name: map.areaName
            }
        }

        protected ParseDaycare(data: Buffer): Partial<TPP.TrainerData> {
            const daycare = new Array<Gen6DaycareMon>();
            if (data[0] & 1)
                daycare.push({ ...this.ParsePokemon(data.slice(0x8, 0xF0)), steps: data.readUInt32LE(0x4) });
            if (data[0xF0] & 1)
                daycare.push({ ...this.ParsePokemon(data.slice(0xF8)), steps: data.readUInt32LE(0xF4) });
            return { daycare: daycare.filter(d => !!d) };
        }

        protected async ParsePC(data: Buffer): Promise<TPP.CombinedPCData> {
            const metadata = await this.CallEmulator(`ReadByteRange/${pcMetadataLocation.toString(16)}/9B3`, this.WrapBytes(data => data));
            const unlockedBoxes = metadata[0x43D];
            const boxNames = this.rom.ReadArray(metadata, 0, 0x22, unlockedBoxes).map(b => this.rom.ConvertText(b));
            const battleBox = {
                box_contents: this.ParsePCBox(metadata.slice(0x444), 6),
                box_name: "Battle Box",
                box_number: 32
            };
            return {
                current_box_number: metadata[0x43F],
                boxes: [battleBox, ...this.rom.ReadArray(data, 0, pcBoxSize, unlockedBoxes).map((boxData, i) => (<TPP.BoxData>{
                    box_contents: this.ParsePCBox(boxData),
                    box_name: boxNames[i],
                    box_number: i + 1
                }))]
            } as TPP.CombinedPCData;
        }

        protected ParsePCBox(data: Buffer, slots = 30) {
            return this.rom.ReadArray(data, 0, BOX_STRUCT_BYTES, slots).map((p, i) => this.ParsePokemon(p, i + 1)).filter(p => !!p);
        }

        protected ParseParty(data: Buffer) {
            return this.rom.ReadArray(data, 0, 4, data[0x18]).map(ptr => ptr.readUInt32LE(0) - partyLocation).filter(ptr => ptr > 0)
                .map(ptr => this.ParsePartyMon(data.slice(ptr + 0x40, ptr + 0x1E4), 0x158));
        }

        protected ParsePartyMon(data: Buffer, battleDataOffset = BOX_STRUCT_BYTES) {
            const pkmn = this.ParsePokemon(data) as any as TPP.PartyPokemon & Gen6Pokemon;
            if (!pkmn)
                return pkmn;

            const decrypted = Buffer.from([...new Array<number>(BOX_STRUCT_BYTES).fill(0), ...this.Decrypt(data.slice(battleDataOffset), pkmn.encryption_constant)]);

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
            const pkmn = { box_slot } as TPP.BoxedPokemon as Gen6Pokemon;
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
            //pkmn.pelago_event_status = decrypted[0x2A];
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

            this.rom.CalculateShiny(pkmn, 16);

            if (pkmn.species.national_dex == 292) //Shedinja copies its PV from its Ninjask. Prevent PV collision at all cost!
                pkmn.personality_value = pkmn.personality_value ^ pkmn.encryption_constant;

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

        protected GameStatsMapping = ["Steps Taken", "Times Saved", "Storyline Completed Time", "Times Bicycled", "Total Battles", "Wild Pokémon Battles", "Trainer Battles", "Pokemon Caught", "Pokemon Caught Fishing", "Eggs Hatched", "Pokémon Evolved", "Pokémon Healed at Pokémon Centers", "Link Trades", "Link Battles", "Link Battle Wins", "Link Battle Losses", "WiFi Trades", "WiFi Battles", "WiFi Battle Wins", "WiFi Battle Losses", "IR Trades", "IR Battles", "IR Battle Wins", "IR Battle Losses", "Mart Stack Purchases", "Money Spent", "Times watched TV", "Pokémon deposited at Daycare", "Pokémon Defeated", "Exp. Points Collected (Highest)", "Exp. Points Collected (Today)", "Deposited in the GTS", "Nicknames Given", "Bonus Premier Balls Received", "Battle Points Earned", "Battle Points Spent", null, "Tips at Restaurant: ★☆☆", "Tips at Restaurant: ★★☆", "Tips at Restaurant: ★★★", "Tips at Restaurant: Sushi High Roller", "Tips at Café 1", "Tips at Café 2", "Tips at Café 3", "Tips at Cameraman", "Tips at Drink Vendors", "Tips at Poet", "Tips at Furfrou Trimmer", "Tips at Battle Maison 1", "Tips at Battle Maison 2", "Tips at Battle Maison 3", "Tips at Battle Maison 4", "Tips at Maid", "Tips at Butler", "Tips at Scary House", "Tips at Traveling Minstrel", "Tips at Special BGM 1", "Tips at Special BGM 2", "Tips at Frieser Furfrou", "Nice! Received", "Birthday Wishes", "Total People Met Online", "Total People Passed By", "Current Pokemiles", "Total Pokemiles Received", "Total Pokemiles sent to PGL", "Total Super Training Attempts", "Total Super Training Cleared", "IV Judge Evaluations", "Trash Cans inspected", /*"Inverse Battles" wrong*/null, "Maison Battles", "Times changed character clothing", "Times changed character hairstyle", "Berries harvested", "Berry Field mutations", "PR Videos", "Friend Safari Encounters", "O-Powers Used", "Secret Base Updates", "Secret Base Flags Captured", "Contests Participated Count", "GTS Trades", "Wonder Trades", "Steps Sneaked", "Multiplayer Contests", "Pokeblocks used", "Times AreaNav Used", "Times DexNav Used", "Times BuzzNav Used", "Times PlayNav Used", null, null, null, null, null, null, null, null, null, /*All the rest are 16-bit values*/ "Champion Title Defense", "Times rested at home", "Times Splash used", "Times Struggle used", "Moves used with No Effect", "Own Fainted Pokémon", "Times attacked ally in battle", "Failed Run Attempts", "Wild encounters that fled", "Failed Fishing Attempts", "Pokemon Defeated (Highest)", "Pokemon Defeated (Today)", "Pokemon Caught (Highest)", "Pokemon Caught (Today)", "Trainers Battled (Highest)", "Trainers Battled (Today)", "Pokemon Evolved (Highest)", "Pokemon Evolved (Today)", "Fossils Restored", "Sweet Scent Encounters", "Battle Institute Tests", "Battle Institute Rank", "Battle Institute Score", "Last Tip at Restaurant: ★☆☆", "Last Tip at Restaurant: ★★☆", "Last Tip at Restaurant: ★★★", "Last Tip at Restaurant: Sushi High Roller", "Last Tip at Café 1", "Last Tip at Café 2", "Last Tip at Café 3", "Last Tip at Cameraman", "Last Tip at Drink Vendors", "Last Tip at Poet", "Last Tip at Furfrou Trimmer", "Last Tip at Battle Maison 1", "Last Tip at Battle Maison 2", "Last Tip at Battle Maison 3", "Last Tip at Battle Maison 4", "Last Tip at Maid", "Last Tip at Butler", "Last Tip at Scary House", "Last Tip at Traveling Minstrel", "Last Tip at Special BGM 1", "Last Tip at Special BGM 2", "Last Tip at Frieser Furfrou", "Photos Taken", /*"Sky Wild Battles (?)" nope*/ null, "Battle Maison Streak: Singles", "Battle Maison Streak: Doubles", "Battle Maison Streak: Triples", "Battle Maison Streak: Rotation", "Battle Maison Streak: Multi", "Loto-ID Wins", "PP Ups used", "PSS Passerby Count (Today)", "Amie Used", "Roller Skate Count: Spin Left", "Roller Skate Count: Spin Right", "Roller Skate Count: Running Start", "Roller Skate Count: Parallel Swizzle", "Roller Skate Count: Drift-and-dash", "Roller Skate Count: 360 right", "Roller Skate Count: 360 left", "Roller Skate Count: Flips", "Roller Skate Count: Grind", "Roller Skate Count: Combos", "Fishing Chains", "Secret Base Battles in your base", "Secret Base Battles in another base", "Contest Spectacular Photos taken", "Times used Fly", "Times used Soar", "Times used Dive", "Times used Sky Holes", "Times healed by Mom", "Times used Escape Rope", "Times used Dowsing Machine", "Trainer's Eye Rematches", "FUREAI Interest ???", "Shiny Pokemon Encountered", "Trick House Clears", "Eon Ticket 1 (Spotpass)", "Eon Ticket 2 (Mystery Gift)"];

        protected ParseStats(data: Buffer): Partial<TPP.TrainerData> {
            return { game_stats: this.ParseGameStats(this.rom.ReadArray(data, 0, 4, 100).map(n => n.readUInt32LE(0)).concat(this.rom.ReadArray(data, 400, 2, 100).map(n => n.readUInt16LE(0)))) };
        }
    }
}
