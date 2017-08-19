/// <reference path="../shared.ts" />
type fitProps = {
    className?: string;
    stretch?: boolean
};
type fitState = {
    containerWidth: number;
    contentWidth: number;
    contentHeight: number;
};

class FitToWidth extends React.Component<fitProps, fitState> {
    private windowResizeListener: EventListener;
    constructor(props: fitProps) {
        super(props);
        this.state = { containerWidth: 1, contentWidth: 1, contentHeight: 1 };
        this.windowResizeListener = () => this.checkWidths();
    }
    render() {
        let scaleFactor = this.state.containerWidth / (this.state.contentWidth || 1);
        if (!this.props.stretch) {
            scaleFactor = Math.min(1, scaleFactor);
        }
        return <div
            className={`fit-to-width-container ${this.props.className}`}
            style={{ height: this.state.contentHeight }}
            data-width={this.state.containerWidth}
        >
            <div style={{ transform: `scaleX(${scaleFactor})` }}>
                {this.props.children}
            </div>
        </div>;
    }
    componentDidMount() {
        setTimeout(() => this.checkWidths(), 100);
        window.addEventListener("resize", this.windowResizeListener);
    }
    componentWillUnmount() {
        window.removeEventListener("resize", this.windowResizeListener);
    }
    componentDidUpdate() {
        this.checkWidths();
    }
    private checkWidths() {
        let node = ReactDOM.findDOMNode(this);
        let containerWidth = node.clientWidth;
        let contentWidth = node.firstElementChild.clientWidth;
        let contentHeight = node.firstElementChild.clientHeight;
        if (this.state.containerWidth != containerWidth
            || this.state.contentWidth != contentWidth
            || this.state.contentHeight != contentHeight) {
            this.setState({
                containerWidth: containerWidth,
                contentWidth: contentWidth,
                contentHeight: contentHeight
            });
        }
    }
}
