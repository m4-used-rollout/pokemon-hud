/// <reference path="base.ts" />
/// <reference path="../../../node_modules/@types/node/index.d.ts" />

namespace RomReader {
    const fs = require("fs") as typeof import('fs');
    const fixCaps = /(\b[a-z])/g;
    const fixWronglyCapped = /(['’][A-Z]|okéMon)/g;
    const fixWronglyLowercased = /(^[T|H]m|\bTv\b)/g;

    export abstract class GCNReader extends RomReaderBase {

        constructor(private basePath: string) {
            super();
            if (!this.basePath.endsWith('/') && !this.basePath.endsWith('\\')) {
                this.basePath += '/';
            }
        }

        protected get StartDol() {
            return fs.readFileSync(this.basePath + "start.dol");
        }

        protected get CommonRel() {
            return fs.readFileSync(this.basePath + "common.rel");
        }

        public FixAllCaps(str: string) {
            return str.toLowerCase().replace(fixCaps, c => c.toUpperCase()).replace(fixWronglyCapped, c => c.toLowerCase()).replace(fixWronglyLowercased, c => c.toUpperCase());
        }

        public ReadStringTable(table: Buffer, address = 0) {
            if (address > 0)
                table = table.slice(address);
            const totalEntries = table.readInt16BE(0x4);
            return this.ReadStridedData(table, 0x10, 0x8, totalEntries)
                .map(data => ({ id: data.readInt32BE(0), addr: data.readInt32BE(0x4) }))
                .map(addr => ({ id: addr.id, addr: addr.addr.toString(16), string: this.FixAllCaps(this.ReadString(table, addr.addr)) }));
        }

        public ReadStringOld(data: Buffer, address = 0, length = 0) {
            length = length || (data.indexOf("\u0000", address + 2, "utf16le") - address);
            const strBuf = data.slice(address, address + length);
            if (length) {
                try {
                    return strBuf.swap16().toString("utf16le");
                }
                catch { }
            }
            return "";
        }

        public ReadStringSloppy(data: Buffer, address = 0, length = 0) {
            length = length || (data.indexOf("\u0000", address + 2, "utf16le") - address);
            if (length)
                return String.fromCodePoint(...this.ReadStridedData(data, address, 2, length / 2)
                    .map(chr => chr.readUInt16BE(0) % 0xFFFF)
                    .filter((c, i, arr) => c > 0 || i < arr.indexOf(0, 1))
                    .filter(c => !!c));
            return "";
        }

        public ReadString(data: Buffer, address = 0) {
            const chars = new Array<number>();
            for (let i = address; i < data.length; i += 2) {
                let char = data.readUInt16BE(i);
                if (char == 0)
                    return String.fromCharCode(...chars);
                if (char == 0xFFFF) {
                    char = data[i + 1];
                    i += codeBytes[char] || 1;
                    let codeResult = controlCodeMap[char];
                    if (codeResult)
                        chars.push(...codeResult.split('').map(c => c.charCodeAt(0)));
                }
                else
                    chars.push(char);
            }
            return String.fromCharCode(...chars);
        }
    }

    const codeBytes: { [key: number]: number } = {
        0x07: 2,
        0x08: 5,
        0x09: 2,
        0x38: 2,
        0x52: 2,
        0x53: 2,
        0x5B: 2,
        0x5C: 2
    }
    const controlCodeMap: { [key: number]: string } = {
        0x00: "\n",
        0x02: " ",
        0x03: " ",
        0x0F: "[POKEMON]",
        0x10: "[POKEMON]",
        0x11: "[POKEMON]",
        0x12: "[POKEMON]",
        0x13: "[PLAYER]",
        0x14: "[POKEMON]",
        0x15: "[POKEMON]",
        0x16: "[POKEMON]",
        0x17: "[POKEMON]",
        0x18: "[POKEMON]",
        0x19: "[POKEMON]",
        0x1A: "[ABILITY]",
        0x1B: "[ABILITY]",
        0x1C: "[ABILITY]",
        0x1D: "[ABILITY]",
        0x1E: "[POKEMON]",
        0x20: "[POKEMON]",
        0x21: "[POKEMON]",
        0x22: "[CLASS]",
        0x23: "[TRAINER]",
        0x28: "[MOVE]",
        0x29: "[ITEM]",
        0x2B: "[PLAYER_F]",
        0x2C: "[RUI]",
    }
}