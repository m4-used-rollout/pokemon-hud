/// <reference path="encounters.tsx" />
/// <reference path="../src-hud/trainersprite.tsx" />
/// <reference path="ksMessages.ts" />


let ksMsgIndex = 0;

const PartyIsFainted = (party: { health: number[] }[]) => !(party || []).some(p => p && p.health && p.health[0] > 0);

class KillScreen extends PersistentComponent<{ party: TPP.PartyData, enemyParty: TPP.EnemyParty }> {
    render() {
        // if (this.props.enemyParty && this.props.enemyParty.some(p=>p && p.species.national_dex == 383))
        //     ksMsgIndex = 0;
        if (this.props.party && this.props.party.filter(p=>!!p).length > 0 && PartyIsFainted(this.props.party))
            return <div className={`encounters error`} key={`kill-screen`} data-message={ksMessages[ksMsgIndex]} />;
        ksMsgIndex = (ksMsgIndex + 1) % ksMessages.length;
        return null;
    }
}