/// <reference path="../../ref/runstatus.d.ts" />

namespace RamReader{
    export interface OptionsFieldSpec {
        [key:number]: string;
        bitmask?: number;
        offset?: number;
    }

    export interface OptionsSpec {
        [key:string]: OptionsFieldSpec;
    }

    function ParseOption(rawOptions:number, fieldSpec:OptionsFieldSpec) {
        const possibleValues = Object.keys(fieldSpec).map(k=>parseInt(k)).filter(k=>k).sort();
        const selection = (fieldSpec.bitmask || possibleValues.reduce((mask,key)=>mask | key, 0)) & rawOptions;
        if (fieldSpec[selection]) //exact match
            return fieldSpec[selection];
        if (!possibleValues.length) { //bitmask match
            let shift = 0;
            let bitmask = fieldSpec.bitmask || 0;
            while(bitmask && (bitmask % 2 == 0)) {
                bitmask = bitmask >> 1;
                shift++;
            }
            return ((selection >> shift) + (fieldSpec.offset || 0)).toString();
        }
        //return the highest value that matches (or the lowest if none match)
        return fieldSpec[possibleValues.filter(v=> (selection & v) == v).pop() || possibleValues.shift()];
    }

    export function ParseOptions(rawOptions:number, optionsSpec:OptionsSpec) {
        const parsedOptions = {} as TPP.Options;
        Object.keys(optionsSpec).forEach(k=>parsedOptions[k] = ParseOption(rawOptions, optionsSpec[k]));
        return parsedOptions;
    }

}