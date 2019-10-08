/// <reference path="../events.ts" />

namespace Events {

    export type GotItemAction = { type: "Got Item", id: number, name: string, quantity: number, pocket?: string, cost: number };
    type UsedSoldTossedItemAction = { type: "Used/Sold/Tossed Item", id: number, name: string, quantity: number, pocket?: string, cost: number, inBattle: boolean; };
    type MoneyGainedAction = { type: "Money Gained", amount: number };
    type MoneySpentAction = { type: "Money Spent", amount: number };
    type KnownActions = GotItemAction | UsedSoldTossedItemAction | MoneyGainedAction | MoneySpentAction | BlackoutAction;

    type InventoryItem = {
        id: number;
        name: string;
        pocket?: string;
        bought: number;
        free: number;
        sold: number;
        usedInBattle: number;
        usedOutOfBattle: number;
    }

    const AllItems = (state: TPP.RunStatus) => []
        .concat(...(Object.keys(state.items || {}).map(k => (state.items[k] as TPP.Item[]).map(i => Object.assign({ pocket: k }, i))) as (TPP.Item & { pocket: string })[][]))
        .concat(...AllMons(state).filter(m => m.held_item && m.held_item.id).map(m => Object.assign({}, m.held_item))) as (TPP.Item & { pocket?: string })[];

    const ItemTotals = (state: TPP.RunStatus) => {
        const items: { [key: number]: (TPP.Item & { pocket?: string }) } = {};
        AllItems(state).forEach(i => {
            i.count = i.count || 1;
            if (items[i.id]) {
                items[i.id].pocket = items[i.id].pocket || i.pocket;
                items[i.id].count += i.count;
            }
            else
                items[i.id] = i;
        });
        return items;
    }

    class InventoryTracker extends Tracker<KnownActions> {

        private justBlackedOut = false;
        private inventory: { [key: number]: InventoryItem } = {};
        private keyItems: { [key: string]: string } = {};
        private moneyGained = 0;
        private moneySpent = 0;
        private moneyLost = 0;

        public Analyzer(newState: TPP.RunStatus, oldState: TPP.RunStatus, dispatch: (action: KnownActions) => void): void {
            if (!this.moneyGained)
                dispatch({ type: "Money Gained", amount: newState.money });
            else if (newState.money > oldState.money)
                dispatch({ type: "Money Gained", amount: newState.money - oldState.money });
            else if (newState.money < oldState.money)
                dispatch({ type: "Money Spent", amount: oldState.money - newState.money });
            const newItems = ItemTotals(newState);
            const oldItems = ItemTotals(oldState);
            [...Object.keys(newItems), ...Object.keys(oldItems).filter(k => !newItems[k])]
                .forEach(k => {
                    newItems[k] = newItems[k] || { count: 0 };
                    oldItems[k] = oldItems[k] || { count: 0 };
                    if (!this.inventory[k])
                        dispatch({ type: "Got Item", id: newItems[k].id, name: newItems[k].name, quantity: newItems[k].count, cost: oldState.money - newState.money, pocket: newItems[k].pocket });
                    else if (newItems[k].count > oldItems[k].count)
                        dispatch({ type: "Got Item", id: newItems[k].id, name: newItems[k].name, quantity: newItems[k].count - oldItems[k].count, cost: oldState.money - newState.money, pocket: newItems[k].pocket });
                    else if (newItems[k].count < oldItems[k].count)
                        dispatch({ type: "Used/Sold/Tossed Item", id: oldItems[k].id, name: oldItems[k].name, quantity: oldItems[k].count - newItems[k].count, cost: newState.money - oldState.money, inBattle: newState.in_battle, pocket: oldItems[k].pocket });
                });
        }
        public Reducer(action: KnownActions & Timestamp): void {
            const { id, name, quantity, cost, pocket, inBattle } = action as UsedSoldTossedItemAction;
            const { amount } = action as MoneyGainedAction;
            const newInv: InventoryItem = { id, name, pocket, bought: 0, free: 0, sold: 0, usedInBattle: 0, usedOutOfBattle: 0 };
            switch (action.type) {
                case "Blackout":
                    this.justBlackedOut = true;
                    return;
                case "Money Gained":
                    this.moneyGained += amount;
                    return;
                case "Money Spent":
                    if (this.justBlackedOut)
                        this.moneyLost += amount;
                    else
                        this.moneySpent += amount;
                    this.justBlackedOut = false;
                    return;
                case "Got Item":
                    this.inventory[id] = this.inventory[id] || newInv;
                    if (cost)
                        this.inventory[id].bought += quantity;
                    else
                        this.inventory[id].free += quantity;
                    if (action.id >= 259) { //Gen 3 Mach Bike
                        this.keyItems[action.name] = this.keyItems[action.name] || action.timestamp;
                    }
                case "Used/Sold/Tossed Item":
                    this.inventory[id] = this.inventory[id] || newInv;
                    if (cost)
                        this.inventory[id].sold += quantity;
                    else if (inBattle)
                        this.inventory[id].usedInBattle += quantity;
                    else
                        this.inventory[id].usedOutOfBattle += quantity;
            }
        }
        public Reporter(state: TPP.RunStatus): TPP.RunStatus {
            state.game_stats = state.game_stats || {};
            const inv = Object.keys(this.inventory).map(k => this.inventory[k]) as InventoryItem[];
            const ballIds = inv.filter(i => i.pocket == "balls").map(i => i.id).filter((p, i, arr) => p && arr.indexOf(p) == i);
            state.game_stats["Thrown Balls (total)"] = ballIds.reduce((s, b) => s + this.inventory[b].usedInBattle, 0);
            ballIds.forEach(ballId => state.game_stats[`Thrown ${this.inventory[ballId].name}s`] = this.inventory[ballId].usedInBattle);
            //state.game_stats["Total Money Paid to Trainers"] = this.moneyLost;

            Object.keys(this.keyItems).forEach(k => state.events.push({
                group: "Key Items",
                name: k,
                time: this.keyItems[k]
            }))
            return state;
        }

    }

    RegisterTracker(InventoryTracker);
}