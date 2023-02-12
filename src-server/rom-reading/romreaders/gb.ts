/// <reference path="base.ts" />
/// <reference path="../../../node_modules/@types/node/index.d.ts" />

namespace RomReader {
    const fs = require("fs");

    export abstract class GBReader extends RomReaderBase {
        protected stringTerminator = 0x50;
        public symTable: { [key: string]: number };

        constructor(private romFileLocation: string, private charmap: string[]) {
            super();
            this.ballIds = this.abilities = [];
            this.characteristics = null;
            this.types = ["Normal", "Fighting", "Flying", "Poison", "Ground", "Rock", "Bird", "Bug", "Ghost", "Steel", "", "", "", "", "", "", "", "", "", "???", "Fire", "Water", "Grass", "Electric", "Psychic", "Ice", "Dragon", "Dark"];
        }

        ConvertText(text: string | Buffer | number[]) {
            if (!text)
                return "";
            let charArray: Array<number>;
            if (typeof text === "string")
                return text;
            else if (text instanceof Buffer) {
                charArray = [];
                for (let i = 0; i < text.length; charArray.push(text[i++]));
            }
            else
                charArray = text;
            let end = charArray.indexOf(this.stringTerminator);
            if (end >= 0)
                charArray.splice(end);
            // end = charArray.indexOf(0x00);   //was for bad romhacky text, but breaks on gen 3
            // if (end >= 0)
            //     charArray.splice(end);
            return charArray.map(c => this.charmap[c] || ' ').join('');
        }

        GetForm(pokemon: TPP.Pokemon) {
            if (pokemon.species.id == 201) {
                return Math.floor((((pokemon.ivs.attack & 6) << 5) | ((pokemon.ivs.defense & 6) << 3) | ((pokemon.ivs.speed & 6) << 1) | ((pokemon.ivs.special_attack & 6) >> 1)) / 10);
            }
            return 0;
        }

        protected loadROM(): Buffer {
            return fs.readFileSync(this.romFileLocation);
        }

        CalculateGender(pokemon: TPP.Pokemon) {
            if (pokemon.species.gender_ratio && typeof (pokemon.gender) !== "string") {
                if (pokemon.species.gender_ratio == 255) {
                    pokemon.gender = '';
                }
                else if (pokemon.species.gender_ratio == 254) {
                    pokemon.gender = "Female";
                }
                else if (pokemon.species.gender_ratio == 0) {
                    pokemon.gender = "Male";
                }
                else { //Generation 2
                    pokemon.gender = ((pokemon.ivs || { attack: 0 }).attack << 4) > pokemon.species.gender_ratio ? "Male" : "Female";
                }
            }
        }

        CalculateShiny(pokemon: TPP.Pokemon) {
            if (pokemon.ivs) {
                // In Generation II, being Shiny is determined by a Pokémon's IVs.
                // If a Pokémon's Speed, Defense, and Special IVs are all 10,
                // and its Attack IV is 2, 3, 6, 7, 10, 11, 14 or 15, it will be Shiny.
                pokemon.shiny = pokemon.ivs.speed == 10 && pokemon.ivs.defense == 10 && pokemon.ivs.special_attack == 10 && (pokemon.ivs.attack & 2) == 2;
            }
        }

        protected ReadBundledData(romData: Buffer, startOffset: number, terminator: number, numBundles: number, endOffset = 0) {
            let bundles = new Array<Buffer>();
            numBundles = numBundles || romData.length;
            if (endOffset < startOffset || endOffset > romData.length) {
                endOffset = romData.length;
            }
            for (let i = startOffset, bundleStart = startOffset; i < endOffset && bundles.length < numBundles; i++) {
                if (romData[i] == terminator) {
                    bundles.push(romData.slice(bundleStart, i));
                    bundleStart = i + 1;
                }
            }
            return bundles;
        }

        protected ReadStringBundle(romData: Buffer, startOffset: number, numStrings: number, endOffset = 0) {
            return this.ReadBundledData(romData, startOffset, this.stringTerminator, numStrings, endOffset).map(b => this.ConvertText(b));
        }

        public LinearAddressToBanked(linear: number, bankSize = this.BankSizes.ROM, hasHomeBank = true) {
            let bank = Math.floor(linear / bankSize);
            let address = linear % bankSize;
            if (hasHomeBank && bank > 0) {
                //ROM and WRAM have a home bank (Bank 0)
                // All switchable banks (Bank 1+) live after the home bank
                // Add the bank size to the address to account for this
                address |= bankSize;
            }
            return { bank: bank, address: address };
        }

        public BankAddressToLinear(bank: number, address: number, bankSize = this.BankSizes.ROM) {
            return (bank * bankSize) | (address % bankSize);
        }

        public SameBankPtrToLinear(baseAddr: number, ptr: number) {
            return this.BankAddressToLinear(this.LinearAddressToBanked(baseAddr).bank, ptr);
        }

        public CalculateHiddenPowerType(stats: TPP.Stats) {
            const types = ['Fighting', 'Flying', 'Poison', 'Ground', 'Rock', 'Bug', 'Ghost', 'Steel', 'Fire', 'Water', 'Grass', 'Electric', 'Psychic', 'Ice', 'Dragon', 'Dark'];
            return types[4 * (stats.attack % 4) + (stats.defense % 4)];
        }

        public CalculateHiddenPowerPower(stats: TPP.Stats) {
            return Math.floor((5 * ((stats.special_attack >> 3) + ((stats.speed >> 3) << 1) + ((stats.defense >> 3) << 2) + ((stats.attack >> 3) << 3)) + (stats.special_defense % 4)) / 2) + 31;
        }

        public BankSizes = {
            ROM: 0x4000,
            VRAM: 0x2000,
            SRAM: 0x2000,
            CartRAM: 0x2000, //SRAM
            WRAM: 0x1000
        }

        private symbolEntry = /([0-9A-F]+):([0-9A-F]+) ([^\s]+)/i;
        protected LoadSymbolFile(filename: string) {
            const symFile: string = fs.readFileSync(filename, 'utf8');
            const symTable: { [key: string]: number } = {};
            symFile.split('\n').forEach(line => {
                const parsed = this.symbolEntry.exec(line.trim());
                if (parsed) {
                    const bank = parseInt(parsed[1], 16);
                    const address = parseInt(parsed[2], 16);
                    const symbol = parsed[3];
                    if (address < 0x8000) // ROM
                        symTable[symbol] = this.BankAddressToLinear(bank, address, this.BankSizes.ROM)
                    else if (address < 0xA000) // VRAM
                        symTable[symbol] = this.BankAddressToLinear(bank, address, this.BankSizes.VRAM)
                    else if (address < 0xC000) // SRAM
                        symTable[symbol] = this.BankAddressToLinear(bank, address, this.BankSizes.SRAM)
                    else if (address < 0xE000) //WRAM
                        symTable[symbol] = this.BankAddressToLinear(bank, address, this.BankSizes.WRAM)
                    else if (address < 0xFE00) // ECHO (nothing should use this, but just in case)
                        symTable[symbol] = this.BankAddressToLinear(bank, address, this.BankSizes.WRAM)
                    else //OAM, I/O, HRAM (no banks)
                        symTable[symbol] = address
                }
            });
            //console.dir(symTable);
            return symTable;
        }

        public GetOamAddress = (symbol: string) => this.symTable[symbol] ? this.symTable[symbol] - 0xFE00 : null;
        public GetHramAddress = (symbol: string) => this.symTable[symbol] ? this.symTable[symbol] - 0xFF80 : null;

        public IsFlagSet(romData: Buffer, flagStartOffset: number, flagIndex: number) {
            return (romData[flagStartOffset + Math.floor(flagIndex / 8)] & ((flagIndex % 8) + 1)) > 0; //FIX
        }

        public ParseBCD(bcd: Buffer) {
            return bcd.toString('hex').split('').reverse().reduce((sum, char, place) => sum + (parseInt(char, 16) * Math.pow(10, place)), 0);
        }

        public FindTerminator(data: Buffer) {
            for (var i = 0; i < data.length; i++) {
                if (data[i] == this.stringTerminator)
                    return i;
            }
            return -1;
        }

        //TODO: This assumes symbols are sorted
        protected GetSymbolSize(symbol: string, ...alternatives: string[]) {
            const addr = this.symTable[symbol] || this.symTable[alternatives.find(sym => !!this.symTable[sym])];
            let nextSymAddr = this.symTable[Object.keys(this.symTable).find((s, i, arr) => i && arr[i - 1] == symbol)];
            if (nextSymAddr < addr)
                nextSymAddr += 0x4000;
            return nextSymAddr - addr;
        }
    }
}