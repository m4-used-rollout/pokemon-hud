/// <reference path="../ref/emotes.d.ts" />
/// <reference path="../node_modules/@types/node/index.d.ts" />
/// <reference path="../node_modules/electron/electron.d.ts" />

module TrendingEmotesPuller {
    const { ipcMain } = require('electron');
    const http = require('http') as typeof import('http');
    const URL = require('url') as typeof import('url');

    export class TrendingEmotesPuller {

        private badges = 0;
        private totalBadges = 0;

        private transmit: (emotes: TrendingEmote[]) => void = _ => null;
        private pullerInterval: NodeJS.Timeout;

        constructor(private url: string, private effects: EmoteEffects, updateInterval: number, state: TPP.RunStatus) {

            ipcMain.on('register-emotes', e => {
                let renderer = e.sender;
                this.transmit = (emotes: TrendingEmote[]) => {
                    if (!renderer.isDestroyed())
                        renderer.send('emote-update', emotes);
                };
                console.log("Starting Emote puller...");
                if (this.pullerInterval)
                    clearInterval(this.pullerInterval);
                this.pullerInterval = setInterval(() => this.update(), updateInterval * 1000);
                this.update();
            });
        }

        public updateBadgeCount(state: TPP.RunStatus) {
            if (this.badges != state.badges) {
                this.badges = state.badges || this.badges;
                this.totalBadges = this.badges.toString(2).split('1').length - 1;
            }
        }

        private update() {
            new Promise<TPPTrendingEmotes>((resolve, reject) => http.get(URL.parse(this.url), response => {
                let body = "";
                response.on('data', c => body += c);
                response.once('end', _ => resolve(JSON.parse(body)));
                response.once('error', reject);
            }).once('error', reject)).then(tppEmotes => {
                const allowedEmotes = Object.keys(this.effects);
                const filtered = tppEmotes.filter(e => allowedEmotes.includes(e[0].name));
                const transformed = new Array<TrendingEmote>();
                filtered.forEach(e => {
                    const id = e[0].id;
                    const name = e[0].name;
                    const locked = this.effects[name].badges > this.totalBadges;
                    const weight = e[1];
                    transformed.push({ id, name, locked, weight });
                });
                const final = transformed.sort((f1, f2) => f2.weight - f1.weight);
                const sum = transformed.reduce((sum, cur) => sum + (cur.locked ? 0 : cur.weight), 0);
                final.forEach(f => f.weight = f.locked ? 0 : (f.weight / sum));
                this.transmit(final);

            }, console.dir);
        }
    }
}