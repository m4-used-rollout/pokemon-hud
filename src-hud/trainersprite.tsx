/// <reference path="pokesprite.tsx" />
class TrainerSprite extends React.PureComponent<{ picId?: number; classId?: number; trainerId?:number }, {}> {
    render() {
        let src = TPP.Server.RomData.GetTrainerSprite(this.props.picId || this.props.classId || this.props.trainerId);
        if (src.charAt(0) == "{") {
            src = RenderImageMap(JSON.parse(src));
            if (src) {
                TPP.Server.RomData.CacheTrainerSprite(this.props.picId || this.props.classId || this.props.trainerId, src);
            }
        }
        return <img src={src} />
    }
}