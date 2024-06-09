// import chalk and fs
const colors = require("colors");
const fs = require("fs");

// import pg
const pg = require("pg");

// import readline
const readline = require('readline');

// variables
null;

const train = (wordsize, letters, keep, verbose) => {
    // Check if config file exists
    if (!fs.existsSync("config.json")) {
        console.log('Please configure the Database first!'.red);
        console.log('Run'.red + ' scrbbl config '.blue + 'to do so!'.red);
        return;
    }

    // Try to connect to the database
    const config = JSON.parse(fs.readFileSync("config.json"));
    const pool = new pg.Pool(config);

    // select a word of the specified size including the specified letters, sorted by last_played
    let query = 'SELECT sorted FROM words WHERE length(word) ' + wordsize;

    if (!wordsize) {
        console.log('No wordsize specified, querying words of any size'.yellow);
        query = 'SELECT sorted FROM words';
    }

    if (letters !== '') {
        if (wordsize) {
            query += ' AND word ~ \'[' + letters.toUpperCase() + ']\'';
        } else {
            query += ' WHERE word ~ \'[' + letters.toUpperCase() + ']\'';
        }
    }
    query += ' ORDER BY last_played ASC LIMIT 1';

    pool.query(query, (err, res) => {
        if (err) {
            console.log('Error querying Database'.red);
            console.log(err);
            pool.end();
        } else {
            if (res.rows.length === 0) {
                console.log('No words found!'.red);
            } else {
                // fetch all word with matching sorted letters
                const sortedLetters = res.rows[0].sorted;
                const query2 = 'SELECT word FROM words WHERE sorted = \'' + sortedLetters + '\'';
                pool.query(query2, (err, res) => {
                    if (err) {
                        console.log('Error querying Database'.red);
                        console.log(err);
                    } else {
                        // user now input all words created from the letters
                        // let them input the word they played
                        const rl = readline.createInterface({
                            input: process.stdin,
                            output: process.stdout
                        });

                        rl.question(sortedLetters.magenta + (verbose ? ' - ' + res.rows.length : "") + '\n', async (answer) => {
                            rl.close();
                            let answers = answer.toUpperCase().split(' ');
                            // filter out empty answers
                            answers = answers.filter((ans) => ans !== '');

                            for (let ans of answers) {
                                if (res.rows.find((row) => row.word === ans)) {
                                    console.log(ans.green + '✅');

                                    // update last_played to now + 4 days
                                    const query3 = 'UPDATE words SET last_played = NOW() + INTERVAL \'4 days\' WHERE word = \'' + ans + '\'';
                                    let res = await pool.query(query3);
                                    if (res.rowCount === 0) {
                                        console.log('Error updating last_played'.red);
                                    }
                                } else {
                                    console.log(ans.red + ' - not valid'.red);
                                }
                            }

                            // now answers that have not been found
                            for (let row of res.rows) {
                                if (!answers.includes(row.word)) {
                                    console.log(row.word.yellow + ' - not played'.yellow + ' - ' + 'https://1mot.net/'.blue + row.word.toLowerCase().blue);
                                    // TODO : fetch definition

                                    // update last_played to now
                                    const query3 = 'UPDATE words SET last_played = NOW() WHERE word = \'' + row.word + '\'';
                                    let res = await pool.query(query3);
                                    if (res.rowCount === 0) {
                                        console.log('Error updating last_played'.red);
                                    }
                                }
                            }
                            
                            pool.end();
                            if (keep) {
                                console.log('\n');
                                train(wordsize, letters, keep, verbose);
                            }
                        });
                        
                    }
                });
            }
        }
    });
}

module.exports = train;