/// <reference path="base.ts" />

namespace RamReader {

    const NAME_LENGTH = 11;
    const BOX_NAME_LENGTH = 9;
    const MONS_PER_BOX = 20;
    const NUM_BOXES = 14; //20; Chatty Crystal
    const NUM_POKEMON = 251; //400; Chatty Crystal
    const DEX_FLAG_BYTES = Math.floor((NUM_POKEMON + 7) / 8);

    const dayOfWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    const timeOfDay = ["Morning", "Day", "Night"];

    interface Gen2BoxedMon extends TPP.Pokemon {
        health: number[];
        status: string;
        sleep_turns?: number;
    }

    export class Gen2 extends RamReaderBase<RomReader.Gen2> {
        protected SymAddr = (...symbols: string[]) => {
            const symbol = symbols.find(symbol => !!this.rom.symTable[symbol]);
            if (!symbol)
                throw `Could not find symbol ${symbols.join(' ')}`;
            return this.rom.symTable[symbol].toString(16);
        };
        protected StructSize = (startSymbol: string, ...endSymbol: string[]) => this.rom.symTable[[...endSymbol, startSymbol.replace("Start", '') + "End"].find(s => !!this.rom.symTable[s])] - this.rom.symTable[startSymbol];

        protected readerFunc = this.ReadSync;

        protected PCBoxSize = () => this.StructSize('sBox') + 2; //??
        protected PartySize = () => this.StructSize('wPokemonData', 'wPartyMonNicknamesEnd');
        protected PartyMonSize = () => this.StructSize('wPartyMon1', 'wPartyMon2');
        protected BattleMonSize = () => this.StructSize('wBattleMon', 'wWildMon') - 2;
        protected Crystal16PokemonMappingSize = () => this.StructSize("wPokemonIndexTable");
        protected Crystal16MovesMappingSize = () => this.StructSize("wMoveIndexTable");
        protected NumPCBoxes = () => Object.keys(this.rom.symTable).filter(s => /^sBox\d+$/.test(s)).length;

        public get isCrystal16() {
            return this.rom.isCrystal16;
        }

        private crystal16PokemonMapping: number[] = [];
        private crystal16MovesMapping: number[] = [];

        public Crystal16MapPokemon(shortId: number) {
            return (this.isCrystal16 && shortId > 0) ? this.crystal16PokemonMapping[shortId] || 0 : shortId;
        }
        public Crystal16MapMove(shortId: number) {
            return (this.isCrystal16 && shortId > 0) ? this.crystal16MovesMapping[shortId] || 0 : shortId;
        }

        public ReadParty = this.CachedEmulatorCaller(`WRAM/ReadByteRange/${this.SymAddr('wPokemonData')}/${this.PartySize().toString(16)}/${this.SymAddr('wBattleMode')}/1/${this.SymAddr('wCurPartyMon')}/1/${this.SymAddr('wBattleMonNick', 'wBattleMonNickname')}/${NAME_LENGTH.toString(16)}/${this.SymAddr('wBattleMon')}/${this.BattleMonSize().toString(16)}` + (this.isCrystal16 ? `/${this.SymAddr('wPokemonIndexTable')}/${this.Crystal16PokemonMappingSize().toString(16)}/${this.SymAddr('wMoveIndexTable')}/${this.Crystal16MovesMappingSize().toString(16)}` : ""), this.WrapBytes(data => this.ParseParty(data)));
        public ReadPC = this.isCrystal16
            ? this.StructEmulatorCaller<TPP.CombinedPCData>('CartRAM', (() => {
                const struct = {
                    "sBox": this.PCBoxSize(),
                };
                Object.keys(this.rom.symTable).filter(s => /^sBox\d+$/.test(s)).forEach(k => struct[k] = this.PCBoxSize());
                Object.keys(this.rom.symTable).filter(s => /^sBox\d+PokemonIndexes$/.test(s)).forEach(k => struct[k] = 2 * MONS_PER_BOX);
                return struct;
            })(), sym => this.rom.symTable[sym], async struct => {
                const { wCurBox, wBoxNames } = await (this.StructEmulatorCaller('WRAM', { wCurBox: 1, wBoxNames: this.NumPCBoxes() * BOX_NAME_LENGTH },
                    sym => this.rom.symTable[sym],
                    s => ({ wCurBox: s.wCurBox[0], wBoxNames: this.rom.ReadArray(s.wBoxNames, 0, BOX_NAME_LENGTH, 0, false, () => false).map(b => this.rom.ConvertText(b)) })))()
                    || { wCurBox: this.currentState.pc.current_box_number - 1, wBoxNames: this.currentState.pc.boxes.map(b => b.box_name) };
                const pcData: TPP.CombinedPCData = {
                    current_box_number: wCurBox + 1,
                    boxes: Object.keys(struct).map(s => /^sBox(\d+)$/.exec(s)).filter(m => !!m).sort((m1, m2) => parseInt(m1[1]) - parseInt(m2[1])).map(m => m[0]).map((k, i) => (<TPP.BoxData>{
                        box_number: i + 1,
                        box_name: wBoxNames[i],
                        box_contents: this.ParsePCBox(struct[k], this.rom.ReadArray(struct[k + "PokemonIndexes"], 0, 2, 0, false, _ => false).map(n => n.readUInt16LE(0)), true).filter(m => m && m.species)
                    }))
                };
                pcData.boxes[wCurBox].box_contents = this.ParsePCBox(struct.sBox);
                return pcData;
            })
            : this.CachedEmulatorCaller([`WRAM/ReadByteRange/${this.SymAddr('wCurBox')}/1/${this.SymAddr('wBoxNames')}/${(BOX_NAME_LENGTH * NUM_BOXES).toString(16)}`, `CartRAM/ReadByteRange/${this.SymAddr('sBox')}/${this.PCBoxSize().toString(16)}/${this.SymAddr('sBox1')}/${(this.PCBoxSize() * 7).toString(16)}/${this.SymAddr('sBox8')}/${(this.PCBoxSize() * 7).toString(16)}`], this.WrapBytes(data => this.ParsePC(data)));
        public ReadBattle = this.CachedEmulatorCaller(`WRAM/ReadByteRange/${this.SymAddr('wBattleMode')}/1/${this.SymAddr('wEnemyMonCatchRate')}/1/${this.SymAddr('wOtherTrainerClass')}/1/${this.SymAddr('wOtherTrainerID')}/1/${this.SymAddr('wOTPartyCount')}/${this.PartySize().toString(16)}/${this.SymAddr('wBattleMode')}/1/${this.SymAddr('wCurOTMon')}/1/${this.SymAddr('wEnemyMonNick', 'wEnemyMonNickname')}/${NAME_LENGTH.toString(16)}/${this.SymAddr('wEnemyMon')}/${this.BattleMonSize().toString(16)}/${this.SymAddr('wStringBuffer3')}/${NAME_LENGTH.toString(16)}` + (this.isCrystal16 ? `/${this.SymAddr('wPokemonIndexTable')}/${this.Crystal16PokemonMappingSize().toString(16)}/${this.SymAddr('wMoveIndexTable')}/${this.Crystal16MovesMappingSize().toString(16)}` : ""), this.WrapBytes(data => this.ParseBattleBundle(data)));
        protected TrainerChunkReaders = [
            this.StructEmulatorCaller<TPP.TrainerData>('WRAM', {
                wPlayerName: NAME_LENGTH,
                wMomsName: NAME_LENGTH,
                wRivalName: NAME_LENGTH,
                wPlayerID: 2,
                wSecretID: 2,
                wOptions: this.StructSize('wOptions'),
                wPokedexCaught: DEX_FLAG_BYTES,
                wPokedexSeen: DEX_FLAG_BYTES,
                wXCoord: 1,
                wYCoord: 1,
                wMapGroup: 1,
                wMapNumber: 1,
                wMoney: 3,
                wMomsMoney: 3,
                wCoins: 2,
                wBadges: this.rom.isPrism ? 3 : 2,
                // TODO: pokecrystal has wTMsHMsEnd but pokegold doesn't
                wTMsHMs: this.StructSize('wTMsHMs'),//, 'wNumItems'),
                wNumItems: 1,
                // TODO: pokecrystal has wItemsEnd but pokegold doesn't
                wItems: this.StructSize('wItems'),//, 'wNumKeyItems'),
                wNumKeyItems: 1,
                // TODO: pokecrystal has wKeyItemsEnd but pokegold doesn't
                wKeyItems: this.StructSize('wKeyItems'),//, 'wNumBalls'),
                wNumBalls: 1,
                // TODO: pokecrystal has wBallsEnd but pokegold doesn't
                wBalls: this.StructSize('wBalls'),//, 'wNumPCItems'),
                wNumPCItems: 1,
                // TODO: pokecrystal has wPCItemsEnd but pokegold doesn't
                wNumBerries: 1,
                wBerries: this.StructSize('wBerries'),
                wNumMedicine: 1,
                wMedicine: this.StructSize('wMedicine'),
                wPCItems: this.StructSize('wPCItems'),//, 'wPokegearFlags'),
                wPhoneList: this.StructSize('wPhoneList', 'wLuckyNumberShowFlag'),// - 23, (not sure why I'm doing -23)
                wCurDay: 1,
                wTimeOfDay: 1,
            }, sym => this.rom.symTable[sym], struct => {
                const map = this.rom.GetMap(struct.wMapNumber[0], struct.wMapGroup[0]) || {} as Pokemon.Map;
                const options = {
                    ...this.ParseOptions(struct.wOptions[0], this.OptionsSpec),
                    ...this.ParseOptions(struct.wOptions[2], this.FrameSpec),
                    ...this.ParseOptions(struct.wOptions[4], this.PrinterSpec),
                    ...this.ParseOptions(struct.wOptions[5], this.Options2Spec)
                };
                if (this.ShouldForceOptions(options, this.OptionsSpec))
                    this.CallEmulator(`WRAM/WriteByte/${this.SymAddr('wOptions')}/${this.SetOptions(struct.wOptions[0], this.config.forceOptions, this.OptionsSpec).toString(16)}`);
                if (this.ShouldForceOptions(options, this.FrameSpec))
                    this.CallEmulator(`WRAM/WriteByte/${this.SymAddr('wTextBoxFrame')}/${this.SetOptions(struct.wOptions[2], this.config.forceOptions, this.FrameSpec).toString(16)}`);
                if (this.ShouldForceOptions(options, this.PrinterSpec))
                    this.CallEmulator(`WRAM/WriteByte/${this.SymAddr('wGBPrinter')}/${this.SetOptions(struct.wOptions[4], this.config.forceOptions, this.PrinterSpec).toString(16)}`);
                if (this.ShouldForceOptions(options, this.Options2Spec))
                    this.CallEmulator(`WRAM/WriteByte/${this.SymAddr('wOptions2')}/${this.SetOptions(struct.wOptions[5], this.config.forceOptions, this.Options2Spec).toString(16)}`);
                options.frame = (parseInt(options.frame || "0") + 1).toFixed(0);
                const tms = this.rom.GetTMsHMs();
                const seenMons = this.GetSetFlags(struct.wPokedexSeen).map(id => this.rom.GetSpecies(id).dexNumber);
                // All Owned mons must also be Seen to count (workaround for Crystal GiveEgg flag bug)
                const ownedMons = this.GetSetFlags(struct.wPokedexCaught).map(id => this.rom.GetSpecies(id).dexNumber).filter(m => seenMons.indexOf(m) >= 0);
                return {
                    name: this.rom.ConvertText(struct.wPlayerName),
                    id: struct.wPlayerID.readUInt16BE(0),
                    // wSecretID is only in Crystal
                    secret: struct.wSecretID && struct.wSecretID.readUInt16BE(0),
                    options,
                    caught_list: ownedMons,
                    seen_list: seenMons,
                    caught: ownedMons.length,
                    seen: seenMons.length,
                    x: struct.wXCoord[0],
                    y: struct.wYCoord[0],
                    map_id: struct.wMapNumber[0],
                    map_bank: struct.wMapGroup[0],
                    map_name: map.name,
                    area_id: map.areaId,
                    area_name: map.areaName,
                    money: this.ReadUInt24BE(struct.wMoney, 0),
                    momsMoney: struct.wMomsMoney && this.ReadUInt24BE(struct.wMomsMoney, 0),
                    coins: struct.wCoins && struct.wCoins.readUInt16BE(0),
                    mom_name: struct.wMomsName && this.rom.ConvertText(struct.wMomsName),
                    rival_name: struct.wRivalName && this.rom.ConvertText(struct.wRivalName),
                    evolution_is_happening: false,
                    badges: this.rom.isPrism ? struct.wBadges.readUIntLE(0, 3) : struct.wBadges.readUInt16LE(0),
                    items: {
                        items: this.rom.ReadArray(struct.wItems, 0, 2, struct.wNumItems[0]).map(data => Pokemon.Convert.ItemToRunStatus(this.rom.GetItem(data[0]), data[1])),
                        balls: this.rom.ReadArray(struct.wBalls, 0, 2, struct.wNumBalls[0]).map(data => Pokemon.Convert.ItemToRunStatus(this.rom.GetItem(data[0]), data[1])),
                        key: this.rom.ReadArray(struct.wKeyItems, 0, 1, struct.wNumKeyItems[0], true, e => e[0] == 255).map(data => Pokemon.Convert.ItemToRunStatus(this.rom.GetItem(data[0]))),
                        berries: struct.wBerries && this.rom.ReadArray(struct.wBerries, 0, 2, struct.wNumBerries[0]).map(data => Pokemon.Convert.ItemToRunStatus(this.rom.GetItem(data[0]), data[1])),
                        medicine: struct.wMedicine && this.rom.ReadArray(struct.wMedicine, 0, 2, struct.wNumMedicine[0]).map(data => Pokemon.Convert.ItemToRunStatus(this.rom.GetItem(data[0]), data[1])),
                        tms: this.rom.isPrism ?
                            this.GetSetFlags(struct.wTMsHMs).map(id => Pokemon.Convert.ItemToRunStatus({ name: this.rom.GetTMById(id), isKeyItem: true, id: id + 255 })) :
                            this.rom.ReadArray(struct.wTMsHMs, 0, 1, 255).map((count, i) => Pokemon.Convert.ItemToRunStatus(tms[i], count[0])).filter(tm => tm.count > 0),
                        pc: this.rom.ReadArray(struct.wNumPCItems ? struct.wPCItems : struct.wPCItems.slice(1), 0, 2, struct.wNumPCItems ? struct.wNumPCItems[0] : struct.wPCItems[0], true).map(data => Pokemon.Convert.ItemToRunStatus(this.rom.GetItem(data[0]), data[1]))
                        // pc: this.rom.ReadArray(struct.wPCItems, 0, 2, struct.wNumPCItems ? struct.wNumPCItems[0] : 255, true, data => data[1] == 255).map(data => Pokemon.Convert.ItemToRunStatus(this.rom.GetItem(data[1]), data[0]))
                    },
                    phone_book: struct.wPhoneList && (this.rom.ReadArray(struct.wPhoneList, 0, 1, 255).map(data => (data[0] == 1 && struct.wMomsName) ? "Mom" /*this.rom.ConvertText(struct.wMomsName) /* Used as player name backup? */ : this.rom.GetPhoneContact(data[0])).filter(p => !!p)),
                    time: { ...((this.currentState || { time: null }).time || { h: 0, m: 0, s: 0 }), d: dayOfWeek[struct.wCurDay[0] % 7], tod: struct.wTimeOfDay ? timeOfDay[struct.wTimeOfDay[0]] : undefined }
                };
            }),
            // Prism Bingo stats
            this.rom.isPrism && this.StructEmulatorCaller<TPP.TrainerData>('WRAM', {
                wHallOfFameCount: 2,
                wMysteryZoneWinCount: 2,
                wMiningLevel: 1,
                wMiningEXP: 1,
                wSmeltingLevel: 1,
                wSmeltingEXP: 1,
                wJewelingLevel: 1,
                wJewelingEXP: 1,
                wBallMakingLevel: 1,
                wBallMakingEXP: 1,
                wOrphanPoints: 2,
                wSootSackAsh: 2,
                wBattlePoints: 2,
                wPachisiWinCount: 2,
                wTowerTycoonsDefeated: 2,
                wFossilsRevived: 2,
                wAccumulatedOrphanPoints: 4,
                wBattleArcadeMaxScore: 4,
                wBattleArcadeMaxRound: 2,
                wBattleArcadeTickets: 3,
                wGlobalStepCounter: 4,
                wBattlesWonCounter: 3,
                wTotalBattleTime: 6, // 3 byte hours (big endian), minutes, seconds, hundredths
                wBankMoney: 3,
            }, sym => this.rom.symTable[sym], struct => {
                const game_stats = {
                    "Steps Taken": struct.wGlobalStepCounter && struct.wGlobalStepCounter.readUInt32LE(0),
                    "Hall of Fame Entries": struct.wHallOfFameCount && struct.wHallOfFameCount.readUInt16LE(0),
                    "Mystery Zone Clears": struct.wMysteryZoneWinCount && struct.wMysteryZoneWinCount.readUInt16LE(0),
                    "Smelting Level": struct.wSmeltingLevel && struct.wSmeltingLevel[0],
                    "Smelting Exp": struct.wSmeltingEXP && struct.wSmeltingEXP[0],
                    "Jeweling Level": struct.wJewelingLevel && struct.wJewelingLevel[0],
                    "Jeweling Exp": struct.wJewelingEXP && struct.wJewelingEXP[0],
                    "Mining Level": struct.wMiningLevel && struct.wMiningLevel[0],
                    "Mining Exp": struct.wMiningEXP && struct.wMiningEXP[0],
                    "Orphan Points (Current)": struct.wOrphanPoints && struct.wOrphanPoints.readUInt16BE(0),
                    "Orphan Points (Total)": struct.wAccumulatedOrphanPoints && struct.wAccumulatedOrphanPoints.readUInt32BE(0),
                    "Battle Tower Tycoons Defeated": struct.wTowerTycoonsDefeated && struct.wTowerTycoonsDefeated.readUInt16LE(0),
                    "Battle Points": struct.wBattlePoints && struct.wBattlePoints.readUInt16LE(0),
                    "Soot Sack Ash": struct.wSootSackAsh && struct.wSootSackAsh.readUInt16BE(0),
                    "Ball Making Level": struct.wBallMakingLevel && struct.wBallMakingLevel[0],
                    "Ball Making Exp": struct.wBallMakingEXP && struct.wBallMakingEXP[0],
                    "Fossils Revived": struct.wFossilsRevived && struct.wFossilsRevived.readUInt16LE(0),
                    "Battle Arcade High Score": struct.wBattleArcadeMaxScore && struct.wBattleArcadeMaxScore.readUInt32BE(0),
                    "Battle Arcade Most Rounds": struct.wBattleArcadeMaxRound && struct.wBattleArcadeMaxRound.readUInt16BE(0),
                    "Battle Arcade Tickets": struct.wBattleArcadeTickets && struct.wBattleArcadeTickets.readUIntBE(0, 3),
                    "Pachisi Wins": struct.wPachisiWinCount && struct.wPachisiWinCount.readUInt16LE(0),
                    "Battles Won": struct.wBattlesWonCounter && struct.wBattlesWonCounter.readUIntLE(0, 3),
                    "Time Spent Battling": struct.wTotalBattleTime && ((struct.wTotalBattleTime.readUIntBE(0, 3) * 3600) + (struct.wTotalBattleTime[3] * 60) + struct.wTotalBattleTime[4] + (struct.wTotalBattleTime[5] / 100)),
                    "Money in the Bank": struct.wBankMoney && struct.wBankMoney.readUIntBE(0, 3),
                };
                Object.keys(game_stats).forEach(k => {
                    if (!game_stats[k]) //Filter out any stats that are missing or 0
                        delete game_stats[k];
                });
                return { game_stats };
            }),
            this.StructEmulatorCaller<TPP.TrainerData>('WRAM', {
                wDayCareMan: 1,
                wDaycareMan: 1, // Prism
                wBreedMon1Nick: NAME_LENGTH,
                wBreedMon1OT: NAME_LENGTH,
                wBreedMon1Stats: this.StructSize('wBreedMon1Stats', 'wBreedMon1End', 'wDayCareLady'),
                wDayCareLady: 1,
                wDaycareLady: 1, // Prism
                wBreedMon2Nick: NAME_LENGTH,
                wBreedMon2OT: NAME_LENGTH,
                wBreedMon2Stats: this.StructSize('wBreedMon2Stats', 'wBreedMon2End', 'wEggNick'),
            }, sym => this.rom.symTable[sym], struct => ({
                daycare: [
                    ((struct.wDayCareMan || struct.wDaycareMan)[0] & 1) && this.ParsePokemon(struct.wBreedMon1Stats, struct.wBreedMon1Stats[0], struct.wBreedMon1Nick, struct.wBreedMon1OT),
                    ((struct.wDayCareLady || struct.wDaycareLady)[0] & 1) && this.ParsePokemon(struct.wBreedMon2Stats, struct.wBreedMon2Stats[0], struct.wBreedMon2Nick, struct.wBreedMon2OT)
                ].filter(p => !!p)
            })),
            this.StructEmulatorCaller<TPP.TrainerData>('System Bus', {
                hHours: 1,
                hMinutes: 1,
                hSeconds: 1
            }, sym => this.rom.symTable[sym], async struct => ({
                time: {
                    ...((this.currentState || { time: null }).time || (await this.getMissingDefaultTime())),
                    h: struct.hHours && struct.hHours[0],
                    m: struct.hMinutes && struct.hMinutes[0],
                    s: struct.hSeconds && struct.hSeconds[0]
                }
            }))
        ].filter(r => !!r);

        private async getMissingDefaultTime() {
            return this.CallEmulator(`WRAM/ReadByteRange/${this.rom.symTable["wCurDay"].toString(16)}/1` + (!!this.rom.symTable["wTimeOfDay"] ? `/${this.rom.symTable["wTimeOfDay"].toString(16)}/1` : ""), this.WrapBytes(data => ({
                d: dayOfWeek[data[0] % 7],
                tod: data.length > 1 ? timeOfDay[data[1]] : undefined
            })), true);
        }


        protected OptionsSpec: OptionsSpec = {
            text_speed: {
                // 0: "Instant", // Prism
                1: "Fast",
                3: "Med",
                5: "Slow"
                // 2: "Mid", // Prism
                // 3: "Slow", // Prism
            },
            sound: {
                0: "Mono",
                0x20: "Stereo",
            },
            battle_style: {
                0: "Shift",
                0x40: "Set"
            },
            battle_scene: {
                0: "On",
                0x80: "Off"
            },
            // turning_speed: { // Prism
            //     0: "Slow",
            //     0x8: "Fast"
            // }
        }
        protected FrameSpec: OptionsSpec = {
            //frame: { bitmask: 0x7 }
            frame: { bitmask: 0xF } // Prism
        }
        protected PrinterSpec: OptionsSpec = {
            print: { // removed for Gold97
                0: 'Lightest',
                0x20: 'Lighter',
                0x40: 'Normal',
                0x60: 'Darker',
                0x7F: 'Darkest'
            },
            // type_chart: { // added for Gold97
            //     0: "SW97",
            //     0x20: "Final"
            // }
        }
        protected Options2Spec: OptionsSpec = {
            menu_account: { // Removed for Prism
                0: 'Off',
                1: 'On'
            }
            // hold_to_mash: { // Prism
            //     0: 'None',
            //     1: 'Start',
            //     2: 'A+B',
            //     3: 'A or B'
            // },
            // preferred_units: { // Prism
            //     0: 'Metric',
            //     4: 'Imperial'
            // },
            // time_format: { // Prism
            //     0: '24-hour',
            //     8: '12-hour'
            // }
        }

        protected BaseOffsetCalc = (baseSymbol: string, extraOffset = 0) => ((symbol: string) => (this.rom.symTable[baseSymbol + symbol] - this.rom.symTable[baseSymbol]) + extraOffset);

        protected ParseBattleBundle(data: Buffer): TPP.BattleStatus {
            if (this.isCrystal16) {
                this.crystal16MovesMapping = this.rom.ReadArray(data.slice(data.length - this.Crystal16MovesMappingSize()), 0, 2, 255).map(id => id.readUInt16LE(0));
                this.crystal16PokemonMapping = this.rom.ReadArray(data.slice(data.length - this.Crystal16MovesMappingSize() - this.Crystal16PokemonMappingSize(), data.length - this.Crystal16MovesMappingSize()), 0, 2, 255).map(id => id.readUInt16LE(0));
            }

            //wBattleMode/1
            const in_battle = data[0] > 0;
            const battle_kind = data[0] < 2 ? "Wild" : "Trainer";
            //wEnemyMonCatchRate/1
            const actualCatchRate = data.readUInt8(1);
            if (in_battle) {
                const enemy_trainers = new Array<TPP.EnemyTrainer>();
                if (battle_kind == "Trainer") {
                    //wTrainerClass/1
                    const trainerClass = data.readUInt8(2);
                    //wTrainerNo/1
                    const trainerNum = data.readUInt8(3);
                    const trainer = Pokemon.Convert.EnemyTrainerToRunStatus(this.rom.GetTrainer(trainerNum, trainerClass));
                    if (/Rival\d+/i.test(trainer.class_name))
                        trainer.class_name = "Rival"
                    if (trainer.name == "Cal")
                        trainer.name = this.rom.ConvertText(data.slice(data.length - NAME_LENGTH));
                    enemy_trainers.push(trainer);
                }
                //wOTParty
                let enemy_party: TPP.PartyData = [];
                if (battle_kind == "Wild") {
                    enemy_party[0] = this.ParseBattlePokemon(data.slice(4 + this.PartySize() + 2));
                    enemy_party[0].species.catch_rate = actualCatchRate;
                }
                else {
                    const trainerClass = data.readUInt8(2);
                    const trainerNum = data.readUInt8(3);
                    enemy_party = this.ParseParty(data.slice(4));
                    enemy_party.forEach((p, i) => p.personality_value = (p.personality_value ^ (i << 16) ^ ((trainerClass << 8 | trainerNum))) >>> 0); //attempt to avoid enemy PV collisions
                }

                return { in_battle, battle_kind, enemy_party, enemy_trainers };
            }
            return { in_battle };
        }

        protected ParsePC(data: Buffer): TPP.CombinedPCData {
            // wCurrentBoxNum
            const currentBox = (data[0] & 0x1F) + 1;
            // wBoxNames
            const boxNames = this.rom.ReadArray(data, 1, BOX_NAME_LENGTH, NUM_BOXES).map(b => this.rom.ConvertText(b));
            // Active Box
            // sBox0-14
            const pc = this.rom.ReadArray(data, 1 + (BOX_NAME_LENGTH * NUM_BOXES), this.PCBoxSize(), NUM_BOXES + 1).map(b => this.ParsePCBox(b));
            const active = pc.shift();
            pc[currentBox - 1] = active;
            return {
                current_box_number: currentBox,
                boxes: pc.map((box, i) => (<TPP.BoxData>{
                    box_contents: box,
                    box_name: boxNames[i],
                    box_number: i + 1
                }))
            };
        }

        protected ParsePCBox(data: Buffer, speciesMap?: number[], movesAre16Bit = false) {
            // sBoxCount::  db
            const boxCount = data[0];
            if (boxCount > MONS_PER_BOX)
                return []; //uninitialized box
            // sBoxSpecies:: ds MONS_PER_BOX + 1
            const boxSpecies = data.slice(1, 1 + boxCount).map(s => s);

            // sBoxMons::
            // sBoxMon1:: box_struct sBoxMon1
            // sBoxMon2:: ds box_struct_length * (MONS_PER_BOX + -1)
            const box = boxCount ? this.rom.ReadArray(data, this.rom.symTable['sBoxMons'] - this.rom.symTable['sBoxCount'], this.rom.symTable['sBoxMon2'] - this.rom.symTable['sBoxMon1'], boxCount)
                .map((p, i) => this.ParsePokemon(p, boxSpecies[i], undefined, undefined, speciesMap ? speciesMap[i] : undefined, movesAre16Bit)) : [];

            if (boxCount) {
                // sBoxMonOT::    ds NAME_LENGTH * MONS_PER_BOX
                this.AddOTNames(box, data.slice(this.rom.symTable['sBoxMonOT'] - this.rom.symTable['sBoxCount']), boxCount);
                // sBoxMonNicknames:: ds NAME_LENGTH * MONS_PER_BOX
                this.AddNicknames(box, data.slice(this.rom.symTable['sBoxMonNicknames'] - this.rom.symTable['sBoxCount']), boxCount);
                // sBoxMonNicknamessEnd::
                // sBoxEnd::  ds 2 ; padding
            }
            return box;
        }

        protected ParseParty(data: Buffer) {
            if (this.isCrystal16) {
                this.crystal16MovesMapping = this.rom.ReadArray(data.slice(data.length - this.Crystal16MovesMappingSize()), 0, 2, 255).map(id => id.readUInt16LE(0));
                this.crystal16PokemonMapping = this.rom.ReadArray(data.slice(data.length - this.Crystal16MovesMappingSize() - this.Crystal16PokemonMappingSize(), data.length - this.Crystal16MovesMappingSize()), 0, 2, 255).map(id => id.readUInt16LE(0));
            }

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
            const party: TPP.PartyData = partyCount ? this.rom.ReadArray(data, this.rom.symTable['wPartyMons'] - this.rom.symTable['wPokemonData'], this.PartyMonSize(), partyCount)
                .map((p, i) => this.ParsePartyMon(p, partySpecies[i])) : [];

            if (partyCount) {
                // wPartyMonOT::    ds NAME_LENGTH * PARTY_LENGTH ; d273
                this.AddOTNames(party, data.slice(this.rom.symTable['wPartyMonOT'] - this.rom.symTable['wPokemonData']), partyCount);
                // wPartyMonNicknames:: ds NAME_LENGTH * PARTY_LENGTH ; d2b5
                this.AddNicknames(party, data.slice(this.rom.symTable['wPartyMonNicknames'] - this.rom.symTable['wPokemonData']), partyCount);
                // wPartyDataEnd::
            }

            const pastPartyOffset = this.PartySize();
            // wBattleMode: ds 1
            if (data[pastPartyOffset] != 0) {
                // wPlayerMonNumber: ds 1
                const battleMonIndex = data[pastPartyOffset + 1];
                const battleMon = this.ParseBattlePokemon(data.slice(pastPartyOffset + 2));
                if (
                    battleMon && party[battleMonIndex] &&
                    party[battleMonIndex].species && battleMon.species &&
                    party[battleMonIndex].species.id == battleMon.species.id &&
                    battleMon.ivs && party[battleMonIndex].ivs &&
                    this.PackDVs(battleMon.ivs) == this.PackDVs(party[battleMonIndex].ivs)
                ) {
                    party[battleMonIndex] = Object.assign(party[battleMonIndex], battleMon);
                }
            }
            return party.filter(p => !!p && !!p.species && !!p.personality_value);
        }

        protected AddOTNames(mons: Gen2BoxedMon[], data: Buffer, monCount: number) {
            this.rom.ReadArray(data, 0, NAME_LENGTH, monCount).forEach((n, i) => mons[i] && mons[i].original_trainer ? mons[i].original_trainer.name = this.rom.ConvertText(n) : null);
        }

        protected AddNicknames(mons: Gen2BoxedMon[], data: Buffer, monCount: number) {
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
            // \1Status::     db
            const statusNum = data[offset('Status')];
            poke.status = this.ParseStatus(statusNum);
            poke.sleep_turns = statusNum % 8;
            //\1Unused::         db
            // \1HP::         dw
            poke.health = [data.readUInt16BE(offset('HP')), data.readUInt16BE(offset('MaxHP'))];
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
                // \1SpclAtk::    dw
                special_attack: data.readUInt16BE(offset('SpclAtk')),
                // \1SpclDef::    dw
                special_defense: data.readUInt16BE(offset('SpclDef')),
            }
            poke.health[1] = poke.stats.hp;
            return poke;
        }

        protected ParsePokemon(data: Buffer, species?: number, nickname?: Buffer, otName?: Buffer, forceSpecies?: number, movesAre16Bit = false) {
            const poke = {} as Gen2BoxedMon;
            const offset = this.BaseOffsetCalc('wPartyMon1');
            if (data[offset('Species')] == 0)
                return poke;

            const actualSpecies = this.Crystal16MapPokemon(data[offset('Species')]);
            poke.is_egg = species == 254; //253; //== for Prism, thanks Libabeel // this.rom.NumPokemon; // gold97 // BW3

            // \1Species::    db
            poke.species = Pokemon.Convert.SpeciesToRunStatus(this.rom.GetSpecies(forceSpecies || actualSpecies));

            // \1Item::       db
            poke.held_item = data[offset('Item')] > 0 ? Pokemon.Convert.ItemToRunStatus(this.rom.GetItem(data[offset('Item')])) : null;
            // \1Moves::      ds NUM_MOVES
            poke.moves = Array.from(data.slice(offset('Moves'), offset('ID'))).map((m, i) => Pokemon.Convert.MoveToRunStatus(this.rom.GetMove(movesAre16Bit ? (m + ((data[offset('PP') + i] % 64) << 8)) : this.Crystal16MapMove(m))));
            // \1ID::         dw
            poke.original_trainer = { id: data.readUInt16BE(offset('ID')) } as TPP.Trainer;
            // \1Exp::        ds 3
            poke.experience = { current: data.readUInt32BE(offset('Exp') - 1) % 0x1000000 };
            // \1StatExp::
            poke.evs = {
                // \1HPExp::      dw
                hp: data.readUInt16BE(offset('HPExp')),
                // \1AtkExp::  dw
                attack: data.readUInt16BE(offset('AtkExp')),
                // \1DefExp:: dw
                defense: data.readUInt16BE(offset('DefExp')),
                // \1SpdExp::   dw
                speed: data.readUInt16BE(offset('SpdExp')),
                // \1SpcExp:: dw
                special_attack: data.readUInt16BE(offset('SpcExp')),
                special_defense: data.readUInt16BE(offset('SpcExp'))
            }
            // \1DVs::        ds 2
            poke.ivs = this.UnpackDVs(data.readUInt16BE(offset('DVs')));
            // \1PP::         ds NUM_MOVES
            data.slice(offset('PP')).forEach((pp, i) => {
                if (poke.moves[i]) {
                    poke.moves[i].pp = movesAre16Bit ? (poke.moves[i] && poke.moves[i].pp || 0) : pp % 64;
                    poke.moves[i].pp_up = pp >>> 6;
                }
            });
            poke.moves = poke.moves.filter(m => m && m.id);

            // \1Happiness:: db
            poke.friendship = data[offset("Happiness")];
            // \1PokerusStatus:: db
            poke.pokerus = this.ParsePokerus(data[offset("PokerusStatus")]);
            // \1CaughtData::
            // \1CaughtTime::
            // \1CaughtLevel:: db
            // \1CaughtGender::
            // \1CaughtLocation:: db
            if (!!offset('CaughtData'))
                poke.met = this.UnpackCaughtData(data.readInt16BE(offset('CaughtData')), poke.original_trainer);

            // \1Level::   db
            poke.level = data[offset('Level')];

            // Fake PV
            poke.personality_value = (data.readUInt16BE(offset('DVs')) << 16) + (poke.original_trainer.id | (!!offset('CaughtData') ? data.readInt16BE(offset('CaughtData')) : 0));

            if (this.rom.isPrism && poke.species) // If DVs have an even number of set bits, ability 0. Otherwise, ability 1
                poke.ability = poke.species.abilities[this.rom.CountSetBytes(data.readUInt16BE(offset('DVs'))) % 2];

            if (nickname)
                poke.name = this.rom.ConvertText(nickname);
            if (otName)
                poke.original_trainer.name = this.rom.ConvertText(otName);

            return poke;
        }

        protected ParseBattlePokemon(data: Buffer) {
            const poke = {} as TPP.PartyPokemon & { active: boolean };
            const offset = this.BaseOffsetCalc('wBattleMon', NAME_LENGTH);
            if (data[offset('Species')] == 0)
                return poke;
            // \1Species::    db
            poke.species = Pokemon.Convert.SpeciesToRunStatus(this.rom.GetSpecies(this.Crystal16MapPokemon(data[offset('Species')])))
            poke.name = this.FixCapsNonNickname(this.rom.ConvertText(data), poke.species.name);
            // \1Item::       db
            poke.held_item = data[offset('Item')] > 0 ? Pokemon.Convert.ItemToRunStatus(this.rom.GetItem(data[offset('Item')])) : null;
            // \1Moves::      ds NUM_MOVES
            poke.moves = Array.from(data.slice(offset('Moves'), offset('DVs'))).map(m => Pokemon.Convert.MoveToRunStatus(this.rom.GetMove(this.Crystal16MapMove(m))));
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
            // \1Happiness:: db
            poke.friendship = data[offset("Happiness")];
            // \1Level::      db
            poke.level = data[offset('Level')];
            // \1Status::     db
            const statusNum = data[offset('Status')];
            poke.status = this.ParseStatus(statusNum);
            poke.sleep_turns = statusNum % 8;
            // \1HP::         dw
            poke.health = [data.readUInt16BE(offset('HP')), data.readUInt16BE(offset('MaxHP'))];
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
                // \1SpclAtk::    dw
                special_attack: data.readUInt16BE(offset('SpclAtk')),
                // \1SpclDef::    dw
                special_defense: data.readUInt16BE(offset('SpclDef')),
            }
            // \1Type::
            // \1Type1::      db
            poke.species.type1 = this.rom.GetType(data[offset('Type1')]);
            // \1Type2::      db
            poke.species.type2 = this.rom.GetType(data[offset('Type2')]);

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

        protected PackDVs(dvs: TPP.Stats) {
            return (dvs.attack << 12) | (dvs.defense << 8) | (dvs.speed << 4) | (dvs.special_attack);
        }

        protected UnpackCaughtData(caught: number, ot: TPP.Trainer) {
            if (caught) {
                //CaughtTime (bits 14-15), CaughtLevel (bits 8-13), Caught(OT)Gender (bit 7), CaughtLocation (bits 0-6)
                const met: TPP.Pokemon['met'] = {
                    area_id: caught % 0x80,
                    level: caught >> 8 % 0x40,
                    game: "Crystal", //Crystal is the only one that sets CatchData
                    time_of_day: timeOfDay[caught >> 14]
                }
                ot && (ot.gender = (caught & 0x80) ? "Female" : "Male");
                return met;
            }
            return undefined;
        }

        public Init() {
            const hRomBank = 0xFF9D; // 0xFF9F; //GS
            //Evolution detect
            const { bank: evoStartBank, address: evoStartAddr } = this.rom.LinearAddressToBanked(this.rom.symTable["EvolutionAnimation"]);
            const { bank: evoEndBank, address: evoEndAddr } = this.rom.LinearAddressToBanked(this.rom.symTable["EvolutionAnimation.EvolutionAnimation"]);
            this.SetSelfCallEvent("Evolution Start", "Execute", evoStartAddr, "override/evolution_is_happening/true", hRomBank, evoStartBank);
            this.SetSelfCallEvent("Evolution End", "Execute", evoEndAddr - 7, "override/evolution_is_happening/false", hRomBank, evoEndBank); //Set hook before the returns before this symbol

            //Printer detect
            const { bank: printerStartBank, address: printerStartAddr } = this.rom.LinearAddressToBanked(this.rom.symTable["Printer_StartTransmission"]);
            const { bank: printerEndBank, address: printerEndAddr } = this.rom.LinearAddressToBanked(this.rom.symTable["Printer_ExitPrinter"]);
            this.SetSelfCallEvent("Printer Start", "Execute", printerStartAddr, "override/evolution_is_happening/true", hRomBank, printerStartBank);
            this.SetSelfCallEvent("Printer End", "Execute", printerEndAddr, "override/evolution_is_happening/false", hRomBank, printerEndBank);
        }
    }
}
