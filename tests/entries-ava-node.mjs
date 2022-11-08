import test from "ava";
import { createReadStream } from "node:fs";
import { Readable } from "node:stream";
import { assertTarStreamEntries } from "./assertions.mjs";
import { readControlChunkSize } from "./util.mjs";

test("entry", async t => {
  const nodeStream = createReadStream(
    new URL("fixtures/test.tar", import.meta.url).pathname
  );

  // @see https://exploringjs.com/nodejs-shell-scripting/ch_web-streams.html

  await assertTarStreamEntries(
    t,
    await readControlChunkSize(Readable.toWeb(nodeStream), 30),
    ["a.txt", "b.csv", "z.doc"],
    async name =>
      Readable.toWeb(
        createReadStream(new URL("fixtures/" + name, import.meta.url).pathname)
      )
  );
});
