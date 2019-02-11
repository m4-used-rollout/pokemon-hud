/// <reference path="../shared.ts" />

interface AppraisalProps {
    pokemon: TPP.Pokemon;
    trainerName: string;
    stepDuration: number;
}
interface AppraisalState extends AppraisalProps {
    overall: AppraisalTier;
    bestStats: string[];
    stats: AppraisalTier;
    step: AppraisalStep;
}

enum AppraisalStep {
    Hide, Hello, Overall, BestStat, NextStat, Stats, Goodbye
}

enum AppraisalTier {
    Great, Good, Average, Bad
}

class Appraisal extends React.Component<AppraisalProps, AppraisalState> {
    private static stats = [{ name: "HP", stat: "hp" }, { name: "Special", stat: "special_attack" }, { name: "Attack", stat: "attack" }, { name: "Defense", stat: "defense" }, { name: "Speed", stat: "speed" }];
    private static perfectStat = 15;
    private static perfectTotal = Appraisal.perfectStat * Appraisal.stats.length;
    private static overallTiers = [.8, .65, .5];
    private static statTiers = [.95, .8, .5];
    constructor(props: AppraisalProps) {
        super(props);
        this.state = this.generateAppraisal(props);
    }
    componentWillReceiveProps(nextProps: AppraisalProps) {
        //only update the state if the mon changes
        if (nextProps.pokemon && nextProps.pokemon.species && nextProps.pokemon.species.id && nextProps.pokemon.personality_value != this.props.pokemon.personality_value)
            this.setState(this.generateAppraisal(nextProps));
    }
    componentWillUnmount() {
        clearTimeout(this.timer);
    }
    private findTier(percent: number, tiers: number[]) {
        let tier = 0;
        for (tier = 0; tier < tiers.length && percent <= tiers[tier]; tier++);
        return tier as AppraisalTier;
    }
    private generateAppraisal(props: AppraisalProps = this.props): AppraisalState {
        const state: AppraisalState = { pokemon: props.pokemon, trainerName: props.trainerName, overall: null, step: AppraisalStep.Hide, stats: null, bestStats: [], stepDuration: props.stepDuration };
        if (props.pokemon && props.pokemon.species && props.pokemon.species.id && props.pokemon.ivs) {
            const stats = Appraisal.stats.map(s => ({ name: s.name, value: props.pokemon.ivs[s.stat] as number })).sort((s1, s2) => s1.value - s2.value);
            const statSum = stats.reduce((sum, stat) => sum + stat.value, 0);
            const overallPercent = statSum / Appraisal.perfectTotal;
            const statPercent = stats[0].value / Appraisal.perfectStat;
            state.bestStats = stats.filter((s, i, arr) => s.value >= arr[0].value).map(s => s.name);
            state.overall = this.findTier(overallPercent, Appraisal.overallTiers);
            state.stats = this.findTier(statPercent, Appraisal.statTiers);
            console.log(`Stats: ${JSON.stringify(stats)} Overall: ${AppraisalTier[state.overall]} ${(overallPercent * 100).toFixed(1)}% (${statSum}/${Appraisal.perfectTotal}) Stat: ${AppraisalTier[state.stats]} ${(statPercent * 100).toFixed(1)} (${stats[0].value}/${Appraisal.perfectStat})`);
            this.timer = setTimeout(() => this.tick(), 1);
        }
        return state;
    }
    private timer: NodeJS.Timer;
    private advance(step: AppraisalStep = this.state.step) {
        if (step == AppraisalStep.Goodbye) {
            return { step: AppraisalStep.Hide };
        }
        if (step == AppraisalStep.BestStat || step == AppraisalStep.NextStat) {
            if (this.state.bestStats.length > 1) {
                const retVal = { step: AppraisalStep.NextStat, bestStats: this.state.bestStats.map(c => c) };
                retVal.bestStats.shift();
                return retVal;
            }
            return { step: AppraisalStep.Goodbye };
        }
        return { step: this.state.step + 1 };
    }
    private tick() {
        //this.setState(this.advance(), () => this.timer = this.state.step != AppraisalStep.Hide && setTimeout(() => this.tick(), this.state.stepDuration * 1000));
    }
    render() {
        if (!this.state.trainerName || !this.state.pokemon) {
            return null;
        }
        return <div
            className={`appraisal ${AppraisalStep[this.state.step]}`}
            data-trainer={cleanForExternalFont(this.state.trainerName)}
            data-pokemon={cleanForExternalFont(this.props.pokemon && this.props.pokemon.name ? this.props.pokemon.name : this.state.pokemon.name)}
            data-overall={AppraisalTier[this.state.overall]}
            data-stats={AppraisalTier[this.state.stats]}
            data-best-stat={this.state.bestStats[0]}
        />;
    }
}