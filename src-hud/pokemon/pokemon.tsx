/// <reference path="../shared.ts" />
/// <reference path="move.tsx" />
/// <reference path="sleepy.tsx" />
/// <reference path="helditem.tsx" />
/// <reference path="../pokesprite.tsx" />
/// <reference path="../frameborder.tsx" />

class Pokemon extends React.Component<{ pokemon: TPP.PartyPokemon; gameState: TPP.TrainerData; }, {}> {
    render() {
        let mon = this.props.pokemon;
        if (!mon)
            return null;
        let hpPercent = mon.health[0] / mon.health[1] * 100;
        let expPercent = mon.experience ? (mon.experience.current - mon.experience.this_level) / (mon.experience.next_level - mon.experience.this_level) * 100 : 0;
        let eggPercent = mon.species ? 100 - ((mon.friendship - 1) / (mon.species.egg_cycles - 1) * 100) : 0;
        let classes = [
            Math.floor(hpPercent) <= 20 ? "health-low" : Math.floor(hpPercent) >= 50 ? "health-high" : "health-med",
            mon.gender,
            mon.health[0] == 0 && "fainted",
            mon.status,
            mon.sleep_turns ? `slp${mon.sleep_turns}` : null,
            this.props.gameState.level_cap && mon.level == this.props.gameState.level_cap && "level-cap",
            mon.is_evolving && "evolving",
        ].filter(c => !!c).map(cleanString).join(' ');
        if (mon.is_egg)
            classes = "egg" + (eggPercent > 99 ? " shimmy-shake" : "");
        return <li className={classes}>
            {/*<Sleepy status={mon.sleep_turns} />*/}
            <div className={`pokemon-image ${cleanString(mon.species.name)}`}>
                <FrameBorder frame={parseInt((this.props.gameState.options || { frame: '0' }).frame)} />
                {mon.is_egg ? <img src="./img/egg.gif" /> : <PokeSprite pokemonId={mon.species.id} shiny={mon.shiny} form={TPP.Server.RomData.GetForm(mon)} />}
            </div>
            {mon.is_egg ?
                <div className="pokemon-info">
                    Egg
                <div className="egg-bar">
                        <div className="hatch" style={{ width: eggPercent + '%' }} />
                    </div>
                </div> :
                <div className="pokemon-info">
                    <div className="top-line">
                        <div className="name">{mon.name}</div>
                        <div className="types">
                            <TypeImg type={mon.species.type1} />
                            {mon.species.type2 != mon.species.type1 ?
                                <TypeImg type={mon.species.type2} />
                                : null}
                        </div>
                        <div className="level">{mon.level}</div>
                        <div className="exp-bar">
                            <div className="exp" style={{ width: expPercent + '%' }} />
                        </div>
                    </div>
                    {mon.ability ? <div className="ability"> {mon.ability} </div> : null}
                    <ul className="moves">
                        {mon.moves.map(m => <Move move={m} key={m.id} />)}
                    </ul>
                    <div className="health-bar">
                        <div className="health" style={{ width: hpPercent + '%' }} />
                        <div className="hp" data-current={mon.health[0]} data-max={new Array(3 - mon.health[1].toString().length).fill(' ').join('') + mon.health[1]} />
                    </div>
                </div>}
            <HeldItem id={mon.held_item ? mon.held_item.id : 0} name={mon.held_item ? mon.held_item.name : ""} />
        </li>
    }
}
