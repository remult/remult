"use strict";
exports.__esModule = true;
var fs = require("fs");
var api = JSON.parse(fs.readFileSync("./tmp/the.json").toString());

for (const file of api.children) {



    for (const type of file.children) {
        switch (type.name) {
            case "EntityOptions":
            case "SpecificEntityHelper":
            case "FindOptions":
            case "EntityWhere":
            case "EntityOrderBy":
            case "Entity":

                let s = '# ' + type.name + '\n';
                {
                    let c = writeMemberComments(type);
                    if (c)
                        s += c;
                }
                if (type.children) {
                    type.children.sort((a, b) => a.sources[0].line - b.sources[0].line);
                    for (const m of type.children) {
                        if (m.flags.isPrivate)
                            continue;
                        let memberText = writeMemberComments(m);
                        if (m.signatures) {
                            for (const s of m.signatures) {
                                memberText += writeMemberComments(s);
                            }
                        }
                        if (memberText.length > 0) {
                            s += '## ' + m.name + "\n" + memberText;
                        }
                    }
                }
                fs.writeFileSync('./docs/guide/ref_' + type.name.toLowerCase() + '.md', s);
        }

    }
}
function writeMemberComments(m) {
    if (!m.comment)
        return '';
    let s = '';
    if (m.comment.shortText) {
        s += m.comment.shortText + "\n";
    }

    if (m.comment.tags)
        for (const t of m.comment.tags) {
            s += "### " + t.tag + "\n";
            if (t.tag == "example") {
                if (!t.text.endsWith('\n'))
                    t.text += '\n';
                t.text = "```ts" + t.text + "```\n";
            }

            s += t.text + "\n";
        }
    return s;
}
