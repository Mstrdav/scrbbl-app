const sqlite = require("sqlite3").verbose();
const fs = require("fs");

const scores = {
    A: 1,
    B: 3,
    C: 3,
    D: 2,
    E: 1,
    F: 4,
    G: 2,
    H: 4,
    I: 1,
    J: 8,
    K: 5,
    L: 1,
    M: 3,
    N: 1,
    O: 1,
    P: 3,
    Q: 10,
    R: 1,
    S: 1,
    T: 1,
    U: 1,
    V: 4,
    W: 4,
    X: 8,
    Y: 4,
    Z: 10,
};

const compute_score = (word) => {
    let score = 0;
    for (let i = 0; i < word.length; i++) {
        score += scores[word[i]];
    }
    return score;
};

const frequency = {
    A: 9,
    B: 2,
    C: 2,
    D: 3,
    E: 15,
    F: 2,
    G: 2,
    H: 2,
    I: 8,
    J: 1,
    K: 1,
    L: 5,
    M: 3,
    N: 6,
    O: 6,
    P: 2,
    Q: 1,
    R: 6,
    S: 6,
    T: 6,
    U: 6,
    V: 2,
    W: 1,
    X: 1,
    Y: 1,
    Z: 1,
};

const compute_probability = (word) => {
    let prob = 1;
    for (let i = 0; i < word.length; i++) {
        prob *= (frequency[word[i]] + 2) / 100;
    }
    return prob;
};

const to_sqlite = (verbose) => {
    // Try to connect to the database
    const db = new sqlite.Database("scrbbl-def.db");

    db.serialize(() => {
        // create table
        db.run(
            "CREATE TABLE IF NOT EXISTS words (word TEXT, definition TEXT, sorted TEXT, score INTEGER, probability REAL, last_played INTEGER)"
        );

        // disable fsync
        db.run("PRAGMA synchronous = OFF");

        // read words from file
        const words = fs.readFileSync("words/ODS9-new-def.txt").toString().split("\n");

        // begin transaction
        db.run("BEGIN TRANSACTION");
        let count = 0;

        // insert words into table
        words.forEach((arr) => {
            let word = arr.split("\t")[0].trim();
            let definition = arr.split("\t")[1];
            count++;
            if (word !== '') {
                console.log('Inserting word ' + word + '                           ' + '\r');
                // db.serialize(() => {

                    const sorted = word.split('').sort().join('');
                    const score = compute_score(word);
                    const probability = compute_probability(word);
                    const last_played = Date.now();

                    db.run('INSERT INTO words VALUES (?, ?, ?, ?, ?, ?)', [word, definition, sorted, score, probability, last_played], (err) => {
                        if (err) {
                            console.log('Error inserting word ' + word);
                            console.log(err);
                        } else {
                            console.log('Inserted word ' + word);
                        }
                    });
                // });
            }

            if (count % 10 === 0 || count === words.length) {
                console.log('Committing transaction');
                db.run('COMMIT');
                db.run('BEGIN TRANSACTION');
            }
        });
    });

    db.close();
};

module.exports = to_sqlite;
