/// <reference path="badges.tsx" />

class ZCrystals extends React.Component<{ items: { [key: string]: TPP.Item[] } }, {}> {
    //Normalium Z, Fightinium Z, Waterium Z, Firium Z, Grassium Z, Rockium Z, Electrium Z, Ghostinium Z, Darkinium Z, Groundium Z, Dragonium Z
    private static significantCrystals = [776, 807, 782, 813, 778, 809, 777, 808, 780, 811, 788, 819, 779, 810, 786, 820, 791, 822, 784, 815, 790, 821];
    render() {
        let owned = Object.keys(this.props.items || {}).reduce((itemArr: TPP.Item[], k: string) => itemArr.concat(this.props.items[k]), []).filter(i => ZCrystals.significantCrystals.indexOf(i.id) >= 0);
        if (!owned.length) return null;
        return <div className="z-crystals">
            {owned.map(i => <ItemSprite key={i.id} id={i.id} />)}
        </div>;
    }
}