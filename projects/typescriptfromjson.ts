export function getMembers(...items: any[]) {
    let members = [] as item[];
    for (const item of items) {
        iterate(members, item);
    }
    return members;
}

function iterate(members: item[], item: any) {
    for (const key in item) {
        if (Object.prototype.hasOwnProperty.call(item, key)) {
            const element = item[key];
            let mem = members.find(m => m.key == key);
            let type: string = typeof element;
            if (!mem) {
                members.push(mem = { key, type, children: [] });

            }
            if (Array.isArray(element)) {
                mem.type = "array";
                for (const item of element) {
                    iterate(mem.children, item);
                }
            } else
                if (type === "object") {
                    iterate(mem.children, element)
                    console.log(element);
                }

        }
    }
}
export interface item {
    key: string,
    type: string,
    children: item[];
}
