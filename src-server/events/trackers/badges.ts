/// <reference path="../events.ts" />

namespace Events {

    type EarnedBadgeAction = { type: "Earned Badge", name: string };
    type KnownActions = EarnedBadgeAction | BlackoutAction | ChallengedTrainerAction | DefeatedTrainerAction | GotItemAction;

    //const badges = ["Boulder", "Cascade", "Thunder", "Rainbow", "Soul", "Marsh", "Volcano", "Earth"]; //Kanto
    //const badges = ["Zepyhr", "Hive", "Plain", "Fog", "Storm", "Mineral", "Glacier", "Rising", "Boulder", "Cascade", "Thunder", "Rainbow", "Soul", "Marsh", "Volcano", "Earth"]; //Johto
    //const badges = ["Stone", "Knuckle", "Dynamo", "Heat", "Balance", "Feather", "Mind", "Rain"]; //Hoenn
    const badges = []; //Alola

    class BadgeTracker extends Tracker<KnownActions> {

        private earnedBadges: TPP.Event[] = [];
        private earnedZCrystals: number[] = [];
        private canEarnBadges: boolean = false;

        private ParseBadges(badgeBytes: number) {
            const earnedBadges = new Array<number>();
            for (let b = 0; b < badges.length; b++)
                if (badgeBytes & (1 << b))
                    earnedBadges.push(b);
            return earnedBadges.map(b => badges[b]).filter(b => !!b);
        }

        public Analyzer(newState: TPP.RunStatus, oldState: TPP.RunStatus, dispatch: (action: KnownActions) => void): void {
            if (badges.length && newState.badges != oldState.badges) {
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
                case "Got Item":
                    if (action.id >= 807 && action.id <= 824 && this.earnedZCrystals.indexOf(action.id) < 0) { //Earned new Z-Crystal
                        this.earnedZCrystals.push(action.id);
                        this.earnedBadges.push({
                            group: "Badge",
                            name: action.name,
                            time: action.timestamp
                        });
                    }
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