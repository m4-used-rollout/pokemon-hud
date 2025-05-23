/// <reference path="wildbattle.tsx" />
/// <reference path="enemytrainer.tsx" />
/// <reference path="goaltrainers.tsx" />

class DexNav extends React.Component<{ state: TPP.Server.DexNav.State }, {}> {
    render() {
        let map = this.props.state;
        if (!map.ShowDexNav)
            return null;
        let totalKnownEncounters = Object.keys(map.KnownEncounters || {}).reduce((a, k) => a + map.KnownEncounters[k].length, 0);
        const glitchOut = map.GlitchOut;
        let classes = [
            "dexnav",
            map.TotalEncounters ? totalKnownEncounters ? map.MoreLeftToCatch ? null : "caught-them-all" : null : null,
            map.TehUrn ? "teh-urn" : null,
            config.hudTheme || "default-theme",
            config.dexNavTheme
        ];
        return <div className={classes.filter(c => !!c).join(' ')} data-completed={map.CompletedCategories}>
            <h3>DexNav</h3>
            {/* <h3>TPP DexNav</h3> */}
            {/* <h3>PuzzNav</h3> */}
            {/* <h3>AltairXD Satellite Pokédex</h3> */}
            {/* <h3>T★DA</h3> */}
            {map.MapName && !glitchOut ? <h4>{map.MapName}</h4> : null}
            <div className="backstop" />
            {glitchOut && <div className="encounters glitch" />}
            <KillScreen party={map.FriendlyParty} enemyParty={map.EnemyParty} playerName={map.PlayerName} />
            <WildBattle wilds={map.WildBattle} />
            <EnemyTrainer trainers={map.EnemyTrainers} battleKind={map.BattleKind} party={map.EnemyParty} />
            {config.generation > 3 && config.generation < 4 && !totalKnownEncounters && map.GoalTrainers && <GoalTrainers goalTrainers={map.GoalTrainers} />}
            {map.PuzzleNumber > 0 && <div className="encounters puzzle-display">
                <div className="puzzle-number">{map.PuzzleNumber}</div>
                <div className="puzzle-name">
                    {map.MapName}
                    <div className="puzzle-author">by {map.PuzzleAuthor}</div>
                </div>
                {map.PuzzleFoundScroll && <img className="puzzle-scroll" src="img/goals/scroll.png" />}
            </div>}
            <div className={`encounters unknown-zone ${map.TotalEncounters || !map.IsUnknownArea ? 'hidden' : ""}`}>
                <TrainerSprite picId={-1} />
            </div>
            <div className={`encounters no-encounters ${map.TotalEncounters ? 'hidden' : ""}`} />
            <div className={`encounters nothing-to-show ${totalKnownEncounters ? 'hidden' : ""}`} />
            <Encounters encounters={totalKnownEncounters ? map.KnownEncounters : null} total={totalKnownEncounters} />
        </div>;
    }
}