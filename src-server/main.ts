/// <reference path="../ref/runstatus.d.ts" />
/// <reference path="argv.ts" />
/// <reference path="rom-reading/romreaders/concrete/g2.ts" />
/// <reference path="rom-reading/romreaders/concrete/generic.ts" />
/// <reference path="ram-reading/g3.ts" />
/// <reference path="../node_modules/@types/node/index.d.ts" />
/// <reference path="../node_modules/@types/electron/index.d.ts" />

module TPP.Server {

    const { ipcMain } = require('electron');

    export function getConfig(): Config {
        const configPath = './config.json';
        delete require.cache[require.resolve(configPath)];
        return Args.Parse().Merge(require(configPath));
    }

    let config = getConfig();

    var state: TPP.RunStatus = { party: [], pc: {} } as any;
    var stateChangeHandlers: ((state: TPP.RunStatus) => void)[] = [];


    var lastCommunicatedState: string = "";
    if (config.runStatusEndpoint)
        stateChangeHandlers.push(s => {
            const data = JSON.stringify(<TPP.OverlayData>{
                area_id: s.area_id,
                area_name: s.area_name,
                badges: s.badges,
                evolution_is_happening: s.evolution_is_happening,
                map_bank: s.map_bank,
                map_id: s.map_id,
                map_name: s.map_name,
                seen: s.seen,
                caught: s.caught,
                // x: s.x,
                // y: s.y
            });
            if (data != lastCommunicatedState) {
                lastCommunicatedState = data;
                sendData(config.runStatusEndpoint, data);
            }
        });
    if (config.newCatchEndpoint) {
        let oldTrainer = {} as TPP.Trainer;
        let oldCatches = new Array<number>();
        stateChangeHandlers.push(s => {
            const sameTrainer = s.id == oldTrainer.id && s.secret == oldTrainer.secret;
            oldCatches = (sameTrainer ? oldCatches : s.caught_list) || [];
            if ((state.caught_list || []).length > oldCatches.length) {
                let newCatches = state.caught_list.filter(c => oldCatches.indexOf(c) < 0);
                if (newCatches.length < 2) //these should only happen one at a time, really, but 2 *might* happen at once
                    newCatches.forEach(newCatch);
            }
            if (!sameTrainer) {
                oldTrainer = { id: s.id, secret: s.secret, name: s.name };
                console.log(`New trainer: ${s.name} ${s.id}-${s.secret}`);
            }
            oldCatches = s.caught_list;
        });
    }

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

    export function MainProcessRegisterStateHandler(stateFunc: (state: TPP.RunStatus) => void) {
        stateChangeHandlers.push(stateFunc);
    }

    export function getState() {
        return state;
    }

    function fixDoubleEscapedUnicode(json) {
        return json.replace(/\\\\u/g, '\\u');
    }

    function findLocalFile(path) {
        const resolve = require("path").resolve;
        const root = resolve(path);
        if (require('fs').existsSync(root)) {
            return root;
        }
        return resolve(`./resources/app/${path}`);
    }

    export let RomData: RomReader.RomReaderBase;
    try {
        let path;
        if (config.romFile ? config.romFile : config.extractedRomFolder) {
            path = findLocalFile(config.romFile ? config.romFile : config.extractedRomFolder);
            console.log(`Reading ROM at ${path}`);
        }
        // RomData = new RomReader.Gen3(path, config.iniFile && findLocalFile(config.iniFile));
        RomData = new RomReader.Gen2(path);
    } catch (e) {
        console.log(`Could not read ROM.`);
        console.error(e);
        RomData = new RomReader.Generic();
    }
    export let RamData: RamReader.RamReaderBase = new RamReader.Gen3(RomData, 5337);

    // RamData.Read(state, () => {
    //     RomReader.AugmentState(RomData, state);
    //     transmitState()
    // });

    let trainerString = "", partyString = "", pcString = "", battleString = "";

    export function rawState() {
        let rawState = JSON.parse(trainerString || "{}");
        rawState.party = JSON.parse(partyString || "[]");
        rawState.pc = JSON.parse(pcString || "{}");
        let battleData = JSON.parse(battleString || "{}")
        Object.keys(battleData).forEach(k => rawState[k] = battleData[k]);
        return rawState;
    }

    function mergeBattleState(battleData: BattleStatus = JSON.parse(battleString || "{}")) {
        if (battleString) {
            state.in_battle = battleData.in_battle;
            state.battle_kind = battleData.battle_kind;
            state.enemy_party = battleData.enemy_party;
            state.enemy_trainers = battleData.enemy_trainers;
        }
    }

    export function setState(dataJson: string) {
        if (dataJson == trainerString || dataJson == partyString || dataJson == pcString || dataJson == battleString)
            return; //same exact data, no update needed.
        try {
            var data = JSON.parse(fixDoubleEscapedUnicode(dataJson));
        }
        catch (e) {
            console.error(e);
            return console.log(dataJson);
        }
        try {
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
                let party = data.party || state.party || [];
                let pc = data.pc || state.pc;
                state = data;
                state.seen_list = RomData.CollapseSeenForms(state.seen_list);
                state.pc = pc;
                state.party = party;
                mergeBattleState(); //if it's being sent separately, don't overwrite it
            }
            else if (data.in_battle || data.in_battle === false) { //battle data subset of trainer data
                battleString = dataJson;
                mergeBattleState(data as BattleStatus);
            }
            else
                return; //unrecognized format, dropped
            RomReader.AugmentState(RomData, state);
        }
        catch (e) {
            console.error(e);
        }
        transmitState();
    }

    function newCatch(dexNum: number) {
        let dexNums: number[];
        if (config.romDexToNatDex) {
            let num = config.romDexToNatDex[dexNum] || dexNum;
            dexNums = num instanceof Array ? num : [num];
        }
        console.log(`New catch: ${dexNum}`);
        if (config.newCatchEndpoint)
            dexNums.forEach(dex=>sendData(config.newCatchEndpoint, dex.toString()));
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