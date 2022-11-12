import test from "ava";
import {
  toString,
  toInteger,
  overflow,
  decodeHeader
} from "browser-stream-tar";

test("decode string", t => {
  t.is(toString(new Uint8Array([65, 66, 67, 0])), "ABC");
});

test("decode integer", t => {
  t.is(toInteger(new Uint8Array([0x32, 0x31])), 17);
});

test("overflow", t => {
  t.is(overflow(23), 489);
  t.is(overflow(512 + 23), 489);
  t.is(overflow(511), 1);
  t.is(overflow(513), 511);
});

test("header empty", t => {
  t.is(decodeHeader(new Uint8Array([0x0])), undefined);
});

test("header plain file", t => {
  const buffer = new Uint8Array(512);

  buffer[0] = 65;
  buffer[1] = 66;
  buffer[124] = 48;
  buffer[125] = 48;
  buffer[126] = 48;
  buffer[127] = 48;
  buffer[128] = 48;
  buffer[129] = 48;
  buffer[130] = 48;
  buffer[131] = 48;
  buffer[132] = 48;
  buffer[133] = 48;
  buffer[134] = 48;
  buffer[135] = 53;
  buffer[156] = "0";

  t.deepEqual(decodeHeader(buffer), { name: "AB", size: 5 });

  buffer[156] = 0;

  t.deepEqual(decodeHeader(buffer), { name: "AB", size: 5 });
});
