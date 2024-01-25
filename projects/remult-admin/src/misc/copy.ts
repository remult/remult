import fs from "fs"
fs.writeFileSync(
  "dist/package.json",
  fs.readFileSync("package.json", "utf8"),
  "utf8"
)
