/*----------------------------------------------------------------------------*/
/*--  blz.ts - Bottom LZ coding for Nintendo GBA/DS                         --*/
/*--  Copyright (C) 2011 CUE                                                --*/
/*--                                                                        --*/
/*--  Originally ported to Java by Dabomstew under the terms of the GPL:    --*/
/*--                                                                        --*/
/*--  This program is free software: you can redistribute it and/or modify  --*/
/*--  it under the terms of the GNU General Public License as published by  --*/
/*--  the Free Software Foundation, either version 3 of the License, or     --*/
/*--  (at your option) any later version.                                   --*/
/*--                                                                        --*/
/*--  This program is distributed in the hope that it will be useful,       --*/
/*--  but WITHOUT ANY WARRANTY; without even the implied warranty of        --*/
/*--  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the          --*/
/*--  GNU General Public License for more details.                          --*/
/*--                                                                        --*/
/*--  You should have received a copy of the GNU General Public License     --*/
/*--  along with this program. If not, see <http://www.gnu.org/licenses/>.  --*/
/*----------------------------------------------------------------------------*/

namespace BLZCoder {
    const BLZ_SHIFT = 1;
    const BLZ_MASK = 0x80;

    const BLZ_THRESHOLD = 2;

    const RAW_MAX = 0x00FFFFFF;

    export function Decode(data: Buffer) {
        let result = BLZ_Decode(data);
        if (result != null) {
            return Buffer.from(result.buffer);
        }
        return null;
    }

    function BLZ_Decode(data: Buffer): BLZResult {
        let pak_buffer: number[], raw_buffer: number[];
        let pak: number, raw: number, pak_end: number, raw_end: number;
        let pak_len: number, raw_len: number, len: number, pos: number, inc_len: number, hdr_len: number, enc_len: number, dec_len: number;
        let flags = 0, mask: number;

        pak_buffer = prepareData(data);
        pak_len = pak_buffer.length - 3;

        inc_len = readUnsigned(pak_buffer, pak_len - 4);
        if (inc_len < 1) {
            console.log("WARNING: not coded file!");
            enc_len = 0;
            dec_len = pak_len;
            pak_len = 0;
            raw_len = dec_len;
        }
        else {
            if (pak_len < 8) {
                throw new Error("File has a bad header");
            }
            hdr_len = pak_buffer[pak_len - 5];
            if (hdr_len < 8 || hdr_len > 0xB) {
                throw new Error("Bad header length");
            }
            if (pak_len <= hdr_len) {
                throw new Error("Bad length");
            }
            enc_len = readUnsigned(pak_buffer, pak_len - 8) & 0x00FFFFFF;
            dec_len = pak_len - enc_len;
            pak_len = enc_len - hdr_len;
            raw_len = dec_len + enc_len + inc_len;
            if (raw_len > RAW_MAX) {
                throw new Error("Bad decoded length");
            }
        }

        raw_buffer = new Array<number>(raw_len);

        pak = 0;
        raw = 0;
        pak_end = dec_len + pak_len;
        raw_end = raw_len;

        for (len = 0; len < dec_len; len++) {
            raw_buffer[raw++] = pak_buffer[pak++];
        }

        BLZ_Invert(pak_buffer, dec_len, pak_len);

        mask = 0;

        while (raw < raw_end) {
            if ((mask = (mask >>> BLZ_SHIFT)) == 0) {
                if (pak == pak_end) {
                    break;
                }
                flags = pak_buffer[pak++];
                mask = BLZ_MASK;
            }

            if ((flags & mask) == 0) {
                if (pak == pak_end) {
                    break;
                }
                raw_buffer[raw++] = pak_buffer[pak++];
            } else {
                if ((pak + 1) >= pak_end) {
                    break;
                }
                pos = pak_buffer[pak++] << 8;
                pos |= pak_buffer[pak++];
                len = (pos >>> 12) + BLZ_THRESHOLD + 1;
                if (raw + len > raw_end) {
                    console.log("WARNING: wrong decoded length!");
                    len = raw_end - raw;
                }
                pos = (pos & 0xFFF) + 3;
                while ((len--) > 0) {
                    let charHere = raw_buffer[raw - pos];
                    raw_buffer[raw++] = charHere;
                }
            }
        }

        BLZ_Invert(raw_buffer, dec_len, raw_len - dec_len);

        raw_len = raw;

        if (raw != raw_end) {
            console.log("WARNING: unexpected end of encoded file!");
        }

        return new BLZResult(raw_buffer, raw_len);

    }

    function prepareData(data: Buffer) {
        let fs = data.length;
        let fb = new Array<number>(fs + 3);
        for (let i = 0; i < fs; i++) {
            fb[i] = data[i] & 0xFF;
        }
        return fb;
    }

    function readUnsigned(buffer: number[], offset: number) {
        return buffer[offset] | (buffer[offset + 1] << 8) | (buffer[offset + 2] << 16) | ((buffer[offset + 3] & 0x7F) << 24);
    }

    class BLZResult {
        constructor(public buffer: number[], public length: number) {

        }
    }

    function BLZ_Invert(buffer: number[], offset: number, length: number) {
        let bottom = offset + length - 1;
        while (offset < bottom) {
            let ch = buffer[offset];
            buffer[offset++] = buffer[bottom];
            buffer[bottom--] = ch;
        }
    }

}
