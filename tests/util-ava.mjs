import test from "ava";
import { toString } from "browser-stream-tar";

test("decode string", t => {
  t.is(toString(new Uint8Array([65, 66, 67, 0])), "ABC");
});
