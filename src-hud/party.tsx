/// <reference path="pokemon/pokemon.tsx" />

class Party extends React.Component<{ party: TPP.PartyData; }, {}> {
    render() {
        return <ul className="party">
            {this.props.party.filter(p=>!!p).map(p => <Pokemon key={`${p.name}:${p.personality_value}`} pokemon={p} />)}
        </ul>;
    }
}