/// <reference path="shared.ts" />

class Pokedex extends React.Component<{seen:number[], owned:number[]},{newEntry:number}> {
    constructor(props) {
        super(props);
        this.state = {newEntry:null};
    }
    componentWillReceiveProps(next) {
        if (this.props.owned.length < next.owned.length)
            next.owned.forEach(p=> {
                if (this.props.owned.indexOf(p) < 0)
                    this.setState({newEntry:p});
            });
    }
    render() {
        if (this.state.newEntry) {
            setTimeout(()=>this.setState({newEntry:null}), 10000);
            console.log(this.state.newEntry);
        }
        let mons:JSX.Element[] = [];
        for (let i = 1; i <= config.totalInDex; i++) {
            let seen = this.props.seen.indexOf(i) >= 0;
            let owned = this.props.owned.indexOf(i) >= 0;
            let newEntry = this.state.newEntry == i;
            mons.push(<li key={i} className={`${owned ? "owned" : "unowned"} ${newEntry ? "new-entry" : ""}`} data-index={ `000${i}`.substring(i.toString().length) }>
                <img src={ seen ? `./img/sprites/${config.spriteFolder}/${i}.gif` : "./img/empty-sprite.png" }/>
            </li>);
        }
        let style = {transform: this.state.newEntry ? `translateY(${ (this.state.newEntry - 1) / config.totalInDex * -100 }%)` : null};
        return <div className={`pokedex ${this.state.newEntry ? "new-entry" : ""}`} data-region={config.mainRegion || "National"}>
            <div className="pokemon-display">
                <ul className="pokemon-list" style={style}>
                    {mons}
                </ul>
            </div>
        </div>
    }
}