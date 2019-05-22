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

        public ReadStringTable(table: Buffer, address = 0) {
            if (address > 0)
                table = table.slice(address);
            const totalEntries = table.readInt16BE(0x4);
            return this.ReadStridedData(table, 0x10, 0x8, totalEntries)
                .map(data => ({id: data.readInt32BE(0), addr: data.readInt32BE(0x4)}))
                .map(addr => ({id: addr.id, string: this.ReadString(table, addr.addr)}));
        }

        public ReadString(data: Buffer, address = 0, length = 0) {
            length = length || data.indexOf("\u0000", address, "utf16le");
            const strBuf = data.slice(address, length);
            if (length) {
                try {
                    return strBuf.swap16().toString("utf16le");
                }
                catch { }
            }
            return "";
        }
    }
}