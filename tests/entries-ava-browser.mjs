import test from "ava";
import { assertTarStreamEntries } from "./assertions.mjs";

test("fetch entries", async t => {
  const base =
    "https://raw.githubusercontent.com/k0nsti/browser-stream-tar/main/tests/fixtures/";

  const response = await fetch(base + "test.tar");

  await assertTarStreamEntries(
    t,
    response.body,
    ["a.txt", "b.csv", "z.doc"],
    async name => {
      const response = await fetch(base + name);
      return response.body;
    }
  );
});
