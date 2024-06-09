const colors = require('colors');
const fs = require('fs');

const readline = require('readline');


// this script ask for host, port, user, password and database
// and create a config.json file with the data

const config = () => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    console.log('Configuring the Database'.blue);

    // Check if config file exists
    if (fs.existsSync("config.json")) {
        console.log('Config file already exists!'.red);
        rl.question('Would you like to overwrite it? (y/N) '.red, (answer) => {
            if (answer === 'y' || answer === 'Y' || answer === 'yes' || answer === 'Yes') {
                askForData(rl);
            } else {
                console.log('Aborting...'.red);
                rl.close();
            }
        });
    }

    // If not, create it
    askForData(rl);
}

const askForData = (rl) => {
    rl.question('Host: '.blue, (host) => {
        rl.question('Port: '.blue, (port) => {
            rl.question('User: '.blue, (user) => {
                rl.question('Password: '.blue, (password) => {
                    rl.question('Database: '.blue, (database) => {
                        const data = {
                            "host": host,
                            "port": port,
                            "user": user,
                            "password": password,
                            "database": database.toLowerCase()
                        };
                        fs.writeFileSync("config.json", JSON.stringify(data));
                        console.log('Config file created!'.green);
                        rl.close();
                    });
                });
            });
        });
    });
}

module.exports = config;