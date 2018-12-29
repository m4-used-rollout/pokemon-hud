/// <reference path="base.ts" />

namespace RamReader {

    interface Gen3PartyPokemon extends TPP.PartyPokemon, TPP.BoxedPokemon {
        encryption_key?: number;
        checksum?: number;
        species: Pokemon.Convert.StatSpeciesWithExp;
    }

    interface Gen3BattlePokemon extends Gen3PartyPokemon {
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
    const FlagsBytes = 0x12C
    const VarsOffset = 0x139C;
    const GameStatsOffset = 0x159C;
    const GameStatsBytes = 64 * 4;
    const DaycareOffset = 0x3030;
    const InventoryOffset = 0x490;
    const IwramClockAddr = 0x5CF8;
    const IwramMusicAddr = 0x0F48;
    const CurrentAreaAddr = 0x0203732C;
    const BattleFlagsAddr = 0x02022FEC;
    const EnemyTrainersAddr = 0x02038BCA;
    const EnemyPartyAddr = 0x02024744;
    const gBattlersCount = 0x0202406c;
    const gBattlerPartyIndexes = 0x0202406e;
    const gBattlerPositions = 0x02024076;
    const gBattleMons = 0x02024084;
    const gBattleMonsBytes = 0x58 * 4;
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

        public ReadBattle = this.CachedEmulatorCaller(`ReadByteRange/${InBattleAddr}/1/${BattleFlagsAddr.toString(16)}/4/${EnemyTrainersAddr.toString(16)}/4/${EnemyPartyAddr.toString(16)}/${PartyBytes.toString(16)}/${gBattleMons.toString(16)}/${gBattleMonsBytes.toString(16)}/${gBattlersCount.toString(16)}/${((gBattlerPositions - gBattlersCount) + 4).toString(16)}`, this.WrapBytes<TPP.BattleStatus>(data => {
            const in_battle = (data.readUInt8(0) & 2) > 0;
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
                const numBattlers = data.readUInt8(9 + PartyBytes + gBattleMonsBytes);
                const isBattlerOnEnemyTeam = new Array<boolean>();
                const battlerPartyIndexes = new Array<number>();
                for (let i = 0; i < numBattlers; i++) {
                    battlerPartyIndexes.push(data.readUInt16LE(11 + PartyBytes + gBattleMonsBytes + (i * 2)));
                    isBattlerOnEnemyTeam.push(!!(data.readUInt8(19 + PartyBytes + gBattleMonsBytes + i) & 1));
                    // B_POSITION_PLAYER_LEFT        0
                    // B_POSITION_OPPONENT_LEFT      1
                    // B_POSITION_PLAYER_RIGHT       2
                    // B_POSITION_OPPONENT_RIGHT     3
                }
                this.StoreCurrentBattleMons(this.ParseBattleMons(data.slice(9 + PartyBytes), numBattlers), battlerPartyIndexes, isBattlerOnEnemyTeam);
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
                    gender: data.readUInt8(8) ? "Female" : "Male",
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
                map_bank: data.readUInt8(4),
                map_id: data.readUInt8(5),
                area_id: data.readUInt8(6),
                map_name: this.rom.GetMap(data.readUInt8(5), data.readUInt8(4)).name,
                area_name: this.rom.GetAreaName(data.readUInt8(6))
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
                        balls: ballPocket,
                        tms: this.ParseItemCollection(data.slice(0x200), 64, halfKey),
                        berries: this.ParseItemCollection(data.slice(0x300), 46, halfKey)
                    },
                    ball_count: ballPocket.reduce((sum, b) => sum + b.count, 0)
                } as TPP.TrainerData
            })),
            //Flags/Vars/Stats
            this.CachedEmulatorCaller<TPP.TrainerData>(`ReadByteRange/*${SaveBlock1Pointer.toString(16)}+${FlagsOffset.toString(16)}/${(GameStatsOffset - FlagsOffset + GameStatsBytes).toString(16)}/*${SaveBlock2Pointer.toString(16)}+AC/4`, this.WrapBytes(data => {
                const key = data.readUInt32LE(GameStatsOffset - FlagsOffset + GameStatsBytes);
                const flags = data.slice(0, FlagsBytes);
                const vars = this.rom.ReadStridedData(data.slice(VarsOffset - FlagsOffset), 0, 2, 256).map(v => v.readUInt16LE(0));
                const stats = this.rom.ReadStridedData(data.slice(GameStatsOffset - FlagsOffset), 0, 4, 64).map(s => s.readUInt32LE(0) ^ key);
                return {
                    badges: (flags.readUInt16LE(0x10C) >>> 7) % 0x100,
                    trick_house: vars.slice(0xAB, 0xB3).map(v => ["Incomplete", "Found Scroll", "Complete"][v]),
                    game_stats: this.ParseGameStats(stats)
                } as TPP.Goals
            }), 760, 1668), //ignore a large swath in the middle of vars/stats because it changes every step
            //Clock
            this.CachedEmulatorCaller<TPP.TrainerData>(`IWRAM/ReadU16BE/${IwramClockAddr.toString(16)}+2`, this.WrapBytes(data => ({
                time: {
                    h: data.readUInt8(0),
                    m: data.readUInt8(1)
                }
            } as TPP.TrainerData))),
            //Evolution
            this.CachedEmulatorCaller<TPP.TrainerData>(`IWRAM/ReadU16BE/${IwramMusicAddr.toString(16)}`, this.WrapBytes(data => ({
                evolution_is_happening: data.readUInt16LE(0) == 0x179
            } as TPP.TrainerData))),
            //Daycare
            this.CachedEmulatorCaller<TPP.TrainerData>(`ReadByteRange/*${SaveBlock1Pointer.toString(16)}+${DaycareOffset.toString(16)}/88/*${SaveBlock1Pointer.toString(16)}+${DaycareOffset.toString(16)}+8C/88`, this.WrapBytes(data => ({
                daycare: [
                    this.ParsePokemon(data.slice(0, 80)),
                    this.ParsePokemon(data.slice(0x88, 0x88 + 80))
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

        protected ParseBattleMons(battleData: Buffer, numBattlers: number) {
            const battleMons = new Array<TPP.PartyPokemon>();
            const battleBytes = 0x58 * numBattlers;
            for (let i = 0; i < battleBytes; i += 0x58) {
                battleMons.push(this.ParseBattlePokemon(battleData.slice(i, i + 0x58)));
            }
            return battleMons;
        }

        protected ParsePokemon(pkmdata: Buffer, boxSlot?: number): TPP.PartyPokemon & TPP.BoxedPokemon {
            const pkmn = {} as Gen3PartyPokemon;
            pkmn.personality_value = pkmdata.readUInt32LE(0);
            pkmn.encryption_key = pkmn.personality_value ^ pkmdata.readUInt32LE(4);
            if (!pkmdata.readUInt32LE(4) && !pkmn.personality_value)
                return null;
            pkmn.original_trainer = {
                name: this.rom.ConvertText(pkmdata.slice(20, 20 + 7)),
                id: pkmdata.readUInt16LE(4),
                secret: pkmdata.readUInt16LE(6)
            }
            pkmn.name = this.rom.ConvertText(pkmdata.slice(8, 8 + 10));
            pkmn.language = Gen3Language[pkmdata.readUInt8(18)] || pkmdata.readUInt16LE(18).toString();
            pkmn.marking = this.ParseMarkings(pkmdata.readUInt8(27));
            pkmn.checksum = pkmdata.readUInt16LE(28);
            pkmn.shiny = this.CalculateShiny(pkmn);
            const sections = this.Descramble(this.Decrypt(pkmdata.slice(32, 80), pkmn.encryption_key, pkmn.checksum), pkmn.personality_value);
            if (!sections) {
                return null;
            }

            //Growth Section
            pkmn.species = Pokemon.Convert.SpeciesToRunStatus(this.rom.GetSpecies(sections.A.readUInt16LE(0)));
            const itemId = sections.A.readUInt16LE(2);
            pkmn.held_item = itemId ? Pokemon.Convert.ItemToRunStatus(this.rom.GetItem(itemId)) : null;
            const exp = sections.A.readUInt32LE(4);
            const ppUps = sections.A.readUInt8(8);
            pkmn.friendship = sections.A.readUInt8(9);

            //Moves
            pkmn.moves = [
                Pokemon.Convert.MoveToRunStatus(this.rom.GetMove(sections.B.readUInt16LE(0)), sections.B.readUInt8(8), ppUps % 4),
                Pokemon.Convert.MoveToRunStatus(this.rom.GetMove(sections.B.readUInt16LE(2)), sections.B.readUInt8(9), (ppUps >>> 2) % 4),
                Pokemon.Convert.MoveToRunStatus(this.rom.GetMove(sections.B.readUInt16LE(4)), sections.B.readUInt8(10), (ppUps >>> 4) % 4),
                Pokemon.Convert.MoveToRunStatus(this.rom.GetMove(sections.B.readUInt16LE(6)), sections.B.readUInt8(11), (ppUps >>> 6) % 4),
            ].filter(m => m && m.id);

            //EVs & Condition
            pkmn.evs = {
                hp: sections.C.readUInt8(0),
                attack: sections.C.readUInt8(1),
                defense: sections.C.readUInt8(2),
                speed: sections.C.readUInt8(3),
                special_attack: sections.C.readUInt8(4),
                special_defense: sections.C.readUInt8(5),
            }
            pkmn.condition = {
                coolness: sections.C.readUInt8(6),
                beauty: sections.C.readUInt8(7),
                cuteness: sections.C.readUInt8(8),
                smartness: sections.C.readUInt8(9),
                toughness: sections.C.readUInt8(10),
                feel: sections.C.readUInt8(11)
            }

            //Miscellaneous
            pkmn.pokerus = this.ParsePokerus(sections.D.readUInt8(0));
            const met = sections.D.readUInt16LE(2);
            const metMap = this.rom.GetMap(sections.D.readUInt8(1));
            pkmn.met = {
                map_id: metMap.id,
                area_id: metMap.areaId,
                area_name: metMap.areaName,
                level: met % 128,
                game: ((met >>> 7) % 16).toString(),
                caught_in: this.rom.GetItem(this.rom.MapCaughtBallId((met >>> 11) % 16)).name
            }
            pkmn.original_trainer.gender = this.ParseGender(met >>> 15);
            const ivs = sections.D.readUInt32LE(4);
            pkmn.ivs = {
                hp: ivs % 32,
                attack: (ivs >>> 5) % 32,
                defense: (ivs >>> 10) % 32,
                speed: (ivs >>> 15) % 32,
                special_attack: (ivs >>> 20) % 32,
                special_defense: (ivs >>> 25) % 32
            }
            pkmn.is_egg = (ivs >>> 30) % 2 > 0;
            pkmn.ability = pkmn.species.abilities[ivs >>> 31] || (ivs >>> 31).toString();
            const ribbons = sections.D.readUInt32LE(8);
            pkmn.ribbons = this.ParseHoennRibbons(ribbons);
            //pkmn.fateful_encounter = (ribbons >>> 27) % 16;
            //pkmn.obedient = ribbons >>> 31;

            if (pkmdata.length > 80) {
                const status = pkmdata.readUInt32LE(80);
                pkmn.status = this.ParseStatus(status);
                pkmn.sleep_turns = status % 8
                pkmn.level = pkmdata.readUInt8(84);
                pkmn.pokerus_remaining = pkmdata.readUInt8(85);
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
            const level = pkmdata.readUInt8(0x2A);
            const itemId = pkmdata.readUInt16LE(0x2E);
            const ppUps = pkmdata.readUInt8(0x3B);
            const personalityValue = pkmdata.readUInt32LE(0x48);
            let name = this.rom.ConvertText(pkmdata.slice(0x30, 0x3C));
            if (name.toLowerCase() == species.name.toLowerCase())
                name = species.name;
            return {
                species: Object.assign(Pokemon.Convert.SpeciesToRunStatus(species), { type1: this.rom.GetType(pkmdata.readUInt8(0x21)), type2: this.rom.GetType(pkmdata.readUInt8(0x22)) }),
                stats: {
                    hp: pkmdata.readUInt16LE(0x2C),
                    attack: pkmdata.readUInt16LE(0x02),
                    defense: pkmdata.readUInt16LE(0x04),
                    speed: pkmdata.readUInt16LE(0x06),
                    special_attack: pkmdata.readUInt16LE(0x08),
                    special_defense: pkmdata.readUInt16LE(0x0A)
                },
                moves: [
                    Pokemon.Convert.MoveToRunStatus(this.rom.GetMove(pkmdata.readUInt16LE(0x0C)), pkmdata.readUInt8(0x24), ppUps % 4),
                    Pokemon.Convert.MoveToRunStatus(this.rom.GetMove(pkmdata.readUInt16LE(0x0E)), pkmdata.readUInt8(0x25), (ppUps >> 2) % 4),
                    Pokemon.Convert.MoveToRunStatus(this.rom.GetMove(pkmdata.readUInt16LE(0x10)), pkmdata.readUInt8(0x26), (ppUps >> 4) % 4),
                    Pokemon.Convert.MoveToRunStatus(this.rom.GetMove(pkmdata.readUInt16LE(0x12)), pkmdata.readUInt8(0x27), (ppUps >> 6) % 4),
                ].filter(m => m && m.id),
                ivs: {
                    hp: ivs % 32,
                    attack: (ivs >>> 5) % 32,
                    defense: (ivs >>> 10) % 32,
                    speed: (ivs >>> 15) % 32,
                    special_attack: (ivs >>> 20) % 32,
                    special_defense: (ivs >>> 25) % 32
                },
                is_egg: (ivs >>> 30) % 2 > 0,
                buffs: {
                    hp: pkmdata.readUInt8(0x18),
                    attack: pkmdata.readUInt8(0x19),
                    defense: pkmdata.readUInt8(0x1A),
                    speed: pkmdata.readUInt8(0x1B),
                    special_attack: pkmdata.readUInt8(0x1C),
                    special_defense: pkmdata.readUInt8(0x1D),
                    accuracy: pkmdata.readUInt8(0x1E),
                    evasion: pkmdata.readUInt8(0x1F),
                },
                ability: this.rom.GetAbility(pkmdata.readUInt8(0x20)),
                health: [pkmdata.readUInt16LE(0x28), pkmdata.readUInt16LE(0x2C)],
                //level,
                friendship: pkmdata.readUInt8(0x2B),
                held_item: itemId ? Pokemon.Convert.ItemToRunStatus(this.rom.GetItem(itemId)) : null,
                name,
                original_trainer: {
                    name: this.rom.ConvertText(pkmdata.slice(0x3C, 0x44)),
                    id: pkmdata.readUInt16LE(0x54),
                    secret: pkmdata.readUInt16LE(0x56)
                },
                //experience: this.CalculateExpVals(pkmdata.readUInt32LE(0x44), level, species.expFunction), //seems to not always update
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

        private GameStatsMapping = ["games_saved", "first_hof_play_time", "started_trends", "planted_berries", "traded_bikes",
            "steps", "got_interviewed", "total_battles", "wild_battles", "trainer_battles", "hof_entries",
            "pokemon_captures", "fishing_captures", "eggs_hatched", "pokemon_evolved", "pokecenter_used", "rested_at_home",
            "entered_safari_zone", "trees_cut", "rocks_smashed", "secret_bases_moved", "pokemon_trades",
            null, "link_battles_won", "link_battles_lost", "link_battles_tied", "splash_used", "struggle_used",
            "slots_jackpots", "consecutive_roulette_wins", "entered_battle_tower", null, "best_battle_tower_streak",
            "pokeblocks_made", "pokeblocks_made_with_friends", "link_contests_won", "contests_entered", "contests_won",
            "shopping_trips", "itemfinder_uses", "got_rained_on", "checked_pokedex", "ribbons_earned", "ledges_jumped",
            "tvs_watched", "clocks_checked", "lottery_wins", "daycare_uses", "cable_car_rides", "hot_spring_baths_taken", null, null];

        protected ParseGameStats(statArr: number[]) {
            const stats: { [key: string]: number } = {};
            statArr.forEach((stat, i) => this.GameStatsMapping[i] && (stats[this.GameStatsMapping[i]] = stat));
            return stats;
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