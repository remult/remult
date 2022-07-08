import * as fs from 'fs';



var api: {
    children: member[]
} = JSON.parse(fs.readFileSync("./dist/generate/the.json").toString());

class DocFile {
    s: string = '';
    constructor(private fileName: string) {

    }
    addTitle(name: string) {
        this.s += '# ' + name + '\n';
    }
    writeMemberComments(m: member, indent = 0) {
        if (!m.comment)
            return;

        if (m.comment.shortText) {
            this.writeLine(m.comment.shortText, indent);
        }

        if (m.comment.tags)
            for (const t of m.comment.tags) {
                this.writeLine(header(3 + indent, t.tag), indent);
                if (t.tag == "example") {
                    if (!t.text.endsWith('\n'))
                        t.text += '\n';
                    t.text = t.text.replace('.@', '@');
                    t.text = "```ts" + t.text + "```\n";
                }

                this.writeLine(t.text, indent);
            }
    }
    writeLine(what: string, indent: number) {
        this.s += what + '\n';
    }
    writeMembers(type: member, indent = 0) {


        if (type.children) {
            try {
                if (type.name === "Repository")
                    type.children.sort((a, b) => a.id - b.id);
                else
                    type.children.sort((a, b) => a.sources[0].line - b.sources[0].line)
            } catch { }

            for (const m of type.children) {
                if (m.flags.isPrivate)
                    continue;
                this.writeLine(header(indent + 2, m.name), indent)

                this.writeMemberComments(m, indent);
                if (m.signatures) {
                    for (const s of m.signatures) {
                        this.writeMemberComments(s, indent);

                        if (s.parameters?.length <= 3 && !m.flags.isStatic) {
                            for (const p of s.parameters) {
                                if (p.type.type == 'union') {
                                    for (const pp of p.type.types) {
                                        if (pp.name)
                                            if (pp.name.endsWith("Options")) {
                                                let o = findType(pp.name);
                                                this.writeMembers(o, indent + 1);
                                            }
                                    }
                                } else if (p.type.name)
                                    if (p.type.name.endsWith("Options")) {
                                        let o = findType(p.type.name);
                                        this.writeMembers(o, indent + 1);
                                    }
                            }


                        }
                    }
                }

            }
        }

    }
    writeFile() {
        fs.writeFileSync('./docs/docs/ref_' + this.fileName.toLowerCase() + '.md', this.s);
    }
}


function findType(type: string) {
    let r = api.children.find(e => e.name == type);
    if (!r)
        throw new Error("Couldn't find type " + type);
    return r;
}


try {
    for (const pairs of [
        ["Entity", "EntityOptions"],
        ["Field", "FieldOptions"],
        ["BackendMethod", "BackendMethodOptions"],
    ]) {
        if (!pairs)
            continue;
        let type = findType(pairs[0]);
        let options = findType(pairs[1]);
        let f = new DocFile(type.name);
        f.addTitle(type.name);
        f.writeMemberComments(type.signatures[0]);
        f.writeMembers(options);
        f.writeFile();
    }

    for (const typeName of [
        "Remult",
        "Repository",
        "QueryResult",
        "Paginator"
    ]) {
        let type = findType(typeName);

        let f = new DocFile(type.name);
        f.addTitle(type.name);
        f.writeMemberComments(type);
        f.writeMembers(type);
        f.writeFile();
    }
}
catch (err) {
    console.error(err);
    for (const line of err.stack.split('\n')) {
        console.error(line);
    }

}


interface member {
    kindString: string;
    name: string,
    parameters: {
        name: string,
        type: {
            name: string,
            type: string,
            types: { name: string }[]
        }
    }[],
    signatures: member[],
    sources: { line: number }[]
    flags: {
        isPrivate: boolean,
        isStatic: boolean
    },
    id: number,
    children: member[],
    comment: {
        shortText: string,
        tags: {
            tag: string,
            text: string
        }[]
    }
}


function header(depth: number, text: string) {
    let s = '';
    for (let index = 0; index < depth; index++) {
        s += '#';
    }
    return s + ' ' + text;
}