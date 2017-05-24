/// <reference path="base.ts" />
/// <reference path="../nds/narchive.ts" />
/// <reference path="../../../node_modules/@types/node/index.d.ts" />

namespace RomReader {
    const NARCArchive = NDS.NARChive;
    const fs = require("fs");

    export abstract class NDSReader extends RomReaderBase {
        constructor(private basePath:string) {
            super();
            if (!this.basePath.endsWith('/') && !this.basePath.endsWith('\\')) {
                this.basePath += '/';
            }
            this.characteristics.hp[1] = "Often dozes off";
            this.characteristics.hp[2] = "Often scatters things";
        }

        protected readNARC(path: string) {
            return new NARCArchive(this.readFile('data/' + path));
        }

        private readFile(path:string):Buffer {
            return fs.readFileSync(this.basePath + path);
        }
    }
}