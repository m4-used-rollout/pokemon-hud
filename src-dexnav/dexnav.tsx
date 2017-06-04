/// <reference path="shared.ts" />

class DexNav extends React.Component<{ state: TPP.Server.DexNav.State }, {}> {
    render() {
        let map = this.props.state;
        console.log(JSON.stringify(map));
        if (!map || !map.MapID)
            return null;
        let totalKnownEncounters = Object.keys(map.KnownEncounters || {}).reduce((a, k) => a + map.KnownEncounters[k].length, 0);
        let classes = [
            "dexnav",
            map.TotalEncounters ? totalKnownEncounters ? null : "nothing-to-show" : "no-encounters", //map.CaughtEverything ? null : "caught-them-all"
        ];
        let numDisplays = totalKnownEncounters? Math.max(3, 10 / (totalKnownEncounters * 3)) : 3, displays: number[] = [];
        for (let i = 0; i < numDisplays; displays.push(i++));
        return <div className={classes.filter(c => !!c).join(' ')} data-incomplete={map.IncompleteCategories}>
            <h3>DexNav</h3>
            {map.MapName ? <h4>{map.MapName}</h4> : null}
            <div className="encounters">
                {displays.map(k => <EncounterGroup encounters={map.KnownEncounters} total={totalKnownEncounters} key={k} />)}
            </div>
        </div>;
    }
}

class EncounterGroup extends React.Component<{ encounters: { [key: string]: TPP.Server.DexNav.KnownEncounter[] }, total: number }, {}> {
    render() {
        let encounters = this.props.encounters;
        return <div className="encounter-group" style={{ animationDuration: `${this.props.total * 2}s` }}>
            {Object.keys(encounters || {}).map(k => encounters[k].map(e => <span key={e.speciesId} className={cleanString(k) + ' ' + (e.owned ? "owned" : "seen")}>
                <img src={`./img/sprites/${config.spriteFolder}/${e.speciesId}.png`} />
            </span>))}
        </div>;
    }
}