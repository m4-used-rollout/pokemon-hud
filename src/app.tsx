/// <reference path="party.tsx" />
/// <reference path="trainer.tsx" />

//sample data for now
var data: TPP.RunStatus = require('../samples/trainer.json');
data.party = require('../samples/party.json');
data.pc = require('../samples/pc.json');

function Render(id: string) {
    ReactDOM.render(<div className="pokemon-hud">
        <Party party={data.party} />
        <Trainer trainer={data} />
    </div>, document.getElementById(id));
}

(window as any).Render = Render;