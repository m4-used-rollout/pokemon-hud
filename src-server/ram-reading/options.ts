/// <reference path="../../ref/runstatus.d.ts" />

namespace RamReader {
    export interface OptionsFieldSpec {
        [key: number]: string;
        bitmask?: number;
        offset?: number;
    }

    export interface OptionsSpec {
        [key: string]: OptionsFieldSpec;
    }

    function CalcBitmaskShift(bitmask: number) {
        let shift = 0;
        while (bitmask && (bitmask % 2 == 0)) {
            bitmask = bitmask >> 1;
            shift++;
        }
        return shift;
    }

    function ParseOption(rawOptions: number, fieldSpec: OptionsFieldSpec) {
        const possibleValues = Object.keys(fieldSpec).map(k => parseInt(k)).filter(k => k).sort();
        const selection = (fieldSpec.bitmask || possibleValues.reduce((mask, key) => mask | key, 0)) & rawOptions;
        if (fieldSpec[selection]) //exact match
            return fieldSpec[selection];
        if (!possibleValues.length) { //bitmask match
            return ((selection >> CalcBitmaskShift(fieldSpec.bitmask)) + (fieldSpec.offset || 0)).toString();
        }
        //return the highest value that matches (or the lowest if none match)
        return fieldSpec[possibleValues.filter(v => (selection & v) == v).pop() || possibleValues.shift()];
    }

    function SetOption(rawOptions: number, setting: string, fieldSpec: OptionsFieldSpec) {
        const backMapping = {} as { [key: string]: number };
        rawOptions &= ~(fieldSpec.bitmask || Object.keys(fieldSpec).map(k => parseInt(k)).filter(k => k).reduce((mask, key) => mask | key, 0));
        Object.keys(fieldSpec).map(k => parseInt(k)).filter(k => k).sort().forEach(k => backMapping[fieldSpec[k].toLowerCase()] = k);
        if (!Object.keys(backMapping).length && fieldSpec.bitmask) { //use bitmask
            return (((parseInt(setting) << CalcBitmaskShift(fieldSpec.bitmask)) - (fieldSpec.offset || 0)) & fieldSpec.bitmask) | rawOptions;
        }
        return (backMapping[setting.toLowerCase()] || 0) | rawOptions;
    }

    export function ParseOptions(rawOptions: number, optionsSpec: OptionsSpec) {
        const parsedOptions = {} as TPP.Options;
        Object.keys(optionsSpec).forEach(k => parsedOptions[k] = ParseOption(rawOptions, optionsSpec[k]));
        return parsedOptions;
    }

    export function SetOptions(rawOptions: number, desiredOptions: TPP.Options, optionsSpec: OptionsSpec) {
        return Object.keys(desiredOptions).filter(o => optionsSpec[o]).reduce((rawOpts, option) => SetOption(rawOpts, desiredOptions[option], optionsSpec[option]), rawOptions);
    }

}