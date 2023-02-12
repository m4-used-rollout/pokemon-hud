/// <reference path="../events.ts" />

namespace Events {

    type EarnedBadgeAction = { type: "Earned Badge", name: string };
    type KnownActions = EarnedBadgeAction | BlackoutAction | ChallengedTrainerAction | DefeatedTrainerAction | GotItemAction;

    class BadgeTracker extends Tracker<KnownActions> {

        private earnedBadges: TPP.Event[] = [];
        private earnedZCrystals: number[] = [];
        private canEarnBadges: boolean = false;
        private _badges: string[];
        private _frontierSymbols: string[];

        protected get badges() {
            if (this._badges)
                return this._badges;
            switch ((this.config.mainRegion || "").toLowerCase()) {
                case "kanto":
                    return this._badges = ["Boulder", "Cascade", "Thunder", "Rainbow", "Soul", "Marsh", "Volcano", "Earth", "Zephyr", "Hive", "Plain", "Fog", "Mineral", "Storm", "Glacier", "Rising"];
                case "johto":
                    return this._badges = ["Zephyr", "Hive", "Plain", "Fog", "Mineral", "Storm", "Glacier", "Rising", "Boulder", "Cascade", "Thunder", "Rainbow", "Soul", "Marsh", "Volcano", "Earth"];
                case "hoenn":
                    // return this._badges = ["Stone", "Shadow", "Dynamo", "Heat", "Balance", "Feather", "Mind", "Rime"]; // Blazing Emerald
                    return this._badges = ["Stone", "Knuckle", "Dynamo", "Heat", "Balance", "Feather", "Mind", "Rain"];
                case "sinnoh":
                    return this._badges = ["Coal", "Forest", "Cobble", "Fen", "Relic", "Mine", "Icicle", "Beacon"];
                case "unova":
                    if (this.config.runName.indexOf('2') > 0) //Black 2 White 2 (bad check)
                        return this._badges = ["Basic", "Toxic", "Insect", "Bolt", "Quake", "Jet", "Legend", "Wave"];
                    return this._badges = ["Trio", "Basic", "Insect", "Bolt", "Quake", "Jet", "Freeze", "Legend"];
                case "kalos":
                    return this._badges = ["Bug", "Cliff", "Rumble", "Plant", "Voltage", "Fairy", "Psychic", "Iceberg"];
                case "alola":
                    return this._badges = []; //Surge Badge?
                case "galar":
                    if (this.config.runName.indexOf('Shield') >= 0) //(bad check)
                        return this._badges = ["Grass", "Water", "Fire", "Ghost", "Fairy", "Ice", "Dark", "Dragon"];
                    return this._badges = ["Grass", "Water", "Fire", "Fighting", "Fairy", "Rock", "Dark", "Dragon"];
                case "sirius":
                    return this._badges = ["Kaitos", "Scheat", "Alya", "Spica", "Deimos", "Regulus", "Dios", "Syrma"];
                case "tohoak": // Vega
                    return this._badges = ["Elnath", "Gemma", "Hadar", "Arneb", "Phact", "Sarfah", "Prior", "Mirach"];
                case "nihon": // gold97
                    return this._badges = ["Zephyr", "Hive", "Plain", "Fog", "Mineral", "Dusk", "Glacier", "Indigo"];
                case "naljo": // prism
                    return this._badges = ["Pyre", "Nature", "Charm", "Midnight", "Muscle", "Haze", "Raucous", "Naljo", "Marine", "Hail", "Sprout", "Sparky", "Fist", "Psi", "White", "Star", "Hive", "Plain", "Marsh", "Blaze"];
            }
            return [];
        }

        protected get frontierSymbols() {
            if (this._frontierSymbols)
                return this._frontierSymbols;
            switch ((this.config.mainRegion || "").toLowerCase()) {
                case "hoenn":
                    return this._frontierSymbols = ["Ability", "Tactics", "Spirits", "Guts", "Knowledge", "Luck", "Brave"];
                case "johto":
                case "sinnoh":
                    break; //TODO
            }
            return [];
        }

        private isTrainerAGymLeader(action: ChallengedTrainerAction) {
            if (this.config.generation > 1)
                return (action.className || "Leader").toLowerCase() == "leader";
            if (action.classId == 29 && action.id == 3) //Giovanni
                return true;
            return [0, 34, 35, 36, 37, 38, 40, 39].indexOf(action.classId) > 0; //rest of Kanto's gym leaders
        }

        private ParseBadges(badgeBytes: number) {
            const earnedBadges = new Array<number>();
            for (let b = 0; b < this.badges.length; b++)
                if (badgeBytes & (1 << b))
                    earnedBadges.push(b);
            return earnedBadges.map(b => this.badges[b]).filter(b => !!b);
        }

        private ParseFrontier(frontierBytes: number) {
            const earnedSymbols = new Array<string>();
            for (let s = 0; s < this.frontierSymbols.length; s++) {
                if (frontierBytes & (1 << (s * 2)))
                    earnedSymbols.push(`Silver ${this.frontierSymbols[s]} Symbol`);
                if (frontierBytes & (2 << (s * 2)))
                    earnedSymbols.push(`Gold ${this.frontierSymbols[s]} Symbol`);
            }
            return earnedSymbols;
        }

        public Analyzer(newState: TPP.RunStatus, oldState: TPP.RunStatus, dispatch: (action: KnownActions) => void): void {
            if (this.badges.length && newState.badges != oldState.badges) {
                const oldBadges = this.ParseBadges(oldState.badges);
                this.ParseBadges(newState.badges).filter(b => oldBadges.indexOf(b) < 0).forEach(b => dispatch({ type: "Earned Badge", name: `${b} Badge` }));
            }
            if (this.frontierSymbols.length && newState.frontier_symbols != oldState.frontier_symbols) {
                const oldSymbols = this.ParseFrontier(oldState.frontier_symbols);
                this.ParseFrontier(newState.frontier_symbols).filter(s => oldSymbols.indexOf(s) < 0).forEach(name => dispatch({ type: "Earned Badge", name }));
            }
        }
        public Reducer(action: KnownActions & Timestamp): void {
            switch (action.type) {
                case "Blackout":
                    this.canEarnBadges = false;
                    return;
                case "Challenged Trainer":
                    this.canEarnBadges = this.isTrainerAGymLeader(action);
                    console.log("Can earn badge!")
                    return;
                case "Got Item":
                    if (this.config.generation == 7 && action.id >= 807 && action.id <= 824 && this.earnedZCrystals.indexOf(action.id) < 0) { //Earned new Z-Crystal
                        this.earnedZCrystals.push(action.id);
                        this.earnedBadges.push({
                            group: "Badge",
                            name: action.name,
                            time: action.timestamp
                        });
                    }
                    return;
                case "Earned Badge":
                    if (!this.earnedBadges.find(b => b.name == action.name)) { //should be solid
                        // if (this.canEarnBadges) { //if badges can be duplicated, try to make this check work instead
                        console.log("Earned a badge!")
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