/// <reference path="shared.ts" />

class PokeSprite extends React.PureComponent<{ pokemonId: number; shiny?: boolean; }, {}> {

    private renderTiledImage(imgData: Sprites.ImageMap) {
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

    render() {
        let src = TPP.Server.RomData.GetPokemonSprite(this.props.pokemonId, this.props.shiny);
        // if (typeof src !== "string") {
        if (src.charAt(0) == "{") {
            src = this.renderTiledImage(JSON.parse(src));
            if (src) {
                TPP.Server.RomData.CachePokemonSprite(this.props.pokemonId, src, this.props.shiny);
            }
        }
        return <img src={src} />
        //return <img src={`./img/sprites/${config.spriteFolder}/${mon.shiny ? "shiny/" : ""}${mon.gender == "Female" ? "female/" : "" }${mon.is_egg ? 'egg' : (mon.species.national_dex || mon.species.id)}${mon.form ? "-" + mon.form : ""}.gif`} />
    }
}