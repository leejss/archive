---
title: Top K Frequent Elements
publishedAt: 2026-07-22
source: "leetcode"
url: "https://leetcode.com/problems/top-k-frequent-elements/description/"
tags:
  - array
  - sort
  - bucket sort
---

## 문제 제약조건

```
Constraints:

1 <= nums.length <= 10^5
-10^4 <= nums[i] <= 10^4
k is in the range [1, the number of unique elements in the array].
It is guaranteed that the answer is unique.

Follow up: Your algorithm's time complexity must be better than O(n log n), where n is the array's size.
```

-

- 배열의 길이가 최대 10^5 로, Brute force로 풀 수 없다.
- 그리고 O(n log n)보다 효율적이어야 하기 때문에 단순 정렬로는 안된다.

## 문제 분석.

- 먼저 k에 대해 이해 한다. k는 상위 빈도 아이템 개수를 말한다.
- 예를 들어 배열에 1이 4개, 2가 3개, 3이 2개 일때, 상위 빈도 아이템 두 개를 고르라 하면 1과 2를 고를 수 있다. 여기서 두 개가 K에 해당한다.
- 즉, 이 문제는 기본적으로 배열 내 아이템의 빈도 수를 계산하여 저장하는게 필요하다.
- 코드로 나타내면 다음과 같다.

```ts
const frequency = new Map<number, number>();
for (const n of nums) {
  frequency.set(n, (frequency.get(n) ?? 0) + 1);
}
```

- 이때 빈도 수 계산을 위해 전체 배열을 순회를 한다. O(n) 비용이 발생한다.
- `frequency`는 key가 아이템이고, value가 빈도 수다.
- `frequency`를 가지고 정렬하면 top k 요소를 구할 수 있지만, 해결책은 O(n log n) 보다는 나아야 한다.
- 여기서 새로운 아이디어가 필요하다. 데이터 구조의 전환이 필요하다.
- key가 빈도수 이고 값이 요소인 구조를 생각해보자. 그런데 여기서 중요한 건, 해시맵을 사용하지 않고 배열에서 (빈도수, 요소)를 표현할 방법을 생각해보자.
- 이때 Bucket 이라는 개념이 등장한다.
- Bucket은 배열 데이터 구조를 가진다. 그런데 index가 빈도 수 이고 그 index에 들어 있는 값은 그 빈도를 가진 요소다.

```

bucket[4] = [1]
bucket[3] = [2]
bucket[2] = [3]

```

- 위 형태는 빈도 4 -> 1, 빈도 3 -> 2, 빈도 2 -> 3 을 표현한다.
- 그 다음 bucket을 역순으로 순회하면, 높은 빈도수 부터 검사할 수 있다.

## 풀이. 사고를 코드로 옮기기.

### Typescript

```ts
function topKFrequent(nums: number[], k: number): number[] {
  // build counter
  const frequency = new Map<number, number>();

  for (const n of nums) {
    frequency.set(n, (frequency.get(n) ?? 0) + 1);
  }

  // build bucket
  const bucket: number[][] = Array.from({ length: nums.length + 1 }, () => []);

  // key -> frequency, value -> items
  for (const [n, counter] of frequency) {
    bucket[counter].push(n);
  }

  // build result
  const result: number[] = [];
  for (let i = nums.length; i >= 1; i--) {
    for (const n of bucket[i]) {
      result.push(n);
      if (result.length === k) return result;
    }
  }
  return result;
}
```

## Mental Model

- 배열의 인덱스가 무엇을 가리키는지 다시 생각해보자.
- 배열의 인덱스는 position이 아닌, key가 될 수 있다.
- 배열의 위치가 무엇을 나타내는 지 생각해본다. 여기서는 배열의 위치가 빈도를 나타낸다. 빈도에 따라 정렬이 된다.
- 데이터 구조의 변환을 다룬다. 여기서는 아이템 -> 빈도 구조를 빈도 -> 아이템 구조로 변환한다.
