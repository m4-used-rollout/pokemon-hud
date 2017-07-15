// Based on parts of GFXFunctions.java from "Universal Pokemon Randomizer" by Dabomstew
/// <reference path="zeropad.ts" />

namespace Sprites {

    export interface ImageMap {
        palette: string[];
        pixels: number[][];
    }

    class Tile2BPP {
        pixels: number[][] = [];
        constructor(data: Buffer) {
            for (let y = 0; y < 8; y++) {
                let leftBits = data[y * 2], rightBits = data[(y * 2) + 1];
                for (let x = 0; x < 8; x++) {
                    let bit = 7 - x;
                    this.pixels[x] = this.pixels[x] || [];
                    this.pixels[x][y] = (((leftBits & (1 << bit)) >> bit) << 1) | ((rightBits & (1 << bit)) >> bit);
                }
            }
        }
        copyPixelsTo(outPix: number[][], offsetX: number, offsetY: number) {
            for (let x = 0; x < 8; x++) {
                for (let y = 0; y < 8; y++) {
                    outPix[x + offsetX][y + offsetY] = this.pixels[x][y];
                }
            }
        }
    }

    export function Parse2BPPToImageMap(data: Buffer, palette: string[], tilesWide: number, tilesHigh: number, fullTilesWide = 7, fullTilesHigh = 7): ImageMap {
        let tiles: Tile2BPP[] = [];
        for (let t = 0; t < tilesHigh * tilesWide; t++) {
            tiles.push(new Tile2BPP(data.slice(t * 16)));
        }
        let pixels: number[][] = [];
        for (let x = 0; x < fullTilesWide * 8; x++) {
            pixels[x] = [];
            for (let y = 0; y < fullTilesHigh * 8; y++) {
                pixels[x][y] = 0;
            }
        }
        let xOffset = ((fullTilesWide - tilesWide) / 2) * 8; //horizontally center
        let yOffset = ((fullTilesHigh - tilesHigh) / 2) * 8; //vertically center
        tiles.forEach((tile, t) => tile.copyPixelsTo(pixels, (Math.floor(t / tilesHigh) * 8) + xOffset, ((t % tilesHigh) * 8) + yOffset));
        return { palette: palette, pixels: pixels };
    }

    export function Convert16BitColorToRGB(color16: number) {
        let red = Math.floor((color16 & 0x1F) * 8.25);
        let green = Math.floor(((color16 & 0x3E0) >> 5) * 8.25);
        let blue = Math.floor(((color16 & 0x7C00) >> 10) * 8.25);
        return '#' + Tools.ZeroPad(red.toString(16), 2) + Tools.ZeroPad(green.toString(16), 2) + Tools.ZeroPad(blue.toString(16), 2);
    }

    export function FloodClear(img: ImageMap, paletteIndex: number, stopPixels: number[][] = [], startPixels: number[][] = [], clearDiagonal = false) {
        let width = img.pixels.length;
        let height = (img.pixels[0] || []).length;
        let visitPixels = new Array<number[]>();
        let queued: boolean[][] = [];

        function queuePixel(x: number, y: number) {
            if (x >= 0 && x < width && y >= 0 && y < height && !(queued[x] || [])[y]) {
                visitPixels.push([x, y]);
                queued[x] = queued[x] || [];
                queued[x][y] = true;
            }
        }

        startPixels.forEach(pix => queuePixel(pix[0], pix[1]));

        for (let x = 0; x < width; x++) {
            queuePixel(x, 0);
            queuePixel(x, height - 1);
        }

        for (let y = 0; y < height; y++) {
            queuePixel(0, y);
            queuePixel(width - 1, y);
        }

        while (visitPixels.length) {
            let nextPixel = visitPixels.shift();
            let x = nextPixel.shift();
            let y = nextPixel.pop();
            if (img.pixels[x][y] == paletteIndex && !stopPixels.some(pix => pix[0] == x && pix[1] == y)) {
                img.pixels[x][y] = -1;
                queuePixel(x - 1, y);
                queuePixel(x + 1, y);
                queuePixel(x, y - 1);
                queuePixel(x, y + 1);
                if (clearDiagonal) {
                    queuePixel(x - 1, y - 1);
                    queuePixel(x + 1, y - 1);
                    queuePixel(x + 1, y - 1);
                    queuePixel(x - 1, y + 1);
                }
            }
        }
    }

}