/// <reference path="party.tsx" />
/// <reference path="trainer/trainer.tsx" />
/// <reference path="pokedex/pokedex.tsx" />
/// <reference path="pokemon/appraisal.tsx" />

var data: TPP.RunStatus = null;
// var isRendering = false;
var targetId: string;
const Render = throttle((id: string = targetId) => {
    // if (isRendering)
    //     return;
    // isRendering = true;
    // setTimeout(() => isRendering = false, 10);
    targetId = id;
    if (!id || !data || (!data.name && !data.party)) return;
    let classes = [
        "pokemon-hud",
        //data.evolution_is_happening && !(data.party || []).some(p=>p && p.is_evolving) ? "evolving" : null,
        config.hudTheme || "default-theme",
        data.transitioning && "glitch"
    ]
    ReactDOM.render(<div className={classes.filter(c => !!c).join(' ')}>
        <Party party={(data.in_battle && data.battle_party && data.battle_party.length ? data.battle_party : data.party) || data.battle_party || data.party} gameState={data} />
        <Trainer trainer={data} />
        <Pokedex seen={data.seen_list || []} owned={data.caught_list || []} noDisplay={data.transitioning} />
        {/* <Appraisal stepDuration={5} pokemon={data.last_caught_pokemon} trainerName={data.name} /> */}
    </div>, document.getElementById(id));
}, 25);
function Register() {
    let oldState: TPP.RunStatus;
    ipcRenderer.on('state-update', (event, state: TPP.RunStatus) => {

        //ignore coordinate changes
        // const { events, x, y, z, game_stats, ...newState } = state;
        // // if (newState.game_stats) {
        // //     newState.game_stats = { ...newState.game_stats };
        // //     delete newState.game_stats["Total Steps"];
        // // }
        // if (newState.time) {
        //     newState.time = { ...newState.time };
        //     delete newState.time.s; //Not worth doing entire re-renders every second. Let the clock component handle seconds.
        // }
        // if (oldState && JSON.stringify(oldState) == JSON.stringify(newState))
        //     return;
        // oldState = newState;
        data = state;
        Render();
    });
    ipcRenderer.send('register-renderer');

    //droppable state changes (for testing)
    document.addEventListener('dragover', e => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'copy';
    });
    document.addEventListener('dragenter', e => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    });
    document.addEventListener('drop', e => {
        e.preventDefault();
        for (let i = 0; i < e.dataTransfer.files.length; i++) {
            //console.log(e.dataTransfer.files[i].type);
            // if (e.dataTransfer.files[i].type == "application/json") {
            let reader = new FileReader();
            reader.onload = e => {
                TPP.Server.setState((e as any).target.result);
            };
            reader.readAsText(e.dataTransfer.files[i]);
            // }
        }
    });
}