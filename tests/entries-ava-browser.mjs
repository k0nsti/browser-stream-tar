import test from "ava";
import { assertTarStreamFiles, tars } from "./assertions.mjs";

test("fetch files", async t => {
  const base =
    "https://raw.githubusercontent.com/k0nsti/browser-stream-tar/main/tests/fixtures/";

  for (const [name, entries] of Object.entries(tars)) {    
    const response = await fetch(base + name);

    await assertTarStreamFiles(t, response.body, entries, async name => {
      const response = await fetch(base + name);
      return response.body;
    });
  }
});
