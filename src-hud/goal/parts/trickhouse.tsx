/// <reference path="../goal.tsx" />

namespace Goal {
    export class TrickHouse extends React.Component<{ trickHouse: ("Incomplete" | "Found Scroll" | "Complete")[] }, {}> {
        render() {
            return <div className="trick-house">
                {this.props.trickHouse.map((t, i) => <span key={`trickHouse${i}`} className={t != "Complete" ? "locked" : ""}><img src="img/goals/scroll.png" /></span>)}
            </div>;
        }
    }
}