/// <reference path="wildbattle.tsx" />
/// <reference path="enemytrainer.tsx" />


class DexNav extends React.Component<{ state: TPP.Server.DexNav.State }, {}> {
    render() {
        let map = this.props.state;
        if (!map || !map.MapID)
            return null;
        let totalKnownEncounters = Object.keys(map.KnownEncounters || {}).reduce((a, k) => a + map.KnownEncounters[k].length, 0);
        let classes = [
            "dexnav",
            map.TotalEncounters ? totalKnownEncounters ? map.MoreLeftToCatch ? null : "caught-them-all" : "nothing-to-show" : "no-encounters"
        ];
        return <div className={classes.filter(c => !!c).join(' ')} data-completed={map.CompletedCategories}>
            <h3>DexNav</h3>
            {map.MapName ? <h4>{map.MapName}</h4> : null}
            <WildBattle wild={this.props.state.WildBattle} />
            <EnemyTrainer trainer={this.props.state.EnemyTrainer} />
            <Encounters encounters={map.KnownEncounters} total={totalKnownEncounters} />
        </div>;
    }
}