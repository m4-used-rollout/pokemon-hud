/// <reference path="encounters.tsx" />
/// <reference path="../src-hud/trainersprite.tsx" />

class EnemyTrainer extends PersistentComponent<{ trainers: TPP.EnemyTrainer[], party: TPP.EnemyParty }> {
    constructor(props) {
        super(props, 2);
    }
    render() {
        const trainers = this.state.trainers;
        if (!trainers || !trainers.length) return null;
        const partyFitness = (this.state.party || []).reduce((sum, mon) => sum + mon.fitness, 0);
        return <div className={`encounters enemy-trainer ${this.props.trainers ? "" : "hidden"}`} key={`${trainers[0].class_id}${trainers[0].id}`}>
            <div className="info-left">
                {trainers.map(trainer => <div className="name">{`${trainer.class_name || ''} ${trainer.name || ''}`.trim()}</div>)}
                {partyFitness && <div className="fitness">{partyFitness.toLocaleString()}</div>}
                <EnemyParty party={this.state.party} />
            </div>
            <div className={`trainer ${trainers.length > 1 ? "double" : ""}`}>
                {trainers.map(trainer => <TrainerSprite picId={trainer.pic_id} classId={trainer.class_id} trainerId={trainer.id} />)}
            </div>
        </div>;
    }
}

class EnemyParty extends React.Component<{ party: TPP.EnemyParty }, {}> {
    render() {
        let party = this.props.party;
        if (!party) return null;
        return <div className="enemy-party">
            {party.map(p => <span className={p.species.id && p.health[0] ? "" : "fainted"} >
                {p.species.id ?
                    <PokeSprite pokemonId={p.species.id} /> :
                    <img src="./img/unknown-sprite.png" />
                }
            </span>)}
        </div>
    }
}