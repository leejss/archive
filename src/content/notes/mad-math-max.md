---
title: Mad Math Max
publishedAt: 2025-08-26
tags: []
---

# Mad Math Max

```js
Math.max([]); // 0
Math.max(...[]); // -Infinity
```

## Math.max가 인자를 Primitive로 변환하는 과정

```js
[].toString(); // ""
Number(""); // 0
Math.max(0); // 0

// 빈 배열을 숫자 0으로 변환.

// -Infinity
Math.max(); // -Infinity
Math.max(...[]); // -Infinity
```

## Helper

```js
function safeMax(arr, fallback = 0) {
  return arr.length ? Math.max(...arr) : fallback;
}
```
