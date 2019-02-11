/// <reference path="../ref/runstatus.d.ts" />
/// <reference path="argv.ts" />
/// <reference path="rom-reading/romreaders/concrete/g3.ts" />
/// <reference path="rom-reading/romreaders/concrete/g1.ts" />
/// <reference path="rom-reading/romreaders/concrete/generic.ts" />
/// <reference path="ram-reading/g3.ts" />
/// <reference path="ram-reading/g1.ts" />
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

    function findLocalFile(path: string) {
        const resolve: typeof import("path").resolve = require("path").resolve;
        const root = resolve(path);
        if (require('fs').existsSync(root)) {
            return root;
        }
        return resolve(`./resources/app/${path}`);
    }

    export let RomDataG3: RomReader.RomReaderBase;
    export let RamDataG3: RamReader.RamReaderBase;
    export let RomDataG1: RomReader.RomReaderBase;
    export let RamDataG1: RamReader.RamReaderBase;
    try {
        let path = findLocalFile(config.romFile[0]);
        console.log(`Reading ROM at ${path}`);
        let rom3 = new RomReader.Gen3(path, config.iniFile && findLocalFile(config.iniFile));
        RomDataG3 = rom3;
        RamDataG3 = new RamReader.Gen3(rom3, 5337, undefined, config.listenPort || 1337);

        path = findLocalFile(config.romFile[1]);
        console.log(`Reading ROM at ${path}`);
        let rom1 = new RomReader.Gen1(path);
        RomDataG1 = rom1;
        RamDataG1 = new RamReader.Gen1(rom1, 5337, undefined, config.listenPort || 1337);
    } catch (e) {
        console.log(`Could not read ROM.`);
        console.error(e);
        process.exit(1);
    }
    export let RomData = RomDataG1;
    export let RamData = RamDataG1;
    // try {
    //     let path;
    //     if (config.romFile ? config.romFile : config.extractedRomFolder) {
    //         path = findLocalFile(config.romFile ? config.romFile : config.extractedRomFolder);
    //         console.log(`Reading ROM at ${path}`);
    //     }
    //     let rom = new RomReader.Gen3(path, config.iniFile && findLocalFile(config.iniFile));
    //     RomData = rom;
    //     RamData = new RamReader.Gen3(rom, 5337);
    //     //RomData = new RomReader.Gen2(path);
    // } catch (e) {
    //     console.log(`Could not read ROM.`);
    //     console.error(e);
    //     RomData = new RomReader.Generic();
    // }

    let transitionTimeout: NodeJS.Timer;

    export function StartRamReading() {
        if (RamData) {
            RamData.Read(state, () => {
                MergeOverrides();
                RomReader.AugmentState(RomData, state);
                transmitState();
            });
            transitionTimeout = setTimeout(() => {
                state.transitioning = false;
                transmitState();
            }, config.transitionDurationMs || 1000);
        }
    }
    export function StopRamReading() {
        if (RamData) {
            RamData.Stop();
        }
        RamDataG1.Stop();
        RamDataG3.Stop();
        clearTimeout(transitionTimeout);
        state.transitioning = true;
    }

    //StartRamReading();
    const WaitForEmu = () => RamData.CallEmulator("/GetROMName", game => {
        console.log(`Emulator says we're playing ${game}`);
        setOverrides({ game });
    }, true).catch(WaitForEmu);
    console.log("Waiting for emulator");
    WaitForEmu();

    let trainerString = "", partyString = "", pcString = "", battleString = "", overrides: { [key: string]: string } = {};

    export function rawState() {
        let rawState: RunStatus = JSON.parse(trainerString || "{}");
        rawState.party = JSON.parse(partyString || "[]");
        rawState.pc = JSON.parse(pcString || "{}");
        rawState = Object.assign(rawState, JSON.parse(battleString || "{}"));
        MergeOverrides(rawState);
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

    function switchGame(game: string) {
        StopRamReading();
        if (game.split('.').pop() == "gba") {
            RomData = RomDataG3;
            RamData = RamDataG3;
        }
        else {
            RomData = RomDataG1;
            RamData = RamDataG1;
        }
        setTimeout(() => state.updates_paused ? null : StartRamReading(), 1);
    }

    export function setOverrides(parsed: { [key: string]: any })
    export function setOverrides(dataJSON: string);
    export function setOverrides(data: string | { [key: string]: any }) {
        let parsed: { [key: string]: any };
        if (typeof (data) == "string")
            parsed = JSON.parse(fixDoubleEscapedUnicode(data));
        else
            parsed = data;
        const unparsed: { [key: string]: string } = {};
        Object.keys(parsed).forEach(k => unparsed[k] = parsed[k] && JSON.stringify(parsed[k]));
        const updateKeys = Object.keys(unparsed).filter(k => unparsed[k] != overrides[k]);
        if (updateKeys.length > 0) {
            updateKeys.forEach(k => {
                if (k == "game")
                    switchGame(parsed[k]);
                else if (k == "updates_paused")
                    parsed[k] ? StopRamReading() : StartRamReading();
                if (parsed[k] === null)
                    delete overrides[k];
                else
                    overrides[k] = unparsed[k];
            });
            MergeOverrides();
            RomReader.AugmentState(RomData, state);
            transmitState();
        }
    }

    export function MergeOverrides(currState = state) {
        Object.keys(overrides).forEach(k => {
            switch (k) {
                case "items":
                    const items = JSON.parse(overrides[k]);
                    return Object.keys(items).forEach(k => currState.items[k] = items[k]);
                default:
                    return currState[k] = JSON.parse(overrides[k]);
            }
        });
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
            MergeOverrides();
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
        else
            dexNums = [dexNum];
        console.log(`New catch: ${dexNum}`);
        if (config.newCatchEndpoint)
            dexNums.forEach(dex => sendData(config.newCatchEndpoint, dex.toString()));
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