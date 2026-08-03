---
title: Container With Most Water
publishedAt: 2026-08-03
source: "leetcode"
url: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/description/"
tags:
  - sliding window
---

문제는 최대 이익을 내는 매수와 매도 시점을 찾는 것이다. 문제를 처음 보고 든 생각은 매수 시점과 매도 시점을 가리키는 포인터를 사용하여 모든 조합을 탐색하는 것이다.

가장 단순한 풀이는 모든 조합을 확인하는 것이다.

```ts
// i: 매수 시점, j: 매도 시점
// i < j
let maxProfit = 0;
for (let i = 0; i < prices.length; i++) {
  const buyPrice = prices[i];
  for (let j = i + 1; j < prices.length; j++) {
    const sellPrice = prices[j];
    const profit = sellPrice - buyPrice;
    maxProfit = Math.max(maxProfit, profit);
  }
}
```

이 알고리즘은 O(n^2) 시간 복잡도를 가지며, n이 커질수록 비효율적이다. 따라서 더 효율적인 방법을 찾아야 한다. 사고의 전환이 필요하다. 모든 조합을 확인하는 대신, 매수 시점과 매도 시점을 한 번의 순회로 찾는 방법을 생각해보자.

## 한쪽 고정하기.

이중 루프가 필요한 이유는 두 시점을 한꺼번에 찾으려 하기 때문이다. 그 대신, 한쪽 시점을 고정해보자. i를 매도 시점으로 고정하고 그 이전의 최소 가격을 찾아보자. 그렇게 하면 i 시점의 최대 이익을 구할 수 있다. 최소 가격을 찾을 때 매 루프마다 찾는 것이 아니라 지금까지 찾은 최소 가격을 저장해두고 비교하면 된다. 이렇게 하면 O(n) 시간 복잡도로 문제를 해결할 수 있다.

```ts
// Pseudocode
for (let i = 0; i < prices.length; i++) {
  const profit = prices[i] - minPrice;
  maxProfit = Math.max(maxProfit, profit);
}
```

한 가지 더 고려해야하는 것은 만약 현재 가격이 최소가격보다 낮다면, 최소가격을 업데이트 해줘야 한다.

```ts
for (let i = 0; i < prices.length; i++) {
  if (prices[i] < minPrice) {
    minPrice = prices[i];
  } else {
    const profit = prices[i] - minPrice;
    maxProfit = Math.max(maxProfit, profit);
  }
}
```

우리는 루프의 불변식을 다음과 같이 정의할 수 있다.

```
minPrice:
현재 날짜 이전까지 확인한 가격 중 최솟값

maxProfit:
현재 날짜까지 만들 수 있었던 최대 이익
```

이 문제를 통해 얻을 수 있는 핵심 인사이트는 두 개의 선택을 동시에 찾기 어렵다면 한쪽을 고정해 문제를 단순화할 수 있다는 것이다. 현재 날짜를 매도일로 고정하면 최선의 매수일은 이전 가격 중 최솟값으로 자연스럽게 결정된다. 또한 과거 전체를 반복해서 탐색하는 대신, 미래의 판단에 필요한 과거의 핵심 정보만 하나의 상태로 압축해서 유지할 수 있다.

## Code

```ts
function maxProfit(prices: number[]): number {
  let maxProfit = 0;
  let minPrice = Infinity;

  for (let i = 0; i < prices.length; i++) {
    if (prices[i] < minPrice) {
      minPrice = prices[i];
    } else {
      maxProfit = Math.max(maxProfit, prices[i] - minPrice);
    }
  }

  return maxProfit;
}
```
