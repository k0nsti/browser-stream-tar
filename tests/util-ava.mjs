import test from "ava";
import {
  decodeString,
  decodeInteger,
  overflow,
  decodeHeader,
  encodeInteger,
  encodeString
} from "browser-stream-tar";

test("decode string", t => {
  t.is(decodeString(new Uint8Array([65, 66, 67, 0])), "ABC");
  t.is(decodeString(new Uint8Array([0])), "");
  t.is(decodeString(new Uint8Array(0)), "");
});

test("decode integer", t => {
  t.is(decodeInteger(new Uint8Array([0x32, 0x31])), 17);
});

test("overflow", t => {
  t.is(overflow(23), 489);
  t.is(overflow(512 + 23), 489);
  t.is(overflow(511), 1);
  t.is(overflow(513), 511);
});

const reader = {
  read: () => {
    return { done: true };
  }
};


function magic(buffer, details, offset = 0) {
  details = Object.assign(
    {
      name: "empty",
      size: 0,
      type: 0,
      uid: 1000,
      gid: 1000,
      mode: 6 + 8 * 6 + 8 * 8 * 6,
      lastModified: new Date()
    },
    details
  );

  encodeString(buffer, offset + 0, details.name, 100);
  encodeInteger(buffer, offset + 100, details.mode, 8);
  encodeInteger(buffer, offset + 108, details.uid, 8);
  encodeInteger(buffer, offset + 116, details.gid, 8);
  encodeInteger(buffer, offset + 124, details.size, 12);
  encodeInteger(buffer, offset + 136, details.lastModified.getTime() / 1000, 12);

  buffer[offset + 156] = details.type === 0 ? 0 : details.type.charCodeAt(0);

  buffer[offset + 257] = 117;
  buffer[offset + 258] = 115;
  buffer[offset + 259] = 116;
  buffer[offset + 260] = 97;
  buffer[offset + 261] = 114;
  buffer[offset + 262] = 0;
  buffer[offset + 263] = 48;
  buffer[offset + 264] = 48;
}

test.skip("pax header", async t => {
  const content = new Uint8Array([
    0x32, 0x31, 0x20, 0x70, 0x61, 0x74, 0x68, 0x3d, 0x68, 0xc3, 0xb8, 0x73,
    0x74, 0xc3, 0xa5, 0x6c, 0x2e, 0x74, 0x78, 0x74, 0x0a
  ]);

  const buffer = new Uint8Array(1024);
  buffer.set(content);

  magic(buffer, { type: "x" }, 0);
  magic(buffer, { type: 0 }, 512);
  const header = {};
  await decodeHeader(reader, buffer, header);
  t.deepEqual(header, {
    lastModified: new Date(0),
    name: "høstål.txt"
  });
});

test("header empty", async t => {
  const buffer = new Uint8Array(512);
  buffer[0] = 0;

  t.is(await decodeHeader( reader, buffer), undefined);
});

test("header unknown type", async t => {
  const buffer = new Uint8Array(512);
  buffer[0] = 65; // todo should throw without
  buffer[156] = 101;

  magic(buffer, { type: "a" }, 0);

  await t.throwsAsync(() => decodeHeader( reader, buffer, {}), {
    message: /Unsupported header type/
  });
});

test("header plain file", async t => {
  const buffer = new Uint8Array(512);

  buffer[100] = 48;
  buffer[101] = 48;
  buffer[102] = 48;
  buffer[103] = 48;
  buffer[104] = 48;
  buffer[105] = 48 + 6;
  buffer[106] = 48 + 6;
  buffer[107] = 48 + 6;

  buffer[108] = 48;

  buffer[116] = 48;

  buffer[156] = 48;

  magic(
    buffer,
    {
      name: "AB",
      type: "0",
      uid: 0,
      gid: 0,
      lastModified: new Date(0),
      size: 5
    },
    0
  );

  const header = {};

  await decodeHeader(reader, buffer, header);
  t.deepEqual(header, {
    name: "AB",
    size: 5,
    mode: 0o666,
    lastModified: new Date(0),
    uname: "",
    gname: "",
    uid: 0,
    gid: 0,
    type: 'application/octet-stream'
  });

  buffer[156] = 0;

  await decodeHeader(reader, buffer, header);
  t.deepEqual(header, {
    name: "AB",
    size: 5,
    mode: 0o666,
    lastModified: new Date(0),
    uname: "",
    gname: "",
    uid: 0,
    gid: 0,
    type: 'application/octet-stream'
  });
});
