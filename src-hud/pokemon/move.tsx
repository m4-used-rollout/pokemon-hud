/// <reference path="../shared.ts" />
/// <reference path="typeimg.tsx" />
class Move extends React.PureComponent<{ move: TPP.Move }, {}> {
    render() {
        let m = this.props.move;
        let isShadow = !!(m as TPP.ShadowMove).is_shadow;
        m.name = m.name || "???";
        let isChattyHiddenPower = m.name.toLowerCase() == "hidden power" && m.id == 352;
        let ppPercentage = m.pp / (m.max_pp || .1) * 100;
        let classes = [
            m.name.replace(/[^A-Z0-9]/ig, '-').toLowerCase(),
            `move-${m.id}`,
            m.name.length > 8 ? "long-name" : null,
            isChattyHiddenPower && "chatty-hidden-power",
            !isShadow && (m.pp === 0 ? 'exhausted' : ppPercentage < 20 ? 'pp-low' : ppPercentage < 50 ? 'pp-med' : null)
        ].filter(c => !!c).map(cleanString).join(' ');
        return <li className={classes}>
            {!isShadow && !isChattyHiddenPower && <TypeImg type={m.type} />}
            {isChattyHiddenPower && m.type != "None" && <img key={`${m.type}${m.pp}`} src={`https://static-cdn.jtvnw.net/emoticons/v1/${m.type}/2.0`} />}
            <span className="move-name">{m.name}</span>
            {isChattyHiddenPower && m.base_power && <span className="move-power">({m.base_power})</span>}
            {!isShadow && <span className="move-pp">{m.pp}</span>}
        </li>;
    }
}