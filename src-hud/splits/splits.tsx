namespace SplitDisplay {
    export class SplitDisplay extends React.Component<{ startTime: Date, splits: Splits, events: TPP.Event[] }> {
        private findMatchingEvent(s: SplitEvent) {
            return this.props.events.find(e => this.isEventGroupMatch(s, e) && (e.name == s.Name || (s.ClassId && (e as TPP.TrainerEvent).class_id == s.ClassId)));
        }
        private isEventGroupMatch(s: SplitEvent, e: TPP.Event) {
            switch (s.Group) {
                case "Badges":
                    return e.group == "Badge";
                case "Champions":
                case "Elite Four":
                    return e.group == "Trainers Defeated";
            }
            return false;
        }
        shouldComponentUpdate(nextProps = this.props) {
            return nextProps.splits.length != this.props.splits.length
                || nextProps.events.length != this.props.events.length
        }

        render() {
            const splits = this.props.splits.map((s, i, arr) => {
                const duration = new Duration(0);
                duration.TotalSeconds = Duration.parse(s.Time).TotalSeconds - (i > 0 ? Duration.parse(arr[i - 1].Time).TotalSeconds : 0);
                return {
                    ...s,
                    Duration: duration,
                    CompletionEvent: this.findMatchingEvent(s),
                } as ProcessedSplit;
            }).sort((s1, s2) =>
                Duration.parse((s1.CompletionEvent || { time: s1.Time }).time, this.props.startTime).TotalSeconds -
                Duration.parse((s2.CompletionEvent || { time: s2.Time }).time, this.props.startTime).TotalSeconds
            ).map((s, i, arr) => {
                const startTime = new Date(((this.props.startTime.valueOf() / 1000) +
                    (i > 0 ? Duration.parse((arr[i - 1].CompletionEvent || { time: "0s" }).time, this.props.startTime).TotalSeconds : 0)) * 1000)
                const completedDuration = new Duration(0);
                const difference = new Duration(0);
                if (s.CompletionEvent) {
                    completedDuration.TotalSeconds = Duration.parse(s.CompletionEvent.time, this.props.startTime).TotalSeconds - (i > 0 ? Duration.parse((arr[i - 1].CompletionEvent || { time: arr[i - 1].Time }).time, this.props.startTime).TotalSeconds : 0);
                    difference.TotalSeconds = completedDuration.TotalSeconds - s.Duration.TotalSeconds;
                }
                return {
                    ...s,
                    Active: this.props.startTime.valueOf() < Date.now() && arr.find(ps => !ps.CompletionEvent) == s,
                    StartTime: startTime,
                    CompletedDuration: s.CompletionEvent ? completedDuration : undefined,
                    Difference: s.CompletionEvent ? difference : undefined
                } as ProcessedSplit;
            });
            // readjust displayed times based on gains or losses from past splits
            splits[0] && (splits[0].EstimatedRunTime = (splits[0].CompletedDuration || splits[0].Duration));
            for (var i = 1; i < splits.length; i++) {
                const estimate = new Duration(0);
                estimate.TotalSeconds = splits[i - 1].EstimatedRunTime.TotalSeconds + (splits[i].CompletedDuration || splits[i].Duration).TotalSeconds;
                splits[i].EstimatedRunTime = estimate;
            }
            console.dir(this.props.events);
            console.dir(splits);
            return <div className="live-split-display">
                {splits.map(s => <SingleSplit key={s.Time} split={s} />)}
                <style dangerouslySetInnerHTML={{ __html: `.live-split-display .split {width: ${100 / splits.length}vw;}` }} />
            </div>;
        }

    }

    class SingleSplit extends React.Component<{ split: ProcessedSplit }> {
        render() {
            const split = this.props.split;
            return <div className={`split ${split.Active && "active"}`}>
                <img src={this.props.split.Image} alt={this.props.split.Name} />
                {!split.Active && !split.CompletionEvent && <div className="future time">{split.EstimatedRunTime.toString()}</div>}
                {split.CompletionEvent && <div className={`past time ${split.Difference.IsNegative ? "pass" : "fail"}`}>{split.Difference.toString()}</div>}
                {split.Active && !split.CompletionEvent && <Countdown toTime={(this.props.split.Duration.TotalSeconds + (this.props.split.StartTime.valueOf() / 1000))} />}
            </div>;
        }
    }

    class Countdown extends React.PureComponent<{ toTime: number }, { currTime: number }> {
        constructor(props: Countdown["props"], context: any) {
            super(props, context);
            this.state = { currTime: (Date.now() / 1000) };
        }
        private requestAnimationFrame(callback: () => void) {
            return setTimeout(callback, 500);
        }
        private running = false;
        private tick = () => this.setState({ currTime: (Date.now() / 1000) }, () => this.running && requestAnimationFrame(this.tick));
        componentDidMount() {
            this.running = true;
            this.tick();
        }
        componentWillUnmount() {
            this.running = false;
        }
        private get timeLeft(): Duration {
            const time = new Duration(0);
            time.TotalSeconds = this.state.currTime - this.props.toTime;
            return time;
        }
        render() {
            const timeLeft = this.timeLeft;
            return <div className={`current time ${timeLeft.IsNegative ? "pass" : "fail"}`}>{timeLeft.toString()}</div>;
        }
    }

    interface ProcessedSplit extends SplitEvent {
        Duration: Duration;
        StartTime: Date;
        Active: boolean;
        CompletionEvent?: TPP.Event;
        CompletedDuration?: Duration;
        Difference?: Duration;
        EstimatedRunTime?: Duration;
    }

    enum Scale {
        Weeks,
        Days,
        Hours,
        Minutes
    }

    class Duration {
        private static parseReg = /^\s*(?:(\d*)w)?\s*(?:(\d*)d)?\s*(?:(\d*)h)?\s*(?:(\d*)m)?\s*(?:(\d*)s)?\s*$/i;

        get TotalSeconds() {
            return (this.seconds + (this.minutes * 60) + (this.hours * 60 * 60) + (this.days * 60 * 60 * 24)) * (this.negative ? -1 : 1);
        }
        get TotalHours() {
            return this.TotalSeconds / 60 / 60;
        }
        get TotalDays() {
            return this.TotalHours / 24;
        }
        get TotalWeeks() {
            return this.TotalDays / 7;
        }
        get IsNegative() {
            return this.negative;
        }

        set TotalSeconds(value) {
            this.negative = value < 0;
            if (this.negative)
                value = Math.abs(value);
            this.seconds = Math.floor(value % 60);
            this.minutes = Math.floor(value / 60) % 60;
            this.hours = Math.floor(value / 60 / 60) % 24;
            this.days = Math.floor(value / 60 / 60 / 24);
        }
        set TotalHours(value) {
            this.TotalSeconds = value * 60 * 60;
        }
        set TotalDays(value) {
            this.TotalHours = value * 24;
        }
        set TotalWeeks(value) {
            this.TotalDays = value * 7;
        }

        TotalTime(scale: Scale) {
            switch (scale) {
                case Scale.Weeks:
                    return this.TotalWeeks;
                case Scale.Hours:
                    return this.TotalHours / 4;
                case Scale.Minutes:
                    return this.TotalHours * 6;
            }
            return this.TotalDays;
        }

        private pad(num: number) {
            if (Math.abs(num) < 10)
                return `0${num.toFixed(0)}`;
            return num.toFixed(0);
        }

        toString(scale = Scale.Days) {
            return (scale == Scale.Minutes ? (this.days * 24 + this.hours) * 60 + this.minutes : (scale == Scale.Hours ? this.days * 24 + this.hours : (scale == Scale.Weeks ? this.pad(Math.floor(this.days / 7)) + "w " + this.pad(this.days % 7) : this.pad(this.days)) + "d " + this.pad(this.hours)) + "h " + this.pad(this.minutes)) + "m " + this.pad(this.seconds) + "s";
        }

        static parse(time: string, baseTime?: Date) {
            var retval = new Duration();
            if (time) {
                if (this.canParse(time)) {
                    try {
                        var matches = this.parseReg.exec(time);
                        return new Duration(parseInt(matches[1]) || 0, parseInt(matches[2]) || 0, parseInt(matches[3]) || 0, parseInt(matches[4]) || 0, parseInt(matches[5]) || 0);
                    }
                    catch (e) { }
                }
                if (baseTime) {
                    retval.TotalSeconds = (Date.parse(time) / 1000) - (baseTime.valueOf() / 1000);
                }
            }
            return retval;
        }

        static canParse(time: string) {
            return this.parseReg.test(time);
        }

        constructor(weeks: string | number = 0, private days = 0, private hours = 0, private minutes = 0, private seconds = 0, private negative = false) {
            if (typeof (weeks) === "string") {
                var parsed = Duration.parse(weeks);
                this.days = parsed.days;
                this.hours = parsed.hours;
                this.minutes = parsed.minutes;
                this.seconds = parsed.seconds;
            }
            else
                this.days += weeks * 7;
        }
    }
}