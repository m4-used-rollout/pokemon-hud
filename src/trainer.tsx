/// <reference path="shared.ts" />

class Trainer extends React.PureComponent<{trainer:TPP.TrainerData},{}> {
    render() {
        let t = this.props.trainer;
        let totalBalls = ((t.items_ball || []).map(b => b.count)).reduce((a, b) => a + b, 0);
        return <div className="trainer-info">
            <div className="badges">Badges Go Here</div>
            <div className="wallet">
                <span className="cash">{t.money}</span>
                <span className="balls">{totalBalls}</span>
            </div>
            <div className="dex-counts">
                <span className="owned">{t.caught}</span>
                <span className="seen">{t.seen}</span>
                <span className="total">{config.totalInDex || "???"}</span>
            </div>
        </div>
    }
}