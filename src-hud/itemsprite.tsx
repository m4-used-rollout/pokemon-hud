/// <reference path="pokesprite.tsx" />
class ItemSprite extends React.PureComponent<{ id:number }, {}> {
    render() {
        let src = TPP.Server.RomData.GetItemSprite(this.props.id);
        // if (src.charAt(0) == "{") {
        //     src = RenderImageMap(JSON.parse(src));
        //     if (src) {
        //         TPP.Server.RomData.CacheItemSprite(this.props.id, src);
        //     }
        // }
        return <img src={src} />
    }
}