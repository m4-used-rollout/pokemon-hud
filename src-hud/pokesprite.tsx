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

class PokeSprite extends React.PureComponent<{ pokemonId?: number; dexNum?: number, shiny?: boolean; form?: number }, {}> {
    render() {
        let pokemonId = this.props.pokemonId || TPP.Server.RomData.GetSpeciesByDexNumber(this.props.dexNum).id;
        let src = TPP.Server.RomData.GetPokemonSprite(pokemonId, this.props.form || 0, this.props.shiny);
        if (src.charAt(0) == "{") {
            src = RenderImageMap(JSON.parse(src));
            if (src) {
                TPP.Server.RomData.CachePokemonSprite(pokemonId, src, this.props.form || 0, this.props.shiny);
            }
        }
        return <img src={src} />
    }
}