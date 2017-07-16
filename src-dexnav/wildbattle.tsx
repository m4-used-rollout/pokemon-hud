/// <reference path="encounters.tsx" />
/// <reference path="../src-hud/pokemon/typeimg.tsx" />

class WildBattle extends React.Component<{ wild: TPP.Server.DexNav.OwnedSpecies }, {}> {
    render() {
        let mon = this.props.wild;
        if (!mon) return null;
        return <div className="encounters wild-battle">
            <div className="info-left">
                <div className="name">{mon.name}</div>
                <div className="catch-rate">{(Math.floor((mon.catchRate / 256) * 1000) / 10).toFixed(1)}</div>
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