/// <reference path="shared.ts" />
/// <reference path="../src-hud/pokesprite.tsx" />


class DexNav extends React.Component<{ state: TPP.Server.DexNav.State }, {}> {
    render() {
        let map = this.props.state;
        if (!map || !map.MapID)
            return null;
        let totalKnownEncounters = Object.keys(map.KnownEncounters || {}).reduce((a, k) => a + map.KnownEncounters[k].length, 0);
        let classes = [
            "dexnav",
            map.TotalEncounters ? totalKnownEncounters ? map.MoreLeftToCatch ? null : "caught-them-all" : "nothing-to-show" : "no-encounters"
        ];
        let numDisplays = totalKnownEncounters ? Math.max(3, 10 / (totalKnownEncounters * 3)) : 3, displays: number[] = [];
        for (let i = 0; i < numDisplays; displays.push(i++));
        return <div className={classes.filter(c => !!c).join(' ')} data-completed={map.CompletedCategories}>
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
            {Object.keys(encounters || {}).map(k => encounters[k].map((e, i) => <Encounter key={k + i + e.speciesId} encounterType={k} encounter={e} />))}
        </div>;
    }
}

class Encounter extends React.PureComponent<{ encounterType: string, encounter: TPP.Server.DexNav.KnownEncounter }, {}> {
    private rarity(percent: number) {
        if (percent > 50)
            return "ultra-common";
        if (percent > 20)
            return "common";
        if (percent >= 10)
            return "uncommon";
        if (percent > 1)
            return "rare";
        return "ultra-rare";
    }
    render() {
        let e = this.props.encounter;
        return <span className={cleanString(this.props.encounterType) + ' ' + (e.owned ? "owned" : "seen")}>
            {/* <img src={`./img/sprites/${config.spriteFolder}/${e.speciesId}.gif`} /> */}
            <PokeSprite pokemonId={e.speciesId} />
            <span className={`rarity ${this.rarity(e.rate)}`} />
        </span>;
    }
}