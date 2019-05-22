/// <reference path="./base.ts" />
/// <reference path="../rom-reading/romreaders/concrete/colxd.ts" />

namespace RamReader {

    const net = require('net') as typeof import('net');

    const baseAddrPtr = 0x8047ADB8; //Colosseum
    const partyOffset = 0xA0;
    const partySize = 0x750;

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
        private transmitState: (state: TPP.RunStatus) => void;

        public Read(state: TPP.RunStatus, transmitState: (state: TPP.RunStatus) => void) {
            this.currentState = state;
            this.transmitState = transmitState;
            this.Init();
        }

        public Stop() {

        }

        public Init() {
            console.log(`Connecting to DolphinWatch (${this.hostname}:${this.port})`);
            this.connection = net.connect(this.port, this.hostname);
            this.connection.on('data', data => this.ResponseHandler(data.toString('ascii')));
            let partyAddr: number;
            this.connection.on('connect', () => this.Subscribe(baseAddrPtr, 4, data => {
                const baseAddr = data.readUInt32BE(0);
                console.log(`Save Struct Base Address: ${baseAddr.toString(16)}`);
                if (partyAddr)
                    this.Unsubscribe(partyAddr);
                partyAddr = baseAddr + partyOffset;
                this.Subscribe(partyAddr, partySize, this.SendParty);
            }));
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
                case "MEM_MULTI":
                    const address = parseInt(parts.shift());
                    if (!this.Handlers[address])
                        return this.Unsubscribe(address);
                    return this.Handlers[address](Buffer.from(parts.map(p => parseInt(p))));
            }
        }

        private ParsePokemon = (monData: Buffer) => monData.readUInt16BE(0x0) > 0 ? (<TPP.ShadowPokemon><any>{
            species: Pokemon.Convert.SpeciesToRunStatus(this.rom.GetSpecies(monData.readUInt16BE(0x0))),
            personality_value: monData.readUInt32BE(0x4),
            met: {
                map_id: monData.readUInt16BE(0xC),
                level: monData[0xE],
                caught_in: this.rom.GetItem(monData[0xF] + 1).name,
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
            status: Status[monData.readUInt16BE(0x65)],
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
            purification: monData.readInt32BE(0xDC),
            shadow_exp: monData.readUInt32BE(0xF0),
            //obedient: monData[0xF8] > 0,
            data: monData.toString('hex')
        }) : null;


        private ParseMove = (moveData: Buffer) => <TPP.Move>Object.assign({},
            Pokemon.Convert.MoveToRunStatus(this.rom.GetMove(moveData.readUInt16BE(0))),
            <Partial<TPP.Move>>{
                pp: moveData[2],
                pp_up: moveData[3]
            });


        public SendParty = (data: Buffer) => this.ReadParty(data).then(party => {
            if (party) {
                this.currentState.party = party;
                this.transmitState(this.currentState);
            }
        }).catch(err => console.error(err));

        public ReadParty: (data?: Buffer) => Promise<TPP.PartyData> = data => new Promise(resolve => resolve(
            this.rom.ReadStridedData(data, 0, 0x138, 6).map(this.ParsePokemon).filter(p => !!p)));

        public ReadPC: (data?: Buffer) => Promise<TPP.CombinedPCData>;
        public ReadBattle: (data?: Buffer) => Promise<TPP.BattleStatus>;
        protected TrainerChunkReaders: ((data?: Buffer) => Promise<TPP.TrainerData>)[];
        protected OptionsSpec: OptionsSpec;
    }
}