/// <reference path="encounters.tsx" />
/// <reference path="../src-hud/pokemon/typeimg.tsx" />

class WildBattle extends PersistentComponent<{ wild: TPP.Server.DexNav.OwnedSpecies }> {
    constructor(props) {
        super(props, 2);
    }
    render() {
        let mon = this.state.wild;
        if (!mon) return null;
        return <div className={`encounters wild-battle ${this.props.wild ? "" : "hidden"}`} key={mon.id}>
            <div className="info-left">
                <div className="name">{mon.name}</div>
                <div className="catch-rate">{mon.catchRate}</div>
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