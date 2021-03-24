/// <reference path="../../ref/emotes.d.ts" />

namespace EmotesDisplay {
    export class EmotesDisplay extends React.Component<{ emotes: TrendingEmote[] }> {
        render() {
            return <div className="trending-emotes-display">
                {this.props.emotes.slice(0, 10).map(e => <SingleEmote key={e.id} emote={e} />)}
            </div>;
        }

    }

    class SingleEmote extends React.Component<{ emote: TrendingEmote }> {
        private get emoteSrc() {
            return `https://static-cdn.jtvnw.net/emoticons/v1/${this.props.emote.id}/3.0`
        }
        render() {
            const emote = this.props.emote;
            return <div className={`emote ${emote.locked ? "locked" : ""}`}>
                <div className="name">{emote.name}</div>
                <div className="emote-img">
                    <img src={this.emoteSrc} alt={emote.name} />
                </div>
                <div className="weight">{(emote.weight * 100).toFixed(0)}%</div>
            </div>;
        }
    }
}