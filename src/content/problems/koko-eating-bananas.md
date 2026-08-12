---
title: Koko Eating Bananas
publishedAt: 2026-08-12
source: "leetcode"
url: "https://leetcode.com/problems/koko-eating-bananas/description/"
tags:
  - binary search
---

## 문제 읽기

koko는 시간당 k개의 바나나를 먹는다. 한 시간에 하나의 pile만 선택한다. 만약 남아 있는 바나나가 k보다 적으면 다음으로 넘어가지 않는다. pile개의 바나나를 시간당 k개를 먹는 시간은 `ceil(pile/k)` 로 계산할 수 있다. 따라서 시간당 k개를 먹을 때 전체 바나나를 먹는 시간은 `piles[i]` 를 모두 순회하여 더한 값이다. 문제는 최소값이 되는 k를 구하는 것이다.

여기서 사고의 전환이 필요하다. 최소값을 구하려 하지 말고 주어진 값이 정답이 될 수 있는 가부터 보는 것이다.

```
...
k가 4일때 h 안에 먹을 수 있는가?
k가 5일때 h 안에 먹을 수 있는가?
k가 6일때 h 안에 먹을 수 있는가?
...
```

이를 다르게 표현하면 주어진 k가 가능한지 판별할 수 있는가 를 보는 것이다.

이 문제와 관련된 중요한 특성은 단조성이다. 이 문제는 다음 특성을 가진다.

```
k:       1   2   3   4   5   6   7 ...
가능?:    F   F   F   T   T   T   T ...
```

어느 지점 부터 값과 상관없이 True가 된다. 이런 특성을 단조성이라 한다. 이제 우리가 관심 있는 것은 True로 바뀌는 지점을 찾는 것이다.

보통 이분 탐색은 특정 Target을 찾으면 Return 한다. 하지만 이 경우에는 바로 Return 하면 안된다. 왜냐하면 더 작은 값이 존재할 수 있기 때문이다.

단조성을 가지고 있기 때문에 `mid`가 만약 `h`안에 가능하다면 오른쪽은 버려도 된다. 왜냐하면 `mid`가 True면 그 오른쪽도 전부 True이기 때문이다. 그래서 왼쪽으로 구간을 좁힌다.

이렇게 계속 구간을 좁히면서 가능한 mid값을 찾는다. 구간을 더 이상 좁힐 수 없게 된다면 찾은 mid를 return 해준다.

## 코드

```ts
function minEatingSpeed(piles: number[], h: number): number {
  let left = 1;
  let right = Math.max(...piles);
  let answer = right;

  while (left <= right) {
    const mid = Math.floor(left + (right - left) / 2);

    let totalHours = 0;

    for (const pile of piles) {
      totalHours += Math.ceil(pile / mid);
    }

    if (totalHours <= h) {
      // mid는 가능한 속도
      answer = mid;

      // 더 작은 가능한 속도를 찾아본다.
      right = mid - 1;
    } else {
      // mid는 너무 느리다.
      // 더 빠르게 먹어야 한다.
      left = mid + 1;
    }
  }

  return answer;
}
```
