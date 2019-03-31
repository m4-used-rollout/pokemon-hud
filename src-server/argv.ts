/// <reference path="../ref/config.d.ts" />

module Args {
    const fs:typeof import('fs') = require('fs');

    export interface CmdConf extends Config {}

    export class CmdConf {
        Merge(config: Config) {
            Object.keys(config || {}).forEach(k => this[k] = this[k] === null || typeof this[k] === "undefined" ? config[k] : this[k]);
            return this;
        }
    }

    export function Parse(): CmdConf {
        const conf = new CmdConf();
        Object.keys(conf).filter(k => typeof conf[k] != "function").forEach(k => {
            const index = process.argv.indexOf(`--${k}`);
            if (index > 0) {
                conf[k] = JSON.parse(process.argv[index + 1]);
            }
        });
        const index = process.argv.indexOf('--config');
        if (index > 0) {
            conf.Merge(JSON.parse(fs.readFileSync(process.argv[index + 1], 'utf8')));
        }
        return conf;
    }
}