namespace Tools.File {
    const fs = require('fs');
    export const Exists = (filename: string) => fs.existsSync(__dirname + '/' + filename) as boolean;
}