/// <reference path="emotes.tsx" />
/// <reference path="../shared.ts" />

namespace EmotesDisplay {
    var targetId: string;
    var emotes: TrendingEmote[] = [];
    export const Render = throttle((id: string = targetId) => {
        targetId = id;
        if (!id) return;
        try {
            ReactDOM.render(<EmotesDisplay emotes={emotes} />, document.getElementById(id));
        }
        catch (e) {

        }
    }, 250);
    export function Register() {
        ipcRenderer.on('emote-update', (event, state: TrendingEmote[]) => {
            if (JSON.stringify(emotes) != JSON.stringify(state)) {
                emotes = state;
                Render();
            }
        });
        ipcRenderer.send('register-emotes');

    }
}