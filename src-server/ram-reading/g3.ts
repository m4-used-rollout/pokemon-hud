/// <reference path="base.ts" />

namespace RamReader {

    interface Gen3PartyPokemon extends TPP.PartyPokemon, TPP.BoxedPokemon {
        encyption_key?: number;
        checksum?: number;
        species: Pokemon.Convert.StatSpeciesWithExp;
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

    //TODO: Get these from .map file
    const EwramPartyLocation = 0x244EC;
    const PartyBytes = 600;
    const PCBlockPointer = 0x3005D94;
    const PCBytes = 33730;
    const SaveBlock1Pointer = 0x03005D8C;
    const SaveBlock2Pointer = 0x03005D90;
    const FlagsOffset = 0x1270;
    const InventoryOffset = 0x490;
    const IwramClockAddr = 0x5CF8
    const IwramMusicAddr = 0x0F48

    export class Gen3 extends RamReaderBase {

        protected TrainerSecurityKey = 0;
        protected get TrainerSecurityHalfKey() {
            return this.TrainerSecurityKey % 0x10000;
        }

        protected Markings = ['●', '■', '▲', '♥'];

        public ReadParty = this.CachedEmulatorCaller(`EWRAM/ReadByteRange/${EwramPartyLocation.toString(16)}/${PartyBytes.toString(16)}`, this.WrapBytes(data => {
            const party = new Array<TPP.PartyPokemon>();
            for (let i = 0; i < data.length; i += 100)
                party.push(this.ParsePokemon(data.slice(i, i + 100)));
            return party;//.filter(p => !!p);
        }));

        public ReadPC = this.CachedEmulatorCaller(`ReadByteRange/*${PCBlockPointer.toString(16)}/${PCBytes.toString(16)}`, this.WrapBytes(data => ({
            current_box_number: data.readUInt32LE(0),
            boxes: this.rom.ReadStridedData(data.slice(4, 0x8344), 0, 30 * 80, 14).map((box, i) => ({
                box_number: i + 1,
                box_name: this.rom.ConvertText(data.slice(0x8344 + (i * 9), 0x8344 + ((i + 1) * 9))),
                box_contents: this.rom.ReadStridedData(box, 0, 80, 30).map((pkmdata, b) => this.ParsePokemon(pkmdata, b + 1)).filter(p => !!p)
            } as TPP.BoxData))
        } as TPP.CombinedPCData)));

        protected TrainerChunkReaders = [
            //Save Block 2 (Do first to get current security key)
            this.CachedEmulatorCaller<TPP.TrainerData>(`ReadByteRange/*${SaveBlock2Pointer.toString(16)}/B0`, this.WrapBytes(data => {
                this.TrainerSecurityKey = data.readUInt32LE(0xAC);
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
                    seen_list: seenList
                } as TPP.TrainerData;
            }), 0xE * 2, 0x13 * 2),
            //Inventory
            this.CachedEmulatorCaller<TPP.TrainerData>(`ReadByteRange/*${SaveBlock1Pointer.toString(16)}+${InventoryOffset.toString(16)}/4F8`, this.WrapBytes(data => {
                const halfKey = this.TrainerSecurityHalfKey;
                const ballPocket = this.ParseItemCollection(data.slice(0x1C0), 16, halfKey);
                return {
                    money: data.readUInt32LE(0) ^ this.TrainerSecurityKey,
                    coins: data.readUInt16LE(4) ^ this.TrainerSecurityHalfKey,
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
        ] as Array<() => Promise<TPP.TrainerData>>;

        protected ParseItemCollection(itemData: Buffer, length = itemData.length / 4, key = 0) {
            return this.rom.ReadStridedData(itemData, 0, 4, length, true).map(data => Pokemon.Convert.ItemToRunStatus(this.rom.GetItem(data.readUInt16LE(0)), data.readUInt16LE(2) ^ key));
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
            pkmn.held_item = Pokemon.Convert.ItemToRunStatus(this.rom.GetItem(sections.A.readUInt16LE(2)));
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
                if (pkmn.species.gender_ratio == 255) {
                    pkmn.gender = '';
                }
                else if (pkmn.species.gender_ratio == 254) {
                    pkmn.gender = "Female";
                }
                else if (pkmn.species.gender_ratio == 0) {
                    pkmn.gender = "Male";
                }
                else {
                    pkmn.gender = (pkmn.personality_value % 256) > pkmn.species.gender_ratio ? "Male" : "Female";
                }
                if (pkmn.species.expFunction) {
                    pkmn.level = pkmn.level || Pokemon.ExpCurve.ExpToLevel(exp, pkmn.species.expFunction);
                    pkmn.experience = {
                        current: exp,
                        next_level: pkmn.species.expFunction(pkmn.level + 1),
                        this_level: pkmn.species.expFunction(pkmn.level),
                        remaining: null
                    }
                    pkmn.experience.remaining = pkmn.experience.next_level - pkmn.experience.current;
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