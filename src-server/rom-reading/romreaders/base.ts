/// <reference path="../../pokemon/map.ts" />
/// <reference path="../../pokemon/move.ts" />
/// <reference path="../../pokemon/item.ts" />
/// <reference path="../../pokemon/trainer.ts" />
/// <reference path="../tools/sprites.ts" />
/// <reference path="../../../ref/runstatus.d.ts" />
/// <reference path="../tools/fileexists.ts" />


namespace RomReader {
    const fixCaps = /(\b[a-z])/g;
    const fixWronglyCapped = /(['’][A-Z]|okéMon|onéKa|okéTch)/g;
    const fixWronglyLowercased = /(^[T|H]m|\bTv\b)/g;

    export type EvoMethod = (evoParam: number, speciesId: number) => Pokemon.Evolution;

    export type PokeSprite = { base: string, shiny: string };

    export abstract class RomReaderBase {
        protected pokemon: Pokemon.Species[] = [];
        protected moves: Pokemon.Move[] = [];
        protected items: Pokemon.Item[] = [];
        protected maps: Pokemon.Map[] = [];
        protected pokemonSprites: PokeSprite[][] = [];
        protected trainerSprites: string[] = [];
        protected frameBorders: string[] = [];
        protected trainers: Pokemon.Trainer[] = [];
        protected areas: string[] = [];
        protected abilities: string[] = [];
        protected moveLearns: { [key: number]: Pokemon.MoveLearn[] };
        protected levelCaps = [100];  //some romhacks have these
        protected ballIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 492, 493, 494, 495, 496, 497, 498, 499, 500, 576, 851];
        protected natures = ["Hardy", "Lonely", "Brave", "Adamant", "Naughty", "Bold", "Docile", "Relaxed", "Impish", "Lax", "Timid", "Hasty", "Serious", "Jolly", "Naive", "Modest", "Mild", "Quiet", "Bashful", "Rash", "Calm", "Gentle", "Sassy", "Careful", "Quirky"];
        public types = ["Normal", "Fighting", "Flying", "Poison", "Ground", "Rock", "Bug", "Ghost", "Steel", "Fire", "Water", "Grass", "Electric", "Psychic", "Ice", "Dragon", "Dark", "Fairy"];
        protected expCurves = [Pokemon.ExpCurve.MediumFast, Pokemon.ExpCurve.Erratic, Pokemon.ExpCurve.Fluctuating, Pokemon.ExpCurve.MediumSlow, Pokemon.ExpCurve.Fast, Pokemon.ExpCurve.Slow];
        protected expCurveNames = ["Medium Fast", "Erratic", "Fluctuating", "Medium Slow", "Fast", "Slow"];
        protected characteristics = {
            hp: ["Loves to eat", "Takes plenty of siestas", "Nods off a lot", "Scatters things often", "Likes to relax"],
            atk: ["Proud of its power", "Likes to thrash about", "A little quick tempered", "Likes to fight", "Quick tempered"],
            def: ["Sturdy body", "Capable of taking hits", "Highly persistent", "Good endurance", "Good perseverance"],
            speed: ["Likes to run", "Alert to sounds", "Impetuous and silly", "Somewhat of a clown", "Quick to flee"],
            spatk: ["Highly curious", "Mischievous", "Thoroughly cunning", "Often lost in thought", "Very finicky"],
            spdef: ["Strong willed", "Somewhat vain", "Strongly defiant", "Hates to lose", "Somewhat stubborn"]
        }
        protected formBackMapping: { [key: number]: number };
        protected ZeroPad(int: number, digits: number) {
            const working = new Array<string>(digits).fill('0').join('') + (int || 0).toFixed(0);
            return working.substr(working.length - digits);
        }

        //override this in a concrete class to do time of day encounter filtering
        GetCurrentMapEncounters(map: Pokemon.Map, state: TPP.TrainerData): Pokemon.EncounterSet {
            return this.GetAllMapEncounters(map);
        }

        HasPokemonData() {
            return (this.pokemon || []).length > 0;
        }

        protected textAdjust: Record<string, string> = {};

        ConvertText(text: string | Buffer | number[]): string {
            if (text instanceof Buffer) {
                const decoded = text.toString("ucs2");
                const terminatorLocation = decoded.indexOf('\u0000');
                if (terminatorLocation > 0)
                    return decoded.slice(0, terminatorLocation);
                return this.ConvertText(decoded);
            }
            else if (Array.isArray(text)) {
                return this.ConvertText(Buffer.from(text));
            }
            Object.keys(this.textAdjust).forEach(k => text = (text as string).replace(new RegExp(k, "g"), this.textAdjust[k]));
            return text;
        }

        static FindLocalFile(path: string) {
            const resolve: typeof import("path").resolve = require("path").resolve;
            const root = resolve(path);
            if (require('fs').existsSync(root)) {
                return root;
            }
            return resolve(`./resources/app/${path}`);
        }

        protected shouldFixCaps = true;
        public FixAllCaps(str: string) {
            if (!this.shouldFixCaps)
                return str;
            return str.toLowerCase().replace(fixCaps, c => c.toUpperCase()).replace(fixWronglyCapped, c => c.toLowerCase()).replace(fixWronglyLowercased, c => c.toUpperCase());
        }

        GetForm(pokemon: TPP.Pokemon) {
            return pokemon.form;
        }
        GetSpecies(id: number, form = 0) {
            return this.pokemon.filter(p => p && (p.id === id || (p.baseSpeciesId && p.baseSpeciesId === id && p.formNumber && p.formNumber === form))).reduce((merged, cur) => ({ ...merged, ...cur, id: merged.id || cur.id, dexNumber: merged.dexNumber || cur.dexNumber, name: merged.name || cur.name }), <Pokemon.Species>{}) || <Pokemon.Species>{};
        }
        GetSpeciesById(id: number) {
            return this.pokemon.find(p => p && p.id == id) || <Pokemon.Species>{};
        }
        GetSpeciesByDexNumber(dexNum: number) {
            return this.pokemon.find(p => p && p.dexNumber == dexNum) || <Pokemon.Species>{};
        }
        GetMove(id: number) {
            return this.moves.find(m => m && m.id === id) || <Pokemon.Move>{};
        }
        GetMap(id: number, bank: number = null) {
            return this.maps.find(m => m && id === m.id && (bank === null || bank === m.bank)) || <Pokemon.Map>{};
        }
        GetItem(id: number) {
            return this.items.find(i => i && i.id === id) || <Pokemon.Item>{};
        }
        GetAbility(id: number) {
            return this.abilities[id] || '';
        }
        get HasAbilities() {
            return this.abilities.length > 0;
        }
        GetNextMoveLearn(speciesId: number, form: number, level: number, moveSet: number[]) {
            if (!this.moveLearns) {
                return null;
            }
            let sId = this.GetSpecies(speciesId, form).id;
            let speciesLearns = this.moveLearns[sId];
            if (speciesLearns) {
                return speciesLearns.filter(m => m.level > level && !moveSet.some(ms => m.id == ms)).sort((m1, m2) => m2.level - m1.level).pop();
            }
            return null;
        }
        GetAreaName(id: number) {
            return this.areas[id] || '';
        }
        ItemIsBall(id: number | Pokemon.Item) {
            if ((<Pokemon.Item>id).id) {
                id = (<Pokemon.Item>id).id;
            }
            return this.ballIds.indexOf(<number>id) >= 0;
        }
        GetCurrentLevelCap(badges: number) {
            if (this.levelCaps.length < 2) {
                return this.levelCaps.map(l => l).pop() || 100;
            }
            let badgeCount = 0;
            while (badges) {
                badges &= badges - 1;
                badgeCount++;
            }
            if (badgeCount >= this.levelCaps.length) {
                return this.levelCaps.map(l => l).pop();
            }
            return this.levelCaps[badgeCount];
        }
        GetNature(id: number) {
            return this.natures[id];
        }
        get HasNatures() {
            return this.natures.length > 0;
        }
        GetCharacteristic(stats: Pokemon.Stats, pv: number) {
            //derived from http://bulbapedia.bulbagarden.net/wiki/Characteristic
            if (this.characteristics) {
                let highestStat = Math.max.apply(Math, Object.keys(stats).map(s => stats[s]));
                let winningCategories = Object.keys(stats).filter(s => stats[s] == highestStat);
                let winningCategory: string;
                if (winningCategories.length == 1) {
                    winningCategory = winningCategories.pop();
                }
                else { //resolve tie
                    let categories = Object.keys(this.characteristics);
                    for (let i = pv; i < pv + 6; i++) {
                        if (winningCategories.indexOf(categories[i % 6]) >= 0) {
                            winningCategory = categories[i % 6];
                            break;
                        }
                    }
                }
                if (winningCategory) {
                    return this.characteristics[winningCategory][highestStat % 5];
                }
            }
            return null;
        }
        GetAllMapEncounters(map: Pokemon.Map) {
            //Collapse all encounter sets for a map into a single encounterset
            let encounters: Pokemon.EncounterSet = {};
            if (map && map.encounters) {
                Object.keys(map.encounters).forEach(timeOfDay => Object.keys(map.encounters[timeOfDay])
                    .forEach(group => encounters[group] = Array.prototype.concat.apply(encounters[group] || [], map.encounters[timeOfDay][group] || [])));
            }
            return encounters;
        }
        GetTrainer(id: number, classId: number = null) {
            return this.trainers.filter(t => t && t.id == id && (classId == null || classId == t.classId)).shift() || this.trainers.filter(t => t && t.classId == classId).shift() || <Pokemon.Trainer>{};
        }
        GetPokemonSprite(id: number, form = 0, gender = "", shiny = false, generic = false) {
            return ((this.pokemonSprites[id] || [])[form] || { base: null, shiny: null })[shiny ? "shiny" : "base"] || `./img/sprites/${TPP.Server.getConfig().spriteFolder}/${shiny ? "shiny/" : ""}${id}.gif`;
        }
        GetTrainerSprite(id: number) {
            if (this.trainerSprites[id])
                return this.trainerSprites[id];
            let path = `./img/trainers/${TPP.Server.getConfig().spriteFolder}/${id}.png`;
            if (Tools.File.Exists(path))
                return path;
            console.log(`Can't find ${path}`);
            return "./img/trainers/unknown.png";
        }
        GetItemSprite(id: number) {
            return `./img/items/${TPP.Server.getConfig().spriteFolder}/${id}.png`;
        }
        IsUnknownTrainerMap(id: number, bank?: number) { //Override this on maps like the Battle Frontier where loading the trainer data doesn't work
            return false;
        }
        TrainerIsRival(id: number, classId: number) {
            return false;
        }
        GetFrameBorder(id: number) {
            return this.frameBorders[id % this.frameBorders.length];
        }
        CachePokemonSprite(id: number, data: string, form = 0, shiny = false) {
            ((this.pokemonSprites[id] || [])[form] || { base: '', shiny: '' })[shiny ? "shiny" : "base"] = data;
        }
        CacheTrainerSprite(id: number, data: string) {
            this.trainerSprites[id] = data;
        }
        CacheFrameBorder(id: number, data: string) {
            this.frameBorders[id] = data;
        }
        CheckIfCanSurf(runState: TPP.RunStatus) {
            //check all PC and Party pokemon for anyone who knows Surf (but this code doesn't seem to work)
            return (runState.pc.boxes || []).map(b => b.box_contents).reduce((arr: TPP.Pokemon[], val: TPP.Pokemon[]) => val, runState.party || [])
                .some(p => !!p && p.moves.some(m => !!m && this.surfExp.test(m.name)));
        }
        CheckIfCanFish(runState: TPP.RunStatus) {
            return true;
            //DexNav will filter out any fishing encounters that require a specific rod
            //Override this if there's another restriction.
        }
        CalculateHiddenPowerType(stats: TPP.Stats) {
            const types = ['Fighting', 'Flying', 'Poison', 'Ground', 'Rock', 'Bug', 'Ghost', 'Steel', 'Fire', 'Water', 'Grass', 'Electric', 'Psychic', 'Ice', 'Dragon', 'Dark'];
            return types[Math.floor(((stats.hp % 2) + ((stats.attack % 2) << 1) + ((stats.defense % 2) << 2) + ((stats.speed % 2) << 3) + ((stats.special_attack % 2) << 4) + ((stats.special_defense % 2) << 5)) * 15 / 63)];
        }
        CalculateHiddenPowerPower(stats: TPP.Stats) {
            return Math.floor((((stats.hp >> 1) % 2) + (((stats.attack >> 1) % 2) << 1) + (((stats.defense >> 1) % 2) << 2) + (((stats.speed >> 1) % 2) << 3) + (((stats.special_attack >> 1) % 2) << 4) + (((stats.special_defense >> 1) % 2) << 5)) * 40 / 63) + 30;
        }
        CollapseSeenForms(seen: number[]) {
            return seen;
        }
        MapCaughtBallId(ballId: number) {
            if (ballId > this.ballIds.length)
                return ballId;
            return this.ballIds[ballId - 1];
        }
        ShinyThreshold() {
            return 8;
        }
        GetType(typeId: number) {
            return this.types[typeId] || typeId.toString();
        }
        protected CombineDuplicateEncounters(mons: Pokemon.EncounterMon[]) {
            return mons && mons.filter(m => m && m.species && m.species.name).filter(thisMon => {
                let firstMon = mons.filter(m => m.species.name == thisMon.species.name && m.form == thisMon.form && (m.requiredItem || { id: 0 }).id == (thisMon.requiredItem || { id: 0 }).id && m.categoryIcon == thisMon.categoryIcon).shift();
                if (firstMon != thisMon) {
                    firstMon.rate += thisMon.rate;
                    return false;
                }
                return true;
            });//.sort((e1, e2) => ((e1.requiredItem || { id: 0 }).id - (e2.requiredItem || { id: 0 }).id) || (e2.rate - e1.rate));
        }

        ReadArray(romData: Buffer, startOffset: number, strideBytes: number, length?: number, lengthIsMax?: boolean, endFunc?: (data: Buffer) => boolean): Buffer[];
        ReadArray(romData: Buffer, startOffset: number, strideBytes: number, length?: number, lengthIsMax?: boolean, endValue?: number): Buffer[];
        ReadArray(romData: Buffer, startOffset: number, strideBytes: number, length: number = 0, lengthIsMax = false, endValue?: (((data: Buffer) => boolean) | number)): Buffer[] {
            let choppedData = new Array<Buffer>();
            const endFunc = typeof endValue === "undefined"
                ? ((chunk: Buffer) => chunk[0] == 0xFF)
                : typeof endValue === "number"
                    ? ((chunk: Buffer) => chunk[0] == endValue)
                    : endValue;
            for (let i = 0; (i < length || length <= 0) && (startOffset + (strideBytes * (i + 1))) <= romData.length; i++) {
                let chunk = romData.slice(startOffset + (strideBytes * i), startOffset + (strideBytes * (i + 1)));
                if ((length <= 0 || lengthIsMax) && endFunc(chunk)) {
                    return choppedData;
                }
                choppedData.push(chunk);
            }
            return choppedData;
        }

        GetSetFlags(flagBytes: Buffer, flagCount = flagBytes.length * 8, offset = 0) {
            const length = Math.floor((flagCount + 7) / 8);
            const setFlags = new Array<number>();
            for (let i = 0; i < length; i++)
                for (let b = 0; b < 8; b++)
                    if (flagBytes[i + offset] & (1 << b))
                        setFlags.push(i * 8 + b + 1);
            return setFlags.filter(f => f <= flagCount);
        }

        CountSetBytes(bytes: number) {
            return bytes.toString(2).split('').filter(b => b == "1").length;
        }

        CalculateGender(pokemon: TPP.Pokemon) {
            if (pokemon.species.gender_ratio && typeof (pokemon.gender) !== "string") {
                if (pokemon.species.gender_ratio == 255) {
                    pokemon.gender = '';
                }
                else if (pokemon.species.gender_ratio == 254) {
                    pokemon.gender = "Female";
                }
                else if (pokemon.species.gender_ratio == 0) {
                    pokemon.gender = "Male";
                }
                else { //Generation 3+
                    pokemon.gender = (pokemon.personality_value % 256) > pokemon.species.gender_ratio ? "Male" : "Female";
                }
            }
        }

        CalculateShiny(pokemon: TPP.Pokemon, threshold = this.ShinyThreshold()) {
            if (typeof pokemon.shiny !== "boolean" && pokemon.original_trainer) {
                pokemon.shiny_value = ((pokemon.original_trainer.id ^ pokemon.original_trainer.secret) ^ (Math.floor(pokemon.personality_value / 65536) ^ (pokemon.personality_value % 65536)))
                pokemon.shiny = pokemon.shiny_value < threshold;
            }
        }

        CalculateUnownForm(pokemon: { species?: TPP.PokemonSpecies, form?: number, personality_value?: number }) {
            if (pokemon.species && pokemon.species.national_dex == 201 && pokemon.personality_value)
                pokemon.form = pokemon.form ||
                    ((((pokemon.personality_value >>> 24) & 3) << 6)
                        | (((pokemon.personality_value >>> 16) & 3) << 4)
                        | (((pokemon.personality_value >>> 8) & 3) << 2)
                        | (pokemon.personality_value & 3)
                    ) % 28;
        }

        protected evolutionMethods: EvoMethod[];
        protected ParseEvolution(method: number, evoParam: number, speciesId: number): Pokemon.Evolution {
            if (!method)
                return null;
            if (this.evolutionMethods[method])
                return this.evolutionMethods[method](evoParam, speciesId);
            return { speciesId, specialCondition: `Unknown evolution method: ${method} (${evoParam})` };
        }

        protected EvolutionMethod: Record<string, EvoMethod> = {
            Level: (evoParam: number, speciesId: number) => ({ speciesId, level: evoParam }),
            LevelAttackHigher: (evoParam: number, speciesId: number) => ({ speciesId, level: evoParam || undefined, specialCondition: "Attack > Defense" }),
            LevelAtkDefEqual: (evoParam: number, speciesId: number) => ({ speciesId, level: evoParam || undefined, specialCondition: "Attack = Defense" }),
            LevelDefenseHigher: (evoParam: number, speciesId: number) => ({ speciesId, level: evoParam || undefined, specialCondition: "Attack < Defense" }),
            LevelLowPV: (evoParam: number, speciesId: number) => ({ speciesId, level: evoParam || undefined, specialCondition: "Low PV" }),
            LevelHighPV: (evoParam: number, speciesId: number) => ({ speciesId, level: evoParam || undefined, specialCondition: "High PV" }),
            LevelSpawnPokemon: (evoParam: number, speciesId: number) => ({ speciesId, level: evoParam || undefined, specialCondition: "Spawn Additional Pokemon" }),
            LevelIsSpawned: (evoParam: number, speciesId: number) => ({ speciesId, level: evoParam || undefined, specialCondition: "Was Spawned By Other Evo" }),
            LevelHighBeauty: (evoParam: number, speciesId: number) => ({ speciesId, level: evoParam || undefined, specialCondition: "High Beauty" }),
            LevelItemDay: (evoParam: number, speciesId: number) => ({ speciesId, item: this.GetItem(evoParam), timeOfDay: "MornDay", specialCondition: "Level While Holding" }),
            LevelItemNight: (evoParam: number, speciesId: number) => ({ speciesId, item: this.GetItem(evoParam), timeOfDay: "Night", specialCondition: "Level While Holding" }),
            LevelDay: (evoParam: number, speciesId: number) => ({ speciesId, level: evoParam || undefined, timeOfDay: "MornDay" }),
            LevelDusk: (evoParam: number, speciesId: number) => ({ speciesId, level: evoParam || undefined, timeOfDay: "Dusk" }),
            LevelNight: (evoParam: number, speciesId: number) => ({ speciesId, level: evoParam || undefined, timeOfDay: "Night" }),
            LevelWithMove: (evoParam: number, speciesId: number) => ({ speciesId, move: this.GetMove(evoParam) }),
            LevelWithMoveType: (evoParam: number, speciesId: number) => ({ speciesId, moveType: this.GetType(evoParam) }),
            LevelWithOtherSpecies: (evoParam: number, speciesId: number) => ({ speciesId, otherSpeciesId: evoParam || undefined, specialCondition: `Level With ${(this.GetSpecies(evoParam) || { name: "???" }).name} In Party` }),
            LevelWithDarkType: (evoParam: number, speciesId: number) => ({ speciesId, level: evoParam || undefined, specialCondition: `Level With Dark Type In Party` }),
            LevelMale: (evoParam: number, speciesId: number) => ({ speciesId, level: evoParam, specialCondition: "Male Only" }),
            LevelFemale: (evoParam: number, speciesId: number) => ({ speciesId, level: evoParam, specialCondition: "Female Only" }),
            LevelElectifiedArea: (evoParam: number, speciesId: number) => ({ speciesId, level: evoParam || undefined, specialCondition: "Electrified Area" }),
            LevelMossRock: (evoParam: number, speciesId: number) => ({ speciesId, level: evoParam || undefined, specialCondition: "Moss Rock" }),
            LevelIcyRock: (evoParam: number, speciesId: number) => ({ speciesId, level: evoParam || undefined, specialCondition: "Icy Rock" }),
            LevelInRain: (evoParam: number, speciesId: number) => ({ speciesId, level: evoParam || undefined, specialCondition: "In Rain" }),
            LevelSpecificArea: (evoParam: number, speciesId: number) => ({ speciesId, specialCondition: `Level At ${this.GetAreaName(evoParam)}` }),
            LevelSpecificMap: (evoParam: number, speciesId: number) => ({ speciesId, specialCondition: `Level At ${this.GetMap(evoParam).name}` }),
            LevelNatureAmped: (evoParam: number, speciesId: number) => ({ speciesId, level: evoParam || undefined, natures: ["Hardy", "Brave", "Adamant", "Naughty", "Docile", "Impish", "Lax", "Hasty", "Jolly", "Naive", "Rash", "Sassy", "Quirky"], specialCondition: "With Amped Nature" }),
            LevelNatureLowKey: (evoParam: number, speciesId: number) => ({ speciesId, level: evoParam || undefined, natures: ["Lonely", "Bold", "Relaxed", "Timid", "Serious", "Modest", "Mild", "Quiet", "Bashful", "Calm", "Gentle", "Careful"], specialCondition: "With Low Key Nature" }),
            Trade: (evoParam: number, speciesId: number) => ({ speciesId, isTrade: true }),
            TradeItem: (evoParam: number, speciesId: number) => ({ speciesId, isTrade: true, item: this.GetItem(evoParam) }),
            TradeForOtherSpecies: (evoParam: number, speciesId: number) => ({ speciesId, isTrade: true, otherSpeciesId: evoParam, specialCondition: `Trade For ${(this.GetSpecies(evoParam) || { name: "???" }).name}` }),
            Stone: (evoParam: number, speciesId: number) => ({ speciesId, item: this.GetItem(evoParam) }),
            StoneMale: (evoParam: number, speciesId: number) => ({ speciesId, item: this.GetItem(evoParam), specialCondition: "Male Only" }),
            StoneFemale: (evoParam: number, speciesId: number) => ({ speciesId, item: this.GetItem(evoParam), specialCondition: "Female Only" }),
            Happiness: (evoParam: number, speciesId: number) => ({ speciesId, happiness: evoParam || 220 }),
            HappinessDay: (evoParam: number, speciesId: number) => ({ speciesId, happiness: evoParam || 220, timeOfDay: "MornDay" }),
            HappinessNight: (evoParam: number, speciesId: number) => ({ speciesId, happiness: evoParam || 220, timeOfDay: "Night" }),
            CriticalHits: (evoParam: number, speciesId: number) => ({ speciesId, specialCondition: `Hit ${evoParam || 3} Crits In One Battle` }),
            RockArch: (evoParam: number, speciesId: number) => ({ speciesId, specialCondition: `Rock Arch After Taking ${evoParam || 49}HP Of Damage` }),
            ScrollOfDarkness: (evoParam: number, speciesId: number) => ({ speciesId, specialCondition: `Use Scroll Of Darkness` }),
            ScrollOfWaters: (evoParam: number, speciesId: number) => ({ speciesId, specialCondition: `Use Scroll Of Waters` }),
            MegaEvo: (evoParam: number, speciesId: number) => ({ speciesId, item: evoParam ? this.GetItem(evoParam) : undefined, specialCondition: evoParam ? "Mega Evolve With" : "Mega Evolution" }),
            MegaEvoMove: (evoParam: number, speciesId: number) => ({ speciesId, move: evoParam ? this.GetMove(evoParam) : undefined, specialCondition: evoParam ? "Mega Evolve Knowing" : "Mega Evolution" }),
            MegaEvoPrimal: (evoParam: number, speciesId: number) => ({ speciesId, specialCondition: "Primal Reversion" })
        }

        private surfExp = /^surf$/i;
    }

}