/// <reference path="shared.ts" />

class DexNav extends React.Component<{ state: TPP.Server.DexNav.State }, {}> {
    render() {
        let map = this.props.state;
        if (!map)
            return null;
        let totalKnownEncounters = Object.keys(map.KnownEncounters || {}).reduce((a, k) => a + map.KnownEncounters[k].length, 0);
        let classes = [
            "dexnav",
            map.TotalEncounters ? null : "no-encounters"
        ];
        return <div className={classes.filter(c => !!c).join(' ')}>
            <h3>DexNav</h3>
            {map.MapName ? <h4>{map.MapName}</h4> : null}
            <div className="encounters">
                <EncounterGroup encounters={map.KnownEncounters} total={totalKnownEncounters} key="1" />
                <EncounterGroup encounters={map.KnownEncounters} total={totalKnownEncounters} key="2" />
                <EncounterGroup encounters={map.KnownEncounters} total={totalKnownEncounters} key="3" />
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