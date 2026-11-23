// Copies the synthetic demo export into public/ so the "Load demo data" button works.
import { copyFileSync, mkdirSync } from "node:fs";
mkdirSync(new URL("../public/demo/", import.meta.url), { recursive: true });
copyFileSync(new URL("../../data/synthetic/phire_demo_export.xlsx", import.meta.url), new URL("../public/demo/phire_demo_export.xlsx", import.meta.url));
console.log("copied synthetic demo export to public/demo/");
