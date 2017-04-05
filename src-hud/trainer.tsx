/// <reference path="shared.ts" />

class Trainer extends React.Component<{trainer:TPP.TrainerData},{}> {
    render() {
        let t = this.props.trainer;
        let totalBalls = ((t.items_ball || []).map(b => b.count)).reduce((a, b) => a + b, 0);
        return <div className="trainer-info">
            <Badges bitfield={t.badges} />
            <div className="bottom-row">
                <div className="wallet">
                    <span className="cash">{(t.money || 0).toLocaleString()}</span>
                    <span className="balls">{totalBalls.toLocaleString()}</span>
                </div>
                <div className="name">
                    {t.name}
                </div>
                <div className="dex-counts">
                    <span className="owned">{t.caught || 0}</span>
                    <span className="seen">{t.seen || 0}</span>
                    <span className="total">{config.totalInDex || "???"}</span>
                </div>
            </div>
        </div>
    }
}

class Badges extends React.PureComponent<{bitfield:number},{}> {
    render() {
        if (!config.badgeCount)
            return <div className="badges">Badges Go Here</div>;
        let badgeStr = (this.props.bitfield || 0).toString(2);
        while (badgeStr.length < config.badgeCount)
            badgeStr = '0' + badgeStr;
        return <div className="badges">
            { badgeStr.split('').reverse().map((own, num)=>
                <img key={num} className={own == '1' ? '' : 'unowned'}
                    style={{
                        width: (100 / 8) + 'vw'
                    }}
                    src={`./img/badges/${config.spriteFolder}/${num + 1}.png`}/>
            )}
        </div>;
    }
}