/// <reference path="parts/hof.tsx" />
/// <reference path="parts/logo.tsx" />
/// <reference path="parts/trickhouse.tsx" />
namespace Goal {
    var targetId: string;
    export const Render = throttle((id: string = targetId) => {
        targetId = id;
        if (!id || !data) return;
        try {
            ReactDOM.render(<div className="goal-display">
                {config.goals.map(g => {
                    switch (g.goalType) {
                        case "HoFEntries":
                            return <HoFEntries totalEntries={g.hofEntries} currentEntries={data && data.game_stats && data.game_stats["hof_entries"]} />
                        case "Logo":
                            return <Logo />
                        case "TrickHouse":
                            return <TrickHouse trickHouse={data && data.trick_house} />
                    }
                })}
            </div>, document.getElementById(id));
        }
        catch (e) {

        }
    }, 250);
    ipcRenderer.on('state-update', (event, state: TPP.RunStatus) => {
        data = state;
        Render();
    });
    ipcRenderer.send('register-renderer');

}