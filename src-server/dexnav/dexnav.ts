/// <reference path="../main.ts" />
/// <reference path="state.ts" />

namespace TPP.Server.DexNav {
    const { ipcMain } = require('electron');

    let state: State = null;

    let ownedCount = 0, seenCount = 0, hour = 0, in_battle = false, enemyParty = "", party = "";

    ipcMain.on('register-dexnav', e => {
        let renderer = e.sender;
        let sendFunc = (state: State) => {
            if (!renderer.isDestroyed())
                renderer.send('dexnav-update', state);
        };
        stateChangeHandlers.push(sendFunc);
        sendFunc(state);
    });

    const getHour = (rs: RunStatus) => (rs.time || { h: 0 }).h;

    MainProcessRegisterStateHandler(runState => {
        if (!state //No previous state
            || state.GlitchOut != runState.transitioning
            || runState.map_id != state.MapID || runState.map_bank != state.MapBank || runState.area_id != state.AreaID //Changed map
            || ownedCount != runState.caught || seenCount != runState.seen //Changed Pokedex
            || hour != getHour(runState) //Changed time of day
            || runState.in_battle != in_battle //Got into/out of a battle
            || enemyParty != JSON.stringify(runState.enemy_party) //enemy trainer update
            || party != JSON.stringify(in_battle && runState.battle_party || runState.party) //our party update
            || (!state.PuzzleFoundScroll && runState.trick_house && runState.trick_house.filter(t => true).pop() != "Incomplete") //found TTH scroll
        ) {
            let map = RomData.GetMap(runState.map_id, runState.map_bank);
            state = new State(map, RomData.GetCurrentMapEncounters(map, runState), RomData.GetAllMapEncounters(map), runState);
            state.GlitchOut = runState.transitioning;
            ownedCount = runState.caught;
            seenCount = runState.seen;
            hour = getHour(runState);
            in_battle = runState.in_battle;
            enemyParty = JSON.stringify(runState.enemy_party);
            party = JSON.stringify(in_battle && runState.battle_party || runState.party);
            transmitState();
        }
    });

    var stateChangeHandlers: ((state: State) => void)[] = [];

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

}