/// <reference path="persistent.ts" />
/// <reference path="../src-hud/itemsprite.tsx" />

interface GoalTrainerProps {
    goalTrainers: TPP.Server.DexNav.GoalTrainer[];
}

class GoalTrainers extends PersistentComponent<GoalTrainerProps> {
    render() {
        const totalKnownTrainers = this.state.goalTrainers.length;
        const numDisplays = Math.max(3, Math.floor((window.innerWidth / ((totalKnownTrainers || 1) * .66)) / (window.innerHeight || 1)) * 3), displays: number[] = [];
        for (let i = 0; i < numDisplays; displays.push(i++));
        return <div className="encounters goal-trainers">
            {displays.map(k => <GoalTrainerGroup goalTrainers={this.state.goalTrainers} key={k.toString() + numDisplays.toString()} />)}
        </div>
    }
}


class GoalTrainerGroup extends React.Component<GoalTrainerProps> {
    render() {
        const trainers = this.props.goalTrainers
        return <div className="encounter-group" style={{ animationDuration: `${this.props.goalTrainers.length * 2}s` }}>
            <span className="action-directive">Defeat</span>
            {trainers.map((t, i) => <GoalTrainer key={`${t.id}-${t.classId}`} trainer={t} />)}
        </div>;
    }
}

class GoalTrainer extends React.PureComponent<{ trainer: TPP.Server.DexNav.GoalTrainer }, {}> {
    render() {
        const trainer = this.props.trainer;
        return <span className={`goal-trainer ${trainer.met ? trainer.defeated ? "defeated" : "met" : "unmet"}`} data-attempts={trainer.attempts}>
            <TrainerSprite picId={trainer.spriteId} classId={trainer.classId} trainerId={trainer.id} />
        </span>;
    }
}