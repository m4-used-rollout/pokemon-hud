/// <reference path="splits.tsx" />
/// <reference path="../shared.ts" />

namespace SplitDisplay {
    var targetId: string;
    var events: TPP.Event[];
    const splits = TPP.Server.getSplits();
    const startTime = new Date(config.runStartTime);
    export const Render = throttle((id: string = targetId) => {
        targetId = id;
        if (!id) return;
        try {
            ReactDOM.render(<SplitDisplay startTime={startTime} splits={splits} events={events} />, document.getElementById(id));
        }
        catch (e) {

        }
    }, 250);
    export function Register() {
        ipcRenderer.on('state-update', (event, state: TPP.RunStatus) => {
            events = (state.events || []).filter(e => e.group == "Badge" || e.group == "Trainers Defeated");
            Render();
        });
        ipcRenderer.send('register-renderer');
    }
}