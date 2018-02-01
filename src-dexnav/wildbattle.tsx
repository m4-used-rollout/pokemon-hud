/// <reference path="encounters.tsx" />
/// <reference path="../src-hud/pokemon/typeimg.tsx" />

class WildBattle extends PersistentComponent<{ wild: TPP.Server.DexNav.OwnedSpecies, wildParty?: TPP.EnemyParty }> {
    constructor(props) {
        super(props, 2);
    }
    render() {
        const mon = this.state.wild;
        const partyMon = (this.state.wildParty || [])[0];
        if (!mon) return null;
        return <div className={`encounters wild-battle ${this.props.wild ? "" : "hidden"}`} key={mon.id}>
            <div className="info-left">
                <div className="name">{(partyMon && partyMon.cp ? `CP ${partyMon.cp.toLocaleString()} ` : "") +  mon.name}</div>
                <div className="catch-rate">{mon.catchRate}</div>
                {partyMon && partyMon.fitness && <div className="fitness">{partyMon.fitness.toLocaleString()}</div>}
            </div>
            <div className="types">
                <TypeImg type={mon.type1} />
                {mon.type1 != mon.type2 ? <TypeImg type={mon.type2} /> : null}
            </div>
            <div className={`pokemon ${cleanString(mon.name)} ${mon.owned ? "owned" : "seen"}`}>
                <PokeSprite pokemonId={mon.id} />
                <Rarity rate={mon.encounterRate} />
            </div>
        </div>;
    }
}