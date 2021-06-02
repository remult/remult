import { Context, keyFor, ServerContext } from '../context';
import { async } from '@angular/core/testing';




describe("many to one relation", () => {

    it("what", async(async () => {
        let c = new Context();
        c.set(itemKey, new item("123"));
        let z = c.get(itemKey);
        expect(z.a).toBe("123");

    }));
});


class item {
    constructor(public a: string) {

    }
}
const itemKey = new keyFor<item>();