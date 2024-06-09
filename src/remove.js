const sqlite = require("sqlite3").verbose();
const fs = require("fs");

const remove = (verbose) => {
    // Try to connect to the database
    const db = new sqlite.Database("scrbbl-def.db");

    db.serialize(() => {
        // disable fsync
        // db.run("PRAGMA synchronous = OFF");

        // read words from file
        const words = fs.readFileSync("words/ODS9-removed.txt").toString().split("\n");

        // begin transaction
        db.run("BEGIN TRANSACTION");
        let count = 0;

        // insert words into table
        words.forEach(wordd => {
            let word = wordd.trim();
            count++;
            if (word !== '') {
                console.log('removing word ' + word + '                           ' + '\r');
                // db.serialize(() => {
                    db.run("DELETE FROM words WHERE word = ?", [word], (err) => {
                        if (err) {
                            console.log(err);
                        } else {
                            if (verbose) {
                                console.log("Removed word " + word);
                            }
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
        db.close();
    });

    
};

module.exports = remove;
