// import chalk and fs
const colors = require("colors");
const fs = require("fs");

// import pg
const pg = require("pg");

// variables
let withDefinition = false;
const LETTER_PROBABILITIES = {
    "E": 15/102,
    "A": 9/102,
    "I": 8/102,
    "N": 6/102,
    "O": 6/102,
    "R": 6/102,
    "S": 6/102,
    "T": 6/102,
    "U": 6/102,
    "L": 5/102,
    "D": 3/102,
    "M": 3/102,
    "G": 2/102,
    "B": 2/102,
    "C": 2/102,
    "P": 2/102,
    "F": 1/102,
    "H": 1/102,
    "V": 1/102,
    "J": 1/102,
    "Q": 1/102,
    "K": 1/102,
    "W": 1/102,
    "X": 1/102,
    "Y": 1/102,
    "Z": 1/102
};

const LETTER_SCORES = {
    "A": 1,
    "B": 3,
    "C": 3,
    "D": 2,
    "E": 1,
    "F": 4,
    "G": 2,
    "H": 4,
    "I": 1,
    "J": 8,
    "K": 10,
    "L": 1,
    "M": 2,
    "N": 1,
    "O": 1,
    "P": 3,
    "Q": 8,
    "R": 1,
    "S": 1,
    "T": 1,
    "U": 1,
    "V": 4,
    "W": 10,
    "X": 10,
    "Y": 10,
    "Z": 10
};

let stop = false;
process.on("SIGINT", () => {
    stop = true;
});

const load = (source, random) => {
    console.log("Trying to load from source file " + source.blue + (random ? " in random order" : ""));

    // Check if config file exists
    if (!fs.existsSync("config.json")) {
        console.log("Please configure the Database first!".red);
        console.log("Run".red + " scrbbl config ".blue + "to do so!".red);
        return;
    }

    // Try to connect to the database
    const config = JSON.parse(fs.readFileSync("config.json"));
    const client = new pg.Client(config);
    client
        .connect()
        .then(() => {
            console.log(
                "Succesfully connected to ".green +
                    config.database.blue +
                    " on ".green +
                    config.host.blue
            );

            // Check if source file exists
            if (!fs.existsSync(source)) {
                console.log("Source file does not exist!".red);
                return;
            } else {
                console.log("Source file exists!".green);

                // check if source is not a directory
                if (fs.lstatSync(source).isDirectory()) {
                    console.log("Source file is a directory!".red);
                    client.end();
                    return;
                } else {
                    // check if file is readable
                    fs.access(source, fs.constants.R_OK, async (err) => {
                        if (err) {
                            console.log("Source file is not readable!".red);
                            client.end();
                            return;
                        } else {
                            // read file
                            const data = fs.readFileSync(source, "utf8");
                            // split data into array
                            const words = data.split("\n");
                            // remove empty lines
                            const filteredWords = words.filter((word) => {
                                return word !== "";
                            });

                            // shuffle array if random is true
                            if (random) {
                                console.log("Shuffling words".green);
                                for (let i = filteredWords.length - 1; i > 0; i--) {
                                    const j = Math.floor(Math.random() * (i + 1));
                                    [filteredWords[i], filteredWords[j]] = [
                                        filteredWords[j],
                                        filteredWords[i],
                                    ];
                                }
                            }

                            // insert words into database
                            let [susccessfulCount, errorCount] = await addWords(client, filteredWords);
                            console.log(
                                "Successfully inserted " +
                                    susccessfulCount +
                                    " words into the Database".green
                            );
                            console.log(
                                "Failed to insert " +
                                    errorCount +
                                    " words into the Database".red
                            );
                            client.end();
                        }
                    });
                }
            }
        })
        .catch((err) => {
            if (err.code === "28P01") {
                console.log("Wrong password".red);
                console.log(
                    "Please configure the Database again with " +
                        "scrbbl config".blue
                );
            } else {
                console.log("Error connecting to Database".red);
                console.log(err);
            }
        });
};

const addWords = async (client, words) => {
    let successfulCount = 0;
    let errorCount = 0;

    console.log("Stop at every moment by pressing Ctrl+C".yellow);

    // check if words relation exists
    let res = await client.query("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'words')");
    if (!res.rows[0].exists) {
        // if not, create it
        console.log("Creating words relation".green);

        // words are unique, so we can use them as primary key.
        // the properties are :
        // - word : the word (primary key)
        // - length : the length of the word
        // - sorted : the word sorted alphabetically
        // - probability : the probability of the word in game (facultative)
        // - score : the score of the word (facultative)
        // - definition : the definition of the word (facultative)
        // - last_played : the last time the word was played

        await client.query("CREATE TABLE words (word VARCHAR(255) PRIMARY KEY, length INT NOT NULL, sorted VARCHAR(255) NOT NULL, probability REAL, score INT, definition TEXT, last_played TIMESTAMP)");
    }

    let count = 0;
    let total = words.length;

    for (let word of words) {
        if (stop) {
            process.stdout.write("\n");
            console.log("Stopped by user".yellow);
            return [successfulCount, errorCount];
        }

        count ++;

        word = word.toUpperCase();
        // replace letter with accent by letter without accent
        word = word.replace(/À|Â|Ä/g, "A");
        word = word.replace(/È|É|Ê|Ë/g, "E");
        word = word.replace(/Î|Ï/g, "I");
        word = word.replace(/Ô|Ö/g, "O");
        word = word.replace(/Ù|Û|Ü/g, "U");
        word = word.replace(/Ç/g, "C");
        word = word.replace(/Œ/g, "OE");
        word = word.replace(/Æ/g, "AE");

        if (withDefinition) {
            // TODO: fetch definition
        }

        // compute probability and score
        let probability = 1;
        let score = 0;
        for (let i = 0; i < word.length; i++) {
            probability *= LETTER_PROBABILITIES[word[i]];
            score += LETTER_SCORES[word[i]];
        }

        let space = " ".repeat(25 - word.length);
        let percentage = Math.round(count/total*10000)/100;
        let space2 = " ".repeat(5 - percentage.toString().length);
        process.stdout.write("\rInserting word " + word.blue + space + space2 + percentage + "%  ");

        // insert word into database
        res = await client.query("INSERT INTO words (word, length, sorted, probability, score, definition, last_played) VALUES ($1, $2, $3, $4, $5, $6, NOW()) ON CONFLICT DO NOTHING", [word, word.length, word.split("").sort().join(""), probability, score, ""]);
        if (res.rowCount === 1) {
            successfulCount++;
        } else {
            errorCount++;
        }
    };

    process.stdout.write("\n");
    return [successfulCount, errorCount];
}

module.exports = load;
