---
title: Valid Parentheses
publishedAt: 2026-07-30
source: "leetcode"
url: "https://leetcode.com/problems/valid-parentheses/"
tags:
  - stack
---

## 문제 읽기

괄호로만 이루어진 문자열이 주어진 경우 문자열이 유효한지 판단해야 한다. 괄호가 올바른 순서로 이루어 져야 하며, 짝이 맞아야 한다. 그리고 열린 괄호는 반드시 닫혀야 한다. 괄호에 순서에 주목해야 한다.  
한번 열린 괄호는 반드시 닫혀야 하는데, 가낭 늦게 열린 괄호가 가장 빨리 닫혀야 한다. 가장 늦은 것을 가장 빠르게 처리해야 할때 이를 처리할 수 있는 데이터 구조로 스택을 떠올릴 수 있다. 스택은 Last In First Out(후입선출) 특성을 지닌다. 스택에서 꺼낸 무언가는 가장 최근에 넣은 무언가다. 이러한 특성은 괄호의 유효한 구조와 일치한다.

따라서 자연어로 문저 풀어보면 이렇게 풀 수 있다.

```
문자열을 왼쪽부터 순회한다.
열린 괄호를 만나면 아직 닫히지 않은 괄호이므로 스택에 넣는다.
닫힌 괄호를 만나면 가장 최근에 열린 괄호와 짝을 이루어야 한다. 따라서 스택의 맨 위를 확인한다.
스택이 비어 있거나, 맨 위의 열린 괄호가 현재 닫힌 괄호와 짝이 아니라면 유효하지 않다.
짝이 맞으면 스택에서 열린 괄호를 제거한다.
문자열을 모두 확인한 뒤 스택이 비어 있다면 모든 열린 괄호가 올바르게 닫힌 것이므로 유효하다. 스택에 괄호가 남아 있다면 닫히지 않은 괄호가 존재하므로 유효하지 않다.
```

## Code

```ts
function isValid(s: string): boolean {
  const stack: string[] = [];

  const pairs: Record<string, string> = {
    ")": "(",
    "]": "[",
    "}": "{",
  };

  for (const char of s) {
    if (char === "(" || char === "[" || char === "{") {
      stack.push(char);
      continue;
    }

    const top = stack.pop();

    if (top !== pairs[char]) {
      return false;
    }
  }

  return stack.length === 0;
}
```
