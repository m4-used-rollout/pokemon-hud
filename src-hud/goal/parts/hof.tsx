/// <reference path="../goal.tsx" />

namespace Goal {
    export class HoFEntries extends React.Component<{totalEntries: number, currentEntries:number}, {}> {
        render() {
            return <div className="hof-entries">
                {new Array(Math.max(this.props.totalEntries, this.props.currentEntries)).fill(0).map((a,i)=><span key={`hofEntry${i}`} className={i + 1 > this.props.currentEntries ? "locked" : ""}><img src="img/goals/hofribbon.png" /></span>) }
            </div>;
        }
    }
}