import { getMembers } from '../../../typescriptfromjson';
describe("test json structure", () => {
    it("test basics", () => {
        expect(getMembers({
            name: "noam"
        })).toEqual([
            {
                key: "name",
                type: "string",
                children: []
            }
        ])
    });
    it("test object", () => {
        expect(getMembers({
            person: {
                name: "noam"
            }
        })).toEqual([
            {
                key: "person",
                type: "object",
                children: [{
                    key: "name",
                    type: "string",
                    children: []
                }]
            }
        ])
    });
    it("test array", () => {
        expect(getMembers({
            person: [{
                name: "noam"
            }]
        })).toEqual([
            {
                key: "person",
                type: "array",
                children: [{
                    key: "name",
                    type: "string",
                    children: []
                }]
            }
        ])
    });
})