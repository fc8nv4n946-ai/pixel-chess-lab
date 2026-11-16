import fs from "node:fs";
import ts from "typescript";
const source = fs.readFileSync("src/art/pieces.ts", "utf8");
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
});
const { sprite } = await import(
  "data:text/javascript;base64," + Buffer.from(outputText).toString("base64")
);
for (const c of ["w", "b"])
  for (const p of ["p", "n", "b", "r", "q", "k"])
    fs.writeFileSync(
      `public/pieces/${c}${p}.svg`,
      decodeURIComponent(sprite(c, p).split(",")[1]),
    );
console.log("Generated 12 original pixel sprites.");
