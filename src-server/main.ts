/// <reference path="../ref/runstatus.d.ts" />
/// <reference path="../ref/config.d.ts" />
/// <reference path="rom-reading/romreaders/concrete/g2.ts" />
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

    export function MainProcessRegisterStateHandler(stateFunc:(state: TPP.RunStatus) => void) {
        stateChangeHandlers.push(stateFunc);
    }

    export function getState() {
        return state;
    }

    function fixDoubleEscapedUnicode(json) {
        return json.replace(/\\\\u/g, '\\u');
    }

    export const RomData = new RomReader.Gen2(config.romFile);

    let trainerString = "", partyString = "", pcString = "";

    export function setState(dataJson: string) {
        if (dataJson == trainerString || dataJson == partyString || dataJson == pcString)
            return; //same exact data, no update needed.
        try {
            var data = JSON.parse(fixDoubleEscapedUnicode(dataJson));
        }
        catch (e) {
            console.error(e);
            return console.log(dataJson);
        }
        if (!data)
            return; //junk
        else if (Array.isArray(data) && data.length && data[0] && data[0].species && data[0].species.id) {
            partyString = dataJson;
            delete state.party;
            state.party = data;
        }
        else if (data.boxes) {
            pcString = dataJson;
            state.pc = state.pc || data;
            state.pc.boxes = state.pc.boxes || [];
            state.pc.current_box_number = data.current_box_number || state.pc.current_box_number;
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
        RomReader.AugmentState(RomData, state);
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