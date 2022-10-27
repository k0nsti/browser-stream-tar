import test from "ava";
import { entries } from "browser-stream-tar";

test("fetch entries", async t => {
  const e = [{ name: "ABC" }];

  const response = await fetch(
    "https://raw.githubusercontent.com/k0nsti/browser-stream-tar/main/tests/fixtures/test.tar"
  );

  let i = 0;
  for await (const entry of entries(response.body)) {
    t.is(entry.name, e[i].name);

    i++;
  }
});
