#!/usr/bin/env node

const yargs = require("yargs");

const load = require("../src/load");
const config = require("../src/config");
const connect = require("../src/connect");
const train = require("../src/train");
const sqlite = require("../src/to_sqlite");
const def = require("../src/def");
const remove = require("../src/remove");

const options = yargs
    .scriptName("scrbbl")
    .usage("$0 <command> [options]")
    .command("config", "Configure the Database", (yargs) => {
        // console.log("Configuring the Database");
    }, (argv) => {
        config();
    })
    .command("test", "Try connecting to the Database", (yargs) => {
        // console.log("Connecting to the Database");
    }, (argv) => {
        connect();
    })
    .command("load <source> [-r]", "Load words from source file", (yargs) => {
        yargs.positional("source", {
            describe: "Source file to load in the DB",
            type: "string",
        })
        .option("r", {
            alias: "random",
            describe: "Load words in random order",
            type: "boolean",
            default: false,
        });
    }, (argv) => {
        // console.log("Trying to load from source file " + argv.source);
        load(argv.source, argv.random);
    })
    .command("train [-w wordsize] [-l letters] [-k] [-v]", "Start training", (yargs) => {
        yargs
            .option("w", {
                alias: "wordsize",
                describe: "Train on words of this size",
                type: "string",
                default: "", // by default, train on words of any size
            })
            .option("l", {
                alias: "letters",
                describe: "Letters to include in the words",
                type: "string",
                default: "", // by default, use all letters. If you want to use only a subset, specify them here
            })
            .option("k", {
                alias: "keep",
                describe: "Don't stop training after a word is found",
                type: "boolean",
                default: false,
            })
            .option("v", {
                alias: "verbose",
                describe: "Print the number of words to find",
                type: "boolean",
                default: false,
            });
    }, (argv) => {
        // console.log("Training...");
        train(argv.wordsize, argv.letters, argv.keep, argv.verbose);
    })
    .command("to_sqlite [-v]", "Export the Database to a SQLite file", (yargs) => {
        yargs
            .option("v", {
                alias: "verbose",
                describe: "Print the number of words to find",
                type: "boolean",
                default: false,
            });
    }, (argv) => {
        // console.log("Exporting to SQLite...");
        sqlite(argv.verbose);
    })
    .command("def", "Get definitions for words", (yargs) => {
        // console.log("Getting definitions...");
    }, (argv) => {
        def();
    })
    .command("remove [-v]", "Remove words from the Database", (yargs) => {
        yargs
            .option("v", {
                alias: "verbose",
                describe: "Print the number of words to find",
                type: "boolean",
                default: false,
            });
    }, (argv) => {
        remove(argv.verbose);
    })
    .help().argv;

