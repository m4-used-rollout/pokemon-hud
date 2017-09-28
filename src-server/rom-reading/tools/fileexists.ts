namespace Tools.File {
    const fs = require('fs');
    export const Exists = (filename: string) => fs.existsSync(filename) as boolean; //TODO: Learn to check resources/app folder or bin folder
}