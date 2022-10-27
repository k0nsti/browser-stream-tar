import test from "ava";
import { assertTarStreamEntries } from "./assertions.mjs";

test("fetch entries", async t => {
  const response = await fetch(
    "https://raw.githubusercontent.com/k0nsti/browser-stream-tar/main/tests/fixtures/test.tar"
  );

  await assertTarStreamEntries(t, response.body);
});
