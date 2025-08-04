/// <reference path="./base.ts" />
/// <reference path="../rom-reading/romreaders/gcn.ts" />

namespace RamReader {

    const net = require('net') as typeof import('net');

    export abstract class DolphinWatchBase<T extends RomReader.GCNReader> extends RamReaderBase<T> {

        private connection: import('net').Socket;
        protected transmitState: (state?: TPP.RunStatus) => void;
        private saveStateInterval: ReturnType<typeof setInterval>;


        public Read(state: TPP.RunStatus, transmitState: (state: TPP.RunStatus) => void) {
            this.currentState = state;
            this.transmitState = (s = this.currentState) => transmitState(s);
            this.Init();
        }

        public Stop() {
            console.log("Disconnected from DolphinWatch");
            this.connection.end();
        }

        protected abstract battleBagAddress: number;
        protected abstract battlePartyAddress: number;
        protected abstract enemyTrainerAddress: number;
        protected abstract enemyPartyAddress: number;
        protected abstract baseAddrPtr: number;
        protected abstract musicIdAddress: number;
        protected abstract musicIdBytes: number;
        protected abstract fsysStartAddress: number;

        // Col values, XD does this differently
        protected singleBattleTrainerStart = 575;
        protected singleBattleTrainerEnd = 674;

        protected abstract fsysSlots: number;
        protected abstract fsysStructBytes: number;
        protected abstract saveCountOffset: number;
        protected abstract partyOffset: number;
        protected abstract partySize: number;
        protected abstract partyPokeBytes: number;
        protected abstract trainerDataOffset: number;
        protected abstract trainerDataSize: number;
        protected abstract pokedexOffset: number;
        protected abstract pokedexSize: number;
        protected abstract pcOffset: number;
        protected abstract pcSize: number;
        protected abstract pcBoxes: number;
        protected abstract pcBoxBytes: number;
        protected abstract bagSize: number;
        protected abstract itemPCSize: number;
        protected abstract daycareOffset: number;
        protected abstract battlePartyPokeBytes: number;
        protected abstract enemyTrainerBytes: number;

        private currentPartyAddr: number;
        private currentTrainerAddr: number;
        private currentPokedexAddr: number;
        private currentItemPCAddr: number;
        private currentPCAddrs: number[] = [];
        private currentDaycareAddr: number;
        private currentSaveBaseAddr: number;

        protected BaseAddrSubscriptions(baseSub: (oldAddr: number, offset: number, size: number, handler: (data: Buffer) => void) => number) {
            this.partyOffset && (this.currentPartyAddr = baseSub(this.currentPartyAddr, this.partyOffset, this.partySize, this.SendParty));
            this.trainerDataOffset && (this.currentTrainerAddr = baseSub(this.currentTrainerAddr, this.trainerDataOffset, this.trainerDataSize, this.SendTrainer));
            this.pokedexOffset && (this.currentPokedexAddr = baseSub(this.currentPokedexAddr, this.pokedexOffset, this.pokedexSize, this.SendPokedex));
            this.pcOffset && this.itemPCSize && (this.currentItemPCAddr = baseSub(this.currentItemPCAddr, this.pcOffset + this.pcSize, this.itemPCSize, this.SendItemPC));
            this.daycareOffset && (this.currentDaycareAddr = baseSub(this.currentDaycareAddr, this.daycareOffset, this.partyPokeBytes + 8, this.SendDaycare));
            if (this.pcOffset && this.pcBoxBytes && this.pcBoxes)
                for (var i = this.pcBoxes; i > 0; i--)
                    this.currentPCAddrs[i - 1] = baseSub(this.currentPCAddrs[i - 1],
                        this.pcOffset + (this.pcBoxBytes * (i - 1)),
                        this.pcBoxBytes, this.PCBoxReader(i));
        }

        protected AdditionalSubscriptions() {

        }

        public Init() {
            console.log(`Connecting to DolphinWatch (${this.hostname}:${this.port})`);
            if (this.connection)
                this.Stop();
            this.connection = net.connect(this.port, this.hostname);
            this.connection.on('data', data => this.DataHandler(data));
            this.connection.on("error", err => setTimeout(() => this.Init(), 1000));
            this.connection.on('connect', () => {
                this.Subscribe(this.baseAddrPtr, 4, data => {
                    this.currentSaveBaseAddr = data.readUInt32BE(0);
                    console.log(`Save Struct Base Address: ${this.currentSaveBaseAddr.toString(16)}`);

                    const BaseSub = (oldAddr: number, offset: number, size: number, handler: (data: Buffer) => void) => {
                        this.Unsubscribe(oldAddr);
                        const addr = this.currentSaveBaseAddr + offset;
                        this.Subscribe(addr, size, handler);
                        return addr;
                    }

                    this.BaseAddrSubscriptions(BaseSub);

                    if (!this.saveStateInterval && this.config.saveStateIntervalSeconds && this.config.saveStatePath) {
                        this.saveStateInterval = setInterval(() => {
                            const savePath = `${this.config.saveStatePath}/${new Date().toISOString().replace(/:/g, '-')}-${this.config.runName}.state`.replace(/\/\//g, "/").replace(/\s/g, '');
                            console.log(`Saving state to ${savePath}`);
                            this.connection.write(`SAVE ${savePath};\n`, 'ascii');
                        },
                            this.config.saveStateIntervalSeconds * 1000);
                    }
                });
                this.battleBagAddress && this.Subscribe(this.battleBagAddress, this.bagSize, data => this.SendBag(data));
                this.battlePartyAddress && this.Subscribe(this.battlePartyAddress, this.battlePartyPokeBytes * 6, data => this.SendParty(data, this.battlePartyPokeBytes, true));
                this.enemyPartyAddress && this.Subscribe(this.enemyPartyAddress, this.battlePartyPokeBytes * 6, data => this.SendEnemyParty(data));
                this.enemyTrainerAddress && this.Subscribe(this.enemyTrainerAddress, this.enemyTrainerBytes, data => this.SendEnemyTrainer(data));
                this.fsysStartAddress && this.Subscribe(this.fsysStartAddress, this.fsysSlots * this.fsysStructBytes, this.FsysWatcher);
                this.musicIdAddress && this.Subscribe(this.musicIdAddress, 4, this.SendMusic);
                this.AdditionalSubscriptions();
            });
        }

        public Script_fixsaving() {
            // Sometimes when reloading a save state, the game will complain that the
            // memory card you're saving to is not the original you loaded from.
            // Setting the in-memory save count to 0 makes it bypass this check
            // and lets you save again.
            if (this.currentSaveBaseAddr) {
                this.Write(this.currentSaveBaseAddr + this.saveCountOffset, 32, 0);
                return "Reset save count to 0. Saving should now be possible again.";
            }
            return "Save file memory location is unknown. Could not fix saving.";
        }

        public ReadByteRange(address: number, length: number, handler: (data: Buffer) => void) {
            this.Subscribe(address, length, (data: Buffer) => {
                this.Unsubscribe(address);
                handler(data);
            });
        }

        public Subscribe(address: number, length: number, handler: (data: Buffer) => void) {
            if (!this.Handlers[address])
                this.connection.write(`SUBSCRIBE_MULTI ${length} ${address};\n`, 'ascii');
            this.Handlers[address] = handler;
        }

        public Unsubscribe(address: number) {
            this.connection.write(`UNSUBSCRIBE_MULTI ${address};\n`, 'ascii');
            delete this.Handlers[address];
        }

        public Write(address: number, bitSize: number, value: number) {
            this.connection.write(`WRITE ${bitSize} ${address} ${value};\n`, 'ascii');
        }

        private Handlers: { [address: number]: (data: Buffer) => void } = {};

        private currentData = "";
        private DataHandler(chunk: Buffer) {
            this.currentData += chunk.toString('ascii');
            const unfinishedChunk = this.currentData.lastIndexOf("\n") != this.currentData.length - 1;
            const commands = this.currentData.split('\n');
            if (unfinishedChunk)
                this.currentData = commands.pop();
            else
                this.currentData = "";
            commands.filter(d => !!d).forEach(d => this.ResponseHandler(d));
        }

        private ResponseHandler(raw: string) {
            const parts = raw.split(' ');
            const cmd = parts.shift();
            switch (cmd) {
                case "MEM":
                case "MEM_MULTI":
                    const address = parseInt(parts.shift());
                    if (!this.Handlers[address])
                        return this.Unsubscribe(address);
                    return this.Handlers[address](Buffer.from(parts.map(p => parseInt(p))));
            }
        }

        protected ParsePokemon = (monData: Buffer) => monData.readUInt16BE(0x0) > 0 ? this.AugmentShadowMon(<TPP.ShadowPokemon><any>{
            species: Pokemon.Convert.SpeciesToRunStatus(this.rom.GetSpecies(monData.readUInt16BE(0x0))),
            personality_value: monData.readUInt32BE(0x4),
            met: {
                map_id: monData.readUInt16BE(0xC),
                level: monData[0xE],
                caught_in: this.rom.GetItem(monData[0xF]).name,
                game: this.Game[monData[0x8]]
            },
            original_trainer: {
                gender: this.ParseGender(monData[0x10]),
                secret: monData.readUInt16BE(0x14),
                id: monData.readUInt16BE(0x16),
                name: this.rom.ReadString(monData.slice(0x18))
            },
            name: this.rom.ReadString(monData.slice(0x2E)) || this.rom.ReadString(monData.slice(0x44)),
            experience: {
                current: monData.readUInt32BE(0x5C)
            },
            level: monData[0x60],
            status: this.Status[monData[0x65]],
            sleep_turns: monData.readInt8(0x69),
            //tox_turns: monData.readInt8(0x6B),
            moves: [
                this.ParseMove(monData.slice(0x78)),
                this.ParseMove(monData.slice(0x7C)),
                this.ParseMove(monData.slice(0x80)),
                this.ParseMove(monData.slice(0x84))
            ].filter(m => !!(m && m.id)),
            held_item: monData.readUInt16BE(0x88) > 0 ? Pokemon.Convert.ItemToRunStatus(this.rom.GetItem(monData.readUInt16BE(0x88))) : null,
            health: [monData.readUInt16BE(0x8A), monData.readUInt16BE(0x8C)],
            stats: {
                hp: monData.readUInt16BE(0x8C),
                attack: monData.readUInt16BE(0x8E),
                defense: monData.readUInt16BE(0x90),
                special_attack: monData.readUInt16BE(0x92),
                special_defense: monData.readUInt16BE(0x94),
                speed: monData.readUInt16BE(0x96)
            },
            evs: {
                hp: monData.readUInt16BE(0x98),
                attack: monData.readUInt16BE(0x9A),
                defense: monData.readUInt16BE(0x9C),
                special_attack: monData.readUInt16BE(0x9E),
                special_defense: monData.readUInt16BE(0xA0),
                speed: monData.readUInt16BE(0xA2)
            },
            ivs: {
                hp: monData.readUInt16BE(0xA4),
                attack: monData.readUInt16BE(0xA6),
                defense: monData.readUInt16BE(0xA8),
                special_attack: monData.readUInt16BE(0xAA),
                special_defense: monData.readUInt16BE(0xAC),
                speed: monData.readUInt16BE(0xAE)
            },
            friendship: monData.readUInt16BE(0xB0),
            condition: {
                coolness: monData[0xB2],
                beauty: monData[0xB3],
                cuteness: monData[0xB4],
                smartness: monData[0xB5],
                toughness: monData[0xB6],
                feel: monData[0xBC]
            },
            ribbons: [
                this.ParseRibbon(monData[0xB7], "Cool"),
                this.ParseRibbon(monData[0xB8], "Beauty"),
                this.ParseRibbon(monData[0xB9], "Cute"),
                this.ParseRibbon(monData[0xBA], "Smart"),
                this.ParseRibbon(monData[0xBB], "Tough"),
                this.ParseRibbon(monData[0xBD], "Hoenn Champion"),
                this.ParseRibbon(monData[0xBE], "Winning"),
                this.ParseRibbon(monData[0xBF], "Victory"),
                this.ParseRibbon(monData[0xC0], "Artist"),
                this.ParseRibbon(monData[0xC1], "Effort"),
                this.ParseRibbon(monData[0xC2], "Champion Battle"),
                this.ParseRibbon(monData[0xC3], "Regional Champion"),
                this.ParseRibbon(monData[0xC4], "National Champion"),
                this.ParseRibbon(monData[0xC5], "Country"),
                this.ParseRibbon(monData[0xC6], "National"),
                this.ParseRibbon(monData[0xC7], "Earth"),
                this.ParseRibbon(monData[0xC8], "World"),
            ].filter(r => !!r),
            pokerus: this.ParsePokerus(monData[0xCA]),
            is_egg: monData[0xCB] > 0,
            ability: this.rom.GetSpecies(monData.readUInt16BE(0x0)).abilities[monData[0xCC]] || this.rom.GetSpecies(monData.readUInt16BE(0x0)).abilities[0],
            //fateful_encounter: monData[0xCD] > 0,
            marking: this.ParseMarkings(monData[0xCF]),
            pokerus_remaining: monData[0xD0],
            shadow_id: monData.readUInt16BE(0xD8),
            purification: { current: monData.readInt32BE(0xDC), initial: -100 },
            in_hyper_mode: monData[0xE9] != 0,
            shadow_exp: monData.readUInt32BE(0xF0),
            //obedient: monData[0xF8] > 0,
            //data: monData.toString('hex')
        }) : null;

        protected AugmentShadowMon(mon: TPP.ShadowPokemon) {
            mon.is_shadow = mon.shadow_id > 0 && (!mon.purification || mon.purification.current > -100);
            const shadowData = this.rom.shadowData[mon.shadow_id];
            if (mon.is_shadow && shadowData) {
                mon.purification = mon.purification || { current: shadowData.purificationStart };
                mon.purification.initial = shadowData.purificationStart;
                mon.catch_rate = shadowData.catchRate;

                const shadowMoves = (shadowData.shadowMoves || [this.rom.GetMove(0x164)]) //Fall back to Shadow Rush (Col)
                    .map(m => Object.assign(Pokemon.Convert.MoveToRunStatus(m), { is_shadow: true }) as TPP.ShadowMove);
                const shadowMoveCount = shadowMoves.length;
                for (let i = -1; shadowMoves.length < 4; i--) {
                    shadowMoves.push((<TPP.ShadowMove>{
                        id: i,
                        name: "????",
                        is_shadow: true
                    }));
                }

                const shadowMoveSlot = (slot: number) => (shadowMoveCount - 1 + slot - 1) % 3 + 1;

                mon.moves[0] = shadowMoves[0];
                const purificationPercentage = Math.max(0, mon.purification.current) / mon.purification.initial * 100;
                if (purificationPercentage >= 80 && mon.moves[shadowMoveSlot(1)] || shadowMoves[shadowMoveSlot(1)].id > 0)
                    mon.moves[shadowMoveSlot(1)] = shadowMoves[shadowMoveSlot(1)];
                if (purificationPercentage >= 60)
                    mon.nature = "????";
                if (purificationPercentage >= 40 && mon.moves[shadowMoveSlot(2)] || shadowMoves[shadowMoveSlot(2)].id > 0)
                    mon.moves[shadowMoveSlot(2)] = shadowMoves[shadowMoveSlot(2)];
                if (purificationPercentage >= 20 && mon.moves[shadowMoveSlot(3)] || shadowMoves[shadowMoveSlot(3)].id > 0)
                    mon.moves[shadowMoveSlot(3)] = shadowMoves[shadowMoveSlot(3)];
            }
            return mon;
        }


        protected ParseMove = (moveData: Buffer) => <TPP.Move>Object.assign({},
            Pokemon.Convert.MoveToRunStatus(this.rom.GetMove(moveData.readUInt16BE(0))),
            <Partial<TPP.Move>>{
                pp: moveData[2],
                pp_up: moveData[3]
            });


        public SendParty = (data: Buffer, monBytes = this.partyPokeBytes, inBattle = false) => this.ReadParty(data, monBytes).then(party => {
            this.currentState.in_battle = false;
            if (party && party.length) {
                // if (party.every(p => p && p.original_trainer && p.original_trainer.name && p.original_trainer.name.toLowerCase() == "eagun")) {
                //     this.currentState.in_battle = false;
                //     return; //Almost certainly we're watching Eagun fight and we don't actually own this party
                // }
                if (inBattle)
                    this.currentState.battle_party = party;
                else
                    this.currentState.party = party;
                // if (this.IsPartyDefeated(party)) {
                //     this.currentState.in_battle = false;
                // }
                this.currentState.in_battle = inBattle;// && !this.IsPartyDefeated(party);
                this.transmitState();
            }
        }).catch(err => console.error(err));

        public SendEnemyParty = (data: Buffer) => this.ReadParty(data, this.battlePartyPokeBytes).then(party => {
            const enemyParty = party as TPP.EnemyParty;
            if (enemyParty && enemyParty.length > 0) {
                // if (this.IsPartyDefeated(party))
                //     this.currentState.in_battle = false;
                this.currentState.battle_kind = "Trainer";
                this.currentState.enemy_trainers = this.currentState.enemy_trainers || [this.rom.GetTrainer(1)];
                enemyParty[0] && (enemyParty[0].active = true);
                if (this.currentState.enemy_trainers && this.currentState.enemy_trainers[0] && !(this.currentState.enemy_trainers[0].id >= this.singleBattleTrainerStart && this.currentState.enemy_trainers[0].id <= this.singleBattleTrainerEnd))
                    enemyParty[1] && (enemyParty[1].active = true);
                this.currentState.enemy_party = this.ConcealEnemyParty(party);
                this.transmitState();
            }
        }).catch(err => console.error(err));

        public SendEnemyTrainer = (data: Buffer) => {
            const trainerId = data.readUInt16BE(0);
            const trainerName = this.rom.ReadString(data.slice(4));
            const trainer = this.rom.GetTrainer(trainerId) || { id: trainerId, name: trainerName } as Pokemon.Trainer;
            //console.log(`Currently fighting trainer ${trainerId} - ${trainerName}`);
            if (trainer && trainer.id == 779)
                return; //Ignore Eagun Skrub fight
            if (trainer && trainer.id > 0 && trainer.name && !(this.currentState.enemy_trainers || []).find(t => t.id == trainer.id)) {
                this.currentState.enemy_trainers = trainer ? [Pokemon.Convert.EnemyTrainerToRunStatus(trainer)] : null;
                this.transmitState();
            }
        }

        public SendTrainer = (data: Buffer) => this.ReadTrainer(data).then(trainer => {
            if (trainer.id) {
                this.currentState = Object.assign(this.currentState, trainer);
                this.transmitState();
            }
        }).catch(err => console.error(err));

        public SendBag = (data: Buffer) => {
            const bag = this.ReadBag(data);
            if (Object.keys(bag).some(k => bag[k].length > 0)) {
                this.currentState.items = Object.assign(this.currentState.items || {}, bag);
                this.transmitState();
            }
        };

        public SendPokedex = (data: Buffer) => this.ReadPokedex(data).then(dex => {
            this.currentState.caught_list = dex.owned;
            this.currentState.caught = dex.owned.length;
            this.currentState.seen_list = dex.seen;
            this.currentState.seen = dex.seen.length;
            this.transmitState();
        }).catch(err => console.error(err));

        public SendItemPC = (data: Buffer) => this.ReadItemPC(data).then(pcItems => {
            if (pcItems) {
                this.currentState.items = this.currentState.items || {};
                this.currentState.items.pc = pcItems;
                this.transmitState();
            }
        }).catch(err => console.error(err));

        // public SendPC = (data: Buffer) => this.ReadPC(data).then(pc => {
        //     if (pc) {
        //         this.currentState.pc = pc;
        //         this.transmitState();
        //     }
        // }).catch(err => console.error(err));

        public SendDaycare = (data: Buffer) => this.ReadDaycare(data).then(daycare => {
            this.currentState.daycare = [daycare].filter(d => !!d);
            this.transmitState();
        });

        public SendMap = (data: Buffer) => {
            const mapId = data.readUInt16BE(0);
            const map = this.rom.GetMap(mapId) || this.rom.DefaultMap;
            console.log(`on map ${mapId} (${map.areaId})`);
            this.currentState.map_id = map.id;
            this.currentState.map_name = map.name;
            this.transmitState();
        };

        public FsysWatcher = (data: Buffer) => {
            let changedState = false;
            this.currentState["fsys"] = this.rom.ReadArray(data, 0, this.fsysStructBytes, this.fsysSlots)
                .map(fData => fData.readUInt32BE(0x34))
                .map((fsysId, i) => {
                    const map = i == 0 ? this.rom.GetMap(fsysId) : { id: null, name: null };
                    if (fsysId && fsysId != this.currentState.map_id && map.id == fsysId && map.name) {
                        this.currentState.map_id = map.id;
                        this.currentState.map_name = map.name;
                        this.currentState.in_battle = fsysId > 1000;
                    }
                    else
                        return fsysId;
                    changedState = true;
                    return fsysId;
                });
            if (changedState)
                this.transmitState();
        };

        public SendMusic = (data: Buffer) => {
            const musicId = this.musicIdBytes == 4 ? data.readUInt32BE(0) : data.readUInt16BE(0);
            if (musicId != this.currentState.music_id) {
                this.currentState.music_id = musicId;
                if (this.musicIdBytes == 2 && musicId == 8) //music fades out in XD
                    this.currentState.in_battle = false;
                this.transmitState();
            }
        }

        public ReadParty: (data?: Buffer, monBytes?: number) => Promise<TPP.PartyData> = (data, monBytes) => new Promise(resolve => resolve(
            this.rom.ReadArray(data, 0, monBytes, 6).map(this.ParsePokemon).filter(p => !!p)));

        public ReadTrainer = (data?: Buffer) => new Promise<TPP.TrainerData>(resolve => resolve({
            name: this.rom.ReadString(data),
            secret: data.readUInt16BE(0x2C),
            id: data.readUInt16BE(0x2E),
            items: this.ReadBag(data.slice(0x780)),
            gender: this.ParseGender(data[0xA80]),
            money: data.readUInt32BE(0xA84),
            coins: data.readUInt32BE(0xA88),
            partner_name: this.rom.ReadString(data.slice(0xAC2))
        } as TPP.TrainerData));

        public ReadBag = (data: Buffer) => (<{ [key: string]: TPP.Item[] }>{
            items: this.ReadPocket(data.slice(0x0, 0x50)),
            key: this.ReadPocket(data.slice(0x50, 0xFC)),
            balls: this.ReadPocket(data.slice(0xFC, 0x13C)),
            tms: this.ReadPocket(data.slice(0x13C, 0x23C)),
            berries: this.ReadPocket(data.slice(0x23C, 0x2F4)),
            cologne: this.ReadPocket(data.slice(0x2F4, 0x300)),
            pc: (this.currentState.items || { pc: [] }).pc
        });

        public ReadPocket = (data: Buffer) => this.rom.ReadArray(data, 0, 4)
            .map(itemData => Object.assign(<TPP.Item>{}, this.rom.GetItem(itemData.readUInt16BE(0)), {
                count: itemData.readUInt16BE(2)
            })).filter(i => !!(i && i.id));

        public ReadPokedex = (data: Buffer) => new Promise<{ owned: number[], seen: number[] }>(resolve => {
            //console.log(`Pokedex Data: ${data.toString('hex')}`);
            const dex = this.rom.ReadArray(data, 0x4, 0xC, data.readUInt16BE(0))
                .map(data => ({
                    species: (this.rom.GetSpecies(data.readUInt16BE(0) & 0x7FFF) || { dexNumber: 0 }).dexNumber,
                    owned: /*(data.readUInt16BE(0) & 0xC000) == 0 ||*/ (data.readUInt16BE(0x6) == this.currentState.id && data.readUInt16BE(0x4) == this.currentState.secret)
                })).filter(d => !!d.species);
            resolve({
                owned: [],//dex.filter(d => d.owned).map(d => d.species),
                seen: dex.map(d => d.species)
            });
        });

        public ReadItemPC = (data: Buffer) => new Promise<TPP.Item[]>(resolve => resolve(this.ReadPocket(data)));

        protected currentPC: TPP.BoxData[];

        public PCBoxReader(boxNum: number) {
            return (data: Buffer) => {
                const box = this.ReadPCBox(data, boxNum);
                this.currentPC = this.currentPC || [];
                this.currentState.pc = this.currentState.pc || { current_box_number: 0, boxes: [] };
                this.currentState.pc.boxes = this.currentState.pc.boxes || [];
                this.currentPC[boxNum - 1] = box;
                this.currentState.pc.boxes = this.currentPC.filter(b => !!b);
                this.currentState.pc.current_box_number = boxNum;
                this.transmitState();
            }
        }

        public ReadPCBox = (data: Buffer, boxNum: number) => (<TPP.BoxData>{
            box_number: boxNum,
            box_name: this.rom.ReadString(data),
            box_contents: this.rom.ReadArray(data, 0x14, this.partyPokeBytes, 30).map((p, i) => Object.assign(this.ParsePokemon(p) || {}, { box_slot: i + 1 }) as TPP.PartyPokemon & TPP.BoxedPokemon).filter(p => !!p && !!p.species)
        });

        public ReadDaycare = (data: Buffer) => new Promise<TPP.PartyPokemon>(resolve => resolve(
            data.readInt8(0) < 1 ? null : this.ParsePokemon(data.slice(0x8))
        ));

        public ReadPC: (data?: Buffer) => Promise<TPP.CombinedPCData>;
        public ReadBattle: (data?: Buffer) => Promise<TPP.BattleStatus>;
        protected TrainerChunkReaders: Array<(trainerData?: TPP.TrainerData) => Promise<TPP.TrainerData>>;
        protected OptionsSpec: OptionsSpec;

        public IsPartyDefeated = (party: TPP.PartyData) => !party.some(p => p && p.health && p.health[0] > 0);

        protected Status: { [key: number]: string } = {
            3: "PSN",
            4: "TOX",
            5: "PAR",
            6: "BRN",
            7: "FRZ",
            8: "SLP"
        };

        protected Game: { [key: number]: string } = {
            0: "None",
            1: "FireRed",
            2: "LeafGreen",
            8: "Sapphire",
            9: "Ruby",
            10: "Emerald",
            11: "Colosseum/XD"
        };
    }
}