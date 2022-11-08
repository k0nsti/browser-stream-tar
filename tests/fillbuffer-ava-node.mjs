import test from "ava";
import { createReadStream } from "node:fs";
import { Readable } from "node:stream";
import { fillBuffer, toString } from "../src/tar.mjs";
import { readControlChunkSize } from "./util.mjs";

test("fillBuffer only file", async t => {
  const nodeStream = createReadStream(
    new URL("fixtures/a.txt", import.meta.url).pathname
  );

  let buffer = new Uint8Array();
  const reader = (
    await readControlChunkSize(Readable.toWeb(nodeStream), 5)
  ).getReader();
  buffer = await fillBuffer(buffer, reader);

  //console.log(String.fromCharCode(buffer[0], buffer[1], buffer[2]))

  t.deepEqual(buffer, new Uint8Array([0x64, 0x61, 0x73, 0x20, 0x69]));

  buffer = await fillBuffer(buffer, reader);

  t.deepEqual(
    buffer,
    new Uint8Array([0x64, 0x61, 0x73, 0x20, 0x69, 0x73, 0x74, 0x20, 0x65, 0x69])
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
      0x20, 0x54, 0x65, 0x78, 0x74, 0x20, 0x44, 0x61, 0x74, 0x65, 0x69
    ])
  );
});

test.skip("fillBuffer tar", async t => {
  const nodeStream = createReadStream(
    new URL("fixtures/test.tar", import.meta.url).pathname
  );

  let buffer = new Uint8Array();
  const reader = (
    await readControlChunkSize(Readable.toWeb(nodeStream), 5)
  ).getReader();

  buffer = await fillBuffer(buffer, reader);

  console.log("#######", toString(buffer), "#####");

  buffer = await fillBuffer(buffer, reader);

  console.log("#######", toString(buffer), "#####");
});
