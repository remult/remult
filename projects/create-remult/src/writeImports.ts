export function writeImports(imports: Import[]) {
  return (
    imports
      .map(({ from, imports }) =>
        typeof imports === "string"
          ? `import ${imports} from "${from}";`
          : `import { ${imports.join(", ")} } from "${from}";`,
      )
      .join("\n") + "\n\n"
  );
}

export type Import = {
  from: string;
  imports: string | string[];
};
