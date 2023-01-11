/// <reference path="../ref/runstatus.d.ts" />
/// <reference path="argv.ts" />
/// <reference path="events/events.ts" />
/// <reference path="rom-reading/romreaders/concrete/g1.ts" />
/// <reference path="rom-reading/romreaders/concrete/g2.ts" />
/// <reference path="rom-reading/romreaders/concrete/g3.ts" />
/// <reference path="rom-reading/romreaders/concrete/col.ts" />
/// <reference path="rom-reading/romreaders/concrete/xd.ts" />
/// <reference path="rom-reading/romreaders/concrete/g4.ts" />
/// <reference path="rom-reading/romreaders/concrete/g5.ts" />
/// <reference path="rom-reading/romreaders/concrete/g6.ts" />
/// <reference path="rom-reading/romreaders/concrete/g7.ts" />
/// <reference path="rom-reading/romreaders/concrete/generic.ts" />
/// <reference path="ram-reading/g1.ts" />
/// <reference path="ram-reading/g2.ts" />
/// <reference path="ram-reading/g3.ts" />
/// <reference path="ram-reading/col.ts" />
/// <reference path="ram-reading/xd.ts" />
/// <reference path="ram-reading/g6.ts" />
/// <reference path="ram-reading/g7.ts" />
/// <reference path="../node_modules/@types/node/index.d.ts" />
/// <reference path="../node_modules/electron/electron.d.ts" />
/// <reference path="../ref/splits.d.ts" />
/// <reference path="emotes.tsx" />



module TPP.Server {

    const { ipcMain } = require('electron');
    const fs = require('fs') as typeof import('fs');

    export function getConfig(): Config {
        const configPath = './config.json';
        delete require.cache[require.resolve(configPath)];
        return Args.Parse().Merge(require(configPath));
    }

    export function getSplits(): Splits {
        if (config.splitFile) {
            delete require.cache[require.resolve(config.splitFile)];
            return require(config.splitFile);
        }
        return [];
    }

    let config = getConfig();

    var state: TPP.RunStatus = { party: [], pc: {}, game: config.runName, generation: config.generation } as Partial<TPP.RunStatus> as TPP.RunStatus;
    var stateChangeHandlers: ((state: TPP.RunStatus) => void)[] = [];

    const fsSafe = /[^a-z0-9-.]*/ig;

    const saveFileName = (state: RunStatus) => `${state.game}-${state.name}-${state.id}`.replace(fsSafe, '');
    const saveState = (path: string, state: RunStatus) => fs.promises.writeFile(path, JSON.stringify(state)).catch(err => console.error(`Could not save state backup (${config.stateBackupFolder}): ${err}`))
    const defaultStateFileName = (state: RunStatus) => `${config.stateBackupFolder}/${saveFileName(state)}.json`;


    var lastCommunicatedState: string = "";
    if (config.runStatusEndpoint)
        stateChangeHandlers.push(s => {
            const data = JSON.stringify(<TPP.OverlayData>{
                in_battle: s.in_battle,
                battle_kind: s.battle_kind,
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
                if (newCatches.length <= 7) //these should only happen one at a time, really, but 2 *might* happen at once
                    newCatches.forEach(NewCatch);
            }
            if (!sameTrainer) {
                oldTrainer = { id: s.id, secret: s.secret, name: s.name };
                console.log(`New trainer: ${s.name} ${s.id}-${s.secret}`);
                if (config.stateBackupFolder && fs.existsSync(defaultStateFileName(s))) {
                    fs.promises.readFile(defaultStateFileName(s)).then(data => setState(Object.assign(JSON.parse(data.toString('utf8')))));
                }
            }
            oldCatches = s.caught_list;
        });
    }
    if (config.newSeenEndpoint) {
        let oldTrainer = {} as TPP.Trainer;
        let oldSeen = new Array<number>();
        stateChangeHandlers.push(s => {
            const sameTrainer = s.id == oldTrainer.id && s.secret == oldTrainer.secret;
            oldSeen = (sameTrainer ? oldSeen : s.seen_list) || [];
            if ((s.seen_list || []).length > oldSeen.length) {
                let newSeen = s.seen_list.filter(c => oldSeen.indexOf(c) < 0);
                if (newSeen.length <= 7) //these should only happen up to 3 at a time, really, but who knows
                    newSeen.forEach(NewSeen);
            }
            if (!sameTrainer) {
                oldTrainer = { id: s.id, secret: s.secret, name: s.name };
                console.log(`New trainer: ${s.name} ${s.id}-${s.secret}`);
                if (config.stateBackupFolder && fs.existsSync(defaultStateFileName(s))) {
                    fs.promises.readFile(defaultStateFileName(s)).then(data => setState(Object.assign(JSON.parse(data.toString('utf8')))));
                }
            }
            oldSeen = s.seen_list;
        });
    }
    if (config.stateBackupFolder) {
        let filePromise = fs.promises.mkdir(config.stateBackupFolder, { recursive: true }).catch(err => console.error(`Could not create state backup folder (${config.stateBackupFolder}): ${err}`));
        let lastSave = Date.now();
        stateChangeHandlers.push(state => {
            if (Date.now() - lastSave > config.stateBackupIntervalMinutes * 1000 * 60) {
                lastSave = Date.now();
                filePromise = filePromise.then(() => saveState(defaultStateFileName(state), state));
                saveState(`${config.stateBackupFolder}/${saveFileName(state)}-${new Date().toISOString()}.json`, state);
            }
        });
        process.on('beforeExit', () => {
            console.log("Saving state on shutdown...");
            saveState(defaultStateFileName(state), state);
        })
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
        state = events.Analyze(state);
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

    export let RomData: RomReader.RomReaderBase;
    export let RamData: RamReader.RamReaderBase;
    try {
        let path: string;
        const romFile = (Array.isArray(config.romFile) ? config.romFile[0] : config.romFile) || config.extractedRomFolder;
        if (romFile) {
            path = RomReader.RomReaderBase.FindLocalFile(romFile);
            console.log(`Reading ROM at ${path}`);
        }
        switch (config.generation) {
            case 1: {
                let rom = new RomReader.Gen1(path);
                RomData = rom;
                if (!config.listenOnly)
                    RamData = new RamReader.Gen1(rom, 5337, "localhost", config);
                break;
            }
            case 2: {
                let rom = new RomReader.Gen2(path);
                RomData = rom;
                if (!config.listenOnly)
                    RamData = new RamReader.Gen2(rom, 5337, "localhost", config);
                break;
            }
            case 3: {
                let rom = new RomReader.Gen3(path, config.iniFile && RomReader.RomReaderBase.FindLocalFile(config.iniFile));
                RomData = rom;
                if (!config.listenOnly)
                    RamData = new RamReader.Gen3(rom, 5337, "localhost", config);
                break;
            }
            case 3.5: { //Colosseum
                let rom = new RomReader.Col(path);
                RomData = rom;
                if (!rom.HasPokemonData) {
                    const msg = `Unable to read ROM files at ${path}`;
                    console.log(msg);
                    alert(msg);
                    process.exit(1);
                }
                if (!config.listenOnly)
                    RamData = new RamReader.Col(rom, 6000, "localhost", config);
                break;
            }
            case 3.9: { //XD
                let rom = new RomReader.XD(path);
                RomData = rom;
                if (!config.listenOnly)
                    RamData = new RamReader.XD(rom, 6000, "localhost", config);
                break;
            }
            case 4: {
                let rom = new RomReader.Gen4(path);
                RomData = rom;
                //RamData = new RamReader.Gen4(rom, 6337, "localhost", config);
                break;
            }
            case 5: {
                let rom = new RomReader.Gen5(path);
                RomData = rom;
                //RamData = new RamReader.Gen5(rom, 6337, "localhost", config);
                break;
            }
            case 6: {
                let rom = new RomReader.Gen6();
                RomData = rom;
                if (!config.listenOnly)
                    RamData = new RamReader.Gen6(rom, 5340, "localhost", config);
                break;
            }
            case 7: {
                let rom = new RomReader.Gen7();
                RomData = rom;
                if (!config.listenOnly)
                    RamData = new RamReader.Gen7(rom, 5340, "localhost", config);
                break;
            }
        }
    } catch (e) {
        console.log(`Could not read ROM.`);
        console.error(e);
        RomData = new RomReader.Generic();
    }
    export const events = new Events.RunEvents(config, RomData);

    let transitionTimeout: NodeJS.Timer;

    export function StartRamReading() {
        if (!config.listenOnly && RamData) {
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
        clearTimeout(transitionTimeout);
    }

    StartRamReading();
    // if (RamData) {
    //     const WaitForEmu = () => RamData.CallEmulator("/GetROMName", game => {
    //         console.log(`Emulator says we're playing ${game}`);
    //         setOverrides({ game });
    //     }, true).catch(WaitForEmu);
    //     console.log("Waiting for emulator");
    //     WaitForEmu();
    // }

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
        // if (battleString) {
        //     state.in_battle = battleData.in_battle;
        //     state.battle_kind = battleData.battle_kind;
        //     state.enemy_party = battleData.enemy_party;
        //     state.enemy_trainers = battleData.enemy_trainers;
        // }
    }

    function switchGame(game: string) {
        StopRamReading();
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
                    currState.items = currState.items || {};
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
            else if (data.party || data.battle_party) {
                partyString = dataJson;
                state.party = data.party || state.party;
                state.battle_party = data.battle_party;
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
                state = { ...data, party, pc, seen_list: RomData.CollapseSeenForms(state.seen_list) };
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

    export function NewSeen(dexNum: number) {
        let dexNums: number[];
        if (config.romDexToNatDex) {
            let num = config.romDexToNatDex[dexNum] || dexNum;
            dexNums = num instanceof Array ? num : [num];
        }
        else
            dexNums = [dexNum];
        console.log(`Newly seen: ${dexNum}`);
        if (config.newSeenEndpoint)
            dexNums.forEach(dex => sendData(config.newSeenEndpoint, dex.toString()));
    }

    export function NewCatch(dexNum: number) {
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

    export function AnyCatch(dexNum: number) {
        let dexNums: number[];
        if (config.romDexToNatDex) {
            let num = config.romDexToNatDex[dexNum] || dexNum;
            dexNums = num instanceof Array ? num : [num];
        }
        else
            dexNums = [dexNum];
        console.log(`Catch: ${dexNum}`);
        if (config.allCatchesEndpoint)
            dexNums.forEach(dex => {
                try {
                    let options = require('url').parse(`${config.allCatchesEndpoint}${dex}`);
                    options['method'] = 'POST';
                    let request = require('http').request(options);
                    request.on('error', () => null);
                    request.end(dex.toString(), 'utf8');
                    return request;
                }
                catch (e) {
                }
            });
    }

    const sendData = (url: string, data: string) => {
        try {
            let options = require('url').parse(url);
            options['method'] = 'POST';
            let request = require('http').request(options);
            request.on('error', () => null);
            request.end(data, 'utf8');
            return request;
        }
        catch (e) {
        }
    };

    export const fileExists = (path: string) => require('fs').existsSync(path);

    export let emotePuller: TrendingEmotesPuller.TrendingEmotesPuller = null;
    if (config.emoteEffectsFile && config.emoteEndpoint) {
        emotePuller = new TrendingEmotesPuller.TrendingEmotesPuller(config.emoteEndpoint, require(config.emoteEffectsFile), config.emotePollIntervalSeconds || 5, state);
        MainProcessRegisterStateHandler(state => emotePuller.updateBadgeCount(state));
    }

}

(exports as any).TPP = TPP;