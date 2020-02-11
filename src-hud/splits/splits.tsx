namespace SplitDisplay {
    export class SplitDisplay extends React.Component<{ startTime: Date, splits: Splits, events: TPP.Event[] }> {
        private splits: ProcessedSplit[];

        constructor(props: SplitDisplay["props"], context: any) {
            super(props, context);
            this.splits = props.splits.map(s => ({ ...s, Duration: Duration.parse(s.Time) }));
        }

        private findMatchingEvent(s: ProcessedSplit) {
            return this.props.events.find(e => e.group == s.Group && (e.name == s.Name || (e as TPP.TrainerEvent).class_id == s.ClassId));
        }

        render() {
            let foundActive = false;
            return <div className="live-split-display">
                {this.splits.map(s => {
                    const event = this.findMatchingEvent(s);
                    let active = !!event;
                    if (foundActive)
                        active = false;
                    else if (active)
                        foundActive = true;
                    return <SingleSplit split={s} current={active} completionEvent={event} />
                })}
            </div>;
        }

    }

    class SingleSplit extends React.Component<{ split: ProcessedSplit, current?: boolean, completionEvent?: TPP.Event }, { tick: number }> {
        constructor(props: SingleSplit["props"], context: any) {
            super(props, context);
            this.state = { tick: 0 };
        }
        private running = false;
        private tick() {
            this.setState(s => ({ tick: s.tick + 1 }), () => this.running && requestAnimationFrame(this.tick));
        }
        componentDidMount() {
            if (this.props.current) {
                this.running = true;
                this.tick();
            }
        }
        componentWillUnmount() {
            this.running = false;
        }
        componentWillReceiveProps(props = this.props) {
            if (this.props.current != props.current)
                (this.running = props.current) && this.tick();
        }
        render() {
            //return <div className={`split ${this.props.current && "active"}`}>
                return <img src={this.props.split.Image} alt={this.props.split.Name}/>;

            //</div>;
        }
    }

    interface ProcessedSplit extends SplitEvent {
        Duration: Duration;
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

        toString(scale = Scale.Days) {
            return (this.negative ? "-" : "") + (scale == Scale.Minutes ? (this.days * 24 + this.hours) * 60 + this.minutes : (scale == Scale.Hours ? this.days * 24 + this.hours : (scale == Scale.Weeks ? Math.floor(this.days / 7) + "w " + (this.days % 7) : this.days) + "d " + this.hours) + "h " + this.minutes) + "m" + (this.seconds ? " " + this.seconds + "s" : "");
        }

        static parse(time: string, baseTime?: number) {
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
                    retval.TotalSeconds = (Date.parse(time) / 1000) - baseTime;
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