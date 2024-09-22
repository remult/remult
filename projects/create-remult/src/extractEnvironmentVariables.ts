export function extractEnvironmentVariables(code: string) {
  const envVariables: string[] = [];
  let match;
  const envVariableRegex = /process\.env\[['"](.+?)['"]\]/g;
  while ((match = envVariableRegex.exec(code ?? "")) !== null) {
    envVariables.push(match[1]);
  }
  return envVariables.filter(
    (value, index) => envVariables.indexOf(value) === index,
  );
}
