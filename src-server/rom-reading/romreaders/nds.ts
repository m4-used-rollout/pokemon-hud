/// <reference path="base.ts" />
/// <reference path="../tools/narchive.ts" />
/// <reference path="../tools/blzcoder.ts" />
/// <reference path="../../../node_modules/@types/node/index.d.ts" />

namespace RomReader {
    const NARCArchive = Tools.NARChive;
    const fs = require("fs");

    export abstract class NDSReader extends RomReaderBase {
        protected dataPath = "data/";

        constructor(private basePath: string) {
            super();
            if (!this.basePath.endsWith('/') && !this.basePath.endsWith('\\')) {
                this.basePath += '/';
            }
            this.characteristics.hp[1] = "Often dozes off";
            this.characteristics.hp[2] = "Often scatters things";
        }

        protected readNARC(path: string) {
            return new NARCArchive(this.readFile(this.dataPath + path));
        }

        protected readArm9() {
            const arm9 = this.readFile('arm9.bin');
            try {
                return BLZCoder.Decode(arm9);
            }
            catch (e){
                return arm9;
            }
        }

        protected readFile(path: string): Buffer {
            return fs.readFileSync(this.basePath + path);
        }
    }
}