/// <reference path="../shared.ts" />
class TypeImg extends React.PureComponent<{type:string; filled?:boolean},{}> {
    render() {
        let type = ((this.props.type == "???" || !this.props.type ? "Fairy" : this.props.type) || '').toLowerCase();
        return <i className={`tpp type tpp-type-unknown${this.props.filled ? "" : "-cutout"} tpp-type-${type}${this.props.filled ? "" : "-cutout"}`}/>
        //return <img className="type" src={`./img/types/${type}.png`}/>
    }
}