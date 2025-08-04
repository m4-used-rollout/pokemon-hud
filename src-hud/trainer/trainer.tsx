/// <reference path="z-crystals.tsx" />
/// <reference path="frontier.tsx" />
/// <reference path="../utils/fittowidth.tsx" />
/// <reference path="../itemsprite.tsx" />

const escapeRope = 85;//TTH

class Trainer extends React.Component<{ trainer: TPP.RunStatus }, {}> {
    render() {
        let t = this.props.trainer;
        let displayOpts = config.displayOptions || ["text_speed", "battle_style", "battle_scene"];
        let pc: TPP.CombinedPCData = t.pc || { current_box_number: 0, boxes: [] };
        let pcBoxCount = (pc.boxes || []).filter(b => !!b && b.box_contents && b.box_number == pc.current_box_number).map(b => b.box_contents.length).shift() || 0;
        let maxDex = (config.totalInDex || 0) + (t.seen_list || []).filter(i => i > (config.totalInDex || 0) || i <= 0).length;
        const hudTheme = config.hudTheme || "";

        return <div className={`trainer-info ${t.transitioning ? "glitch" : ""}`}>
            {t.items && t.items.candy && ((t.party.length <= 3 || t.party.length == 5) && t.items && t.items.key && t.items.key.length > 0) && <div className={`key-items ${t.items.candy.length > 34 && t.party.length >= 2 ? "too-much-candy" : ""}`}>
                {((t.items.candy.length <= 30 && t.party.length <= 3) || t.party.length < 3) && <h5>Helpful Items</h5>}
                <ul>
                    {t.items.key.map(i => <li key={i.id}>
                        <ItemSprite id={i.id} />
                        {/* <span>{i.name}</span> */}
                    </li>)}
                </ul>
            </div>}
            {t.party.length <= 3 && t.items && t.items.candy && t.items.candy.length > 0 && <div className={`candy-counts ${((t.items.candy.length > 40 || t.party.length > 3) && t.party.length >= 2) ? "way-too-much-candy" : t.items.candy.length > 34 ? "too-much-candy" : ""}`}>
                {((t.items.candy.length <= 30 && t.party.length <= 3) || t.party.length < 3) && <h5>Candy Haul</h5>}
                {t.items.candy.map(i => <div className="candy" key={i.id}>
                    <ItemSprite id={i.id} />
                    <FitToWidth className="candy-name">{i.pluralName || i.name}</FitToWidth>
                    <span className="quantity">{i.count || 1}</span>
                </div>)}
            </div>}
            {config.generation < 6 && (!t.items || !t.items.candy) && !hudTheme.includes("n3ds-theme") && (typeof t.frontier_symbols === "number" && config.frontierFacilities && <BattleFrontier bitfield={t.frontier_symbols} /> || <Badges bitfield={t.badges} rematch={t.rematch_available} />)}
            {t.time && <Clock time={t.time} />}
            {config.generation < 6 && !hudTheme.includes("n3ds-theme") /*&& (!t.time || config.generation < 3)*/ && config.badgeCount < 9 && t.options && displayOpts.length > 1 && <div className="options">
                {displayOpts.map(opt => t.options[opt] && <span key={opt} className={`option ${cleanString(opt)}`} data-val={cleanString(t.options[opt])}>{t.options[opt]}</span>)}
            </div>}
            <FitToWidth className="bottom-row">
                <span className={`cash ${t.money < 1000 ? t.money < 200 ? 'low' : 'med' : 'good'}`}>{(t.money || 0).toLocaleString()}</span>
                {t.items && !t.items.candy && <span className={`balls ${(t.ball_count || 0) < 10 ? (t.ball_count || 0) < 1 ? 'low' : 'med' : 'good'}`}>{(t.ball_count || 0).toLocaleString()}</span>}
                {(t.stickers || t.stickers === 0) && <span className="stickers">{t.stickers}</span>}
                {config.generation < 3 && <span className={`pc ${pcBoxCount < 20 ? "almost-" : ""}${pcBoxCount >= 18 ? "full" : ""}`}>{pcBoxCount.toLocaleString()}</span>}
                {t.level_cap && t.level_cap < 100 ? <span className="level-cap">{t.level_cap}</span> : null}
                {(config.generation > 5 || (config.generation > 2 && (/*t.time ||*/ config.badgeCount > 8)) || (t.items && t.items.candy) || hudTheme.includes("n3ds-theme")) && t.options && displayOpts.length >= 1 && /*<div className="options">}
                    {*/displayOpts.map(opt => t.options[opt] && <span key={opt} className={`option ${cleanString(opt)}`} data-val={cleanString(t.options[opt])}>{t.options[opt]}</span>)/*}
                {</div>*/}
                {config.generation == 7 && t.items && t.items.z_crystals && <ZCrystals items={t.items} />}
                {(config.generation > 5 || hudTheme.includes("n3ds-theme")) && <Badges bitfield={t.badges} rematch={t.rematch_available} />}
                {t.party_fitness && <span className="fitness">{t.party_fitness.toLocaleString()}</span>}
                {(!t.items || !t.items.candy) && <div className="dex-counts">
                    <span className="owned">{t.caught || 0}</span>
                    <span className="seen">{t.seen || 0}</span>
                    <span className="total">{maxDex || "???"}</span>
                </div>}
                {t.items && t.items.candy && <div className="dex-counts">
                    <span className="owned">{t.game_stats && t.game_stats["Puzzles Completed"] || 0}</span>
                    <span className="total">{t.puzzleTotal || "??"}</span>
                </div>}
            </FitToWidth>
        </div>
    }
}

