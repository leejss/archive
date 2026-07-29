---
title: Container With Most Water
publishedAt: 2026-07-29
source: "leetcode"
url: "https://leetcode.com/problems/container-with-most-water/description/"
tags:
  - two pointers
---

## 문제 풀이

문제는 가장 큰 면적이 되는 Container를 찾는 것이다. 면적은 너비 X 높이다. 너비는 양쪽 index의 차이로 구해진다. 0-indexed 이기 때문에 index의 차이로 구할 수 있다. 높이가 중요하다. 높이는 더 낮은 height 값으로 정해진다. 예를 들어 `height[1]`이 `4`고 `height[4]`가 `100`인 경우, (1,4)의 면적은 `3 * 4` 로 `12`가 된다.

```
height = [1,8,6,2,5,4,8,3,7]
```

인 경우, 가장 큰 면적은 (1, 8), 즉 7 * 7 = 49 다.

---

이제 가장 큰 면적이 되는 Pair (left, right) 를 구해야 한다. 두 개의 포인터를 활용할 수 있다. 가장 큰 면적을 구해야 하기 때문에 가장 큰 너비에서 시작해야 한다. 그래서 배열의 양쪽에서 시작한다.

```ts
// input is nums
let left = 0;
let right = nums.length - 1;
```

이제 루프 로직을 작성해야 한다. 어떻게 하면 최대 면적을 구하는 방향으로 루프를 구성할 수 있을까 이는 즉 어떤 조건으로 왼쪽 또는 오른쪽 포인터를 움직일 수 있을가? 포인터를 움직일때마다 너비는 줄어들게 된다. 너비가 줄어드는 데, 이전보다 같거나 더 낮은 높이가 되면 그건 잘못된 움직임이다. 따라서 포인터는 전체 면적의 높이를 증가할 가능성이 있는 방향으로 이동해야한다. 그러면 높이가 증가하는 방향의 조건은 무엇인가? 높이는 다음과 같이 표현할 수 있다.

```
height = Min(left_height, right_height)
```

왼쪽 높이와 오른쪽 높이 중 더 낮은 값으로 높이가 정해진다. 따라서 우리는 왼쪽 높이와 오른쪽 높이 중 더 낮은 값을 바꿔야 한다. 왜냐하면 더 낮은 값으로 높이가 정해지기 때문이다. 코드로 간략히 표현하면 다음과 같다.

```ts
if (left_height < right_height) {
  // move left
  left++;
} else {
  // move right
  right--;
}
```

그리고 매 루프마다 면적을 계산하여 이전에 기록된 최대 면적과 비교하고 갱신해주면 된다.

## Code

```ts
function maxArea(height: number[]): number {
  let left = 0;
  let right = height.length - 1;
  let maxArea = 0;

  while (left < right) {
    const h = Math.min(height[left], height[right]);
    const w = right - left;
    const a = h * w;
    maxArea = Math.max(maxArea, a);

    if (height[left] < height[right]) {
      left++;
    } else {
      right--;
    }
  }
  return maxArea;
}
```

## 핵심 인사이트

이 문제를 통해 배울 수 있는 핵심 인사이트는 정답이 될 수 없는 행동을 제거하는 것이다. 정답을 찾아서 이동하는 것이 아니라 정답이 아닐 수 밖에 없는 행동을 제거함으로써 정답을 찾아가는 것이다. 이 인사이트는 포인터의 이동으로 이어진다. 어떤 포인터를 이동할 때, 어느 쪽을 이동시킬 지를 정해야 한다. 여기서 선택을 할 때 그 기준은 정답이 될거라고 생각하는 곳을 이동시키는 게 아니라 정답이 절대 될 수 없는 곳을 제거하는 것이다. 이 문제에서는 높이가 더 높은 쪽을 이동시키는 것은 아무 의미가 없다. 왜냐하면 높이는 더 낮은 쪽으로 정해지기 때문이다. 따라서 높은 쪽은 후보에서 제거한다. 더 낮은 쪽을 가리키는 포인터를 이동시킨다.
