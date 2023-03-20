import fs from "fs"

for (let folder of ["react", "angular", "react-next", "vue"]) {
  for (let file of [
    "entities",
    "live-queries",
    "crud",
    "auth",
    "backend-methods",
    "database",
    "deployment",
    "README",
    "sorting-filtering",
    "validation"
  ]) {
    const fileName = `docs/tutorials/${folder}/${file}.md`
    const lines = fs.readFileSync(fileName).toString().split("\n")
    for (let index = 0; index < lines.length; index++) {
      let line = lines[index]
      if (line.trim().startsWith("_")) {
        let codeTitle = lines[index + 2]
        let parts = line.split("_")
        if (codeTitle.includes("html"))
          line = parts[0] + "<!-- " + parts[1] + " -->" + parts[2]
        else line = parts[0] + "// " + parts[1] + parts[2]

        let part = ""
        let fixedPart = ""
        if (codeTitle.includes("{")) {
          let sp1 = codeTitle.split("{")
          let sp2 = sp1[1].split("}")
          part = sp2[0]
          fixedPart = part
            .split(",")
            .map((y) => {
              let ft = y.split("-")
              if (ft.length == 1) return +ft + 2
              else return ft.map((x) => +x + 2).join("-")
            })
            .join(",")
          codeTitle = sp1[0] + "{" + fixedPart + "}" + sp2[1]
        }
        lines[index] = codeTitle
        lines[index + 2] = lines[index + 1]
        lines[index + 1] = line
        console.log({ line, codeTitle, part, fixedPart })
      }
    }
    fs.writeFileSync(fileName, lines.join("\n"))
  }
}
