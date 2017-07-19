/// <reference path="shared.ts" />

abstract class PersistentComponent<T> extends React.Component<T, T> {
    constructor(props, private persistSeconds = 0) {
        super(props);
        this.state = props;
    }
    componentWillReceiveProps(nextProps: T) {
        if (nextProps && Object.keys(nextProps).some(k => !!nextProps[k])) {
            this.setState(nextProps);
        }
        else if (this.persistSeconds > 0) {
            setTimeout(() => this.setState(() => this.props), this.persistSeconds * 1000);
        }
    }
}