/// <reference path="encounters.tsx" />
/// <reference path="../src-hud/trainersprite.tsx" />

class EnemyTrainer extends React.Component<{ trainer: Pokemon.Trainer }, {}> {
    render() {
        let trainer = this.props.trainer;
        if (!trainer) return null;
        return <div className="encounters enemy-trainer">
            <div className="info-left">
                <div className="name">{`${trainer.className || ''} ${trainer.name || ''}`.trim()}</div>
            </div>
            <div className="trainer">
                <TrainerSprite classId={trainer.classId} trainerId={trainer.id} />
            </div>
        </div>;
    }
}