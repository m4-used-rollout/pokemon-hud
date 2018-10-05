/// <reference path="../rom-reading/romreaders/base.ts" />

namespace RamReader {
    export abstract class RamReaderBase {
        constructor(public rom: RomReader.RomReaderBase, public port: number, public hostname) { }


        public CallEmulator<T=string>(path: string, callback?: (data: string) => T) {
            return new Promise<T>((resolve, reject) => {
                try {
                    require('http').get(`http://${this.hostname}:${this.port}/${path}`, response => {
                        let data = '';
                        response.on('data', chunk => data += chunk);
                        if (callback) {
                            response.on('end', () => resolve(callback(data)));
                        }
                        else {
                            response.on('end', () => resolve(data as any as T));
                        }
                    }).on('error', reject);
                }
                catch (e) {
                    reject(e);
                }
            });
        }

        public CachedEmulatorCaller<T>(path: string, callback: (data: string) => T) {
            let lastInput: string = null;
            return () => this.CallEmulator<T>(path, data => {
                if (lastInput != data) {
                    try {
                        const result = callback(data);
                        if (result) {
                            lastInput = data;
                            return result;
                        }
                    }
                    catch (e) {
                        console.error(e);
                        return null;
                    }
                }
                return null;
            });
        }

    }
}