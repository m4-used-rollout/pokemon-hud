/// <reference path="../ref/runstatus.d.ts" />
/// <reference path="../ref/config.d.ts" />
/// <reference path="rom-reading/romreaders/g5.ts" />
/// <reference path="../node_modules/@types/node/index.d.ts" />
/// <reference path="../node_modules/@types/electron/index.d.ts" />

module TPP.Server {

    const { ipcMain } = require('electron');

    export function getConfig(): Config {
        delete require.cache[require.resolve('./config.json')];
        return require('./config.json');
    }

    let config = getConfig();

    var state: TPP.RunStatus = { party: [], pc: {} } as any;
    var stateChangeHandlers: ((state: TPP.RunStatus) => void)[] = [];

    if (config.runStatusEndpoint)
        stateChangeHandlers.push(s => sendData(config.runStatusEndpoint, JSON.stringify(s)));

    ipcMain.on('register-renderer', e => {
        let renderer = e.sender;
        let sendFunc = (state: TPP.RunStatus) => {
            if (!renderer.isDestroyed())
                renderer.send('state-update', state);
        };
        stateChangeHandlers.push(sendFunc);
        sendFunc(state);
    });

    function transmitState() {
        for (let i = 0; i < stateChangeHandlers.length; i++) {
            try {
                if (typeof stateChangeHandlers[i] === "function")
                    setTimeout(() => stateChangeHandlers[i](state), 0);
                else
                    delete stateChangeHandlers[i];
            }
            catch (e) {
                delete stateChangeHandlers[i];
            }
        }
    }

    export function getState() {
        return state;
    }

    function fixDoubleEscapedUnicode(json) {
        return json.replace(/\\\\u/g, '\\u');
    }

    const RomData = new RomReader.Gen5(config.extractedRomFolder);

    function augmentState() {
        state.name = RomData.ConvertText(state.name);
        state.caught = (state.caught_list || []).length;
        state.seen = (state.seen_list || []).length;
        state.ball_count = 0;
        [state.items, state.items_ball, state.items_berry, state.items_free_space, state.items_key, state.items_medicine, state.items_tm, state.pc_items]
            .filter(i => i && i.length)
            .forEach(itemList => itemList.filter(i => !!i).forEach(item => {
                state.ball_count += RomData.ItemIsBall(item.id) ? item.count : 0;
                let romItem = RomData.GetItem(item.id);
                item.name = item.name || romItem.name;
                item.count = romItem.isKeyItem && item.count == 1 ? null : item.count;
                if (!item.count)
                    delete item.count;
            }));
        (state.pc.boxes || []).map(b => b.box_contents).reduce((arr: Pokemon[], val: Pokemon[]) => val, state.party || []).filter(p => !!p).forEach(p => {
            p.name = RomData.ConvertText(p.name);
            if (p.original_trainer) {
                p.original_trainer.name = RomData.ConvertText(p.original_trainer.name);
            }
            if (p.met) {
                p.met.area_name = RomData.GetMap(p.met.area_id || p.met.map_id).name;
                if (typeof p.met.caught_in !== "string") {
                    p.met.caught_in = RomData.GetItem(parseInt(p.met.caught_in)).name;
                }
            }
            if (p.held_item) {
                p.held_item.name = RomData.GetItem(p.held_item.id).name;
            }
            let romMon = RomData.GetSpecies(p.species.id);
            if (typeof p.ability === "number") {
                p.ability = romMon.abilities[parseInt(p.ability)];
            }
            p.species.name = p.species.name || romMon.name;
            p.species.national_dex = p.species.national_dex || romMon.dexNumber;
            p.species.type1 = p.species.type1 || romMon.type1;
            p.species.type2 = p.species.type2 || romMon.type2;
            p.species.growth_rate = p.species.growth_rate || (romMon.expFunction.name || "").replace(/([A-Z])/g, " $1").trim();
            if (!p.level) {
                p.level = Pokemon.ExpCurve.ExpToLevel(p.experience.current, romMon.expFunction);
            }
            p.experience.next_level = p.experience.next_level || p.level == 100 ? 0 : romMon.expFunction(p.level + 1);
            p.experience.this_level = p.experience.this_level || romMon.expFunction(p.level);
            p.experience.remaining = p.experience.next_level - p.experience.current;
            p.moves.filter(m => !!m).forEach(m => {
                let romMove = RomData.GetMove(m.id);
                m.name = m.name || romMove.name;
                m.accuracy = m.accuracy || romMove.accuracy;
                m.base_power = m.base_power || romMove.basePower;
                m.type = m.type || romMove.type;
            });
        });
        state.area_name = RomData.GetMap(state.area_id || state.map_id).name;
    }

    let trainerString = "", partyString = "", pcString = "";

    export function setState(dataJson: string) {
        if (dataJson == trainerString || dataJson == partyString || dataJson == pcString)
            return; //same exact data, no update needed.
        let data = JSON.parse(fixDoubleEscapedUnicode(dataJson));
        if (Array.isArray(data) && data.length && data[0] && typeof (data[0].personality_value) == "number") {
            partyString = dataJson;
            delete state.party;
            state.party = data;
        }
        else if (data.boxes) {
            pcString = dataJson;
            state.pc = state.pc || data;
            state.pc.boxes = state.pc.boxes || [];
            state.pc.current_box_number = data.current_box_number;
            (data.boxes || []).forEach(b => state.pc.boxes[b.box_number - 1] = b);
        }
        else if (data.id || data.secret) {
            trainerString = dataJson;
            let sameTrainer = data.id == state.id && data.secret == state.secret;
            let oldCatches = (sameTrainer ? state.caught_list : data.caught_list) || [];
            let party = data.party || state.party || [];
            let pc = data.pc || state.pc;
            state = data;
            state.pc = pc;
            state.party = party;
            if ((state.caught_list || []).length > oldCatches.length) {
                let newCatches = state.caught_list.filter(c => oldCatches.indexOf(c) < 0);
                if (newCatches.length < 3) //these should only happen one at a time, really, but 2 *might* happen at once
                    newCatches.forEach(newCatch);
            }
        }
        else
            return; //unrecognized format, dropped
        augmentState();
        transmitState();
    }

    function newCatch(dexNum: number) {
        if (config.romDexToNatDex) {
            dexNum = config.romDexToNatDex[dexNum] || dexNum;
        }
        console.log(`New catch: ${dexNum}`);
        if (config.newCatchEndpoint)
            sendData(config.newCatchEndpoint, dexNum.toString());
    }

    const sendData = (url: string, data: string) => {
        try {
            var options = require('url').parse(url);
            options['method'] = 'POST';
            var request = require('http').request(options);
            request.on('error', () => null);
            request.end(data, 'utf8');
            return request;
        }
        catch (e) {
        }
    };

    export const fileExists = (path: string) => require('fs').existsSync(path);

}

(exports as any).TPP = TPP;