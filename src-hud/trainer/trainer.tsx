/// <reference path="badges.tsx" />

class Trainer extends React.Component<{ trainer: TPP.RunStatus }, {}> {
    private padTime(n: number) {
        let str = '0' + (n || 0).toString();
        return str.substring(str.length - 2);
    }
    render() {
        let t = this.props.trainer;
        let displayOpts = config.displayOptions || ["text_speed", "battle_style", "battle_scene"];
        let pc: TPP.CombinedPCData = t.pc || { current_box_number: 0, boxes: [] };
        let pcBoxCount = (pc.boxes || []).filter(b => !!b && b.box_contents && b.box_number == pc.current_box_number).map(b => b.box_contents.length).shift() || 0;
        return <div className="trainer-info">
            <Badges bitfield={t.badges} />
            {t.time ?
                <div className="rtc">
                    <span className="days">{t.time.d}</span>
                    <span className="hours">{(t.time.h || 0) % 12 ? t.time.h % 12 : 12}</span>
                    <span className="minutes">{this.padTime(t.time.m)}</span>
                    <span className="seconds">{this.padTime(t.time.s)}</span>
                    <span className="meridian">{t.time.h < 12 ? "AM" : "PM"}</span>
                </div>
                : null
            }
            <div className="bottom-row">
                {/* <div className="wallet"> */}
                    <span className="cash">{(t.money || 0).toLocaleString()}</span>
                    <span className="balls">{(t.ball_count || 0).toLocaleString()}</span>
                    <span className={`pc ${pcBoxCount < 20 ? "almost-" : ""}${pcBoxCount >= 18 ? "full" : ""}`}>{pcBoxCount.toLocaleString()}</span>
                    { t.level_cap && t.level_cap < 100 ? 
                        <span className="level-cap">{t.level_cap}</span>
                        : null
                    }
                {/* </div> */}
                {/* {
                    t.options && displayOpts.length && 
                    <div className={"options" + (displayOpts.length > 2 ? " slim" : "")}>
                        {displayOpts.map(opt => <span key={opt}>{t.options[opt]}</span>)}
                    </div>
                } */}
                <div className="dex-counts">
                    <span className="owned">{t.caught || 0}</span>
                    <span className="seen">{t.seen || 0}</span>
                    <span className="total">{config.totalInDex || "???"}</span>
                </div>
            </div>
        </div>
    }
}

