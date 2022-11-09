import test from "ava";
import { createReadStream } from "node:fs";
import { Readable } from "node:stream";
import { assertTarStreamEntries } from "./assertions.mjs";
import { readControlChunkSize } from "./util.mjs";

async function entry_chunk_size(t,size) {
  const nodeStream = createReadStream(
    new URL("fixtures/test.tar", import.meta.url).pathname
  );

  // @see https://exploringjs.com/nodejs-shell-scripting/ch_web-streams.html

  await assertTarStreamEntries(
    t,
    await readControlChunkSize(Readable.toWeb(nodeStream), size),
    ["a.txt", "b.csv", "z.doc"],
    async name =>
      Readable.toWeb(
        createReadStream(new URL("fixtures/" + name, import.meta.url).pathname)
      )
  );
}

entry_chunk_size.title=(size)=>`entries ($size)`;

test(entry_chunk_size, 30);
//test(entry_chunk_size, 200);
