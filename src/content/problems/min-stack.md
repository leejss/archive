---
title: Min Stack
publishedAt: 2026-08-02
source: "leetcode"
url: "https://leetcode.com/problems/min-stack/"
tags:
  - stack
---

MinStack은 일반적인 스택 구현에 getMin() 메서드를 추가한 스택이다. getMin() 메서드는 스택의 최소값을 constant time으로 반환해야 한다. 최소값을 반환하기 위해서는 최소값을 어딘가 저장해야 한다. 스택에 값이 push 또는 pop 할 때마다 최소값을 갱신해야 한다.

단순하게 접근 하면 최소값을 변수 하나에 저장하는 방식을 생각해 볼 수 있다.

```ts
class MinStack {
  private stack: number[] = [];
  private min: number | null = null;

  // ...

  getMin(): number | null {
    return this.min;
  }
}
```

push할때마다 이전 최소값과 들어오는 값을 비교해서 갱신한다.

```ts
push(val: number): void {
  this.stack.push(val);
  if (this.min === null || val < this.min) {
    this.min = val;
  }
}

```

하지만 문제는 pop, 즉 스택에서 값을 제거할 때 발생한다. 만약 pop으로 최소값을 제거하면 최소값을 갱신해야 하는데, constant time으로 어떻게 갱신할 수 있을까? 최소값을 다시 찾아서 갱신해야 하기 때문에 O(n)이 걸린다. 따라서 최소값을 단일 변수로 저장하는 방식은 사용할 수 없다.

## 스택 사용하기

스택은 후입선출 특성을 가진다. 이 특성은 최신 변경이력을 관리하는 데 적합하다. 스택에서 POP을 하게 되면 자연스럽게 이전 상태로 돌아간다.  
이 아이디어를 이 문제에 적용하면 최소값 변경 이력을 스택으로 관리할 수 있다. 매 PUSH마다 최소값을 같이 PUSH하고 POP할 때도 최소값을 스택에서 POP하면 된다. 이러면 자연스럽게 가장 최근의 최소값을 얻을 수 있다. getMin은 최소값 스택에서 TOP만 반환하면 된다.

## 구현

```ts
class MinStack {
  values: number[] = [];
  mins: number[] = [];

  push(value: number): void {
    const currentMin =
      this.mins.length === 0
        ? value
        : Math.min(value, this.mins[this.mins.length - 1]);
    this.values.push(value);
    this.mins.push(currentMin);
  }

  pop(): void {
    this.values.pop();
    this.mins.pop();
  }

  top(): number {
    const len = this.values.length - 1;
    return this.values[len];
  }

  getMin(): number {
    const len = this.mins.length - 1;
    return this.mins[len];
  }
}
```

## 정리

Min Stack 문제의 핵심은 스택에서 최소값을 찾는 것 자체가 아니라, 최소값을 항상 O(1)에 조회할 수 있도록 상태를 어떻게 설계할 것인가에 있다.

일반적인 스택에 값만 저장하면 현재 최소값이 제거되었을 때 이전 최소값을 다시 알기 어렵다. 스택 전체를 순회해서 최소값을 다시 계산할 수는 있지만, 그러면 pop이나 getMin 연산이 O(n)이 된다. 따라서 이 문제에서는 현재 값뿐 아니라, 그 값이 추가된 시점의 최소값도 함께 저장해야 한다.

여기서 중요한 사고방식은 계산 결과를 필요할 때 다시 구하지 않고, 상태가 변경되는 순간 미리 계산해서 저장하는 것이다. push할 때 새 값과 이전 최소값을 비교해 현재 최소값을 기록해두면, getMin은 단순히 저장된 값을 읽기만 하면 된다. 이는 추가 공간을 사용해서 반복 계산을 제거하는 전형적인 시간과 공간의 교환이다.

스택은 이전 상태를 복구하는 데도 적합하다. 가장 최근에 추가된 값이 가장 먼저 제거되기 때문에, 각 시점의 최소값을 스택 순서대로 저장해두면 pop 이후의 top이 자연스럽게 이전 상태를 나타낸다. 별도의 최소값 스택을 사용할 수도 있고, 각 원소를 값과 그 시점의 최소값을 묶은 형태로 저장할 수도 있다. 두 방식은 표현만 다를 뿐 핵심 원리는 같다.

이 문제에서 유지해야 할 불변식은 스택의 top에 저장된 최소값이 현재 스택 전체의 최소값이라는 것이다. push할 때 이 불변식을 갱신하고, pop할 때 현재 상태를 제거하면 이전 원소에 저장된 최소값이 다시 드러난다. 최소값이 중복으로 저장되는 것은 불필요한 낭비가 아니라, 각 시점의 상태를 O(1)에 복구하기 위해 의도적으로 저장한 정보다.

결국 Min Stack이 주는 핵심 교훈은 데이터 구조에 요구되는 연산이 느리다면, 그 연산을 매번 계산하려 하지 말고 상태 변경 시 필요한 보조 정보를 함께 저장하라는 것이다. 즉, 원본 데이터만 저장하는 것이 아니라 앞으로 자주 필요할 계산 결과까지 데이터 구조의 일부로 설계하는 문제다.
