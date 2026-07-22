---
title: Running Sum of 1d Array
publishedAt: 2026-07-23
source: "leetcode"
url: "https://leetcode.com/problems/running-sum-of-1d-array/"
tags:
  - array
  - prefix sum
---

## 문제의 제약조건이 의미하는 것은?

- 문제의 제약조건을 먼저 파악해보자. 문제의 제약조건을 통해 우리가 알 수 있는 것은 무엇인가?
  - 어떤 시간복잡도를 가진 알고리즘이 가능한가?
  - 어떤 자료형을 사용해야 하는가?
  - 입력으로 들어온 데이터의 최소 값, 길이는 어느정도인가?
- 입력으로 들어오는 배열의 길이에 따라 출제자의 의도를 알 수 있다.
- 이 문제 같은 경우 배열의 최대 길이 는 1,000 정도다.
- 따라서 O(n^2) 도 어느정도가능하다. 하지만 더 효율적인 방법도 존재한다는 점을 유의.

# 누적합을 통해 얻을 수 있는 이점.

- 핵심은 이전 계산 결과를 저장하여 중복계산을 제거한다는 것이다.
- 가장 단순한 형태는 다음과 같다.

```
nums = [1, 2, 3, 4]

result[0] = 1
result[1] = 1 + 2
result[2] = 1 + 2 + 3
result[3] = 1 + 2 + 3 + 4
```

- 현재 값을 구하기 위해 처음부터 다시 계산한다.

```
result = []

for i in range(len(nums)):
    total = 0

    for j in range(i + 1):
        total += nums[j]

    result.append(total)
```

> 단순한 방법은 각 인덱스의 누적합을 구할 때마다 배열의 처음부터 해당 인덱스까지 다시 순회하므로 `O(n²)`의 시간이 필요하다. 누적합은 이전 인덱스까지 계산한 합에 현재 값만 더하여 계산 결과를 재사용하므로, 한 번의 순회인 `O(n)`에 모든 인덱스의 누적합을 구할 수 있다.

## 문제 풀이.

- 문제는 단순하다.

```
Input: nums = [1,2,3,4]
Output: [1,3,6,10]
Explanation: Running sum is obtained as follows: [1, 1+2, 1+2+3, 1+2+3+4].
```

- result[i] = nums[0] + ... + n[i]
- result[0] = nums[0]
- result[1] = nums[0] + nums[1]
- result[2] = nums[0] + nums[1] + nums[2]
- 이런 식으로 흘러간다.
- 하지만 여기서 우리는 이전 계산이 반복되고 있는 것에 주목해야 한다.

```
result[1] = nums[0] + nums[1]
result[2] = nums[0] + nums[1] + nums[2] same as
result[2] = result[1] + nums[2]
```

- 이전 계산이 반복되고 있기 때문에 이전 계산 결과를 어딘가에 저장하여 재활용할 수 있어야 한다. 말하자면 계산 결과를 캐싱하는 것이다.

```ts
let runningSum = 0;
const prefixSums = [];

for (const n of prefixSums) {
  runningSum += n;
  prefixSums.push(runningSum);
}
```

- 코드 풀이는 다음과 같다.

```ts
function runningSum(nums: number[]): number[] {
  let sum = 0;
  const prefix = [];
  for (const n of nums) {
    sum += n;
    prefix.push(sum);
  }

  return prefix;

```
