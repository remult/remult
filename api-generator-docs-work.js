"use strict";
exports.__esModule = true;
var fs = require("fs");
var api = JSON.parse(fs.readFileSync("./temp/remult.api.json").toString());

for (const type of api.members[0].members) {
    switch (type.name) {
        case "EntityOptions":
            {
                let s = '# ' + type.name + '\n';
                let inSource = false;
                for (const m of type.members) {
                    s += '## ' + m.name + "\n";
                    for (let line of m.docComment.split('\n')) {
                        console.log(line);
                        line = line.trim();
                        if (line.startsWith('/**'))
                            line = line.substring(3);
                        if (line.endsWith('*/')) {
                            if (inSource) {
                                s += '```\n';
                                inSource = false;
                            }
                            line = line.substring(0, line.length - 2);
                        }
                        if (line.startsWith('* '))
                            line = line.substring(2);
                        if (line.startsWith("@example")) {
                            if (inSource) {
                                s += '```\n';
                            }
                            line = '```ts';
                            inSource = true;
                        }
                        if (line != '*')
                            s += line + '\n';
                    }
                    if (inSource) {
                        s += '```\n';
                        inSource = false;
                    }


                }
                fs.writeFileSync('./docs/guide/ref_' + type.name.toLowerCase() + '.md', s);
            }
    }
}