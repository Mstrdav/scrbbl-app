const colors = require('colors');
const fs = require('fs');

const pg = require('pg');

const connect = () => {
    console.log('Connecting to the Database'.blue);

    // Check if config file exists
    if (!fs.existsSync("config.json")) {
        console.log('Please configure the Database first!'.red);
        console.log('Run'.red + ' scrbbl config '.blue + 'to do so!'.red);
        return;
    }

    // Try to connect to the database
    const config = JSON.parse(fs.readFileSync("config.json"));
    const pool = new pg.Pool(config);

    pool.query('SELECT NOW()', (err, res) => {
        if (err) {
            if (err.code === '3D000') {
                // connecting to postgres works, but the database doesn't exist
                // create the database and try again
                console.log('Database does not exist, creating it...'.red);
                const pool2 = new pg.Pool({
                    "host": config.host,
                    "port": config.port,
                    "user": config.user,
                    "password": config.password,
                    "database": 'postgres'
                });
                pool2.query('CREATE DATABASE ' + config.database, (err, res) => {
                    if (err) {
                        console.log('Error creating database'.red);
                        if (err.code === '42P04') {
                            console.log('Database already exists!'.red);
                        } else {
                            console.log(err);
                        }
                    } else {
                        console.log('Database created!'.green);
                        connect();
                    }
                });
            } else if (err.code === '28P01') {
                console.log('Wrong password'.red);
                console.log('Please configure the Database again with ' + 'scrbbl config'.blue);
            } else {
                console.log('Error connecting to Database'.red);
                console.log(err);
            }
        } else {
            console.log('Succesfully connected to '.green + config.database.blue + ' on '.green + config.host.blue);
        }
        pool.end();
    });
}

module.exports = connect;