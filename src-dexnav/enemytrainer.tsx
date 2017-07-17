/// <reference path="encounters.tsx" />
/// <reference path="../src-hud/trainersprite.tsx" />

class EnemyTrainer extends React.Component<{ trainer: TPP.EnemyTrainer }, {}> {
    render() {
        let trainer = this.props.trainer;
        if (!trainer) return null;
        return <div className="encounters enemy-trainer">
            <div className="info-left">
                <div className="name">{`${trainer.class_name || ''} ${trainer.name || ''}`.trim()}</div>
                <EnemyParty trainer={trainer} />
            </div>
            <div className="trainer">
                <TrainerSprite classId={trainer.class_id} trainerId={trainer.id} />
            </div>
        </div>;
    }
}

class EnemyParty extends React.Component<{ trainer: TPP.EnemyTrainer }, {}> {
    render() {
        let party = this.props.trainer.party;
        if (!party) return null;
        return <div className="enemy-party">
            {party.map(p => <span className={p.species.id && p.health[0] ? "" : "fainted"} >
                {p.species.id ?
                    <PokeSprite pokemonId={p.species.id} /> :
                    <img src="./img/empty-sprite.png" />
                }
            </span>)}
        </div>
    }
}