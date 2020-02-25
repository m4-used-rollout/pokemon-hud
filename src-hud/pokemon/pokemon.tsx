/// <reference path="../shared.ts" />
/// <reference path="move.tsx" />
/// <reference path="sleepy.tsx" />
/// <reference path="helditem.tsx" />
/// <reference path="../pokesprite.tsx" />
/// <reference path="../frameborder.tsx" />

class Pokemon extends React.Component<{ pokemon: TPP.PartyPokemon; gameState: TPP.RunStatus; }, {}> {
    render() {
        let mon = this.props.pokemon;
        let isShadow = !!((mon as TPP.ShadowPokemon).is_shadow) && !!(mon as TPP.ShadowPokemon).purification;
        if (!mon)
            return null;
        let hpPercent = mon.health[0] / mon.health[1] * 100;
        let expPercent = mon.experience ? (mon.experience.current - mon.experience.this_level) / (mon.experience.next_level - mon.experience.this_level) * 100 : 0;
        if (isShadow)
            expPercent = (Math.max(0, (mon as TPP.ShadowPokemon).purification.current) / (mon as TPP.ShadowPokemon).purification.initial) * 100;
        let eggPercent = mon.species ? 100 - ((mon.friendship - 1) / (mon.species.egg_cycles - 1) * 100) : 0;
        let hpPixels = Math.floor(mon.health[0] * 48 / mon.health[1]);
        let classes = [
            Math.floor(hpPercent) <= 20 ? "health-low" : Math.floor(hpPercent) >= 50 ? "health-high" : "health-med",
            //hpPixels < 10 ? "health-low" : hpPixels >= 24 ? "health-high" : "health-med",
            this.props.gameState.transitioning && 'glitch',
            this.props.gameState.transitioning && `glitch-effect-${Math.ceil(Math.random() * 6)}`,
            mon.gender,
            mon.health[0] == 0 && "fainted",
            mon.status,
            mon.sleep_turns ? `slp${mon.sleep_turns}` : null,
            this.props.gameState.level_cap && mon.level == this.props.gameState.level_cap && "level-cap",
            mon.is_evolving && "evolving",
            mon.original_trainer.id != this.props.gameState.id && "trademon",
            `ot-${mon.original_trainer.name}`,
            mon.capsule && "ball-capsule",
            isShadow && "shadow",
            (mon as TPP.ShadowPokemon).in_hyper_mode && "hyper-mode"
        ].filter(c => !!c).map(cleanString).join(' ');
        if (mon.is_egg)
            classes = "egg" + (eggPercent > 99 ? " shimmy-shake" : "");
        const extraInfo = <FitToWidth className="extra-info">
            {config.generation < 3 && mon.held_item && <HeldItem id={mon.held_item.id} name={mon.held_item.name} />}
            {mon.ability && <div className="ability"> {mon.ability} </div>}
            {mon.cp && <div className="cp"> {mon.cp.toLocaleString()} </div>}
            {mon.fitness && <div className="fitness"> {mon.fitness.toLocaleString()} </div>}
            {mon.next_move && <div className={`movelearn ${mon.next_move.level == mon.level + 1 && "alert"} ${mon.next_move.type}`} data-level={mon.next_move.level} />}
        </FitToWidth>;
        return <li className={classes}>
            <Sleepy status={mon.sleep_turns} />
            <div className={`pokemon-image ${cleanString(mon.species.name)} ${mon.species.do_not_flip_sprite ? "no-flip" : ""}`}>
                <FrameBorder frame={parseInt((this.props.gameState.options || { frame: '0' }).frame)} />
                {mon.is_egg ? <img src="./img/egg.gif" /> : <PokeSprite pokemonId={mon.species.id} shiny={mon.shiny} gender={mon.gender} form={TPP.Server.RomData.GetForm(mon)} />}
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
                    {extraInfo}
                    <ul className="moves">
                        {mon.moves.map(m => <Move move={m} key={m.id} />)}
                    </ul>
                    <div className="health-bar">
                        <div className="health" style={{ width: hpPercent + '%' }} />
                        <div className="hp" data-current={mon.health[0]} data-max={(mon.health[1].toString().length < 3 ? new Array(3 - mon.health[1].toString().length).fill(' ').join('') : "") + mon.health[1]} />
                    </div>
                </div>}
            {config.generation > 2 && <HeldItem id={mon.held_item ? mon.held_item.id : 0} name={mon.held_item ? mon.held_item.name : ""} />}
        </li>
    }
}
