import {
  inspectCurriculum,
  importCurriculum,
  prepareCurriculum,
} from "../src/modules/curriculum-import";
import { pool } from "../src/server/db";
const [command = "check", input = "../kazanim", output] = process.argv.slice(2);
try {
  if (command === "import")
    console.log(JSON.stringify(await importCurriculum(input)));
  else if (command === "prepare" && output)
    console.log(JSON.stringify(await prepareCurriculum(input, output)));
  else if (command === "check") {
    const d = await inspectCurriculum(input);
    console.log(
      JSON.stringify({
        id: d.id,
        warnings: d.warnings,
        ...d.summary,
        coverage: undefined,
      }),
    );
  } else
    throw Error(
      "Usage: curriculum check|import <dataset> OR curriculum prepare <dataset> <new-directory>",
    );
} finally {
  await pool.end();
}
