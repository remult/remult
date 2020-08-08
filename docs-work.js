"use strict";
exports.__esModule = true;
var fs = require("fs");
var api = JSON.parse(fs.readFileSync("./tmp/the.json").toString());

for (const file of api.children) {

    switch (file.name) {
        case '"projects/core/src/entity"':

            for (const type of file.children) {
                switch (type.name) {
                    case "EntityOptions":
                        let s = '# ' + type.name + '\n';
                        let inSource = false;
                        for (const m of type.children) {
                            s += '## ' + m.name + "\n";
                            if (m.comment) {
                                if (m.comment.shortText) {
                                    s += m.comment.shortText + "\n";
                                }

                                if (m.comment.tags)
                                    for (const t of m.comment.tags) {
                                        s += "### " + t.tag + "\n";
                                        if (t.tag == "example") {
                                            if(!t.text.endsWith('\n'))
                                                t.text+='\n';
                                            t.text = "```ts" + t.text + "```\n";
                                        }

                                        s += t.text + "\n";
                                    }
                            }

                        }
                        fs.writeFileSync('./docs/guide/ref_' + type.name.toLowerCase() + '.md', s);

                        break;
                }
            }

            break;
    }
}