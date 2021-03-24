/// <reference path="./dwbase.ts" />
/// <reference path="../rom-reading/romreaders/concrete/xd.ts" />

namespace RamReader {

    export interface XDRAMShadowData {
        snagged: boolean;
        purified: boolean;
        shadowExp: number;
        speciesId: number;
        pId: number;
        purification: number;
    }

    export class XD extends DolphinWatchBase<RomReader.XD> {
        protected partyOffset = 0x140 + 0x30;
        protected partySize = 0x750;
        protected partyPokeBytes = 0xC4;
        protected trainerDataOffset = 0x140;
        protected trainerDataSize = 0x8EC;
        protected pokedexOffset = 0xC870;
        protected pokedexSize = 0x1774;
        protected pcOffset = 0xAD0;
        protected pcSize = 0xB860;
        protected pcBoxes = 8;
        protected pcBoxBytes = 0x170C;
        protected bagSize = 0x328 + 0xF0;
        protected itemPCSize = 0x3AC;
        protected daycareOffset = 0xC790;
        protected battlePartyPokeBytes = 0xC4;
        protected enemyTrainerBytes = 0x1A;
        protected shadowDataOffset = 0xE380;
        protected shadowEntryBytes = 0x48;
        protected shadowEntries = 128;
        protected purificationChamberOffset = 0x1D690;
        protected purificationChamberSize = 0x2298;

        protected battlePartyAddress = null;
        protected enemyTrainerAddress = null;
        protected enemyPartyAddress = null;
        protected baseAddrPtr = 0x804EB6F8;
        protected battleAddress = 0x804A1740;
        protected battleTrainersOffset = 0x68;
        protected battleTrainerBytes = 0x6EF0;
        protected battleBagAddress = this.battleAddress + this.battleTrainersOffset + 0x4 + 0x4C8;
        // protected battleStructBytes = 0x1BC28;
        protected musicIdAddress = 0x8044707A;
        protected musicIdBytes = 2;
        protected mapIdAddress = 0x80446f32;

        protected fsysStartAddress = null;
        protected fsysSlots = 16;
        protected fsysStructBytes = 0x40;

        protected purifierAddr: number;
        protected shadowAddr: number;


        protected BaseAddrSubscriptions(baseSub: (oldAddr: number, offset: number, size: number, handler: (data: Buffer) => void) => number) {
            this.shadowDataOffset && (this.shadowAddr = baseSub(this.shadowAddr, this.shadowDataOffset, this.shadowEntryBytes * this.shadowEntries, this.ReadShadowData));

            super.BaseAddrSubscriptions(baseSub);

            this.purificationChamberOffset && (this.purifierAddr = baseSub(this.purifierAddr, this.purificationChamberOffset, this.purificationChamberSize, this.ReadPurifierData));
        }

        protected AdditionalSubscriptions() {
            if (this.battleAddress) {
                this.Subscribe(this.battleAddress, this.battleTrainersOffset, this.SendBattle);
                for (let i = 1; i >= 0; i--)
                    this.Subscribe(this.battleAddress + this.battleTrainersOffset + (this.battleTrainerBytes * i), this.battleTrainerBytes, this.BattleTrainerReader(i));
            }
            this.mapIdAddress && this.Subscribe(this.mapIdAddress, 4, this.SendMap);
        }

        protected ParseOrreRibbons(ribbonVal: number, ribbonCounts: number[]) {
            return [
                this.ParseRibbon(ribbonCounts[0], "Cool"),
                this.ParseRibbon(ribbonCounts[1], "Beauty"),
                this.ParseRibbon(ribbonCounts[2], "Cute"),
                this.ParseRibbon(ribbonCounts[3], "Smart"),
                this.ParseRibbon(ribbonCounts[4], "Tough"),
                this.ParseRibbon((ribbonVal >>> 0x0) % 2, "Champion"),
                this.ParseRibbon((ribbonVal >>> 0x1) % 2, "Winning"),
                this.ParseRibbon((ribbonVal >>> 0x2) % 2, "Victory"),
                this.ParseRibbon((ribbonVal >>> 0x3) % 2, "Artist"),
                this.ParseRibbon((ribbonVal >>> 0x4) % 2, "Effort"),
                this.ParseRibbon((ribbonVal >>> 0x5) % 2, "Champion Battle"),
                this.ParseRibbon((ribbonVal >>> 0x6) % 2, "Regional Champion"),
                this.ParseRibbon((ribbonVal >>> 0x7) % 2, "National Champion"),
                this.ParseRibbon((ribbonVal >>> 0x8) % 2, "Country"),
                this.ParseRibbon((ribbonVal >>> 0x9) % 2, "National"),
                this.ParseRibbon((ribbonVal >>> 0xA) % 2, "Earth"),
                this.ParseRibbon((ribbonVal >>> 0xB) % 2, "World"),
            ].filter(r => !!r);
        }

        protected ParsePokemon = (monData: Buffer) => monData.readUInt16BE(0x0) > 0 ? this.AugmentShadowMon(<TPP.ShadowPokemon>{
            species: Pokemon.Convert.SpeciesToRunStatus(this.rom.GetSpecies(monData.readUInt16BE(0x0))),
            held_item: monData.readUInt16BE(0x2) > 0 ? Pokemon.Convert.ItemToRunStatus(this.rom.GetItem(monData.readUInt16BE(0x2))) : null,
            health: [monData.readUInt16BE(0x4), monData.readUInt16BE(0x90)],
            friendship: monData.readUInt16BE(0x6),
            met: {
                area_id: monData.readUInt16BE(0x8),
                level: monData[0xE],
                caught_in: this.rom.GetItem(monData[0xF]).name,
                game: this.Game[monData[0x34]]
            },
            level: monData[0x11],
            pokerus: this.ParsePokerus(monData[0x13]),
            marking: this.ParseMarkings(monData[0x14]),
            pokerus_remaining: monData.readInt8(0x15),
            status: this.Status[monData[0x16]],
            //tox_turns: monData.readInt8(0x17),
            sleep_turns: monData.readInt8(0x18),
            ability: (this.rom.GetSpecies(monData.readUInt16BE(0x0)) || { abilities: [] }).abilities[(monData[0x1D] >> 6) & 1] || (this.rom.GetSpecies(monData.readUInt16BE(0x0)) || { abilities: [] }).abilities[0],
            //is_egg: (monData[0x1D] & 1) == 1,
            experience: {
                current: monData.readUInt32BE(0x20)
            },
            original_trainer: {
                gender: this.ParseGender(monData[0x10]),
                secret: monData.readUInt16BE(0x24),
                id: monData.readUInt16BE(0x26),
                name: this.rom.ReadString(monData.slice(0x38))
            },
            personality_value: monData.readUInt32BE(0x28),
            //fateful_encounter: monData[0x30] > 0,
            name: this.rom.ReadString(monData.slice(0x4E)) || this.rom.ReadString(monData.slice(0x64)),
            ribbons: this.ParseOrreRibbons(monData.readUInt16BE(0x7C), [monData[0xB3], monData[0xB4], monData[0xB5], monData[0xB6], monData[0xB7]]),
            moves: [
                this.ParseMove(monData.slice(0x80)),
                this.ParseMove(monData.slice(0x84)),
                this.ParseMove(monData.slice(0x88)),
                this.ParseMove(monData.slice(0x8C))
            ].filter(m => !!(m && m.id)),
            stats: {
                hp: monData.readUInt16BE(0x90),
                attack: monData.readUInt16BE(0x92),
                defense: monData.readUInt16BE(0x94),
                special_attack: monData.readUInt16BE(0x96),
                special_defense: monData.readUInt16BE(0x98),
                speed: monData.readUInt16BE(0x9A)
            },
            evs: {
                hp: monData.readUInt16BE(0x9C),
                attack: monData.readUInt16BE(0x9E),
                defense: monData.readUInt16BE(0xA0),
                special_attack: monData.readUInt16BE(0xA2),
                special_defense: monData.readUInt16BE(0xA4),
                speed: monData.readUInt16BE(0xA6)
            },
            ivs: {
                hp: monData[0xA8],
                attack: monData[0xA9],
                defense: monData[0xAA],
                special_attack: monData[0xAB],
                special_defense: monData[0xAC],
                speed: monData[0xAD]
            },
            condition: {
                coolness: monData[0xAE],
                beauty: monData[0xAF],
                cuteness: monData[0xB0],
                smartness: monData[0xB1],
                toughness: monData[0xB2],
                feel: monData[0x12]
            },
            shadow_id: monData.readUInt16BE(0xBA),
            is_shadow: monData.readUInt16BE(0xBA) > 0
        }) : null;

        public ReadBag = (data: Buffer) => (<{ [key: string]: TPP.Item[] }>{
            items: this.ReadPocket(data.slice(0x0, 0x78)),
            key: this.ReadPocket(data.slice(0x78, 0x124)),
            balls: this.ReadPocket(data.slice(0x124, 0x164)),
            tms: this.ReadPocket(data.slice(0x164, 0x264)),
            berries: this.ReadPocket(data.slice(0x264, 0x31C)),
            cologne: this.ReadPocket(data.slice(0x31C, 0x328)),
            battleCDs: this.ReadPocket(data.slice(0x328, 0x328 + 0xF0))
        });

        public ReadTrainer = (data?: Buffer) => new Promise<TPP.TrainerData>(resolve => resolve({
            name: this.rom.ReadString(data),
            secret: data.readUInt16BE(0x2C),
            id: data.readUInt16BE(0x2E),
            items: this.ReadBag(data.slice(0x4C8)),
            gender: this.ParseGender(data[0x8E0]),
            money: data.readUInt32BE(0x8E4),
            coins: data.readUInt32BE(0x8E8)
        } as TPP.TrainerData));

        private currentBattle: RomReader.XDBattle;
        private currentEnemyTrainers: TPP.EnemyTrainer[];
        private currentEnemyParty: TPP.EnemyParty;

        public ReadBattle = async (data?: Buffer) => {
            const battleId = data.readUInt16BE(2);
            this.currentBattle = this.rom.GetBattle(battleId);
            return (<Partial<TPP.BattleStatus> & { battle_id: number; battle_type: string; }>{
                in_battle: battleId > 0 && !!this.currentBattle,
                battle_kind: this.currentBattle && ((
                    this.currentBattle.battleType == RomReader.XDBattleType.WildBattle ||
                    this.currentBattle.battleType == RomReader.XDBattleType.BattleBingo
                ) ? "Wild" : "Trainer"),
                battle_id: battleId,
                party_is_rental: this.currentBattle.battleType == RomReader.XDBattleType.BattleTraining,
                battle_type: this.currentBattle.battleTypeStr
            } as TPP.BattleStatus);
        };

        public BattleTrainerReader(slot: number) {
            return (data: Buffer) => {
                const trainerId = data.readUInt16BE(0);
                const battle = this.currentBattle || this.rom.GetBattle(0);
                if (!trainerId && !(slot == 1 && this.currentState.battle_kind == "Wild"))
                    return;
                const trainer = this.rom.GetTrainerByBattle(data.readUInt16BE(0), slot, this.currentBattle.id);
                const party = this.rom.ReadArray(data.slice(0x97C + 4), 0, 0x300, 6).map(this.ParsePokemon).filter(p => !!p);
                (party as TPP.EnemyParty).filter((p, i) => !!p && i < battle.battleStyle).forEach(p => p.active = true);

                if (slot == 0) {
                    this.currentState.battle_party = party;
                }
                else {
                    if (this.currentState.battle_kind != "Wild") {
                        this.currentEnemyTrainers = this.currentEnemyTrainers || [];
                        this.currentEnemyTrainers[slot] = Pokemon.Convert.EnemyTrainerToRunStatus(trainer);
                        this.currentState.enemy_trainers = this.currentEnemyTrainers.filter(t => !!t && t.pic_id != 10);
                    }
                    while (party.length < battle.partySize)
                        party.push(null);
                    this.currentEnemyParty = this.currentEnemyParty || [];
                    this.currentEnemyParty.splice((slot - 1) * battle.partySize, battle.partySize, ...this.ConcealEnemyParty(party));
                    this.currentState.enemy_party = this.currentEnemyParty.filter(p => !!p);
                }
                this.currentState.in_battle = true;
                this.transmitState();
            };
        }

        public SendBattle = (data: Buffer) => this.ReadBattle(data).then(battle => {
            this.currentState.battle_id = battle.battle_id;
            this.currentState.battle_kind = battle.battle_kind;
            this.currentState.in_battle = battle.in_battle;
            this.currentState.battle_party = this.currentState.battle_party || [];
            this.currentState.enemy_party = this.currentState.enemy_party || [];
            this.currentState.enemy_trainers = this.currentState.enemy_trainers || [];
            this.transmitState();
        });

        private shadowData: XDRAMShadowData[];

        public ReadShadowData = (data: Buffer) => this.shadowData = this.rom.ReadArray(data, 0, 0x48, this.rom.shadowData.length).map(sData => (<XDRAMShadowData>{
            snagged: (sData[0] >>> 6 & 1) > 0,
            purified: (sData[0] >>> 7 & 1) > 0,
            shadowExp: sData.readUInt32BE(4),
            speciesId: sData.readUInt16BE(0x1A),
            pId: sData.readUInt16BE(0x1C),
            purification: sData.readInt32BE(0x24)
        }));

        protected AugmentShadowMon(mon: TPP.ShadowPokemon) {
            if (mon.shadow_id && this.shadowData) {
                const shadow = this.shadowData[mon.shadow_id];
                if (shadow) {
                    mon.shadow_exp = shadow.shadowExp;
                    mon.purification = { current: shadow.purified ? -100 : shadow.purification, initial: -100 };
                    mon["Shadow Species"] = shadow.speciesId;
                    mon["Shadow Data"] = shadow["data"];
                }
                else {
                    console.error(`Unable to find shadow #${mon.shadow_id} in RAM (only ${this.shadowData.length} found)`);
                }
            }
            return super.AugmentShadowMon(mon);
        }

        public ReadPurifierData = (data: Buffer) => {
            this.currentPC = this.currentPC || [];
            this.currentState.pc = this.currentState.pc || { boxes: [], current_box_number: 0 };

            this.rom.ReadArray(data, 0, 0x3D8, 9).map((pData, i) => (<TPP.BoxData>{
                box_name: `Purification Chamber ${i + 1}`,
                box_number: this.pcBoxes + 1 + i,
                box_contents: this.rom.ReadArray(pData, 0, this.partyPokeBytes, 5).map((p, i) => Object.assign(this.ParsePokemon(p) || {}, { box_slot: i + 1 }) as TPP.PartyPokemon & TPP.BoxedPokemon).filter(p => !!p && !!p.species)
            })).forEach(pc => this.currentPC[pc.box_number] = pc);

            this.currentState.pc.boxes = this.currentPC.filter(b => !!b);
            this.transmitState();
        };
    }
}
