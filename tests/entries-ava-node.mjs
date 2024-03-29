import test from "ava";
import { createReadStream } from "node:fs";
import { Readable } from "node:stream";
import { assertTarStreamFiles, tars } from "./assertions.mjs";
import { readControlChunkSize } from "./util.mjs";

async function entryWithChunksSize(t, size, consume = true) {
  for (const [name, entries] of Object.entries(tars)) {
    const nodeStream = createReadStream(
      new URL("fixtures/" + name, import.meta.url)
    );

    // @see https://exploringjs.com/nodejs-shell-scripting/ch_web-streams.html

    await assertTarStreamFiles(
      t,
      await readControlChunkSize(Readable.toWeb(nodeStream), size),
      entries,
      async name =>
        consume
          ? Readable.toWeb(
              createReadStream(new URL("fixtures/" + name, import.meta.url))
            )
          : undefined
    );
  }
}

entryWithChunksSize.title = (providedTitle, size, consume = true) =>
  `files <${size}> ${consume ? "consume data" : "skip data"}`;

test(entryWithChunksSize, 1000);

/*
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


test(entryWithChunksSize, 10, false);
*/