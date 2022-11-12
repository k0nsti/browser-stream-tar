import test from "ava";
import { assertTarStreamEntries, tars } from "./assertions.mjs";

test("fetch entries", async t => {
  const base =
    "https://raw.githubusercontent.com/k0nsti/browser-stream-tar/main/tests/fixtures/";

  for (const [name, entries] of Object.entries(tars)) {
    const response = await fetch(base + name);

    await assertTarStreamEntries(t, response.body, entries, async name => {
      const response = await fetch(base + name);
      return response.body;
    });
  }
});
