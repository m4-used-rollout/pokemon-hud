/// <reference path="shared.ts" />

class Party extends React.Component<{ party: TPP.PartyData; }, {}> {
    render() {
        return <ul className="party">
            {this.props.party.map(p => <Pokemon key={`${p.name}:${p.personality_value}`} pokemon={p} />)}
        </ul>;
    }
}

class Pokemon extends React.Component<{ pokemon: TPP.PartyPokemon; }, {}> {
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
        if (!mon)
            return null;
        let hpPercent = mon.health[0] / mon.health[1] * 100;
        let expPercent = mon.experience ? (mon.experience.current - mon.experience.this_level) / (mon.experience.next_level - mon.experience.this_level) * 100 : 0;
        let eggPercent = mon.species ? 100 - (mon.friendship / mon.species.egg_cycles * 100) : 0;
        let classes = [
            Math.floor(hpPercent) <= 20 ? "health-low" : Math.floor(hpPercent) > 50 ? "health-high" : "health-med",
            mon.gender,
            mon.health[0] == 0 ? "fainted" : "",
            this.status
        ].filter(c=>!!c).map(cleanString).join(' ');
        if (mon.is_egg) 
            classes = "egg" + (!mon.friendship ? " shimmy-shake" : "");
        return <li className={classes}>
            <Sleeps status={mon.status} />
            <div className="pokemon-image">
                <img src={`./img/sprites/${config.spriteFolder}/${mon.is_egg ? 'egg' : mon.species.national_dex}.gif`} />
            </div>
            {mon.is_egg ?
            <div className="pokemon-info">
                Egg
                <div className="egg-bar">
                    <div className="hatch" style={{width: eggPercent + '%'}} />
                </div>
            </div> :
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
        let type = ((this.props.type == "???" ? "Fairy" : this.props.type) || '').toLowerCase();
        return <img src={`./img/types/${type}.png`}/>
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

class Sleeps extends React.PureComponent<{status:number},{tick:number}> {
    timer:number;
    constructor(props) {
        super(props);
        this.state = {tick: 0};
    }
    componentDidMount() {
        this.timer = setInterval(()=>this.setState(prev=> ({tick: prev.tick + 1})), 1000) as any;
    }
    componentWillUnmount() {
        clearInterval(this.timer);
    }
    render() {
        if (this.props.status > 0 && this.props.status < 8)
            return <div className="sleeps">
                {[1,2,3,4,5,6,7]
                    .filter(s => s <= this.props.status)
                    .map(s => (s + this.state.tick) % 2 ? '☽' : '☾')
                    .join(' ')
                }
            </div>;
        return null;
    }
}