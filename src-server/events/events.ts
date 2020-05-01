/// <reference path="../../ref/runstatus.d.ts" />
/// <reference path="../../ref/config.d.ts" />

namespace Events {

    const fs = require('fs') as typeof import('fs');

    export interface Action {
        type: string;
    }

    export interface Timestamp {
        timestamp: string;
    }

    export abstract class Tracker<T extends Action = Action> {
        constructor(protected config: Config) { }

        /**
         * Dispatches any actions based on the contents of or change in state. DO NOT mutate any state in here.
         * @param newState The new run state
         * @param oldState The previous run state
         * @param dispatch Function to dispatch your actions from. They will be given a timestamp when you dispatch them
         */
        public abstract Analyzer(newState: TPP.RunStatus, oldState: TPP.RunStatus, dispatch: (action: T) => void): void;

        /**
         * Processes all actions dispatched anywhere in the events system. Mutate your store's state in here.
         * @param action Any action dispatched through the events system.
         */
        public abstract Reducer(action: T & Timestamp): void;

        /**
         * Digest the state of your store for inclusion in the run state.
         * @param state The augmented run state.
         */
        public abstract Reporter(state: TPP.RunStatus): TPP.RunStatus;
    }

    const Trackers = new Array<new (config: Config) => Tracker>();

    export function RegisterTracker(trackerClass: new (config: Config) => Tracker) {
        if (Trackers.indexOf(trackerClass) < 0)
            Trackers.push(trackerClass);
    }

    export class RunEvents {

        private currentState: TPP.RunStatus;

        private trackers: Tracker[];

        private ready = false;
        private saveStream: import('fs').WriteStream;
        private savePath: string;

        constructor(private config: Config) {
            this.savePath = config.eventBackupFolder || "./";
            fs.promises.mkdir(this.savePath, { recursive: true }).catch(err => console.error(`Couldn't create Events folder: ${err}`));
            //setTimeout(() => this.Init(), 0); //wait for state to initialize
            process.on("beforeExit", () => this.saveStream && this.saveStream.end());
        }

        public Init() {
            this.trackers = Trackers.map(s => new s(this.config));
            this.ready = true;
        }

        public get EventsFileName() {
            const state = this.currentState || { name: undefined, id: undefined };
            return `${this.savePath}/${this.config.runName}-${state.name}-${state.id}.events`;
        }

        private OpenFile() {
            if (this.saveStream)
                this.saveStream.end();
            console.log(`Opened Events file ${this.EventsFileName} for writing...`);
            this.saveStream = fs.createWriteStream(this.EventsFileName, {
                encoding: "utf8",
                flags: "a"
            });
        }

        public Analyze(newState: TPP.RunStatus) {
            if (newState.id != (this.currentState || { id: undefined }).id || newState.name != (this.currentState || { name: undefined }).name) {
                this.currentState = JSON.parse(JSON.stringify(newState));
                this.Replay();
            }
            if (this.ready) {
                this.trackers.forEach(t => {
                    try {
                        t.Analyzer(newState, this.currentState || newState, a => this.Dispatch(a));
                    } catch (e) {
                        console.error(e);
                    }
                });
                this.currentState = JSON.parse(JSON.stringify(newState));
            }
            newState.events = /*newState.events ||*/[];
            (this.trackers || []).forEach(t => newState = Object.assign(newState, t.Reporter(newState)));
            newState.events = this.DedupeEvents(newState.events);
            return newState;
        }

        private DedupeEvents(events: TPP.Event[]) {
            return events
                .sort((e1, e2) => Date.parse(e1.time) - Date.parse(e2.time))
                .filter((e, i, arr) => arr.findIndex(e2 => e2.group == e.group && e2.name == e.name && e2.time == e.time) == i);
        }

        private Replay() {
            this.trackers = [];
            this.Init();
            if (fs.existsSync(this.EventsFileName))
                fs.readFileSync(this.EventsFileName).toString('utf8').split('\n').filter(a => a.trim().length).forEach(a => this.DispatchInternal(JSON.parse(a)));
            this.OpenFile();
        }

        public Dispatch(action: Action) {
            const dispatchedAction = Object.assign({ timestamp: new Date().toISOString() } as Timestamp, action);
            this.SaveAction(dispatchedAction);
            this.DispatchInternal(dispatchedAction);
        }

        private SaveAction(action: Action & Timestamp) {
            if (!this.saveStream)
                this.OpenFile();
            try {
                if (!this.saveStream.write(JSON.stringify(action) + "\n"))
                    this.saveStream.once("drain", () => this.SaveAction(action));
            }
            catch {
                console.error(`Could not write to Events file ${this.EventsFileName}`);
                delete this.saveStream;
                this.SaveAction(action);
            }
        }

        private DispatchInternal(action: Action & Timestamp) {
            //console.log(JSON.stringify(action));
            this.trackers.forEach(s => s.Reducer(action));
        }

    }

}