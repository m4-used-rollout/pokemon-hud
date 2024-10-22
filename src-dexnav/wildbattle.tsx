/// <reference path="encounters.tsx" />
/// <reference path="../src-hud/pokemon/typeimg.tsx" />

class WildBattle extends PersistentComponent<{ wilds: TPP.Server.DexNav.WildPokemon[] }> {
    constructor(props) {
        super(props, 2);
    }
    render() {
        if (!this.state.wilds || !this.state.wilds.length) return null;
        const livingWilds = this.state.wilds.filter(mon => (mon.health || [1])[0] > 0);
        const wild = livingWilds[0];
        return <div className={`encounters wild-battle ${this.props.wilds ? "" : "hidden"}`} key={`Wild Battle ${(wild || { id: 0 }).id}`}>
            {livingWilds.length == 1 &&
                <div className="info-left">
                    <div className={['name', (wild.gender || '').toLowerCase()].filter(c => !!c).join(' ')}>
                        {/* {partyMon && partyMon.cp && `CP ${partyMon.cp.toLocaleString()} `} */}
                        {wild.name}
                    </div>
                    <div className="catch-rate">{wild.catchRate}</div>
                    {/* <div className="mon-info">
                        <span>Catch Rate: {wild.catchRate}</span>
                        <span>
                            Type{wild.type1 != wild.type2 ? "s" : ""}:&nbsp;
                        <span><TypeImg type={wild.type1} /> {wild.type1}</span>
                            {wild.type1 != wild.type2 && <span>&nbsp;<TypeImg type={wild.type2} /> {wild.type2}</span>}
                        </span>
                        {wild.shiny && <span>Shiny!</span>}
                    </div> */}
                    {/* {partyMon && partyMon.fitness && <div className="fitness">{partyMon.fitness.toLocaleString()}</div>} */}
                </div>}
            {livingWilds.length == 1 &&
                <div className="types" style={{/*opacity:livingWilds[0].owned ? 1 : 0, transition: "opacity 1s ease-in-out"*/}}>
                    <TypeImg type={wild.type1} filled/>
                    {wild.type1 != wild.type2 ? <TypeImg type={wild.type2} filled/> : null}
                </div>
            }
            {(livingWilds.length == 1 ? livingWilds : this.state.wilds).reverse().map((mon, i) =>
                <div className={`pokemon ${cleanString(mon.name)} ${mon.owned ? "owned" : "seen"} ${(mon.health || [1])[0] < 1 ? "fainted" : ""} ${mon.is_shadow ? "shadow" : ""}`} key={`${i}:${mon.id}`}>
                    <PokeSprite pokemonId={mon.id} form={mon.form} gender={mon.gender} shiny={mon.shiny} />
                    <Rarity rate={mon.encounterRate} />
                </div>
            )}
        </div>;
    }
}