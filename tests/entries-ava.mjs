import test from "ava";
import { entries } from "browser-stream-tar";

test("entry", async t => {
  const e = [{ name: "ABC" }];

  const stream = {
    getReader() {
      return {
        async read() {
          return { done: true, value: new Uint8Array([65, 66, 67, 0]) };
        }
      };
    }
  };

  let i = 0;
  for await (const entry of entries(stream)) {
    t.is(entry.name, e[i].name);

    i++;
  }
});
