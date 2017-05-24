/// <reference path="../shared.ts" />

interface ItemProps {
    id: number;
}

class HeldItem extends React.PureComponent<ItemProps, ItemProps> {
    constructor(props: ItemProps) {
        super(props);
        this.state = { id: props.id };
    }
    componentWillReceiveProps(nextProps: ItemProps) {
        //only update the image if it's not ID 0
        //this way the removed item image persists as the panel animates
        if (nextProps.id)
            this.setState({ id: nextProps.id });
    }
    render() {
        return <div className="held-item" data-id={this.props.id}>
            <img src={`./img/items/${config.spriteFolder}/${this.state.id}.png`} />
        </div>;
    }
}