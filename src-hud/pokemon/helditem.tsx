/// <reference path="../itemsprite.tsx" />

interface ItemProps {
    id: number;
    name: string;
}

class HeldItem extends React.PureComponent<ItemProps, ItemProps> {
    constructor(props: ItemProps) {
        super(props);
        this.state = { id: props.id, name:props.name };
    }
    componentWillReceiveProps(nextProps: ItemProps) {
        //only update the image if it's not ID 0
        //this way the removed item image persists as the panel animates
        if (nextProps.id)
            this.setState({ id: nextProps.id });
    }
    render() {
        return <div className="held-item" data-id={this.props.id} data-name={this.props.name} >
            <ItemSprite id={this.props.id} />
        </div>;
    }
}