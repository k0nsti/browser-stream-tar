import test from "ava";
import { createReadStream } from "node:fs";
import { Readable } from "node:stream";
import { assertTarStreamEntries } from "./assertions.mjs";
import { readControlChunkSize } from "./util.mjs";

async function entryWithChunksSize(t, size) {
  const nodeStream = createReadStream(
    new URL("fixtures/bytes.tar", import.meta.url).pathname
  );

  await assertTarStreamEntries(
    t,
    await readControlChunkSize(Readable.toWeb(nodeStream), size),
    ["0.bytes", "1.bytes", "511.bytes", "512.bytes", "513.bytes"],
    async name =>
      Readable.toWeb(
        createReadStream(new URL("fixtures/" + name, import.meta.url).pathname)
      )
  );
}

entryWithChunksSize.title = (providedTitle, size) => `entries extreme <${size}>`;

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
