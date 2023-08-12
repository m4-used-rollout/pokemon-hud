/// <reference path="base.ts" />

namespace RamReader {

    const NAME_LENGTH = 11;
    const ITEM_NAME_LENGTH = 13;
    const MONS_PER_BOX = 20;
    const NUM_BOXES = 12;
    const NUM_POKEMON = 151;
    const BAG_ITEM_CAPACITY = 20;
    const PC_ITEM_CAPACITY = 50;
    const DEX_FLAG_BYTES = Math.floor((NUM_POKEMON + 7) / 8);

    interface Gen1BoxedMon extends TPP.Pokemon {
        health: number[];
        status: string;
        sleep_turns?: number;
    }

    export class Gen1 extends RamReaderBase<RomReader.Gen1> {
        protected SymAddr = (symbol: string) => this.rom.symTable[symbol].toString(16);

        protected PCBoxSize = () => this.rom.symTable['wBoxDataEnd'] - this.rom.symTable['wBoxDataStart'];
        protected PartySize = () => this.rom.symTable['wPartyDataEnd'] - this.rom.symTable['wPartyDataStart'];
        protected PartyMonSize = () => this.rom.symTable['wPartyMon2'] - this.rom.symTable['wPartyMon1'];
        protected BattleMonSize = () => this.rom.symTable['wTrainerClass'] - this.rom.symTable['wBattleMonNick'];

        public ReadParty = this.CachedEmulatorCaller(`WRAM/ReadByteRange/${this.SymAddr('wPartyDataStart')}/${this.PartySize().toString(16)}/${this.SymAddr('wIsInBattle')}/1/${this.SymAddr('wPlayerMonNumber')}/1/${this.SymAddr('wBattleMonNick')}/${this.BattleMonSize().toString(16)}`, this.WrapBytes(data => this.ParseParty(data)));
        public ReadPC = this.CachedEmulatorCaller([`WRAM/ReadByteRange/${this.SymAddr('wCurrentBoxNum')}/1/${this.SymAddr('wBoxDataStart')}/${this.PCBoxSize().toString(16)}`, `CartRAM/ReadByteRange/${this.SymAddr('sBox1')}/${(this.PCBoxSize() * 6).toString(16)}/${this.SymAddr('sBox7')}/${(this.PCBoxSize() * 6).toString(16)}`], this.WrapBytes(data => this.ParsePC(data)));
        public ReadBattle = this.CachedEmulatorCaller(`WRAM/ReadByteRange/${this.SymAddr('wIsInBattle')}/1/${this.SymAddr('wEnemyMonActualCatchRate')}/1/${this.SymAddr('wTrainerClass')}/1/${this.SymAddr('wTrainerNo')}/1/${this.SymAddr('wTrainerName')}/${NAME_LENGTH.toString(16)}/${this.SymAddr('wEnemyPartyCount')}/${this.PartySize().toString(16)}/${this.SymAddr('wIsInBattle')}/1/${this.SymAddr('wEnemyMonPartyPos')}/1/${this.SymAddr('wEnemyMonNick')}/${this.BattleMonSize().toString(16)}`, this.WrapBytes(data => this.ParseBattleBundle(data)));
        protected TrainerChunkReaders = [
            this.StructEmulatorCaller<TPP.TrainerData>('WRAM', {
                wPlayerName: NAME_LENGTH,
                wPlayerID: 2,
                wOptions: 1,
                wPokedexOwned: DEX_FLAG_BYTES,
                wPokedexSeen: DEX_FLAG_BYTES,
                wXCoord: 1,
                wYCoord: 1,
                wCurMap: 1,
                wNumBagItems: 1,
                wBagItems: BAG_ITEM_CAPACITY * 2,
                wPlayerMoney: 3,
                wPlayerCoins: 2,
                wRivalName: NAME_LENGTH,
                wObtainedBadges: 1,
                wNumBoxItems: 1,
                wPikachuHappiness: 1,
                wBoxItems: PC_ITEM_CAPACITY * 2,
                wDayCareInUse: 1,
                wDayCareMonName: NAME_LENGTH,
                wDayCareMonOT: NAME_LENGTH,
                wDayCareMon: this.rom.symTable['wMainDataEnd'] - this.rom.symTable['wDayCareMon']
            }, sym => this.rom.symTable[sym], struct => {
                const options = this.ParseOptions(struct.wOptions[0]);
                if (this.ShouldForceOptions(options)) {
                    this.CallEmulator(`WRAM/WriteByte/${this.SymAddr('wOptions')}/${this.SetOptions(struct.wOptions[0], this.config.forceOptions).toString(16)}`);
                }
                return {
                    name: this.rom.ConvertText(struct.wPlayerName),
                    id: struct.wPlayerID.readUInt16BE(0),
                    options,
                    caught_list: this.GetSetFlags(struct.wPokedexOwned),
                    seen_list: this.GetSetFlags(struct.wPokedexSeen),
                    caught: this.GetSetFlags(struct.wPokedexOwned).length,
                    seen: this.GetSetFlags(struct.wPokedexSeen).length,
                    x: struct.wXCoord[0],
                    y: struct.wYCoord[0],
                    map_id: struct.wCurMap[0],
                    map_name: this.rom.GetMap(struct.wCurMap[0]).name,
                    map_bank: null,
                    area_id: null,
                    area_name: null,
                    money: parseInt(struct.wPlayerMoney.toString('hex')),
                    coins: parseInt(struct.wPlayerCoins.toString('hex')),
                    rival_name: this.rom.ConvertText(struct.wRivalName),
                    evolution_is_happening: false,
                    pikachu_happiness: (struct.wPikachuHappiness || [])[0],
                    badges: struct.wObtainedBadges[0],
                    items: {
                        items: this.rom.ReadArray(struct.wBagItems, 0, 2, struct.wNumBagItems[0]).map(data => Pokemon.Convert.ItemToRunStatus(this.rom.GetItem(data[0]), data[1])),
                        pc: this.rom.ReadArray(struct.wBoxItems, 0, 2, struct.wNumBoxItems[0]).map(data => Pokemon.Convert.ItemToRunStatus(this.rom.GetItem(data[0]), data[1]))
                    },
                    daycare: struct.wDayCareInUse[0] > 0 ? [this.ParsePokemon(struct.wDayCareMon, struct.wDayCareMon[0], struct.wDayCareMonName, struct.wDayCareMonOT)] : []
                };
            }),
        ];

        protected OptionsSpec = {
            text_speed: {
                1: "Fast",
                3: "Med",
                5: "Slow"

                //Cramorant
                // 1: "Inst",
                // 3: "Fast",
                // 5: "Mid"
            },
            battle_style: {
                0: "Shift",
                0x40: "Set"
            },
            battle_scene: {
                0: "On",
                0x80: "Off"
            },
            //Yellow
            sound: {
                0:"Mono",
                0x10: "Earphone 1",
                0x20: "Earphone 2",
                0x30: "Earphone 3"
            }
        }
        protected BaseOffsetCalc = (baseSymbol: string, extraOffset = 0) => ((symbol: string) => (this.rom.symTable[baseSymbol + symbol] - this.rom.symTable[baseSymbol]) + extraOffset);

        protected ParseBattleBundle(data: Buffer): TPP.BattleStatus {
            //wIsInBattle/1
            const in_battle = data[0] > 0;
            const battle_kind = data[0] < 2 ? "Wild" : "Trainer";
            //wEnemyMonActualCatchRate/1
            const actualCatchRate = data.readUInt8(1);
            if (in_battle) {
                const enemy_trainers = new Array<TPP.EnemyTrainer>();
                if (battle_kind == "Trainer") {
                    //wTrainerClass/1
                    const trainerClass = data.readUInt8(2);
                    //wTrainerNo/1
                    const trainerNum = data.readUInt8(3);
                    const trainer = Pokemon.Convert.EnemyTrainerToRunStatus(this.rom.GetTrainer(trainerNum, trainerClass));
                    //wTrainerName/NAME_LENGTH
                    trainer.name = this.rom.ConvertText(data.slice(4, 4 + NAME_LENGTH));
                    if (/Rival\d+/i.test(trainer.class_name))
                        trainer.class_name = "Rival"
                    if ((trainer.name || "").toLowerCase() == (trainer.class_name || '').toLowerCase())
                        trainer.name = trainer.class_name;
                    trainer.class_id = trainerClass;
                    trainer.id = trainerNum;
                    enemy_trainers.push(trainer);
                }
                //wEnemyParty
                let enemy_party: TPP.PartyData = [];
                if (battle_kind == "Wild") {
                    enemy_party[0] = this.ParseBattlePokemon(data.slice(4 + NAME_LENGTH + this.PartySize() + 2));
                    enemy_party[0].species.catch_rate = actualCatchRate;
                }
                else {
                    const trainerClass = data.readUInt8(2);
                    const trainerNum = data.readUInt8(3);
                    enemy_party = this.ParseParty(data.slice(4 + NAME_LENGTH));
                    enemy_party.forEach((p, i) => p.personality_value = (p.personality_value ^ (i << 16) ^ ((trainerClass << 8 | trainerNum))) >>> 0); //attempt to avoid enemy PV collisions
                }

                return { in_battle, battle_kind, enemy_party, enemy_trainers };
            }
            return { in_battle };
        }

        protected ParsePC(data: Buffer): TPP.CombinedPCData {
            // wCurrentBoxNum
            const currentBox = (data[0] + 1) & 0x1F;// + 15; //pbr
            // Active Box
            // sBox1-12
            const pc = this.rom.ReadArray(data.slice(1), 0, this.PCBoxSize(), NUM_BOXES + 1).map(b => this.ParsePCBox(b));
            const active = pc.shift();
            pc[currentBox - 1] = active;
            //pc[currentBox - 15] = active; //pbr
            return {
                current_box_number: currentBox,
                boxes: pc.map((box, i) => (<TPP.BoxData>{
                    box_contents: box,
                    box_name: `Box ${i + 1}`,
                    box_number: i + 1
                    // box_name: `Red Box ${i + 1}`, //PBR
                    // box_number: i + 15 //PBR
                }))
            };
        }

        protected ParsePCBox(data: Buffer) {
            // wBoxDataStart::
            // wNumInBox::  ds 1
            const numInBox = data[0];
            if (numInBox > MONS_PER_BOX)
                return []; //uninitialized box
            // wBoxSpecies:: ds MONS_PER_BOX + 1
            const boxSpecies = data.slice(1, 1 + numInBox).map(s => s);

            // wBoxMons::
            // wBoxMon1:: box_struct wBoxMon1
            // wBoxMon2:: ds box_struct_length * (MONS_PER_BOX + -1)
            const box = numInBox ? this.rom.ReadArray(data, this.rom.symTable['wBoxMons'] - this.rom.symTable['wBoxDataStart'], this.rom.symTable['wBoxMon2'] - this.rom.symTable['wBoxMon1'], numInBox)
                .map((p, i) => this.ParsePokemon(p, boxSpecies[i])) : [];

            if (numInBox) {
                // wBoxMonOT::    ds NAME_LENGTH * MONS_PER_BOX
                this.AddOTNames(box, data.slice(this.rom.symTable['wBoxMonOT'] - this.rom.symTable['wBoxDataStart']), numInBox);
                // wBoxMonNicks:: ds NAME_LENGTH * MONS_PER_BOX
                this.AddNicknames(box, data.slice(this.rom.symTable['wBoxMonNicks'] - this.rom.symTable['wBoxDataStart']), numInBox);
                // wBoxMonNicksEnd::
                // wBoxDataEnd::
            }
            return box;
        }

        protected ParseParty(data: Buffer) {
            // wPartyCount::   ds 1 ; d163
            const partyCount = data[0];
            // wPartySpecies:: ds PARTY_LENGTH ; d164
            // wPartyEnd::     ds 1 ; d16a
            const partySpecies = data.slice(1, 1 + partyCount).map(s => s);

            // wPartyMons::
            // wPartyMon1:: party_struct wPartyMon1 ; d16b
            // wPartyMon2:: party_struct wPartyMon2 ; d197
            // wPartyMon3:: party_struct wPartyMon3 ; d1c3
            // wPartyMon4:: party_struct wPartyMon4 ; d1ef
            // wPartyMon5:: party_struct wPartyMon5 ; d21b
            // wPartyMon6:: party_struct wPartyMon6 ; d247
            const party: TPP.PartyData = partyCount ? this.rom.ReadArray(data, this.rom.symTable['wPartyMons'] - this.rom.symTable['wPartyDataStart'], this.PartyMonSize(), partyCount)
                .map((p, i) => this.ParsePartyMon(p, partySpecies[i])) : [];

            if (partyCount) {
                // wPartyMonOT::    ds NAME_LENGTH * PARTY_LENGTH ; d273
                this.AddOTNames(party, data.slice(this.rom.symTable['wPartyMonOT'] - this.rom.symTable['wPartyDataStart']), partyCount);
                // wPartyMonNicks:: ds NAME_LENGTH * PARTY_LENGTH ; d2b5
                this.AddNicknames(party, data.slice(this.rom.symTable['wPartyMonNicks'] - this.rom.symTable['wPartyDataStart']), partyCount);
                // wPartyDataEnd::
            }

            const pastPartyOffset = this.PartySize();
            // wIsInBattle: ds 1
            if (data[pastPartyOffset] != 0) {
                // wPlayerMonNumber: ds 1
                const battleMonIndex = data[pastPartyOffset + 1];
                if (party[battleMonIndex]) {
                    party[battleMonIndex] = Object.assign(party[battleMonIndex], this.ParseBattlePokemon(data.slice(pastPartyOffset + 2)) || {});
                }
            }
            return party.filter(p => !!p && !!p.species && !!p.personality_value);
        }

        protected AddOTNames(mons: Gen1BoxedMon[], data: Buffer, monCount: number) {
            this.rom.ReadArray(data, 0, NAME_LENGTH, monCount).forEach((n, i) => mons[i] && mons[i].original_trainer ? mons[i].original_trainer.name = this.rom.ConvertText(n) : null);
        }

        protected AddNicknames(mons: Gen1BoxedMon[], data: Buffer, monCount: number) {
            this.rom.ReadArray(data, 0, NAME_LENGTH, monCount).forEach((n, i) => mons[i] && mons[i].species ? mons[i].name = this.FixCapsNonNickname(this.rom.ConvertText(n), mons[i].species.name) : null);
        }

        protected FixCapsNonNickname(nick: string, speciesName: string) {
            if (this.rom.FixAllCaps(nick) != speciesName)
                return nick;
            return speciesName;
        }

        protected ParsePartyMon(data: Buffer, species?: number) {
            const poke = this.ParsePokemon(data, species) as TPP.PartyPokemon;
            const offset = this.BaseOffsetCalc('wPartyMon1');
            if (data[offset('Species')] == 0)
                return poke;
            // \1Level::      db
            poke.level = data[offset('Level')];
            // \1Stats::
            poke.stats = {
                // \1MaxHP::      dw
                hp: data.readUInt16BE(offset('MaxHP')),
                // \1Attack::     dw
                attack: data.readUInt16BE(offset('Attack')),
                // \1Defense::    dw
                defense: data.readUInt16BE(offset('Defense')),
                // \1Speed::      dw
                speed: data.readUInt16BE(offset('Speed')),
                // \1Special::    dw
                special_attack: data.readUInt16BE(offset('Special')),
                special_defense: data.readUInt16BE(offset('Special')),
            }
            poke.health[1] = poke.stats.hp;
            return poke;
        }

        protected ParsePokemon(data: Buffer, species?: number, nickname?: Buffer, otName?: Buffer) {
            const poke = {} as Gen1BoxedMon;
            const offset = this.BaseOffsetCalc('wPartyMon1');
            if (data[offset('Species')] == 0)
                return poke;
            // \1Species::    db
            poke.species = Pokemon.Convert.SpeciesToRunStatus(this.rom.GetSpeciesById(species) || this.rom.GetSpeciesById(data[offset('Species')]));
            // \1HP::         dw
            poke.health = [data.readUInt16BE(offset('HP'))];
            // \1BoxLevel::   db
            poke.level = data[offset('BoxLevel')];
            // \1Status::     db
            const statusNum = data[offset('Status')];
            poke.status = this.ParseStatus(statusNum);
            poke.sleep_turns = statusNum % 8;
            // \1Type::
            // \1Type1::      db
            poke.species.type1 = this.rom.GetType(data[offset('Type1')]);
            // \1Type2::      db
            poke.species.type2 = this.rom.GetType(data[offset('Type2')]);
            // \1CatchRate::  db
            poke.species.catch_rate = data[offset('CatchRate')];
            // \1Moves::      ds NUM_MOVES
            poke.moves = Array.from(data.slice(offset('Moves'), offset('OTID'))).map(m => Pokemon.Convert.MoveToRunStatus(this.rom.GetMove(m)));
            // \1OTID::       dw
            poke.original_trainer = { id: data.readUInt16BE(offset('OTID')) } as TPP.Trainer;
            // \1Exp::        ds 3
            poke.experience = { current: data.readUInt32BE(offset('Exp') - 1) % 0x1000000 };
            poke.evs = {
                // \1HPExp::      dw
                hp: data.readUInt16BE(offset('HPExp')),
                // \1AttackExp::  dw
                attack: data.readUInt16BE(offset('AttackExp')),
                // \1DefenseExp:: dw
                defense: data.readUInt16BE(offset('DefenseExp')),
                // \1SpeedExp::   dw
                speed: data.readUInt16BE(offset('SpeedExp')),
                // \1SpecialExp:: dw
                special_attack: data.readUInt16BE(offset('SpecialExp')),
                special_defense: data.readUInt16BE(offset('SpecialExp'))
            }
            // \1DVs::        ds 2
            poke.ivs = this.UnpackDVs(data.readUInt16BE(offset('DVs')));
            // \1PP::         ds NUM_MOVES
            data.slice(offset('PP')).forEach((pp, i) => {
                if (poke.moves[i]) {
                    poke.moves[i].pp = pp % 64;
                    poke.moves[i].pp_up = pp >>> 6;
                }
            });
            poke.moves = poke.moves.filter(m => m && m.id);

            // Fake PV
            poke.personality_value = (data.readUInt16BE(offset('DVs')) << 16) + (poke.original_trainer.id | poke.species.catch_rate);

            if (nickname)
                poke.name = this.rom.ConvertText(nickname);
            if (otName)
                poke.original_trainer.name = this.rom.ConvertText(otName);

            // //PBR
            // (poke as any).aiss_id = this.AissId(poke.species.national_dex, poke.species.catch_rate);
            // poke.gender = "";

            return poke;
        }

        protected ParseBattlePokemon(data: Buffer) {
            const poke = {} as TPP.PartyPokemon & { active: boolean };
            const offset = this.BaseOffsetCalc('wBattleMon', NAME_LENGTH);
            if (data[offset('Species')] == 0)
                return poke;
            // \1Species::    db
            poke.species = Pokemon.Convert.SpeciesToRunStatus(this.rom.GetSpecies(data[offset('Species')]))
            poke.name = this.FixCapsNonNickname(this.rom.ConvertText(data), poke.species.name);
            // \1HP::         dw
            poke.health = [data.readUInt16BE(offset('HP')), data.readUInt16BE(offset('MaxHP'))];
            // \1PartyPos::
            // \1BoxLevel::   db
            // \1Status::     db
            const statusNum = data[offset('Status')];
            poke.status = this.ParseStatus(statusNum);
            poke.sleep_turns = statusNum % 8;
            // \1Type::
            // \1Type1::      db
            poke.species.type1 = this.rom.GetType(data[offset('Type1')]);
            // \1Type2::      db
            poke.species.type2 = this.rom.GetType(data[offset('Type2')]);
            // \1CatchRate::  db
            poke.species.catch_rate = data[offset('CatchRate')];
            // \1Moves::      ds NUM_MOVES
            poke.moves = Array.from(data.slice(offset('Moves'), offset('DVs'))).map(m => Pokemon.Convert.MoveToRunStatus(this.rom.GetMove(m)));
            // \1DVs::        ds 2
            poke.ivs = this.UnpackDVs(data.readUInt16BE(offset('DVs')));
            // \1Level::      db
            poke.level = data[offset('Level')];
            // \1Stats::
            poke.stats = {
                // \1MaxHP::      dw
                hp: data.readUInt16BE(offset('MaxHP')),
                // \1Attack::     dw
                attack: data.readUInt16BE(offset('Attack')),
                // \1Defense::    dw
                defense: data.readUInt16BE(offset('Defense')),
                // \1Speed::      dw
                speed: data.readUInt16BE(offset('Speed')),
                // \1Special::    dw
                special_attack: data.readUInt16BE(offset('Special')),
                special_defense: data.readUInt16BE(offset('Special')),
            }
            // \1PP::         ds NUM_MOVES
            data.slice(offset('PP')).forEach((pp, i) => {
                if (poke.moves[i]) {
                    poke.moves[i].pp = pp % 64;
                    poke.moves[i].pp_up = pp >>> 6;
                }
            });
            poke.moves = poke.moves.filter(m => m && m.id);

            poke.active = true;

            return poke;
        }

        protected UnpackDVs(dvs: number) {
            const ivs = {
                attack: dvs >> 12,
                defense: (dvs >> 8) % 16,
                speed: (dvs >> 4) % 16,
                special_attack: dvs % 16,
                special_defense: dvs % 16
            } as TPP.Stats;
            ivs.hp = (8 * (ivs.attack % 2)) + (4 * (ivs.defense % 2)) + (2 * (ivs.speed % 2)) + (ivs.special_attack % 2);
            return ivs;
        }

        public Init() {
            const hRomBank = 0xFFB8;
            //Evolution detect
            const { bank, address } = this.rom.LinearAddressToBanked(this.rom.symTable["EvolveMon"]);
            this.SetSelfCallEvent("Evolution Start", "Execute", address, "override/evolution_is_happening/true", hRomBank, bank);
            this.SetSelfCallEvent("Evolution End", "Execute", address + 152, "override/evolution_is_happening", hRomBank, bank);
        }
    }
}
