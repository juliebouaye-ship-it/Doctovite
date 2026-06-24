import { runDiagnostic, printDiagnostic } from "./diagnostic.js";

const result = await runDiagnostic();
printDiagnostic(result);
process.exit(result.ok ? 0 : 1);
