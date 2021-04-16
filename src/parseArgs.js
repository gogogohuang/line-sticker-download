const chalk = require("chalk");

const argv = require("yargs")
    .usage("$0 <URL> [folder]")
    .demand(1, chalk.red("Error: URL"))
    .argv;

module.exports = {
    url: argv._[0],
    folder: argv._[1],
};
