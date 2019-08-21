/// <reference path="../events.ts" />

namespace Events {

    type EarnedBadgeAction = { type: "Earned Badge", name: string };
    type KnownActions = EarnedBadgeAction | BlackoutAction | ChallengedTrainerAction | DefeatedTrainerAction;

    //const badges = ["Boulder", "Cascade", "Thunder", "Rainbow", "Soul", "Marsh", "Volcano", "Earth"]; //Kanto
    //const badges = ["Zepyhr", "Hive", "Plain", "Fog", "Storm", "Mineral", "Glacier", "Rising", "Boulder", "Cascade", "Thunder", "Rainbow", "Soul", "Marsh", "Volcano", "Earth"]; //Johto
    const badges = ["Stone", "Knuckle", "Dynamo", "Heat", "Balance", "Feather", "Mind", "Rain"]; //Hoenn

    class BadgeTracker extends Tracker<KnownActions> {

        private earnedBadges: TPP.Event[] = [];
        private canEarnBadges: boolean = false;

        private ParseBadges(badgeBytes: number) {
            const earnedBadges = new Array<number>();
            for (let b = 0; b < badges.length; b++)
                if (badgeBytes & (1 << b))
                    earnedBadges.push(b);
            return earnedBadges.map(b => badges[b]).filter(b => !!b);
        }

        public Analyzer(newState: TPP.RunStatus, oldState: TPP.RunStatus, dispatch: (action: KnownActions) => void): void {
            if (newState.badges != oldState.badges) {
                const oldBadges = this.ParseBadges(oldState.badges);
                this.ParseBadges(newState.badges).filter(b => oldBadges.indexOf(b) < 0).forEach(b => dispatch({ type: "Earned Badge", name: b }));
            }
        }
        public Reducer(action: KnownActions & Timestamp): void {
            switch (action.type) {
                case "Blackout":
                    this.canEarnBadges = false;
                    return;
                case "Challenged Trainer":
                    this.canEarnBadges = (action.className || "Leader").toLowerCase() == "leader";
                    return;
                case "Earned Badge":
                    if (this.canEarnBadges) {
                        this.earnedBadges.push({
                            group: "Badge",
                            name: action.name,
                            time: action.timestamp
                        });
                        this.canEarnBadges = false;
                    }
                    return;
            }
        }
        public Reporter(state: TPP.RunStatus): TPP.RunStatus {
            state.events.push(...this.earnedBadges);
            return state;
        }

    }
    RegisterTracker(BadgeTracker);
}