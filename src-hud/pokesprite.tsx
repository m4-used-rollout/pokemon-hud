/// <reference path="shared.ts" />

function RenderImageMap(imgData: Sprites.ImageMap) {
    if (!imgData || !imgData.pixels) {
        return;
    }
    imgData.palette = imgData.palette || ['white', '#AAAAAA', '#666666', 'black'];
    let canvas = document.createElement('canvas'), draw = canvas.getContext("2d");
    canvas.width = imgData.pixels.length;
    canvas.height = (imgData.pixels[0] || []).length;
    imgData.pixels.forEach((col, x) => col.forEach((pal, y) => {
        let color = imgData.palette[pal];
        if (color) {
            draw.fillStyle = color;
            draw.fillRect(x, y, 1, 1);
        }
    }));
    return canvas.toDataURL();
}

type PokeSpriteProps = {
    pokemonId?: number;
    dexNum?: number;
    gender?: string;
    shiny?: boolean;
    form?: number;
    generic?: boolean;
    className?: string;
};

class PokeSprite extends React.PureComponent<PokeSpriteProps, {}> {
    render() {
        let pokemonId = this.props.dexNum || TPP.Server.RomData.GetSpecies(this.props.pokemonId).dexNumber;
        if (config.generation == 1)
            pokemonId = this.props.pokemonId || TPP.Server.RomData.GetSpeciesByDexNumber(this.props.dexNum).id;
        let src = TPP.Server.RomData.GetPokemonSprite(pokemonId, this.props.form || 0, this.props.gender, this.props.shiny, this.props.generic);
        if (src.charAt(0) == "{") {
            src = RenderImageMap(JSON.parse(src));
            if (src) {
                TPP.Server.RomData.CachePokemonSprite(pokemonId, src, this.props.form || 0, this.props.shiny);
            }
        }
        return <img className={this.props.className} src={src} />
    }
}