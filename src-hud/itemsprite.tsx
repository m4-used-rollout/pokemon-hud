/// <reference path="pokesprite.tsx" />
class ItemSprite extends React.PureComponent<{ id:number, className?: string }, {}> {
    render() {
        return <img className={this.props.className} src={TPP.Server.RomData.GetItemSprite(this.props.id)} />
    }
}