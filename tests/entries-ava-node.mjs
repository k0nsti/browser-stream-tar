import test from "ava";
import { createReadStream } from "node:fs";
import { Readable } from "node:stream";
import { assertTarStreamEntries } from "./assertions.mjs";
import { readControlChunkSize } from "./util.mjs";
import { fillBuffer } from "../src/tar.mjs";

test.only("entry", async (t) => {
  const nodeStream = createReadStream(
    new URL("fixtures/test.tar", import.meta.url).pathname
  );

  // @see https://exploringjs.com/nodejs-shell-scripting/ch_web-streams.html

  await assertTarStreamEntries(
    t,
    await readControlChunkSize(Readable.toWeb(nodeStream), 300),
    ["a.txt", "b.csv", "z.doc"],
    async (name) =>
      createReadStream(new URL("fixtures/" + name, import.meta.url).pathname)
  );
});

test("fillBuffer", async (t) => {
  const nodeStream = createReadStream(
    new URL("fixtures/a.txt", import.meta.url).pathname
  );

  let buffer = new Uint8Array();
  const reader = (await readControlChunkSize(
    Readable.toWeb(nodeStream),
    5
  )).getReader();
  buffer = await fillBuffer(buffer, reader);

  //console.log(String.fromCharCode(buffer[0], buffer[1], buffer[2]))

  t.deepEqual(
    buffer,
    new Uint8Array([
      0x64, 0x61, 0x73, 0x20, 0x69
    ])
  );

  buffer = await fillBuffer(buffer, reader);

  t.deepEqual(
    buffer,
    new Uint8Array([
      0x64, 0x61, 0x73, 0x20, 0x69, 0x73, 0x74, 0x20, 0x65, 0x69
    ])
  );

  buffer = await fillBuffer(buffer, reader);

  t.deepEqual(
    buffer,
    new Uint8Array([
      0x64, 0x61, 0x73, 0x20, 0x69, 0x73, 0x74, 0x20, 0x65, 0x69, 0x6e, 0x65,
      0x20, 0x54, 0x65
    ])
  );

  buffer = await fillBuffer(buffer, reader);

  t.deepEqual(
    buffer,
    new Uint8Array([
      0x64, 0x61, 0x73, 0x20, 0x69, 0x73, 0x74, 0x20, 0x65, 0x69, 0x6e, 0x65,
      0x20, 0x54, 0x65, 0x78, 0x74, 0x20, 0x44, 0x61
    ])
  );

  buffer = await fillBuffer(buffer, reader);

  t.deepEqual(
    buffer,
    new Uint8Array([
      0x64, 0x61, 0x73, 0x20, 0x69, 0x73, 0x74, 0x20, 0x65, 0x69, 0x6e, 0x65,
      0x20, 0x54, 0x65, 0x78, 0x74, 0x20, 0x44, 0x61, 0x74, 0x65, 0x69,
    ])
  );
});
