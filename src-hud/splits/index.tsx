/// <reference path="splits.tsx" />


namespace SplitDisplay {
    var targetId: string;
    var events: TPP.Event[];
    const splits = TPP.Server.getSplits();
    export function Render(id: string = targetId) {
        targetId = id;
        if (!id) return;
        try {
            ReactDOM.render(<SplitDisplay startTime={new Date(config.runStartTime)} splits={splits} events={events} />, document.getElementById(id));
        }
        catch (e) {

        }
    }
    ipcRenderer.on('state-update', (event, state: TPP.RunStatus) => {
        events = (state.events || []).filter(e => e.group == "Badge" || e.group == "Trainers Defeated");
        Render();
    });
    ipcRenderer.send('register-renderer');

}