/// <reference path="base.ts" />

namespace RamReader {

    interface Gen3PartyPokemon extends TPP.PartyPokemon {
        encyption_key?: number;
        checksum?: number;
        species: Pokemon.Species;
        item: Pokemon.Item;
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

    export class Gen3 extends RamReaderBase {

        protected Markings = ['●', '■', '▲', '♥'];

        public ReadParty = this.CachedEmulatorCaller(`EWRAM/ReadByteRange/244EC/258`, this.WrapBytes(data => {
            const party = new Array<TPP.PartyPokemon>();
            for (let i = 0; i < data.length; i += 100)
                party.push(this.ParsePokemon(data.slice(i, i + 100)));
            return party;//.filter(p => !!p);
        }));

        protected ParsePokemon(pkmdata: Buffer): TPP.PartyPokemon {
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
            if (!sections)
                return null;

            //Growth Section
            pkmn.species = this.rom.GetSpecies(sections.A.readUInt16LE(0));
            pkmn.held_item = this.rom.GetItem(sections.A.readUInt16LE(2));
            const exp = sections.A.readUInt16LE(4);
            const ppUps = sections.A[8];
            pkmn.friendship = sections.A[9];

            //Moves
            pkmn.moves = [
                this.rom.GetMove(sections.B.readUInt16LE(0)) as any as TPP.Move,
                this.rom.GetMove(sections.B.readUInt16LE(2)) as any as TPP.Move,
                this.rom.GetMove(sections.B.readUInt16LE(4)) as any as TPP.Move,
                this.rom.GetMove(sections.B.readUInt16LE(6)) as any as TPP.Move
            ].map((m, i) => {
                m.pp = sections.B[8 + i];
                m.pp_up = (ppUps >> (2 * i)) % 4;
                return m;
            });

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
            pkmn.ability = pkmn.species.abilities[ivs >> 31];
            const ribbons = sections.D.readUInt32LE(8);
            pkmn.ribbons = this.ParseHoennRibbons(ribbons);
            //pkmn.fateful_encounter = (ribbons >> 27) % 16;
            //pkmn.obedient = ribbons >> 31;

            if (pkmdata.length >= 80) {
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
                if (pkmn.species.genderRatio == 255) {
                    pkmn.gender = '';
                }
                else if (pkmn.species.genderRatio == 254) {
                    pkmn.gender = "Female";
                }
                else if (pkmn.species.genderRatio == 0) {
                    pkmn.gender = "Male";
                }
                else {
                    pkmn.gender = (pkmn.personality_value % 256) > pkmn.species.genderRatio ? "Male" : "Female";
                }
                if (pkmn.species.expFunction) {
                    pkmn.level = pkmn.level || Pokemon.ExpCurve.ExpToLevel(pkmn.experience.current, pkmn.species.expFunction);
                    pkmn.experience = {
                        current: exp,
                        next_level: pkmn.level == 100 ? 0 : pkmn.species.expFunction(pkmn.level + 1),
                        this_level: pkmn.species.expFunction(pkmn.level),
                        remaining: null
                    }
                    pkmn.experience.remaining = pkmn.experience.next_level - pkmn.experience.current;
                }
            }

            return pkmn;
        }

        protected Decrypt(data: Buffer, key: number, checksum?: number) {
            for (let i = 0; i < data.length; i += 4) {
                data.writeInt32LE(data.readInt32LE(i) ^ key, i);
            }
            if (typeof (checksum) == "number" && this.CalcChecksum(data) != checksum) {
                return null;
            }
            return data;
        }
    }
}