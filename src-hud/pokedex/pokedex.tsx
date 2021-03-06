/// <reference path="../pokesprite.tsx" />
/// <reference path="../trainersprite.tsx" />

const DEVMODE = true;

type dexProps = { seen: number[], owned: number[], noDisplay?: boolean };
type dexState = { newEntry: number, scrollTo: number, firstEntry: boolean };

class Pokedex extends React.Component<dexProps, dexState> {
    constructor(props) {
        super(props);
        this.state = { newEntry: null, scrollTo: null, firstEntry: true };
    }
    componentWillReceiveProps(next: dexProps) {
        if (this.props.owned.length < next.owned.length && this.props.owned.length + 2 >= next.owned.length)
            next.owned.forEach(p => {
                if (this.props.owned.indexOf(p) < 0)
                    this.setState({ newEntry: p, scrollTo: (p - 1) / this.totalInDex(next.seen) * -100 });
            });
    }
    private totalInDex(seen: number[]) {
        return (seen || []).reduce((max, current) => Math.max(max, current), 0);
    }

    render() {
        if (this.props.noDisplay && !DEVMODE)
            return null;
        let state: dexState = { newEntry: this.state.newEntry, scrollTo: this.state.scrollTo, firstEntry: this.state.firstEntry };
        if ((this.props.seen.length + this.props.owned.length < 1) && !DEVMODE) {
            return null;
        }
        if (state.firstEntry) {
            //Render Pokedex before adding transitions
            setTimeout(() => this.setState({ firstEntry: false }), 100);
            state.newEntry = state.scrollTo = null;
        }
        else if (state.newEntry && !state.firstEntry) {
            setTimeout(() => this.setState({ newEntry: null }), 10000);
        }
        let mons: JSX.Element[] = [];
        const totalInDex = config.totalInDex;//this.totalInDex(this.props.seen);
        for (let i = 1; i <= totalInDex; i++) {
            let seen = this.props.seen.indexOf(i) >= 0 || DEVMODE;
            let owned = this.props.owned.indexOf(i) >= 0 || DEVMODE;
            let newEntry = state.newEntry == i;
            mons.push(<li key={i} className={`${owned ? "owned" : "unowned"} ${newEntry ? "new-entry" : ""}`} data-index={`000${i}`.substring(i.toString().length)}>
                {seen || owned ? <PokeSprite dexNum={i} /> : <img src="./img/empty-sprite.png" />}
            </li>);
        }
        if (DEVMODE) {
            //show all unown for dev
            for (let i = 0; i < 26; i++) {
                mons.push(<li key={`unown-${i}`} className="owned" data-index={`000${i}`.substring(i.toString().length)}>
                    <PokeSprite pokemonId={201} form={i} />
                </li>);
            }
            //show all trainers for dev
            for (let i = 1; i < 99; i++) {
                mons.push(<li key={`trainer-${i}`} className="owned" data-index={`000${i}`.substring(i.toString().length)}>
                    <TrainerSprite trainerId={0} classId={i} />
                </li>);
            }
        }
        let style = { transform: state.scrollTo ? `translateY(${state.scrollTo}%)` : null };
        return <div className={`pokedex ${state.newEntry ? "new-entry" : ""}`} data-region={(typeof config.dexName === "undefined" ? config.mainRegion : config.dexName) || "National"}>
            <div className="pokemon-display">
                <ul className="pokemon-list" style={style}>
                    {mons}
                </ul>
            </div>
        </div>
    }
}