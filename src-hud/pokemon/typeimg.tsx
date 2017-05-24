/// <reference path="../shared.ts" />
class TypeImg extends React.PureComponent<{type:string;},{}> {
    render() {
        let type = ((this.props.type == "???" ? "Fairy" : this.props.type) || '').toLowerCase();
        return <img src={`./img/types/${type}.png`}/>
    }
}