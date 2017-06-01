/// <reference path="../shared.ts" />
/// <reference path="typeimg.tsx" />
class Move extends React.PureComponent<{move:TPP.Move},{}> {
    render() {
        let m = this.props.move;
        m.name = m.name || "???";
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