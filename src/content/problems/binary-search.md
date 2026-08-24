---
title: Binary Search
publishedAt: 2026-08-11
source: "leetcode"
url: "https://leetcode.com/problems/binary-search/description/"
tags:
  - binary search
---

이 문제는 Binary Search 알고리즘 구현 문제다. Binary Search는 정렬된 배열에 적용 가능하다. Binary Search의 핵심 통찰은

"가운데 값을 보고, 답이 있을 수 없는 절반을 통째로 버리자." 이다. 우리가 관심 있는 것은 구간의 가운데 값이다. 만약 찾는 값이 가운데 값과 일치하면 바로 해당 인덱스를 반환한다. 찾는 값이 가운데 값보다 작으면 오른쪽 절반을 버리고, 찾는 값이 가운데 값보다 크면 왼쪽 절반을 버린다. 이를 코드로 나타내면 다음과 같다.

```ts
if (nums[mid] === target) {
  return mid;
} else if (target < nums[mid]) {
  right = mid - 1;
} else {
  left = mid + 1;
}
```

left와 right로 구간을 나타낸다. mid는 구간의 중앙 인덱스를 나타낸다. 다음과 같이 구한다.

```ts
let mid = Math.floor((left + right) / 2);
```

이제 루프를 설계한다. 얼마동안 반복해야 할까 ? Binary Search에서는 left와 right로 아직 탐색해야 할 구간을 나타낸다. 찾는 값이 없다면 탐색 구간은 계속 줄어들고, 결국 left > right가 되어 구간이 사라진다. 따라서 [left, right] 구간을 사용하는 Binary Search에서는 left <= right인 동안 반복한다. 다음과 같이 표현할 수 있다.

```ts
while (left <= right) {
  // 반복
}
```

## Code

```ts
function binarySearch(nums: number[], target: number): number {
  let left = 0;
  let right = nums.length - 1;

  while (left <= right) {
    let mid = Math.floor((left + right) / 2);
    if (nums[mid] === target) {
      return mid;
    } else if (target < nums[mid]) {
      right = mid - 1;
    } else {
      left = mid + 1;
    }
  }

  return -1;
}
```
