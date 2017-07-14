/**
 * Pokemon Gen 2 sprite decompressor Source:
 * https://github.com/pret/pokemon-reverse-engineering-tools/blob/master/pokemontools/lz.py 
 * (and gfx.py for flatten())
 * Originally ported to Java by Dabomstew
 *
 */
namespace Tools {
    const LZ_END = 0xFF;
    const INITIAL_BUF_SIZE = 0x1000;
    const bit_flipped = new Array<number>(0x100);
    for (let b = 0; b < 0x100; b++) {
        for (let i = 0; i < 8; i++) {
            bit_flipped[b] += ((b >> i) & 1) << (7 - i);
        }
    }

    function flatten(planar: Buffer) {
        let strips = new Buffer(planar.length * 4);
        for (let j = 0; j < planar.length / 2; j++) {
            let bottom = planar[j * 2] & 0xFF;
            let top = planar[j * 2 + 1] & 0xFF;
            let strip = new Buffer(8);
            for (let i = 7; i >= 0; i--) {
                strip[7 - i] = (((bottom >>> i) & 1) + ((top * 2 >>> i) & 2));
            }
            strip.copy(strips, j * 8, 0, 8);
        }
        return strips;
    }

    export class Gen2LZDecmp {
        public data: Buffer;
        public address: number = 0;
        private output: Buffer = new Buffer(INITIAL_BUF_SIZE);
        private out_idx: number = 0;
        private cmd: number = 0;
        private len: number = 0;
        private offset: number = 0;

        constructor(input: Buffer, baseOffset: number, tilesWide: number, tilesHigh: number) {
            this.data = input;
            this.address = baseOffset;
            this.decompress();
            this.cutAndTranspose(tilesWide, tilesHigh);
        }

        public getData() {
            return this.output;
        }

        public getFlattenedData() {
            return flatten(this.output);
        }

        private cutAndTranspose(width: number, height: number) {
            if (this.output == null) {
                return;
            }
            let tiles = width * height;

            let newData = new Buffer(width * height * 16);
            for (let tile = 0; tile < tiles; tile++) {
                let oldTileX = tile % width;
                let oldTileY = tile / width;
                let newTileNum = oldTileX * height + oldTileY;
                this.output.copy(newData, newTileNum * 16, tile * 16, (tile + 1) * 16);
            }
            this.output = newData;
        }

        private decompress() {
            this.output.fill(0);
            while (true) {
                if (this.peek() == LZ_END) {
                    this.next();
                    break;
                }

                this.cmd = (this.peek() & 0xE0) >> 5;
                if (this.cmd == 7) {
                    // LONG command
                    this.cmd = (this.peek() & 0x1C) >> 2;
                    this.len = (this.next() & 0x03) * 0x100 + this.next() + 1;
                }
                else {
                    // Normal length
                    this.len = (this.next() & 0x1F) + 1;
                }

                while (this.out_idx + this.len > this.output.length) {
                    this.resizeOutput();
                }

                switch (this.cmd) {
                    case 0:
                        // Literal
                        this.data.copy(this.output, this.address, this.out_idx, this.address + this.len);
                        this.out_idx += this.len;
                        this.address += this.len;
                        break;
                    case 1:
                        // Iterate
                        let repe = this.next();
                        for (let i = 0; i < this.len; i++) {
                            this.output[this.out_idx++] = repe;
                        }
                        break;
                    case 2:
                        // Alternate
                        let alts = [this.next(), this.next()];
                        for (let i = 0; i < this.len; i++) {
                            this.output[this.out_idx++] = alts[i & 1];
                        }
                        break;
                    case 3:
                        // Zero-fill
                        this.out_idx += this.len;
                        break;
                    case 4:
                        // Default repeat
                        this.repeat();
                        break;
                    case 5:
                        this.repeat(1, bit_flipped);
                        break;
                    case 6:
                        this.repeat(-1);
                        break;
                }
            }

            this.output = this.output.slice(0, this.out_idx);
        }

        private repeat(direction = 1, table: number[] = null) {
            this.get_offset();
            for (let i = 0; i < this.len; i++) {
                let value = this.output[this.offset + i * direction] & 0xFF;
                this.output[this.out_idx++] = ((table == null) ? value : table[value]);
            }
        }

        private get_offset() {
            if (this.peek() >= 0x80) {
                // Negative
                this.offset = this.next() & 0x7F;
                this.offset = this.out_idx - this.offset - 1;
            } else {
                // Positive, extended
                this.offset = this.next() * 0x100 + this.next();
            }
        }

        private resizeOutput() {
            let newOut = new Buffer(this.output.length * 2);
            newOut.fill(0);
            this.output.copy(newOut);//, 0, 0, this.out_idx);
            this.output = newOut;
        }

        public peek() {
            return this.data[this.address] & 0xFF;
        }

        public next() {
            return this.data[this.address++] & 0xFF;
        }

    }
}
