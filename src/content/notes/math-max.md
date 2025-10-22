---
title: pitfalls of Math.max
publishedAt: 2025-08-26
tags: []
---

# Pitfalls of Math.max

```js

// 배열 내 최대 값 반환 예시.
Math.max(...[1,2,3]); // 3

const data = []
Math.max(data); // 0

// 그런데 빈 배열일 경우 -Infinity를 반환.
// 이는 예상치 못한 동작을 유발할 수 있다.
Math.max(...data); // -Infinity
```

## Math.max가 인자를 Primitive로 변환하는 과정

```js

Math.max([]) // 0


[].toString(); // ""
Number(""); // 0
Math.max(0); // 0

// 빈 배열을 숫자 0으로 변환.

// -Infinity
Math.max(); // -Infinity
Math.max(...[]); // -Infinity
```

## Solution

```js
function safeMax(arr: number[], fallback = 0): number {
  return arr.length ? Math.max(...arr) : fallback;
}

safeMax([]); // 0
safeMax([1,2,3]); // 3
```
