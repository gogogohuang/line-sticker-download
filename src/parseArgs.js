const chalk = require("chalk");

const argv = require("yargs")
    .usage("$0 <URL> [sticker package id]")
    .demand(1, chalk.red("Error: URL"))
    .options('sticker package id', {
        alias: 's',
        default: null,
        type: 'string'
    })
    .options('local path', {
        alias: 'p',
        default: null,
        type: 'string'
    })
    .argv;
    

module.exports = {
    url: argv._[0],
    stickerPackageIds: Array.isArray(argv.s)? argv.s: [argv.s],
    path: argv.p
};
