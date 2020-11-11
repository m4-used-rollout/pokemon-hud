/// <reference path="../shared.ts" />
class Sleepy extends React.PureComponent<{status:number},{tick:number}> {
    timer:number;
    constructor(props) {
        super(props);
        this.state = {tick: 0};
    }
    componentDidMount() {
        this.timer = setInterval(()=>this.setState(prev=> ({tick: prev.tick + 1})), 1000) as any;
    }
    componentWillUnmount() {
        clearInterval(this.timer);
    }
    render() {
        if (this.props.status > 0 && this.props.status < 8)
            return <div className="sleepy">
                {[1,2,3,4,5,6,7]
                    .filter(s => s <= this.props.status)
                    .map(s => (s + this.state.tick) % 2 ? '☽' : '☾')
                    .join(' ')
                }
            </div>;
        return null;
    }
}