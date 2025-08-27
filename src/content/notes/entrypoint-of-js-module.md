---
title: Entrypoint of js module
publishedAt: 2025-08-27
tags: []
---

## Importing a module

```ts
// a.ts
export class App {
  run(msg: string = "") {
    console.log("App is running", msg);
  }
}

const app = new App();
app.run("a.ts");


// b.ts
import { App } from "./a.js";

const app = new App();
app.run("b.ts");
```

```shell

tsx b.ts 

# App is running b.ts
# App is running a.ts

```

Import 하는 순간 a.ts는 실행된다. -> 다른 코드에서 불러오기만 해도 앱이 실행되는 문제.

직접 실행과 모듈로서 실행하는 방식 구분 필요.

## Entrypoint of module

```ts

// esm
if (import.meta.url === `file://${process.argv[1]}`) {
  // entrypoint of program
}

// cjs
if (require.main === module) { ... }
```

`a.ts`를 아래와 같이 수정

```ts
export class App {
  run(msg: string = "") {
    console.log("App is running", msg);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("a.ts is running on entrypoint");
  const app = new App();
  app.run("a.ts");
}

```

```shell
tsx b.ts
# App is running b.ts


tsx a.ts
# a.ts is running on entrypoint
# App is running a.ts
```

