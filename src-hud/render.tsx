/// <reference path="party.tsx" />
/// <reference path="trainer/trainer.tsx" />
/// <reference path="pokedex/pokedex.tsx" />

var data: TPP.RunStatus = null;

var targetId:string;
function Render(id: string = targetId) {
    targetId = id;
    if (!id || !data) return;
    ReactDOM.render(<div className="pokemon-hud">
        <Party party={data.party} />
        <Trainer trainer={data} />
        <Pokedex seen={data.seen_list || []} owned={data.caught_list || []} />
    </div>, document.getElementById(id));
}

const {ipcRenderer} = require('electron')
ipcRenderer.on('state-update', (event, state:TPP.RunStatus) => {
    data = state;
    Render();
});
ipcRenderer.send('register-renderer');

//droppable state changes (for testing)
document.addEventListener('dragover', e=>{
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy';
});
document.addEventListener('dragenter', e=>{
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
});
document.addEventListener('drop', e=>{
    e.preventDefault();
    for (let i = 0; i < e.dataTransfer.files.length; i++) {
        //console.log(e.dataTransfer.files[i].type);
        // if (e.dataTransfer.files[i].type == "application/json") {
            let reader = new FileReader();
            reader.onload = e=> {
                TPP.Server.setState((e as any).target.result);
            };
            console.log();
            reader.readAsText(e.dataTransfer.files[i]);
        // }
    }
});