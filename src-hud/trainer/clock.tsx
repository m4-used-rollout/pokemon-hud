/// <reference path="../shared.ts" />

class Clock extends React.Component<{ time: TPP.TrainerData["time"] }, { lastUpdated: number, lastTick: number }> {
    constructor(props: Clock["props"], context: any) {
        super(props, context);
        this.state = { lastUpdated: Date.now(), lastTick: Date.now() };
    }
    private padTime(n: number) {
        let str = '0' + (n || 0).toString();
        return str.substring(str.length - 2);
    }
    private dayOfWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    private isMounted = false;
    componentWillMount() {
        this.isMounted = true;
        this.tick();
    }
    componentWillUnmount() {
        this.isMounted = false;
    }
    componentWillReceiveProps(newProps = this.props) {
        if (this.totalSeconds() != this.totalSeconds(newProps.time))
            this.setState({ lastUpdated: Date.now() });
    }
    private tick = () => {
        if (this.isMounted) {
            this.setState({ lastTick: Date.now() });
            requestAnimationFrame(this.tick);
        }
    }
    private totalSeconds(time = this.props.time) {
        if (time) {
            return ((time.d ? this.dayOfWeek.indexOf(time.d) : 0) * 24 * 60 * 60)
                + (time.h * 60 * 60)
                + (time.m * 60)
                + (time.s || 0);
        }
        return 0;
    }
    private day(totalSeconds: number) {
        return this.dayOfWeek[Math.floor(totalSeconds / 24 / 60 / 60) % 7];
    }
    private hour(totalSeconds: number) {
        return ((Math.floor(totalSeconds / 60 / 60) % 12) || 12);
    }
    private minute(totalSeconds: number) {
        return this.padTime(Math.floor(totalSeconds / 60) % 60);
    }
    private second(totalSeconds: number) {
        return this.padTime(totalSeconds % 60);
    }
    private meridian(totalSeconds: number) {
        return ((Math.floor(totalSeconds / 60 / 60) % 24) < 12) ? "AM" : "PM";
    }
    render() {
        const time = this.props.time;
        if (!time)
            return null;
        const totalSeconds = this.totalSeconds() + Math.floor((Date.now() - this.state.lastUpdated) / 1000);
        return <div className="rtc">
            <span className="days">{time.d && this.day(totalSeconds)}</span>
            <span className="hours">{this.hour(totalSeconds)}</span>
            <span className="minutes">{this.minute(totalSeconds)}</span>
            {typeof time.s === "number" && <span className="seconds">{this.second(totalSeconds)}</span>}
            <span className="meridian">{this.meridian(totalSeconds)}</span>
        </div>
    }
}