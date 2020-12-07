/// <reference path="z-crystals.tsx" />
/// <reference path="../utils/fittowidth.tsx" />
/// <reference path="../itemsprite.tsx" />

const escapeRope = 85;//TTH

class Trainer extends React.Component<{ trainer: TPP.RunStatus }, {}> {
    render() {
        let t = this.props.trainer;
        let displayOpts = config.displayOptions || ["text_speed", "battle_style", "battle_scene"];
        let pc: TPP.CombinedPCData = t.pc || { current_box_number: 0, boxes: [] };
        let pcBoxCount = (pc.boxes || []).filter(b => !!b && b.box_contents && b.box_number == pc.current_box_number).map(b => b.box_contents.length).shift() || 0;

        return <div className={`trainer-info ${t.transitioning ? "glitch" : ""}`}>
            {/* {t.party.length <= 3 && t.items && t.items.candy && t.items.candy.length > 0 && <div className={`candy-counts ${((t.items.candy.length >= 40 || t.party.length > 3) && t.party.length >= 3) ? "way-too-much-candy" : t.items.candy.length >= 34 ? "too-much-candy" : ""}`}>
                {((t.items.candy.length <= 30 && t.party.length <= 3) || t.party.length < 3) && <h5>Candy Haul</h5>}
                {t.items.candy.map(i => <div className="candy" key={i.id}>
                    <ItemSprite id={i.id} />
                    <FitToWidth className="candy-name">{i.pluralName || i.name}</FitToWidth>
                    <span className="quantity">{i.count || 1}</span>
                </div>)}
            </div>}
            {((t.party.length <= 3 || t.party.length == 5) && t.items && t.items.key && t.items.key.length > 0 && (t.items.candy.length <= 40 || t.party.length < 3)) && <div className={`key-items ${t.items.candy.length >= 34 && t.party.length >= 3 ? "too-much-candy" : ""}`}>
                {((t.items.candy.length <= 30 && t.party.length <= 3) || t.party.length < 3) && <h5>Helpful Items</h5>}
                <ul>
                    {t.items.key.map(i => <li key={i.id}>{i.name}</li>)}
                </ul>
            </div>} */}
            {config.generation < 6 && <Badges bitfield={t.badges} rematch={t.rematch_available} />}
            {t.time && <Clock time={t.time} />}
            {t.generation < 6 && !t.time && config.badgeCount < 9 && t.options && displayOpts.length > 1 && <div className="options">
                {displayOpts.map(opt => t.options[opt] && <span key={opt} className={`option ${cleanString(opt)}`} data-val={cleanString(t.options[opt])}>{t.options[opt]}</span>)}
            </div>}
            <FitToWidth className="bottom-row">
                <span className={`cash ${t.money < 1000 ? t.money < 200 ? 'low' : 'med' : 'good'}`}>{(t.money || 0).toLocaleString()}</span>
                {<span className={`balls ${(t.ball_count || 0) < 10 ? (t.ball_count || 0) < 1 ? 'low' : 'med' : 'good'}`}>{(t.ball_count || 0).toLocaleString()}</span>}
                {(t.stickers || t.stickers === 0) && <span className="stickers">{t.stickers}</span>}
                {t.generation < 3 && <span className={`pc ${pcBoxCount < 20 ? "almost-" : ""}${pcBoxCount >= 18 ? "full" : ""}`}>{pcBoxCount.toLocaleString()}</span>}
                {t.level_cap && t.level_cap < 100 ? <span className="level-cap">{t.level_cap}</span> : null}
                {(t.generation > 5 || (t.generation > 2 && (t.time || config.badgeCount > 8)) || (t.items && t.items.candy)) && t.options && displayOpts.length >= 1 && /*<div className="options">}
                    {*/displayOpts.map(opt => t.options[opt] && <span key={opt} className={`option ${cleanString(opt)}`} data-val={cleanString(t.options[opt])}>{t.options[opt]}</span>)/*}
                {</div>*/}
                {t.items && t.items.z_crystals && <ZCrystals items={t.items} />}
                {t.generation > 5 && <Badges bitfield={t.badges} rematch={t.rematch_available} />}
                {t.party_fitness && <span className="fitness">{t.party_fitness.toLocaleString()}</span>}
                <div className="dex-counts">
                    <span className="owned">{t.caught || 0}</span>
                    <span className="seen">{t.seen || 0}</span>
                    <span className="total">{config.totalInDex || "???"}</span>
                </div>
                {/* <div className="dex-counts">
                    <span className="owned">{t.game_stats && t.game_stats["Puzzles Completed"] || 0}</span>
                    <span className="total">{t.puzzleTotal || "??"}</span>
                </div> */}
            </FitToWidth>
        </div>
    }
}

