/// <reference path="persistent.ts" />
/// <reference path="../src-hud/itemsprite.tsx" />

interface EncounterProps {
    encounters: { [key: string]: TPP.Server.DexNav.KnownEncounter[] };
    total: number
}

class Encounters extends PersistentComponent<EncounterProps> {
    render() {
        let totalKnownEncounters = this.state.total;
        let numDisplays = Math.max(3, Math.floor((window.innerWidth / ((totalKnownEncounters || 1) * .66)) / (window.innerHeight || 1)) * 3), displays: number[] = [];
        for (let i = 0; i < numDisplays; displays.push(i++));
        return <div className="encounters">
            {displays.map(k => <EncounterGroup encounters={this.state.encounters} total={totalKnownEncounters} key={k.toString() + numDisplays.toString()} />)}
        </div>
    }
}


class EncounterGroup extends React.Component<EncounterProps, {}> {
    render() {
        let encounters = this.props.encounters;
        return <div className="encounter-group" style={{ animationDuration: `${this.props.total * 2}s` }}>
            {Object.keys(encounters || {}).map(k => encounters[k].map((e, i) => <Encounter key={k + i + e.speciesId} encounterType={k} encounter={e} />))}
        </div>;
    }
}

class Encounter extends React.PureComponent<{ encounterType: string, encounter: TPP.Server.DexNav.KnownEncounter }, {}> {
    render() {
        let e = this.props.encounter;
        return <span className={`${cleanString(this.props.encounterType)} ${e.owned ? "owned" : "seen"} ${e.hidden ? "hidden" : ""}`}>
            <PokeSprite pokemonId={e.speciesId} form={e.form} />
            <Rarity rate={e.rate} />
            {(e.categoryIcon || e.requiredItemId) && <div className="item" style={{ backgroundImage: `url("${e.requiredItemId ? TPP.Server.RomData.GetItemSprite(e.requiredItemId) : `img/dexnav/terrain/${e.categoryIcon}.png`}")` }} />}
        </span>;
    }
}

class Rarity extends React.PureComponent<{ rate: number }, {}> {
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
        if (!this.props.rate)
            return null;
        return <span className={`rarity ${this.rarity(this.props.rate)}`} />;
    }
}