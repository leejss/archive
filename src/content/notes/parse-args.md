---
title: parseArgs
publishedAt: 2025-09-01
tags: []
---

# parseArgs

```txt
config -> parseArgs -> values
```

## Option, Positional

```js
import { parseArgs } from "node:util"


// option
const {values} = parseArgs({
  args: process.argv.slice(2),
  options: {
    help: {
      type: "boolean",
      short: "h",
      default: false,
    }
    
  }
})

console.log(values.help) // false

if (values.help) {
  // printHelpMessage()
}

// positional
const { positionals } = parseArgs({
  args: process.argv.slice(2),
  allowPositionals: true,
});

const [source, destination] = positionals;
// Validate args, ensure source exists, ensure destination dir exists
if (!source || !destination) {
  console.error("Usage: node parsing.mjs <source> <destination>");
  process.exit(1);
}

if (!existsSync(source)) {
  console.error(`Source not found: ${source}`);
  process.exit(1);
}

const destDir = dirname(destination);
if (destDir && !existsSync(destDir)) {
  mkdirSync(destDir, { recursive: true });
}

copyFileSync(source, destination);


```
