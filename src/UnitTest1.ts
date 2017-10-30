import assert = require('assert');

export function Test1() {
    assert.ok(true, "This shouldn't fail");
}

export function Test2() {
    assert.ok(1 === 1, "This shouldn't fail");
    assert.ok(false, "This should fail");
}
