/// <reference path="dexnav.tsx" />

var data: TPP.Server.DexNav.State = null;

var targetId: string;
const Render = throttle((id: string = targetId) => {
    targetId = id;
    if (!id || !data) return;
    try {
        ReactDOM.render(<DexNav state={data} />, document.getElementById(id));
    } catch (e) {
        console.error(e);
    }
}, 25);

function Register() {
    ipcRenderer.on('dexnav-update', (event, state: TPP.Server.DexNav.State) => {
        data = state;
        Render();
    });
    ipcRenderer.send('register-dexnav');
}