// Data header (32bit)
//     Bit 0-3   Reserved
//     Bit 4-7   Compressed type (must be 1 for LZ77)
//     Bit 8-31  Size of decompressed data
// Repeat below. Each Flag Byte followed by eight Blocks.
// Flag data (8bit)
//     Bit 0-7   Type Flags for next 8 Blocks, MSB first
// Block Type 0 - Uncompressed - Copy 1 Byte from Source to Dest
//     Bit 0-7   One data byte to be copied to dest
// Block Type 1 - Compressed - Copy N+3 Bytes from Dest-Disp-1 to Dest
//     Bit 0-3   Disp MSBs
//     Bit 4-7   Number of bytes to copy (minus 3)
//     Bit 8-15  Disp LSBs

namespace Tools.LZ77 {
    export function Decompress(compressed: Buffer, offset = 0) {
        if (offset >= compressed.length) {
            console.log(`Offset ${offset.toString(16)} exceeds length of buffer (${compressed.length.toString(16)})`);
            return Buffer.alloc(0);
        }
        if (offset < 0) {
            console.log(`Offset ${offset.toString(16)} is insane`);
            return Buffer.alloc(0);
        }
        let header = compressed.readUInt32LE(offset)
        let size = header >> 8;
        if (size <= 0) {
            return Buffer.alloc(0);
        }
        let decompressed = Buffer.alloc(size);
        let cPtr = offset + 4;
        let dPtr = 0;
        while (dPtr < decompressed.length) {
            let flags = compressed[cPtr++];
            for (let bit = 0; bit < 8 && dPtr < decompressed.length; bit++) {
                if (flags & (0x80 >> bit)) { //Compressed - Copy N+3 Bytes from Dest-Disp-1 to Dest
                    let copyCtrl = compressed.readUInt16LE(cPtr);
                    cPtr += 2;
                    let startCopy = dPtr - (copyCtrl && 0xFFF) - 1;
                    let endCopy = startCopy + (copyCtrl >> 12) + 3;
                    if (endCopy > decompressed.length) {
                        endCopy = decompressed.length;
                    }
                    if (startCopy >= 0) {
                        try {
                            decompressed.copy(decompressed, dPtr, startCopy, endCopy);
                        }
                        catch (e) {
                            console.log(`length: ${decompressed.length} - dPtr: ${dPtr} - startCopy: ${startCopy} - endCopy: ${endCopy}`);
                        }
                    }
                    dPtr += endCopy - startCopy;
                }
                else { //Uncompressed - Copy 1 Byte from Source to Dest
                    decompressed[dPtr++] = compressed[cPtr++];
                }
            }
        }
        //console.log(`Offset: ${offset.toString(16)} Length: ${header >> 8} --- Compressed: ${compressed.slice(offset, cPtr).toString('hex')} --- Decompressed: ${decompressed.toString('hex')}`);
        return decompressed;
    }
}