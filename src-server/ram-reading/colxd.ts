/// <reference path="./base.ts" />
/// <reference path="../rom-reading/romreaders/concrete/colxd.ts" />

namespace RamReader {

    const net = require('net') as typeof import('net');


    const partyOffset = 0xA0;
    const partySize = 0x750;
    const partyPokeBytes = 0x138;
    const trainerDataOffset = 0x70;
    const trainerDataSize = 0xAC2 + 0x14;
    const pokedexOffset = 0x82A8;
    const pokedexSize = 0x1774;
    const pcOffset = 0xB88;
    const pcSize = 0x6DEC;
    const itemPCSize = 0x3AC;
    const battlePartyPokeBytes = 0x154;
    const enemyTrainerBytes = 0x1A;

    const battlePartyAddress = 0x8046E928;
    const enemyTrainerAddress = 0x80473038;
    const enemyPartyAddress = 0x80473B58;
    const mapAddress = 0x8047AC1A;
    const baseAddrPtr = 0x8047ADB8;

    const Status: { [key: number]: string } = {
        3: "PSN",
        4: "TOX",
        5: "PAR",
        6: "BRN",
        7: "FRZ",
        8: "SLP"
    };

    const Game: { [key: number]: string } = {
        0: "None",
        1: "FireRed",
        2: "LeafGreen",
        8: "Sapphire",
        9: "Ruby",
        10: "Emerald",
        11: "Colosseum/XD"
    };

    export class ColXD extends RamReaderBase<RomReader.ColXD> {

        private connection: import('net').Socket;
        private transmitState: (state?: TPP.RunStatus) => void;

        public Read(state: TPP.RunStatus, transmitState: (state: TPP.RunStatus) => void) {
            this.currentState = state;
            this.transmitState = (s = this.currentState) => transmitState(s);
            this.Init();
        }

        public Stop() {
            console.log("Disconnected from DolphinWatch");
            this.connection.end();
        }

        public Init() {
            console.log(`Connecting to DolphinWatch (${this.hostname}:${this.port})`);
            if (this.connection)
                this.Stop();
            this.connection = net.connect(this.port, this.hostname);
            this.connection.on('data', data => data.toString('ascii').split('\n').filter(d => !!d).forEach(d => this.ResponseHandler(d)));
            this.connection.on("error", err => setTimeout(() => this.Init(), 1000));
            let partyAddr: number;
            let trainerAddr: number;
            let pokedexAddr: number;
            let itemPCAddr: number;
            let pcAddr: number;
            this.connection.on('connect', () => {
                this.Subscribe(baseAddrPtr, 4, data => {
                    const baseAddr = data.readUInt32BE(0);
                    console.log(`Save Struct Base Address: ${baseAddr.toString(16)}`);

                    const BaseSub = (addr: number, offset: number, size: number, handler: (data: Buffer) => void) => {
                        this.Unsubscribe(addr);
                        addr = baseAddr + offset;
                        this.Subscribe(addr, size, handler);
                        return addr;
                    }

                    partyAddr = BaseSub(partyAddr, partyOffset, partySize, this.SendParty);
                    trainerAddr = BaseSub(trainerAddr, trainerDataOffset, trainerDataSize, this.SendTrainer);
                    pokedexAddr = BaseSub(pokedexAddr, pokedexOffset, pokedexSize, this.SendPokedex);
                    itemPCAddr = BaseSub(itemPCAddr, pcOffset + pcSize, itemPCSize, this.SendItemPC);
                    pcAddr = BaseSub(pcAddr, pcOffset, pcSize, this.SendPC);
                });
                this.Subscribe(battlePartyAddress, battlePartyPokeBytes * 6, data => this.SendParty(data, battlePartyPokeBytes, true));
                this.Subscribe(enemyPartyAddress, battlePartyPokeBytes * 6, data => this.SendEnemyParty(data));
                this.Subscribe(enemyTrainerAddress, enemyTrainerBytes, data => this.SendEnemyTrainer(data));
                //this.Subscribe(mapAddress, 2, data => this.SendMap(data));
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

        private Handlers: { [address: number]: (data: Buffer) => void } = {};

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

        private ParsePokemon = (monData: Buffer) => monData.readUInt16BE(0x0) > 0 ? this.AugmentShadowMon(<TPP.ShadowPokemon><any>{
            species: Pokemon.Convert.SpeciesToRunStatus(this.rom.GetSpecies(monData.readUInt16BE(0x0))),
            personality_value: monData.readUInt32BE(0x4),
            met: {
                map_id: monData.readUInt16BE(0xC),
                level: monData[0xE],
                caught_in: this.rom.GetItem(monData[0xF]).name,
                game: Game[monData[0x8]]
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
            status: Status[monData[0x65]],
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
            ability: this.rom.GetSpecies(monData.readUInt16BE(0x0)).abilities[monData[0xCC]],
            //fateful_encounter: monData[0xCD] > 0,
            marking: this.ParseMarkings(monData[0xCF]),
            pokerus_remaining: monData[0xD0],
            shadow_id: monData.readUInt16BE(0xD8),
            purification: { current: monData.readInt32BE(0xDC), initial: -100 },
            shadow_exp: monData.readUInt32BE(0xF0),
            //obedient: monData[0xF8] > 0,
            //data: monData.toString('hex')
        }) : null;

        private AugmentShadowMon = (mon: TPP.ShadowPokemon) => {
            mon.is_shadow = mon.shadow_id > 0 && mon.purification && mon.purification.current > -100;
            const shadowData = this.rom.shadowData[mon.shadow_id];
            if (mon.is_shadow && shadowData) {
                mon.nature = "????";
                mon.purification.initial = shadowData.purificationStart;
                mon.species.catch_rate = shadowData.catchRate;

                //Colosseum
                const shadowRush: TPP.ShadowMove = Pokemon.Convert.MoveToRunStatus(this.rom.GetMove(0x164));
                shadowRush.is_shadow = true;
                const nullMove = (<TPP.ShadowMove>{
                    id: 0,
                    name: "????",
                    is_shadow: true
                });
                mon.moves[0] = shadowRush;
                const purificationPercentage = Math.max(0, mon.purification.current) / mon.purification.initial * 100;
                if (purificationPercentage > 80 && mon.moves[1])
                    mon.moves[1] = Object.assign({}, nullMove, { id: -1 });
                if (purificationPercentage > 50 && mon.moves[2])
                    mon.moves[2] = Object.assign({}, nullMove, { id: -2 });
                if (purificationPercentage > 20 && mon.moves[3])
                    mon.moves[3] = Object.assign({}, nullMove, { id: -3 });
            }
            return mon;
        };


        private ParseMove = (moveData: Buffer) => <TPP.Move>Object.assign({},
            Pokemon.Convert.MoveToRunStatus(this.rom.GetMove(moveData.readUInt16BE(0))),
            <Partial<TPP.Move>>{
                pp: moveData[2],
                pp_up: moveData[3]
            });


        public SendParty = (data: Buffer, monBytes = 0x138, inBattle = false) => this.ReadParty(data, monBytes).then(party => {
            this.currentState.in_battle = inBattle;
            if (party && party.length) {
                this.currentState.party = party;
                if (this.IsPartyDefeated(party)) {
                    this.currentState.in_battle = false;
                }
                this.transmitState();
            }
        }).catch(err => console.error(err));

        public SendEnemyParty = (data: Buffer) => this.ReadParty(data, battlePartyPokeBytes).then(party => {
            const enemyParty = party as TPP.EnemyParty;
            if (enemyParty) {
                if (this.IsPartyDefeated(party))
                    this.currentState.in_battle = false;
                this.currentState.battle_kind = "Trainer";
                this.currentState.enemy_trainers = this.currentState.enemy_trainers || [this.rom.GetTrainer(1)];
                enemyParty[0] && (enemyParty[0].active = true);
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
            if (trainer && trainer.id > 0) {
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

        public SendPC = (data: Buffer) => this.ReadPC(data).then(pc => {
            if (pc) {
                this.currentState.pc = pc;
                this.transmitState();
            }
        }).catch(err => console.error(err));

        public SendMap = (data: Buffer) => {
            const mapId = data.readUInt16BE(0);
            console.log(`on map ${mapId}`);
            const map = this.rom.GetMap(mapId) || this.rom.DefaultMap;
            this.currentState.map_id = map.id;
            this.currentState.map_name = map.name;
            this.transmitState();
        };

        public ReadParty: (data?: Buffer, monBytes?: number) => Promise<TPP.PartyData> = (data, monBytes) => new Promise(resolve => resolve(
            this.rom.ReadStridedData(data, 0, monBytes, 6).map(this.ParsePokemon).filter(p => !!p)));

        public ReadTrainer = (data?: Buffer) => new Promise<TPP.TrainerData>(resolve => resolve({
            name: this.rom.ReadString(data),
            secret: data.readUInt16BE(0x2C),
            id: data.readUInt16BE(0x2E),
            items: this.ReadBag(data.slice(0x780)),
            gender: this.ParseGender(data[0xA80]),
            money: data.readUInt32BE(0xA84),
            coins: data.readUInt32BE(0xA88),
            partner_name: this.rom.ReadString(data.slice(0xAC2)),
            map_id: 0 //AAAAAAAAA
        } as TPP.TrainerData));

        public ReadTrainerInventory = (data: Buffer) => new Promise<TPP.TrainerData>(resolve => resolve({

        } as TPP.TrainerData));

        public ReadBag = (data: Buffer) => (<{ [key: string]: TPP.Item[] }>{
            items: this.ReadPocket(data.slice(0x0, 0x50)),
            key: this.ReadPocket(data.slice(0x50, 0xFC)),
            balls: this.ReadPocket(data.slice(0xFC, 0x13C)),
            tms: this.ReadPocket(data.slice(0x13C, 0x23C)),
            berries: this.ReadPocket(data.slice(0x23C, 0x2F4)),
            cologne: this.ReadPocket(data.slice(0x2F4, 0x300))
        });

        public ReadPocket = (data: Buffer) => this.rom.ReadStridedData(data, 0, 4)
            .map(itemData => Object.assign(<TPP.Item>{}, this.rom.GetItem(itemData.readUInt16BE(0)), {
                count: itemData.readUInt16BE(2)
            })).filter(i => !!(i && i.id));

        public ReadPokedex = (data: Buffer) => new Promise<{ owned: number[], seen: number[] }>(resolve => {
            //console.log(`Pokedex Data: ${data.toString('hex')}`);
            const dex = this.rom.ReadStridedData(data, 0x4, 0xC, data.readUInt16BE(0))
                .map(data => ({
                    species: (this.rom.GetSpecies(data.readUInt16BE(0) & 0x7FFF) || { dexNumber: 0 }).dexNumber,
                    owned: (data.readUInt16BE(0) & 0xC000) == 0 //|| (data.readUInt16BE(0x6) == this.currentState.id && data.readUInt16BE(0x4) == this.currentState.secret)
                })).filter(d => !!d.species);
            resolve({
                owned: dex.filter(d => d.owned).map(d => d.species),
                seen: dex.map(d => d.species)
            });
        });

        public ReadItemPC = (data: Buffer) => new Promise<TPP.Item[]>(resolve => resolve(this.ReadPocket(data)));

        public ReadPC: (data?: Buffer) => Promise<TPP.CombinedPCData> = data => new Promise<TPP.CombinedPCData>(resolve => resolve({
            boxes: this.rom.ReadStridedData(data, 0, 0x24A4, 3).map((b, i) => this.ReadPCBox(b, i + 1))
        } as TPP.CombinedPCData));

        public ReadPCBox = (data: Buffer, boxNum: number) => (<TPP.BoxData>{
            box_number: boxNum,
            box_name: this.rom.ReadString(data),
            box_contents: this.rom.ReadStridedData(data, 0x14, partyPokeBytes, 30).map((p, i) => Object.assign(this.ParsePokemon(p) || {}, { box_slot: i + 1 }) as TPP.PartyPokemon & TPP.BoxedPokemon).filter(p => !!p.species)
        });

        public ReadDaycare = (data: Buffer) => new Promise<TPP.PartyPokemon>(resolve => resolve(
            data.readInt8(0) < 1 ? null : this.ParsePokemon(data.slice(0x8))
        ));

        public ReadBattle: (data?: Buffer) => Promise<TPP.BattleStatus>;
        protected TrainerChunkReaders: ((data?: Buffer) => Promise<TPP.TrainerData>)[];
        protected OptionsSpec: OptionsSpec;

        public IsPartyDefeated = (party: TPP.PartyData) => !party.some(p => p && p.health && p.health[0] > 0);
    }
}