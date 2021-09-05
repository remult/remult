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
            this.s += m.comment.shortText + "\n";
        }

        if (m.comment.tags)
            for (const t of m.comment.tags) {
                for (let index = 0; index < 3 + indent; index++) {
                    this.s += '#';
                }
                this.s += " " + t.tag + "\n";
                if (t.tag == "example") {
                    if (!t.text.endsWith('\n'))
                        t.text += '\n';
                    t.text = "```ts" + t.text + "```\n";
                }

                this.s += t.text + "\n";
            }
    }
    writeMembers(type: member, indent = 0) {

        if (type.children) {
            try {
                type.children.sort((a, b) => a.sources[0].line - b.sources[0].line);
            } catch { }
            for (const m of type.children) {
                if (m.flags.isPrivate)
                    continue;
                for (let index = 0; index < 2 + indent; index++) {
                    this.s += '#';
                }
                this.s += ' ' + m.name + "\n";
                this.writeMemberComments(m, indent);
                if (m.signatures) {
                    for (const s of m.signatures) {
                        this.writeMemberComments(s, indent);
                        if (m.name == "findFirst") {
                            debugger;
                        }
                        if (s.parameters?.length == 1) {
                            let p = s.parameters[0];
                            if (p.type.type == 'union') {
                                for (const pp of p.type.types) {
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
    writeFile() {
        fs.writeFileSync('./docs/guide/ref_' + this.fileName.toLowerCase() + '.md', this.s);
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
        f.writeMemberComments(type);
        f.writeMembers(options);
        f.writeFile();
    }

    for (const typeName of [
        "Repository"
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




for (const file of api.children) {


    if (file.children)
        for (const type of file.children) {

            switch (type.name) {
                case "EntityOptions":
                case "SpecificEntityHelper":
                case "FindOptions":
                case "EntityWhere":
                case "EntityOrderBy":
                case "Entity":
                case "DataControlSettings":
                case "IDataSettings":
                case "RowButton":
                case "GridButton":

                    let s = '# ' + type.name + '\n';
                    {
                        let c = writeMemberComments(type);
                        if (c)
                            s += c;
                    }


            }

        }
}
function writeMembers(type: member) {
    let s = '';
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
    return s;

}
function writeMemberComments(m: member) {
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


 interface member {
    name: string,
    parameters: {
        type: {
            name: string,
            type: string,
            types: { name: string }[]
        }
    }[],
    signatures: member[],
    sources: { line: number }[]
    flags: {
        isPrivate
    },
    children: member[],
    comment: {
        shortText: string,
        tags: {
            tag: string,
            text: string
        }[]
    }
}


