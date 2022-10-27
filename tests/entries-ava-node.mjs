import test from "ava";
import { createReadStream } from "fs";
import { Readable } from "node:stream";

import { entries } from "browser-stream-tar";

test("entry", async t => {
  const nodeStream = createReadStream(
    new URL("fixtures/test.tar", import.meta.url).pathname
  );
  const stream = Readable.toWeb(nodeStream);

  const e = [{ name: "a.txt" }];

  /*
  const stream = {
    getReader() {
      return {
        async read() {
          return { done: true, value: new Uint8Array([65, 66, 67, 0]) };
        }
      };
    }
  };
*/

  let i = 0;
  for await (const entry of entries(stream)) {
    console.log(entry);
    t.is(entry.name, e[i].name);

    i++;
  }
});
