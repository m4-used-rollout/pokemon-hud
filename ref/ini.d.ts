declare module ini {
    interface EncodeOptions {
        section: string
        whitespace: boolean
    }

    export function decode(inistring: string): any;
    export function parse(initstring: string): any;
    export function encode(object: any, options?: EncodeOptions): string;
    export function stringify(object: any, options?: EncodeOptions): string;
    export function safe(val: string): string;
    export function unsafe(val: string): string;
}