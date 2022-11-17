import test from "ava";
import {
  toString,
  toInteger,
  overflow,
  decodeHeader,
  decodePaxHeader
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

test("pax header", async t => {
  const dummyReader = {};

  const content = new Uint8Array([
    0x32, 0x31, 0x20, 0x70, 0x61, 0x74, 0x68, 0x3d, 0x68, 0xc3, 0xb8, 0x73,
    0x74, 0xc3, 0xa5, 0x6c, 0x2e, 0x74, 0x78, 0x74, 0x0a
  ]);

  const buffer = new Uint8Array(512);
  buffer.set(content);

  const header = {};
  await decodePaxHeader(dummyReader, buffer, header);
  t.deepEqual(header, { name: "høstål.txt" });
});

test("header empty", async t => {
  const buffer = new Uint8Array(512);
  buffer[0] = 0;

  t.is(await decodeHeader({}, buffer), undefined);
});

test("header unknown type", async t => {
  const buffer = new Uint8Array(512);
  buffer[0] = 65; // todo should throw without
  buffer[156] = 101;

  await t.throwsAsync(() => decodeHeader({}, buffer, {}), {
    message: /Unsupported header type/
  });
});

test("header plain file", async t => {
  const dummyReader = {};
  const buffer = new Uint8Array(512);

  buffer[0] = 65;
  buffer[1] = 66;
  buffer[100] = 48;
  buffer[101] = 48;
  buffer[102] = 48;
  buffer[103] = 48;
  buffer[104] = 48;
  buffer[105] = 48 + 6;
  buffer[106] = 48 + 6;
  buffer[107] = 48 + 6;

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

  const header = {};

  await decodeHeader(dummyReader, buffer, header);
  t.deepEqual(header, { name: "AB", size: 5, mode: 0o666 });

  buffer[156] = 0;

  await decodeHeader(dummyReader, buffer, header);
  t.deepEqual(header, { name: "AB", size: 5, mode: 0o666 });
});
