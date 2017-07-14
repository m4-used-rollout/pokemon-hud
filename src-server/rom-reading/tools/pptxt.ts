/*----------------------------------------------------------------------------*/
/*--  pptxt.ts - handles generation 5 games text decoding                   --*/
/*--  Code derived from "PPTXT", copyright (C) SCV?                         --*/
/*--  Originally ported to Java and bugfixed/customized by Dabomstew        --*/
/*----------------------------------------------------------------------------*/

namespace Tools.PPTxt {

    /**
     * Decompress the words given into chars according to 9bits per char format
     * Based off poketext's implementation of the same in gen4, but uses all 16
     * bits per word as opposed to 15
     * 
     * @param chars
     *            List of words, beginning with [F100] which is skipped.
     * @return Decompressed list of integers corresponding to characters
     */
    function decompress(chars: number[]) {
        let uncomp = new Array<number>();
        let j = 1;
        let shift1 = 0;
        let trans = 0;
        while (true) {
            let tmp = chars[j];
            tmp = tmp >> shift1;
            let tmp1 = tmp;
            if (shift1 >= 0x10) {
                shift1 -= 0x10;
                if (shift1 > 0) {
                    tmp1 = (trans | ((chars[j] << (9 - shift1)) & 0x1FF));
                    if ((tmp1 & 0xFF) == 0xFF) {
                        break;
                    }
                    if (tmp1 != 0x0 && tmp1 != 0x1) {
                        uncomp.push(tmp1);
                    }
                }
            } else {
                tmp1 = ((chars[j] >> shift1) & 0x1FF);
                if ((tmp1 & 0xFF) == 0xFF) {
                    break;
                }
                if (tmp1 != 0x0 && tmp1 != 0x1) {
                    uncomp.push(tmp1);
                }
                shift1 += 9;
                if (shift1 < 0x10) {
                    trans = ((chars[j] >> shift1) & 0x1FF);
                    shift1 += 9;
                }
                j += 1;
            }
        }
        return uncomp;
    }

    /**
     * Take a Buffer corresponding to a NARC entry and build a list of
     * strings against the gen5 text encryption. Decompresses as appropriate.
     * 
     * @param ds
     *            The data from this msg.narc entry
     * @return The list of strings
     */
    export function GetStrings(ds: Buffer) {
        let pos = 0;
        let i = 0;
        let strings = new Array<string>();
        let numSections: number, numEntries: number, tmpCharCount: number, tmpUnknown: number, tmpChar: number, tmpOffset: number;
        let sizeSections = [0, 0, 0];
        let sectionOffset = [0, 0, 0];
        let tableOffsets: { [key: number]: number[] } = {};
        let characterCount: { [key: number]: number[] } = {};
        let encText: { [key: number]: number[][] } = {};
        let string = "";
        let key: number;

        numSections = ds.readInt16LE(0);
        numEntries = ds.readInt16LE(2);
        sizeSections[0] = ds.readInt32LE(4);
        pos += 12;
        if (numSections > i) {
            for (let z = 0; z < numSections; z++) {
                sectionOffset[z] = ds.readInt32LE(pos);
                pos += 4;
            }
            pos = sectionOffset[i];
            sizeSections[i] = ds.readInt32LE(pos);
            pos += 4;
            tableOffsets[i] = [];
            characterCount[i] = [];
            encText[i] = [];
            for (let j = 0; j < numEntries; j++) {
                tmpOffset = ds.readInt32LE(pos);
                pos += 4;
                tmpCharCount = ds.readInt16LE(pos);
                pos += 4;
                tableOffsets[i].push(tmpOffset);
                characterCount[i].push(tmpCharCount);
            }
            for (let j = 0; j < numEntries; j++) {
                let tmpEncChars = new Array<number>();
                pos = sectionOffset[i] + tableOffsets[i][j];
                for (let k = 0; k < characterCount[i][j]; k++) {
                    tmpChar = ds.readUInt16LE(pos);
                    pos += 2;
                    tmpEncChars.push(tmpChar);
                }
                encText[i].push(tmpEncChars);
                key = encText[i][j][characterCount[i][j] - 1] ^ 0xFFFF;
                for (let k = characterCount[i][j] - 1; k >= 0; k--) {
                    encText[i][j][k] = encText[i][j][k] ^ key;
                    key = ((key >>> 3) | (key << 13)) & 0xffff;
                }
                if (encText[i][j][0] == 0xF100) {
                    encText[i][j] = decompress(encText[i][j]);
                    characterCount[i][j] = encText[i][j].length;
                }
                let chars = new Array<string>();
                string = "";
                for (let k = 0; k < characterCount[i][j]; k++) {
                    if (encText[i][j][k] != 0xFFFF) {
                        try {
                            string += String.fromCodePoint(encText[i][j][k]);
                        }
                        catch (e) {
                            string += "?";
                        }
                    }
                }
                strings.push(PokeToText(string.trim()));
            }
        }
        return strings;
    }

    export function PokeToText(str: string) {
        return str.replace(pokeToTextExp, r => pokeToTextMap[r]);
    }

    const pokeToTextMap: { [key: string]: string } = {
        '\u2467': '×',
        '\u2468': '÷',
        '\u246C': '…',
        '\u246D': '♂',
        '\u246E': '♀',
        '\u246F': '♠',
        '\u2470': '♣',
        '\u2471': '♥',
        '\u2472': '♦',
        '\u2473': '★',
        '\u2474': '◎',
        '\u2475': '○',
        '\u2476': '□',
        '\u2477': '△',
        '\u2478': '◇',
        '\u2479': '♪',
        '\u247A': '☀',
        '\u247B': '☁',
        '\u247C': '☂',
        '\u247D': '☂',
        '\u21D2': '\u260A',
        '\u21D4': '\u2197',
        '\u2200': '\u2198',
        '\u2203': '\u263D',
        '\u2227': '\u260B',
        '\u2228': '\u2654',
        '\u2460': '\u263A',
        '\u2461': '\u265A',
        '\u2462': '\u2655',
        '\u2463': '\u2639',
        '\u2464': '\u21D7',
        '\u2465': '\u21D8',
        '\u2466': '\u263E',
        '\u2469': '\u00B9',
        '\u246A': '\u00B2',
        '\u246B': '\u00B3',
        '\u247E': '\u263A',
        '\u247F': '\u265A',
        '\u2480': '\u265B',
        '\u2481': '\u2639',
        '\u2482': '\u21D7',
        '\u2483': '\u21D8',
        '\u2484': '\u263E',
        '\u2485': '\u2074',
        '\u2486': '\u20A7',
        '\u2487': '\u20A6',
        '\uFFE2': '\u265B'
    }

    const pokeToTextExp = new RegExp('[' + Object.keys(pokeToTextMap).join('') + ']', 'g');
}