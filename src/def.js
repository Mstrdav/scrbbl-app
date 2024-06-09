const fs = require("fs");
const jsdom = require("jsdom");

const def = async () => {
    // read words from file
    const defs = fs.readFileSync("words/definitions.txt").toString().split("\n");
    const words = fs.readFileSync("words/ODS9-new.txt").toString().split("\n");

    // transform definitions into a js map
    const def_map = new Map();
    defs.forEach((def) => {
        const word = def.split(" ")[0];
        const definition = def;

        def_map[word] = definition;

        process.stdout.write("Processing word: " + word + " ".repeat(20 - word.length) + "\r");
    });

    const new_0DS9_defs = new Map();

    for (let i = 0; i < words.length; i++) {
        const word = words[i].trim();
        let definition = def_map[word];

        if (definition === '' || definition === undefined) {
            const def = await fetch_definition(word);
            definition = def;
            console.log("Fetched definition for " + word + ": " + def);
        }

        new_0DS9_defs[word] = definition;
    }

    // write to file
    let new_defs = "";
    for (let [word, definition] of Object.entries(new_0DS9_defs)) {
        new_defs += word + "\t" + definition + "\n";
    }

    fs.writeFileSync("words/ODS9-new-def.txt", new_defs);
}

const fetch_definition = async (word) => {
    const url = "https://1mot.net/" + word.toLowerCase();
    const response = await fetch(url);

    const html = await response.text();
    // parse html
    const dom = new jsdom.JSDOM(html);

    return dom.window.document.querySelector("ul li").textContent.split("\n")[0];
};

module.exports = def;