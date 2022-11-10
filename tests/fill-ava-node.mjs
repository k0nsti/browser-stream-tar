import test from "ava";
import { createReadStream } from "node:fs";
import { Readable } from "node:stream";
import { fill, toString } from "../src/tar.mjs";
import { readControlChunkSize } from "./util.mjs";

test("fill once", async t => {
  const nodeStream = createReadStream(
    new URL("fixtures/a.txt", import.meta.url).pathname
  );

  const reader = (
    await readControlChunkSize(Readable.toWeb(nodeStream), 5)
  ).getReader();

  t.deepEqual(
    await fill(reader, undefined, 20),
    new Uint8Array([
      0x64, 0x61, 0x73, 0x20, 0x69, 0x73, 0x74, 0x20, 0x65, 0x69, 0x6e, 0x65,
      0x20, 0x54, 0x65, 0x78, 0x74, 0x20, 0x44, 0x61
    ])
  );
});

test("fill already filled", async t => {
  const unusedReader = {};

  const buffer = new Uint8Array([
    0x64, 0x61, 0x73, 0x20, 0x69, 0x73, 0x74, 0x20, 0x65, 0x69, 0x6e, 0x65,
    0x20, 0x54, 0x65, 0x78, 0x74, 0x20, 0x44, 0x61
  ]);

  t.deepEqual(
    await fill(unusedReader, buffer, buffer.length),
    buffer
  );
});

test("fill step by step", async t => {
  const nodeStream = createReadStream(
    new URL("fixtures/a.txt", import.meta.url).pathname
  );

  const reader = (
    await readControlChunkSize(Readable.toWeb(nodeStream), 5)
  ).getReader();
  let buffer = await fill(reader);

  t.deepEqual(buffer, new Uint8Array([0x64, 0x61, 0x73, 0x20, 0x69]));

  buffer = await fill(reader, buffer);

  t.deepEqual(
    buffer,
    new Uint8Array([0x64, 0x61, 0x73, 0x20, 0x69, 0x73, 0x74, 0x20, 0x65, 0x69])
  );

  buffer = await fill(reader, buffer);

  t.deepEqual(
    buffer,
    new Uint8Array([
      0x64, 0x61, 0x73, 0x20, 0x69, 0x73, 0x74, 0x20, 0x65, 0x69, 0x6e, 0x65,
      0x20, 0x54, 0x65
    ])
  );

  buffer = await fill(reader, buffer);

  t.deepEqual(
    buffer,
    new Uint8Array([
      0x64, 0x61, 0x73, 0x20, 0x69, 0x73, 0x74, 0x20, 0x65, 0x69, 0x6e, 0x65,
      0x20, 0x54, 0x65, 0x78, 0x74, 0x20, 0x44, 0x61
    ])
  );

  buffer = await fill(reader, buffer);

  t.deepEqual(
    buffer,
    new Uint8Array([
      0x64, 0x61, 0x73, 0x20, 0x69, 0x73, 0x74, 0x20, 0x65, 0x69, 0x6e, 0x65,
      0x20, 0x54, 0x65, 0x78, 0x74, 0x20, 0x44, 0x61, 0x74, 0x65, 0x69
    ])
  );

  t.true((await fill(reader, buffer)) === undefined);
});

test.only("fill tar", async t => {
  const nodeStream = createReadStream(
    new URL("fixtures/test.tar", import.meta.url).pathname
  );

  let buffer;

  const reader = (
    await readControlChunkSize(Readable.toWeb(nodeStream), 5)
  ).getReader();

  buffer = await fill(reader);

  console.log("#######", toString(buffer), "#####");

  buffer = await fill(reader, buffer);

  console.log("#######", toString(buffer), "#####");
});
