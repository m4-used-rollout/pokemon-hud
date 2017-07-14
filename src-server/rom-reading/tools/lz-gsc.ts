// The following document details the LZ spec as used in Pokemon Gold, Silver, and Crystal.
// The LZ format is a sequence of commands.  Each command designates the command type, the output size resulting from execution of that command, and additional parameters depending on the parameter.
// First byte:
// All LZ files are terminated with 255 (0xFF).
// Upper three bits indicate the command.  They are:
// - 0: LITERAL
// - 1: ITERATE
// - 2: ALTERNATE
// - 3: ZERO
// - 4: REPEAT
// - 5: FLIP
// - 6: REVERSE
// If any of these is read, the size is one more than the value of the lower 5 bits.
// If a 7 is read here, the next three bits designate the actual commands as enumerated above, and the subsequent 10 bits (remaining two bits plus all 8 bits of the next byte) indicate the size less 1.
// Henceforth the command size will be represented as N.
// LITERAL:
// The following N bytes are copied verbatim from the LZ file to the decompression buffer.
// ITERATE:
// The following single byte is repeated N times in the decompression buffer.
// ALTERNATE:
// The following two bytes are written alternatingly to the decompression buffer up to N bytes.  For example, if the two bytes are 67 EF and the size N = 7, the decompressor will write 67 EF 67 EF 67 EF 67.
// ZERO:
// A string of N zeros (00) is written to the decompression buffer.
// REPEAT, FLIP, and REVERSE:
// The next byte(s) indicates an offset.  Call it O.
// If the high bit of O is set, the remaining bits are subtracted from the address immediately before the decompression pointer.
// Otherwise, the offset is actually a 15-bit big endian number which is added to the start of the decompression buffer.
// Data for these commands are then read from the pointer resulting from the operation, henceforth called the rewrite pointer.
// REPEAT:
// N bytes are copied verbatim from the rewrite pointer to the decompression buffer.
// FLIP:
// Similar to REPEAT, but the bit order of each byte is reversed, i.e. 11000101 --> 10100011.
// REVERSE:
// Similar to REPEAT, but the rewrite pointer decrements instead of incrementing.

namespace Tools.LZGSC {
    const LZTERM = 0xFF;
    const bitFlipPrecomp = new Uint8Array(0x100);
    for (let b = 0; b < 0x100; b++) {
        bitFlipPrecomp[b] = 0;
        for (let i = 0; i < 8; i++) {
            bitFlipPrecomp[b] += ((b >> i) & 1) << (7 - i);
        }
    }

    export function Decompress(compressed: Buffer) {
        let compPtr = 0;
        let decompressed: number[] = [];
        function getRewritePtr() {
            if (compressed[compPtr] >= 0x80) {
                return (decompressed.length - 1) - (compressed[compPtr++] & 0x7F);
            }
            compPtr += 2;
            return compressed.readUInt16BE(compPtr - 2) & 0x7FFF;
        }
        let commands: ((n: number) => void)[] = [
            n => { //LITERAL
                n += compPtr;
                for (compPtr = compPtr; compPtr < n; compPtr++) {
                    decompressed.push(compressed[compPtr]);
                }
            },
            n => { //ITERATE
                let byte = compressed[compPtr++];
                for (let i = 0; i < n; i++) {
                    decompressed.push(byte);
                }
            },
            n => { //ALTERNATE
                let bytes = [compressed[compPtr], compressed[compPtr + 1]];
                compPtr += 2;
                for (let i = 0; i < n; i++) {
                    decompressed.push(bytes[i & 1]);
                }
            },
            n => { //ZERO
                for (let i = 0; i < n; i++) {
                    decompressed.push(0);
                }
            },
            n => { //REPEAT
                let ptr = getRewritePtr();
                for (let i = 0; i < n; i++) {
                    decompressed.push(decompressed[ptr + i]);
                }
            },
            n => { //FLIP
                let ptr = getRewritePtr();
                for (let i = 0; i < n; i++) {
                    decompressed.push(bitFlipPrecomp[decompressed[ptr + i]]);
                }
            },
            n => { //REVERSE
                let ptr = getRewritePtr();
                for (let i = 0; i < n; i++) {
                    decompressed.push(decompressed[ptr - i]);
                }
            }
        ];

        while (compressed[compPtr] != LZTERM && compPtr < compressed.length) {
            let cmd = compressed[compPtr] >> 5;
            let len = compressed[compPtr] & 0x1F;
            if (cmd >= commands.length) { //long cmd
                cmd = len >> 2;
                len = compressed.readUInt16BE(compPtr) & 0x3FF;
                compPtr += 2;
            }
            else {
                compPtr++;
            }
            commands[cmd](len + 1);
        }
        return Buffer.from(decompressed);
    }
}