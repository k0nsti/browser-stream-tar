import test from "ava";
import { createReadStream } from "node:fs";
import { Readable } from "node:stream";
import { assertTarStreamEntries, tars } from "./assertions.mjs";
import { readControlChunkSize } from "./util.mjs";


async function entryWithChunksSize(t, size) {
  for (const [name, entries] of Object.entries(tars)) {
    const nodeStream = createReadStream(
      new URL("fixtures/" + name, import.meta.url).pathname
    );

    // @see https://exploringjs.com/nodejs-shell-scripting/ch_web-streams.html

    await assertTarStreamEntries(
      t,
      await readControlChunkSize(Readable.toWeb(nodeStream), size),
      entries,
      async name =>
        Readable.toWeb(
          createReadStream(
            new URL("fixtures/" + name, import.meta.url).pathname
          )
        )
    );
  }
}

entryWithChunksSize.title = (providedTitle, size) => `entries <${size}>`;

test(entryWithChunksSize, 1000);
test(entryWithChunksSize, 400);
test(entryWithChunksSize, 49);
test(entryWithChunksSize, 48);
test(entryWithChunksSize, 47);
test(entryWithChunksSize, 46);
test(entryWithChunksSize, 45);
test(entryWithChunksSize, 44);
test(entryWithChunksSize, 43);
test(entryWithChunksSize, 42);
test(entryWithChunksSize, 41);
test(entryWithChunksSize, 40);
test(entryWithChunksSize, 31);
test(entryWithChunksSize, 30);
test(entryWithChunksSize, 10);
