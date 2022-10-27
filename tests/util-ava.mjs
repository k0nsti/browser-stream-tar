import test from "ava";
import { toString, toInteger } from "browser-stream-tar";

test("decode string", t => {
  t.is(toString(new Uint8Array([65, 66, 67, 0])), "ABC");
});

test("decode integer", t => {
  t.is(toInteger(new Uint8Array([0x32, 0x31])), 17);
});
