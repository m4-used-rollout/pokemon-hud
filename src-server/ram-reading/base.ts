/// <reference path="../rom-reading/romreaders/base.ts" />
/// <reference path="../../ref/runstatus.d.ts" />


namespace RamReader {

    export abstract class RamReaderBase {
        constructor(public rom: RomReader.RomReaderBase, public port: number, public hostname = "localhost") { }

        public ReadParty: () => Promise<TPP.PartyData>;

        public CallEmulator<T>(path: string, callback?: (data: string) => T) {
            return new Promise<T>((resolve, reject) => {
                try {
                    require('http').get(`http://${this.hostname}:${this.port}/${path}`, response => {
                        let data = '';
                        response.on('data', chunk => data += chunk);
                        if (callback) {
                            response.on('end', () => resolve(callback(data)));
                        }
                        else {
                            response.on('end', () => resolve(data as any as T));
                        }
                    }).on('error', reject);
                }
                catch (e) {
                    reject(e);
                }
            });
        }

        public CachedEmulatorCaller<T>(path: string, callback: (data: string) => T) {
            let lastInput: string = null;
            return () => this.CallEmulator<T>(path, data => {
                if (lastInput != data) {
                    try {
                        const result = callback(data);
                        if (result) {
                            lastInput = data;
                            return result;
                        }
                    }
                    catch (e) {
                        console.error(e);
                        return null;
                    }
                }
                return null;
            });
        }

        public WrapBytes<T>(callback: (data: Buffer) => T) {
            return (hex: string) => callback(Buffer.from(hex, "hex"));
        }

        protected Markings = ['●', '▲', '■', '♥', '★', '♦'];
        protected ParseMarkings(marks: number) {
            let marking = "";
            for (let i = 0; i < this.Markings.length; i++) {
                if (marks & i)
                    marking += this.Markings[i];
            }
            return marking;
        }

        protected abstract Decrypt(data: Buffer, key: number, checksum?: number): Buffer;

        public CalcChecksum(data: Buffer) {
            let sum = 0;
            for (let i = 0; i < data.length; i += 2) {
                sum += data.readInt16LE(i) % 0x10000;
            }
            return sum;
        }

        protected Descramble(data: Buffer, key: number) {
            if (!data)
                return null;
            const order = this.DataScrambleOrders[key % this.DataScrambleOrders.length];
            const sectionBytes = data.length / order.length;
            const descrambled = {} as { [key: string]: Buffer };
            for (let i = 0; i < order.length; i++) {
                descrambled[order[i]] = data.slice(sectionBytes * i, sectionBytes * (i + 1));
            }
            return descrambled as { A: Buffer, B: Buffer, C: Buffer, D: Buffer };
        }

        protected DataScrambleOrders = ["ABCD", "ABDC", "ACBD", "ACDB", "ADBC", "ADCB", "BACD", "BADC", "BCAD", "BCDA", "BDAC", "BDCA", "CABD", "CADB", "CBAD", "CBDA", "CDAB", "CDBA", "DABC", "DACB", "DBAC", "DBCA", "DCAB", "DCBA"];

        protected ParseStatus(status: number) {
            if (status % 8 > 0)
                return "SLP";
            if (status & 8)
                return "PSN";
            if (status & 16)
                return "BRN";
            if (status & 32)
                return "FRZ";
            if (status & 64)
                return "PAR";
            if (status & 128)
                return "TOX";
            return null;
        }

        protected ParsePokerus(pokerus:number) {
            const pkrs =  {
                infected: pokerus > 0,
                days_left: pokerus % 16,
                strain: pokerus >> 4,
                cured: false
            }
            pkrs.cured = pkrs.infected && !pkrs.days_left;
            return pkrs;
        }

        protected ParseGender(gender: number) {
            if (gender == 0) return "Male";
            if (gender == 1) return "Female";
            return null;
        }

        protected ParseRibbon(ribbonVal: number, ribbonName: string) {
            if (ribbonVal)
                return `${ribbonName} Ribbon ${this.RibbonRanks[ribbonVal]}`.trim();
            return null;
        }

        protected RibbonRanks = [null, "", "Super", "Hyper", "Master"];

        protected ParseHoennRibbons(ribbonVal) {
            return [
                this.ParseRibbon(ribbonVal % 8, "Cool"),
                this.ParseRibbon((ribbonVal >> 3) % 8, "Beauty"),
                this.ParseRibbon((ribbonVal >> 6) % 8, "Cute"),
                this.ParseRibbon((ribbonVal >> 9) % 8, "Smart"),
                this.ParseRibbon((ribbonVal >> 12) % 8, "Tough"),
                this.ParseRibbon((ribbonVal >> 15) % 2, "Champion"),
                this.ParseRibbon((ribbonVal >> 16) % 2, "Winning"),
                this.ParseRibbon((ribbonVal >> 17) % 2, "Victory"),
                this.ParseRibbon((ribbonVal >> 18) % 2, "Artist"),
                this.ParseRibbon((ribbonVal >> 19) % 2, "Effort"),
                this.ParseRibbon((ribbonVal >> 20) % 2, "Gift"),
                this.ParseRibbon((ribbonVal >> 21) % 2, "Gift"),
                this.ParseRibbon((ribbonVal >> 22) % 2, "Gift"),
                this.ParseRibbon((ribbonVal >> 23) % 2, "Gift"),
                this.ParseRibbon((ribbonVal >> 24) % 2, "Gift"),
                this.ParseRibbon((ribbonVal >> 25) % 2, "Gift"),
                this.ParseRibbon((ribbonVal >> 26) % 2, "Gift"),
            ].filter(r => !!r);
        }

        protected CalculateShiny(pokemon:TPP.Pokemon) {
            pokemon.shiny_value = ((pokemon.original_trainer.id ^ pokemon.original_trainer.secret) ^ (Math.floor(pokemon.personality_value / 65536) ^ (pokemon.personality_value % 65536)))
            return pokemon.shiny = pokemon.shiny_value < this.rom.ShinyThreshold();
        }
    }
}