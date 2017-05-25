/// <reference path="badges.tsx" />

class Trainer extends React.Component<{ trainer: TPP.TrainerData }, {}> {
    render() {
        let t = this.props.trainer;
        let displayOpts = config.displayOptions || ["text_speed", "battle_style", "battle_scene"];
        return <div className="trainer-info">
            <Badges bitfield={t.badges} />
            <div className="bottom-row">
                <div className="wallet">
                    <span className="cash">{(t.money || 0).toLocaleString()}</span>
                    <span className="balls">{(t.ball_count || 0).toLocaleString()}</span>
                </div>
                {
                    t.options &&
                    <div className={"options" + (displayOpts.length > 2 ? " slim" : "")}>
                        {displayOpts.map(opt => <span key={opt}>{t.options[opt]}</span>)}
                    </div>
                }
                <div className="dex-counts">
                    <span className="owned">{t.caught || 0}</span>
                    <span className="seen">{t.seen || 0}</span>
                    <span className="total">{config.totalInDex || "???"}</span>
                </div>
            </div>
        </div>
    }
}

