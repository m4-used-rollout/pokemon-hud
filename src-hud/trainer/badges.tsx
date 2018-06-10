/// <reference path="../shared.ts" />
class Badges extends React.PureComponent<{bitfield:number, rematch?:number},{}> {
    render() {
        if (!config.badgeCount)
            return <div className="badges">Badges Go Here</div>;
        let badgeFolder = config.spriteFolder;
        let badgeStr = (this.props.bitfield || 0).toString(2);
        while (badgeStr.length < config.badgeCount)
            badgeStr = '0' + badgeStr;
        return <div className="badges"> {
                badgeStr.split('').reverse().map((own, num)=> {
                    let isOwned = own == '1';
                    let hasRematch = isOwned && this.props.rematch == (num + 1);
                    let img = `./img/badges/${badgeFolder}/${num + 1}.png`;
                    let slotImg = img.replace(/\/(\d*)\.png/, "/d$1.png");
                    let hasSlotImg = true;// TPP.Server.fileExists(slotImg);
                    return <span style={{ backgroundImage: hasSlotImg ? `url('${slotImg}')` : null }} className={hasRematch ? "rematch-ready" : ""}>
                        <img key={num} className={isOwned ? '' : hasSlotImg ? 'badge-slot' : 'unowned'}  src={img}/>
                    </span>
                }
            )}
        </div>;
    }
}