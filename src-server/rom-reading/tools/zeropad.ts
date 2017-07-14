namespace Tools {
    export function ZeroPad(str: string, len: number, left = true) {
        let zeroes = new Array<string>();
        for (let i = 0; i < len; zeroes[i++] = '0');
        if (left) {
            let mash = zeroes.join('') + str;
            return mash.substring(mash.length - len);
        }
        return (str + zeroes.join('')).substring(0, len);
    }
}