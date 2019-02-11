/// <reference path="pokemon/pokemon.tsx" />

class Party extends React.Component<{ party: TPP.PartyData; gameState: TPP.RunStatus;}, {}> {
    render() {
        return <ul className="party">
            {this.props.party.filter(p=>!!p).map(p => <Pokemon key={`${p.name}:${p.personality_value}`} pokemon={p} gameState={this.props.gameState} />)}
        </ul>;
    }
}