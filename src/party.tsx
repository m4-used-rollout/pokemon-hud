/// <reference path="shared.ts" />

class Party extends React.PureComponent<{ party: TPP.PartyData; }, {}> {
    render() {
        return <ul className="party">
            {this.props.party.map(p => <Pokemon key={`${p.name}:${p.personality_value}`} pokemon={p} />)}
        </ul>;
    }
}

class Pokemon extends React.PureComponent<{ pokemon: TPP.PartyPokemon; }, {}> {
    get status() {
        let status = this.props.pokemon.status;
        if (status % 8 > 0)
            return "SLP";
        if (status & 8)
            return "PSN";
        if (status & 16)
            return "BRN";
        if (status & 32)
            return "FRZ";
        if (status & 64)
            return "PAR";
        if (status & 128)
            return "TOX";
        return null;
    }
    render() {
        let mon = this.props.pokemon;
        let hpPercent = mon.health[0] / mon.health[1] * 100;
        let expPercent = (mon.experience.current - mon.experience.this_level) / (mon.experience.next_level - mon.experience.this_level) * 100;
        let classes = [
            hpPercent <= 20 ? "health-low" : hpPercent >= 50 ? "health-high" : "health-med",
            mon.gender,
            mon.health[0] == 0 ? "fainted" : "",
            this.status
        ].filter(c=>!!c).map(cleanString).join(' ');
        if (mon.is_egg)
            classes = "egg";
        return <li className={classes}>
            <div className="pokemon-image">
                <img src={`../img/sprites/${config.spriteFolder}/${mon.is_egg ? 'egg' : mon.species.national_dex}.gif`} />
            </div>
            {mon.is_egg ?
            <div className="pokemon-info">Egg</div> :
            <div className="pokemon-info">
                <div className="top-line">
                    <div className="name">{ mon.name }</div>
                    <div className="types">
                        <TypeImg type={mon.species.type1} />
                        { mon.species.type2 != mon.species.type1 ?
                            <TypeImg type={mon.species.type2} />
                        : null}
                    </div>
                    <div className="level">{ mon.level }</div>
                    <div className="exp-bar">
                        <div className="exp" style={{width: expPercent + '%'}} />
                    </div>
                </div>
                <ul className="moves">
                    {mon.moves.map(m=><Move move={m} key={m.id}/>)}
                </ul>
                <div className="health-bar">
                    <div className="health" style={{width: hpPercent + '%'}} />
                    <div className="hp" data-current={mon.health[0]} data-max={mon.health[1]} />
                </div>
            </div> }
        </li>
    }
}

class TypeImg extends React.PureComponent<{type:string;},{}> {
    render() {
        return <img src={`../img/types/${(this.props.type || '').toLowerCase()}.png`}/>
    }
}

class Move extends React.PureComponent<{move:TPP.Move},{}> {
    render() {
        let m = this.props.move;
        let ppPercentage = m.pp / m.max_pp * 100;
        let classes = [
            m.name.length > 8 ? "long-name" : null,
            m.pp == 0 ? 'exhausted' : ppPercentage < 20 ? 'pp-low': ppPercentage < 50 ? 'pp-med' : null 
        ].filter(c=>!!c).map(cleanString).join(' ');
        return <li className={classes}>
            <TypeImg type={m.type} />
            <span className="move-name">{ m.name }</span>
            <span>{ m.pp }</span>
        </li>;
    }
}