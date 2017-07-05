/// <reference path="../main.ts" />
/// <reference path="state.ts" />

namespace TPP.Server.DexNav {
    const { ipcMain } = require('electron');

    let state:State = null;

    let ownedCount = 0, seenCount = 0;

    ipcMain.on('register-dexnav', e => {
        let renderer = e.sender;
        let sendFunc = (state: State) => {
            if (!renderer.isDestroyed())
                renderer.send('dexnav-update', state);
        };
        stateChangeHandlers.push(sendFunc);
        sendFunc(state);
    });

    MainProcessRegisterStateHandler(runState=>{
        if (!state || runState.map_id != state.MapID || runState.map_bank != state.MapBank || runState.area_id != state.AreaID || ownedCount != runState.caught || seenCount != runState.seen) {
            state = new State(RomData.GetMap(runState.map_id, runState.map_bank), runState);
            ownedCount = runState.caught;
            seenCount = runState.seen;
            transmitState();
        }
    });

    var stateChangeHandlers: ((state:State) => void)[] = [];

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