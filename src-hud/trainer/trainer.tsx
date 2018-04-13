/// <reference path="z-crystals.tsx" />
/// <reference path="../utils/fittowidth.tsx" />

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
            <Badges bitfield={t.badges} rematch={t.rematch_available} />
            {t.time ?
                <div className="rtc">
                    {t.time.d ? <span className="days">{t.time.d}</span> : null}
                    <span className="hours">{(t.time.h || 0) % 12 ? t.time.h % 12 : 12}</span>
                    <span className="minutes">{this.padTime(t.time.m)}</span>
                    {typeof t.time.s === "number" ? <span className="seconds">{this.padTime(t.time.s)}</span> : null}
                    <span className="meridian">{t.time.h < 12 ? "AM" : "PM"}</span>
                </div>
                : null
            }
            <FitToWidth className="bottom-row">
                <span className={`cash ${t.money < 1000 ? t.money < 200 ? 'low' : 'med' : 'good'}`}>{(t.money || 0).toLocaleString()}</span>
                <span className={`balls ${t.ball_count < 10 ? t.ball_count < 1 ? 'low' : 'med' : 'good'}`}>{(t.ball_count || 0).toLocaleString()}</span>
                {(t.stickers || t.stickers === 0) && <span className="stickers">{t.stickers}</span>}
                {/* <span className={`pc ${pcBoxCount < 20 ? "almost-" : ""}${pcBoxCount >= 18 ? "full" : ""}`}>{pcBoxCount.toLocaleString()}</span> */}
                {t.level_cap && t.level_cap < 100 ? <span className="level-cap">{t.level_cap}</span> : null}
                {t.options && displayOpts.length && <div className="options">
                    {displayOpts.map(opt => t.options[opt] && <span key={opt} className={`option ${cleanString(opt)}`} data-val={cleanString(t.options[opt])}>{t.options[opt]}</span>)}
                </div>}
                {t.items && t.items.z_crystals && <ZCrystals items={t.items} />}
                {t.party_fitness && <span className="fitness">{t.party_fitness.toLocaleString()}</span>}
                <div className="dex-counts">
                    <span className="owned">{t.caught || 0}</span>
                    <span className="seen">{t.seen || 0}</span>
                    <span className="total">{config.totalInDex || "???"}</span>
                </div>
            </FitToWidth>
        </div>
    }
}

