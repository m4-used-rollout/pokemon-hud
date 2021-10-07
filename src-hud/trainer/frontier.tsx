/// <reference path="../shared.ts" />
class BattleFrontier extends React.PureComponent<{ bitfield?: number }, {}> {
    render() {
        if (typeof this.props.bitfield === "undefined" || !config.frontierFacilities)
            return null;
        let badgeFolder = config.spriteFolder;
        let frontierStr = (this.props.bitfield || 0).toString(4);
        while (frontierStr.length < config.frontierFacilities)
            frontierStr = '0' + frontierStr;
        return <div className="badges frontier"> {
            frontierStr.split('').reverse().map(s => parseInt(s)).map((own, num) => {
                const isSilver = own == 1 || own == 2;
                const isGold = own == 3;
                const img = `./img/badges/${badgeFolder}/${num + 1 + config.badgeCount}.png`;
                return <span>
                    <img key={num} className={isSilver ? 'silver' : isGold ? 'gold' : 'unearned'} src={img} />
                </span>
            })
        }
        </div>;
    }
}