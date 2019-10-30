/// <reference path="pokesprite.tsx" />
class TrainerSprite extends React.PureComponent<{ picId?: number; classId?: number; trainerId?:number }, {}> {
    render() {
        const picId = this.props.picId;// typeof(this.props.picId) === "number" ? this.props.picId : typeof(this.props.classId) === "number" ? this.props.classId : this.props.trainerId; //TTH
        let src = TPP.Server.RomData.GetTrainerSprite(picId);
        if (src.charAt(0) == "{") {
            src = RenderImageMap(JSON.parse(src));
            if (src) {
                TPP.Server.RomData.CacheTrainerSprite(picId, src);
            }
        }
        return <img src={src} />
    }
}