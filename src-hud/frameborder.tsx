/// <reference path="pokesprite.tsx" />
class FrameBorder extends React.PureComponent<{ frame: number }, {}> {
    render() {
        let src = TPP.Server.RomData.GetFrameBorder(this.props.frame - 1);
        if (src && src.charAt(0) == "{") {
            src = RenderImageMap(JSON.parse(src));
            if (src) {
                TPP.Server.RomData.CacheFrameBorder(this.props.frame - 1, src);
            }
        }
        return <img className="frame-border" src={src} />
    }
}