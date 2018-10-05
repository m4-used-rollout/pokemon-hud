/// <reference path="../shared.ts" />
class TypeImg extends React.PureComponent<{type:string;},{}> {
    render() {
        let type = ((this.props.type == "???" || !this.props.type ? "Fairy" : this.props.type) || '').toLowerCase();
        return <img className="type" src={`./img/types/${type}.png`}/>
    }
}