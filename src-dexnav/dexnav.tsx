/// <reference path="wildbattle.tsx" />
/// <reference path="enemytrainer.tsx" />


class DexNav extends React.Component<{ state: TPP.Server.DexNav.State }, {}> {
    render() {
        let map = this.props.state;
        if (!map.ShowDexNav)
            return null;
        let totalKnownEncounters = Object.keys(map.KnownEncounters || {}).reduce((a, k) => a + map.KnownEncounters[k].length, 0);
        let classes = [
            "dexnav",
            map.TotalEncounters ? totalKnownEncounters ? map.MoreLeftToCatch ? null : "caught-them-all" : null : null,
            map.TehUrn ? "teh-urn" : null,
            config.hudTheme || "default-theme",
            config.dexNavTheme
        ];
        return <div className={classes.filter(c => !!c).join(' ')} data-completed={map.CompletedCategories}>
            <h3>DexNav</h3>
            {map.MapName ? <h4>{map.MapName}</h4> : null}
            <WildBattle wild={map.WildBattle} wildParty={map.EnemyParty} />
            <EnemyTrainer trainers={map.EnemyTrainers} party={map.EnemyParty} />
            <div className={`encounters unknown-zone ${map.TotalEncounters || !map.IsUnknownArea ? 'hidden' : ""}`}>
                <TrainerSprite picId={-1} />
            </div>
            <div className={`encounters no-encounters ${map.TotalEncounters ? 'hidden' : ""}`} />
            <div className={`encounters nothing-to-show ${totalKnownEncounters ? 'hidden' : ""}`} />
            <Encounters encounters={totalKnownEncounters ? map.KnownEncounters : null} total={totalKnownEncounters} />
        </div>;
    }
}