/// <reference path="shared.ts" />

class Trainer extends React.Component<{trainer:TPP.TrainerData},{}> {
    render() {
        let t = this.props.trainer;
        return <div className="trainer-info">
            <Badges bitfield={t.badges} />
            <div className="bottom-row">
                <div className="wallet">
                    <span className="cash">{(t.money || 0).toLocaleString()}</span>
                    <span className="balls">{t.ball_count.toLocaleString()}</span>
                </div>
                {t.options && 
                <div className="options">
                    <span>{t.options.text_speed}</span>
                    <span>{t.options.battle_style}</span>
                    <span>{t.options.battle_scene}</span>
                </div>}
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
        return <div className="badges"> {
            badgeStr.split('').reverse().map((own, num)=> {
                let isOwned = own == '1';
                let img = `./img/badges/${config.spriteFolder}/${num + 1}.png`;
                let slotImg = img.replace(/\/(\d*)\.png/, "/d$1.png");
                let hasSlotImg = true;// TPP.Server.fileExists(slotImg);
                return <span style={{ backgroundImage: hasSlotImg ? `url('${slotImg}')` : null }}>
                    <img key={num} className={isOwned ? '' : hasSlotImg ? 'badge-slot' : 'unowned'}  src={img}/>
                </span>
            }
        )}
        </div>;
    }
}