import type { ServerInfo } from "./FRAMEWORKS";

export function writeImports(imports: Import[], server: ServerInfo) {
  return (
    imports
      .map(({ from, imports }) => {
        if (server.doesNotLikeJsFileSuffix && from.endsWith(".js"))
          from = from.substring(0, from.length - 3);
        return typeof imports === "string"
          ? `import ${imports} from "${from}";`
          : `import { ${imports.join(", ")} } from "${from}";`;
      })
      .join("\n") + "\n\n"
  );
}

export type Import = {
  from: string;
  imports: string | string[];
};
