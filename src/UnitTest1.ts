import * as assert from 'assert';
import * as index from './index';

export function Test1() {
    let x = new index.myClass();
    assert.equal(x.add(1,1),2);
}