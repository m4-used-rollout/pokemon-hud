/// <reference path="base.ts" />

namespace RamReader {

    interface Gen3PartyPokemon extends TPP.PartyPokemon, TPP.BoxedPokemon {
        encyption_key?: number;
        checksum?: number;
        species: Pokemon.Convert.StatSpeciesWithExp;
    }

    interface Gen3BattlePokemon extends Gen3PartyPokemon {
        buffs?: {
            accuracy: number;
            evasion: number;
        } & TPP.Stats;
        volatile_status?: string[];
    }

    enum Gen3Language {
        Japanese = 1,
        English = 2,
        French = 3,
        Italian = 4,
        German = 5,
        Korean = 6,
        Spanish = 7
    }

    enum Gen3VolatileStatus {
        Confusion = 0x00000007,
        Flinched = 0x00000008,
        Uproar = 0x00000070,
        Bide = 0x00000300,
        "Lock Confuse" = 0x00000C00,
        "Multiple Turns" = 0x00001000,
        Wrapped = 0x0000E000,
        Infatuated = 0x000F0000,
        "Focus Energy" = 0x00100000,
        Transformed = 0x00200000,
        "Must Recharge" = 0x00400000,
        Rage = 0x00800000,
        Substitute = 0x01000000,
        "Destiny Bond" = 0x02000000,
        Trapped = 0x04000000,
        Nightmare = 0x08000000,
        Cursed = 0x10000000,
        Foresight = 0x20000000,
        "Defense Curl" = 0x40000000,
        Torment = 0x80000000
    }

    //TODO: Get these from .map file
    const EwramPartyLocation = 0x244EC;
    const PartyBytes = 600;
    const PCBlockPointer = 0x3005D94;
    const PCBytes = 33730;
    const SaveBlock1Pointer = 0x03005D8C;
    const SaveBlock2Pointer = 0x03005D90;
    const FlagsOffset = 0x1270;
    const DaycareOffset = 0x3030;
    const InventoryOffset = 0x490;
    const IwramClockAddr = 0x5CF8;
    const IwramMusicAddr = 0x0F48;
    const CurrentAreaAddr = 0x0203732C;
    const BattleFlagsAddr = 0x02022FEC;
    const EnemyTrainersAddr = 0x02038BCA;
    const EnemyPartyAddr = 0x02024744;
    const BattleMonsAddr = 0x02024084;
    const BattleMonsBytes = 0x58 * 4;
    const InBattleAddr = "30022c0+439"; //gMain.inBattle (bit 2)


    export class Gen3 extends RamReaderBase {
        protected Markings = ['●', '■', '▲', '♥'];

        public ReadParty = this.CachedEmulatorCaller(`EWRAM/ReadByteRange/${EwramPartyLocation.toString(16)}/${PartyBytes.toString(16)}`, this.WrapBytes(data => this.ParseParty(data)));

        public ReadPC = this.CachedEmulatorCaller(`ReadByteRange/*${PCBlockPointer.toString(16)}/${PCBytes.toString(16)}`, this.WrapBytes(data => ({
            current_box_number: data.readUInt32LE(0),
            boxes: this.rom.ReadStridedData(data.slice(4, 0x8344), 0, 30 * 80, 14).map((box, i) => ({
                box_number: i + 1,
                box_name: this.rom.ConvertText(data.slice(0x8344 + (i * 9), 0x8344 + ((i + 1) * 9))),
                box_contents: this.rom.ReadStridedData(box, 0, 80, 30).map((pkmdata, b) => this.ParsePokemon(pkmdata, b + 1)).filter(p => !!p)
            } as TPP.BoxData))
        } as TPP.CombinedPCData)));

        public ReadBattle = this.CachedEmulatorCaller(`ReadByteRange/${InBattleAddr}/1/${BattleFlagsAddr.toString(16)}/4/${EnemyTrainersAddr.toString(16)}/4/${EnemyPartyAddr.toString(16)}/${PartyBytes.toString(16)}/${BattleMonsAddr.toString(16)}/${BattleMonsBytes.toString(16)}`, this.WrapBytes<TPP.BattleStatus>(data => {
            const in_battle = (data[0] & 2) > 0;
            const battleFlags = data.readUInt32LE(1);
            if (in_battle) {
                const battle_kind = battleFlags & 8 ? "Trainer" : "Wild";
                const enemy_trainers = new Array<TPP.EnemyTrainer>();
                if (battle_kind == "Trainer") {
                    enemy_trainers.push(Pokemon.Convert.EnemyTrainerToRunStatus(this.rom.GetTrainer(data.readUInt16LE(5))));
                    if (battleFlags & 0x41) { //multi-battle
                        enemy_trainers.push(Pokemon.Convert.EnemyTrainerToRunStatus(this.rom.GetTrainer(data.readUInt16LE(7))));
                    }
                }
                const enemy_party = this.ParseParty(data.slice(9, 9 + PartyBytes));
                this.StoreCurrentBattleMons(this.ParseBattleMons(data.slice(9 + PartyBytes), (battleFlags & 0x41) > 0));
                return { in_battle, battle_kind, enemy_party, enemy_trainers };
            }
            return { in_battle };
        }));

        protected TrainerChunkReaders = [
            //Save Block 2
            this.CachedEmulatorCaller<TPP.TrainerData>(`ReadByteRange/*${SaveBlock2Pointer.toString(16)}/B0`, this.WrapBytes(data => {
                const caughtList = this.GetSetFlags(data.slice(0x28), 412);
                const seenList = this.GetSetFlags(data.slice(0x5C), 412);
                return {
                    name: this.rom.ConvertText(data.slice(0, 8)),
                    gender: data[8] ? "Female" : "Male",
                    id: data.readUInt16LE(10),
                    secret: data.readUInt16LE(12),
                    options: this.ParseOptions(data.readUInt32LE(19)), //options is 24 bits, so this grabs the next byte as well (but ignores it)
                    caught: caughtList.length,
                    caught_list: caughtList,
                    seen: seenList.length,
                    seen_list: seenList,
                    security_key: data.readUInt32LE(0xAC),
                } as TPP.TrainerData;
            }), 0xE * 2, 0x13 * 2),
            //Location
            this.CachedEmulatorCaller<TPP.TrainerData>(`ReadByteRange/*${SaveBlock1Pointer.toString(16)}/6/${CurrentAreaAddr.toString(16)}/1`, this.WrapBytes(data => ({
                x: data.readUInt16LE(0),
                y: data.readUInt16LE(2),
                map_bank: data[4],
                map_id: data[5],
                area_id: data[6],
                map_name: this.rom.GetMap(data[5], data[4]).name,
                area_name: this.rom.GetAreaName(data[6])
            } as TPP.TrainerData))),
            //Inventory
            this.CachedEmulatorCaller<TPP.TrainerData>(`ReadByteRange/*${SaveBlock1Pointer.toString(16)}+${InventoryOffset.toString(16)}/4F8/*${SaveBlock2Pointer.toString(16)}+AC/4`, this.WrapBytes(data => {
                const key = data.readUInt32LE(0x4F8);
                const halfKey = key % 0x10000;
                const ballPocket = this.ParseItemCollection(data.slice(0x1C0), 16, halfKey);
                return {
                    money: data.readUInt32LE(0) ^ key,
                    coins: data.readUInt16LE(4) ^ halfKey,
                    items: {
                        pc: this.ParseItemCollection(data.slice(8), 50), //no key
                        items: this.ParseItemCollection(data.slice(0xD0), 30, halfKey),
                        key: this.ParseItemCollection(data.slice(0x148), 30, halfKey),
                        ball: ballPocket,
                        tm: this.ParseItemCollection(data.slice(0x200), 64, halfKey),
                        berry: this.ParseItemCollection(data.slice(0x300), 46, halfKey)
                    },
                    ball_count: ballPocket.reduce((sum, b) => sum + b.count, 0)
                } as TPP.TrainerData
            })),
            //Flags (Currently just badges)
            this.CachedEmulatorCaller<TPP.TrainerData>(`ReadByteRange/*${SaveBlock1Pointer.toString(16)}+${FlagsOffset.toString(16)}/12C`, this.WrapBytes(data => ({
                badges: (data.readUInt16LE(0x10C) >> 7) % 0x100
            } as TPP.TrainerData))),
            //Clock
            this.CachedEmulatorCaller<TPP.TrainerData>(`IWRAM/ReadU16BE/${IwramClockAddr.toString(16)}+2`, this.WrapBytes(data => ({
                time: {
                    h: data[0],
                    m: data[1]
                }
            } as TPP.TrainerData))),
            //Evolution
            this.CachedEmulatorCaller<TPP.TrainerData>(`IWRAM/ReadU16BE/${IwramMusicAddr.toString(16)}`, this.WrapBytes(data => ({
                evolution_is_happening: data.readUInt16LE(0) == 0x179
            } as TPP.TrainerData))),
            //Daycare
            this.CachedEmulatorCaller<TPP.TrainerData>(`ReadByteRange/*${SaveBlock1Pointer.toString(16)}+${DaycareOffset.toString(16)}/118`, this.WrapBytes(data => ({
                daycare: [
                    this.ParsePokemon(data.slice(0, 80)),
                    this.ParsePokemon(data.slice(140, 140 + 80))
                ].filter(dm => !!dm)
            } as TPP.TrainerData))),
        ] as Array<() => Promise<TPP.TrainerData>>;

        protected ParseItemCollection(itemData: Buffer, length = itemData.length / 4, key = 0) {
            return this.rom.ReadStridedData(itemData, 0, 4, length, true).map(data => Pokemon.Convert.ItemToRunStatus(this.rom.GetItem(data.readUInt16LE(0)), data.readUInt16LE(2) ^ key)).filter(i => i.id);
        }

        protected ParseParty(partyData: Buffer) {
            const party = new Array<TPP.PartyPokemon>();
            for (let i = 0; i < PartyBytes; i += 100)
                party.push(this.ParsePokemon(partyData.slice(i, i + 100)));
            return party;//.filter(p => !!p);
        }

        protected ParseBattleMons(battleData: Buffer, multBattle: boolean) {
            const battleMons = new Array<TPP.PartyPokemon>();
            const battleBytes = BattleMonsBytes / (multBattle ? 1 : 2);
            for (let i = 0; i < battleBytes; i += 0x58) {
                battleMons.push(this.ParseBattlePokemon(battleData.slice(i, i + 0x58)));
            }
            return battleMons.filter(b => !!b);
        }

        protected ParsePokemon(pkmdata: Buffer, boxSlot?: number): TPP.PartyPokemon & TPP.BoxedPokemon {
            const pkmn = {} as Gen3PartyPokemon;
            pkmn.personality_value = pkmdata.readUInt32LE(0);
            pkmn.encyption_key = pkmn.personality_value ^ pkmdata.readUInt32LE(4);
            if (!pkmn.encyption_key)
                return null;
            pkmn.original_trainer = {
                name: this.rom.ConvertText(pkmdata.slice(20, 20 + 7)),
                id: pkmdata.readUInt16LE(4),
                secret: pkmdata.readUInt16LE(6)
            }
            pkmn.name = this.rom.ConvertText(pkmdata.slice(8, 8 + 10));
            pkmn.language = Gen3Language[pkmdata[18]] || pkmdata.readUInt16LE(18).toString();
            pkmn.marking = this.ParseMarkings(pkmdata[27]);
            pkmn.checksum = pkmdata.readUInt16LE(28);
            const sections = this.Descramble(this.Decrypt(pkmdata.slice(32, 80), pkmn.encyption_key, pkmn.checksum), pkmn.personality_value);
            if (!sections) {
                return null;
            }

            //Growth Section
            pkmn.species = Pokemon.Convert.SpeciesToRunStatus(this.rom.GetSpecies(sections.A.readUInt16LE(0)));
            const itemId = sections.A.readUInt16LE(2);
            pkmn.held_item = itemId ? Pokemon.Convert.ItemToRunStatus(this.rom.GetItem(itemId)) : null;
            const exp = sections.A.readUInt16LE(4);
            const ppUps = sections.A[8];
            pkmn.friendship = sections.A[9];

            //Moves
            pkmn.moves = [
                Pokemon.Convert.MoveToRunStatus(this.rom.GetMove(sections.B.readUInt16LE(0)), sections.B[8], ppUps % 4),
                Pokemon.Convert.MoveToRunStatus(this.rom.GetMove(sections.B.readUInt16LE(2)), sections.B[9], (ppUps >> 2) % 4),
                Pokemon.Convert.MoveToRunStatus(this.rom.GetMove(sections.B.readUInt16LE(4)), sections.B[10], (ppUps >> 4) % 4),
                Pokemon.Convert.MoveToRunStatus(this.rom.GetMove(sections.B.readUInt16LE(6)), sections.B[11], (ppUps >> 6) % 4),
            ].filter(m => m && m.id);

            //EVs & Condition
            pkmn.evs = {
                hp: sections.C[0],
                attack: sections.C[1],
                defense: sections.C[2],
                speed: sections.C[3],
                special_attack: sections.C[4],
                special_defense: sections.C[5],
            }
            pkmn.condition = {
                coolness: sections.C[6],
                beauty: sections.C[7],
                cuteness: sections.C[8],
                smartness: sections.C[9],
                toughness: sections.C[10],
                feel: sections.C[11]
            }

            //Miscellaneous
            pkmn.pokerus = this.ParsePokerus(sections.D[0]);
            const met = sections.D.readUInt16LE(2);
            const metMap = this.rom.GetMap(sections.D[1]);
            pkmn.met = {
                map_id: metMap.id,
                area_id: metMap.areaId,
                area_name: metMap.areaName,
                level: met % 128,
                game: ((met >> 7) % 16).toString(),
                caught_in: this.rom.GetItem(this.rom.MapCaughtBallId((met >> 11) % 16)).name
            }
            pkmn.original_trainer.gender = this.ParseGender(met >> 15);
            const ivs = sections.D.readUInt32LE(4);
            pkmn.ivs = {
                hp: ivs % 32,
                attack: (ivs >> 5) % 32,
                defense: (ivs >> 10) % 32,
                speed: (ivs >> 15) % 32,
                special_attack: (ivs >> 20) % 32,
                special_defense: (ivs >> 25) % 32
            }
            pkmn.is_egg = (ivs >> 30) % 2 > 0;
            pkmn.ability = pkmn.species.abilities[ivs >>> 31] || (ivs >>> 31).toString();
            const ribbons = sections.D.readUInt32LE(8);
            pkmn.ribbons = this.ParseHoennRibbons(ribbons);
            //pkmn.fateful_encounter = (ribbons >> 27) % 16;
            //pkmn.obedient = ribbons >> 31;

            if (pkmdata.length > 80) {
                const status = pkmdata.readUInt32LE(80);
                pkmn.status = this.ParseStatus(status);
                pkmn.sleep_turns = status % 8
                pkmn.level = pkmdata[84];
                pkmn.pokerus_remaining = pkmdata[85];
                pkmn.health = [pkmdata.readUInt16LE(86), pkmdata.readUInt16LE(88)]
                pkmn.stats = {
                    hp: pkmdata.readUInt16LE(88),
                    attack: pkmdata.readUInt16LE(90),
                    defense: pkmdata.readUInt16LE(92),
                    speed: pkmdata.readUInt16LE(94),
                    special_attack: pkmdata.readUInt16LE(96),
                    special_defense: pkmdata.readUInt16LE(98),
                }
            }

            if (pkmn.species) {
                pkmn.form = this.rom.GetSpecies(pkmn.species.id).formNumber;
                pkmn.gender = this.CalculateGender(pkmn.species.gender_ratio, pkmn.personality_value);
                if (pkmn.species.expFunction) {
                    pkmn.level = pkmn.level || this.CalculateLevelFromExp(exp, pkmn.species.expFunction);
                    pkmn.experience = this.CalculateExpVals(exp, pkmn.level, pkmn.species.expFunction);
                }
                const moveLearn = this.rom.GetNextMoveLearn(pkmn.species.id, pkmn.form, pkmn.level, pkmn.moves.map(m => m.id));
                if (moveLearn)
                    pkmn.next_move = { level: moveLearn.level, name: null, id: null, type: moveLearn.type };

                if (pkmn.name.toLowerCase() == pkmn.species.name.toLowerCase())
                    pkmn.name = pkmn.species.name;
            }

            if (boxSlot)
                pkmn.box_slot = boxSlot;

            return pkmn;
        }

        protected ParseBattlePokemon(pkmdata: Buffer): TPP.PartyPokemon {
            const speciesId = pkmdata.readUInt16LE(0);
            if (!speciesId)
                return null;
            const species = this.rom.GetSpecies(speciesId);
            const ivs = pkmdata.readUInt32LE(0x14);
            const level = pkmdata[0x2A];
            const itemId = pkmdata.readUInt16LE(0x2E);
            const ppUps = pkmdata[0x3B];
            const personalityValue = pkmdata.readUInt32LE(0x48);
            let name = this.rom.ConvertText(pkmdata.slice(0x30, 0x3C));
            if (name.toLowerCase() == species.name.toLowerCase())
                name = species.name;
            return {
                species: Object.assign(Pokemon.Convert.SpeciesToRunStatus(species), { type1: this.rom.GetType(pkmdata[0x21]), type2: this.rom.GetType(pkmdata[0x22]) }),
                stats: {
                    hp: pkmdata.readUInt16LE(0x2C),
                    attack: pkmdata.readUInt16LE(0x02),
                    defense: pkmdata.readUInt16LE(0x04),
                    speed: pkmdata.readUInt16LE(0x06),
                    special_attack: pkmdata.readUInt16LE(0x08),
                    special_defense: pkmdata.readUInt16LE(0x0A)
                },
                moves: [
                    Pokemon.Convert.MoveToRunStatus(this.rom.GetMove(pkmdata.readUInt16LE(0x0C)), pkmdata[0x24], ppUps % 4),
                    Pokemon.Convert.MoveToRunStatus(this.rom.GetMove(pkmdata.readUInt16LE(0x0E)), pkmdata[0x25], (ppUps >> 2) % 4),
                    Pokemon.Convert.MoveToRunStatus(this.rom.GetMove(pkmdata.readUInt16LE(0x10)), pkmdata[0x26], (ppUps >> 4) % 4),
                    Pokemon.Convert.MoveToRunStatus(this.rom.GetMove(pkmdata.readUInt16LE(0x12)), pkmdata[0x27], (ppUps >> 6) % 4),
                ].filter(m => m && m.id),
                ivs: {
                    hp: ivs % 32,
                    attack: (ivs >> 5) % 32,
                    defense: (ivs >> 10) % 32,
                    speed: (ivs >> 15) % 32,
                    special_attack: (ivs >> 20) % 32,
                    special_defense: (ivs >> 25) % 32
                },
                is_egg: (ivs >> 30) % 2 > 0,
                buffs: {
                    hp: pkmdata[0x18],
                    attack: pkmdata[0x19],
                    defense: pkmdata[0x1A],
                    speed: pkmdata[0x1B],
                    special_attack: pkmdata[0x1C],
                    special_defense: pkmdata[0x1D],
                    accuracy: pkmdata[0x1E],
                    evasion: pkmdata[0x1F],
                },
                ability: this.rom.GetAbility(pkmdata[0x20]),
                health: [pkmdata.readUInt16LE(0x28), pkmdata.readUInt16LE(0x2C)],
                level,
                friendship: pkmdata[0x2B],
                held_item: itemId ? Pokemon.Convert.ItemToRunStatus(this.rom.GetItem(itemId)) : null,
                name,
                original_trainer: {
                    name: this.rom.ConvertText(pkmdata.slice(0x3C, 0x44)),
                    id: pkmdata.readUInt16LE(0x54),
                    secret: pkmdata.readUInt16LE(0x56)
                },
                experience: this.CalculateExpVals(pkmdata.readUInt32LE(0x44), level, species.expFunction),
                personality_value: personalityValue,
                gender: this.CalculateGender(species.genderRatio, personalityValue),
                status: this.ParseStatus(pkmdata.readUInt32LE(0x4C)),
                volatile_status: this.ParseVolatileStatus(pkmdata.readUInt32LE(0x50))
            } as Gen3BattlePokemon;
        }

        protected ParseVolatileStatus(status: number) {
            return Object.keys(Gen3VolatileStatus).map(k => parseInt(k)).filter(k => k && (status & k)).map(k => Gen3VolatileStatus[k]);
        }

        protected CalculateGender(genderRatio: number, personalityValue: number) {
            if (genderRatio == 255) {
                return null;
            }
            else if (genderRatio == 254) {
                return "Female";
            }
            else if (genderRatio == 0) {
                return "Male";
            }
            else {
                return (personalityValue % 256) > genderRatio ? "Male" : "Female";
            }
        }

        protected Decrypt(data: Buffer, key: number, checksum?: number) {
            if (typeof (checksum) == "number" && checksum == this.CalcChecksum(data)) {
                return data; //already decrypted
            }
            for (let i = 0; i < data.length; i += 4) {
                data.writeInt32LE(data.readInt32LE(i) ^ key, i);
            }
            if (typeof (checksum) == "number" && this.CalcChecksum(data) != checksum) {
                console.error(`Checksum ${checksum} does not match calculated sum ${this.CalcChecksum(data)}`);
                return null;
            }
            return data;
        }

        protected OptionsSpec = {
            sound: {
                0: "Mono",
                0x10000: "Stereo"
            },
            battle_style: {
                0: "Shift",
                0x20000: "Set"
            },
            battle_scene: {
                0: "On",
                0x40000: "Off"
            },
            map_zoom: {
                0: "Full",
                0x80000: "Zoom"
            },
            text_speed: {
                0: "Slow",
                0x100: "Med",
                0x200: "Fast"
            },
            frame: {
                bitmask: 0xF800,
                offset: 1
            },
            button_mode: {
                0: "Normal",
                1: "LR",
                2: "L=A"
            },

        }
    }
}