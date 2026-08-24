---
title: Product of Array Except Self
publishedAt: 2026-07-24
source: "leetcode"
url: "https://leetcode.com/problems/product-of-array-except-self/description/"
tags:

- array
- prefix sum
---

## 문제 이해하기

- 문제의 불변 성질을 발견한다.
- $\text{Result}[i] = (\text{index } i \text{ 왼쪽 요소들의 곱}) \times (\text{index } i \text{ 오른쪽 요소들의 곱})$
- $\text{Prefix}[i] = \text{Prefix}[i-1] \times \text{nums}[i-1]$
- $\text{Suffix}[i] = \text{Suffix}[i+1] \times \text{nums}[i+1]$

- 자기 자신을 제외한 나머지 요소들의 곱을 구하는 문제이기 때문에, 자기 자신을 기준으로 왼쪽 곱과 오른쪽 곱을 서로 곱하는 문제로 이해한다.
- 순회 시, 인덱스 i일때 매번, 0 ... i -1, i + 1 ... n 까지 구하면 O(n ^ 2) 의 시간복잡도가 걸린다.
- 누적배열을 사용하여 계산 결과를 저장한다.

```ts
// nums is input array
// n is length of nums
const prefix = new Array(n).fill(1)
for (let i = 1; i < n; i++) {
  prefix[i] = prefix[i -1] * nums[i - 1]
}

// 또는
const prefix = new Array(n)
let product = 1
for (let i = 0; i < n; i++) {
    prefix[i] = product
    product *= nums[i]
}

const suffix = new Array(n).fill(1)
for (let i = n - 2; i >=0; i--) {
  suffix[i] = suffix[i + 1] * nums[i + 1]
}

// 또는
const suffix = new Array(n)
let product = 1
for (let i = n - 1; i >=0; i--) {
    suffix[i] = product
    product *= nums[i]
}

```

- 인덱스 i에 대한 왼쪽곱과 오른쪽곱을 구했으면 두 값을 서로 곱하면 된다.
- `answer[i] = prefix[i] * suffix[i]`

## 풀이

```ts
function productExceptSelf(nums: number[]): number[] {
  const prefix = new Array<number>(nums.length).fill(1);
  const suffix = new Array<number>(nums.length).fill(1);
  const result = new Array<number>(nums.length);

  for (let i = 1; i < nums.length; i++) {
    prefix[i] = prefix[i - 1] * nums[i - 1];
  }

  for (let i = nums.length - 2; i >= 0; i--) {
    suffix[i] = suffix[i + 1] * nums[i + 1];
  }

  for (let i = 0; i < nums.length; i++) {
    result[i] = prefix[i] * suffix[i];
  }

  return result;
}

```

### 공간 복잡도 줄이기

- 누적값 저장을 위해 prefix와 suffix를 생성했다.
- 하지만 우리가 필요한 건 누적값이지 모든 index 마다의 결과가 아니다. 
- 따라서 단일 변수를 사용해서 누적값을 추적하면 추가공간이 필요 없다.

```ts
function productExceptSelf(nums: number[]): number[] {
    const n = nums.length
    const answer = new Array(n)

    let product = 1

    for (let i = 0; i < n; i++) {
        answer[i] = product
        product *= nums[i]
    }

    product = 1

    for (let i = n-1; i >= 0; i--) {
        answer[i] = answer[i] * product
        product *= nums[i]
    }

    return answer
    
};
```

## 멘탈 모델

- 이전 단계의 결과에 현재 값만 연산하여 O(1)에 값을 도출하는 점화식 테크닉을 기억하자. 대표적인 예는 이 문제에서 사용하는 구간 곱
- 정방향으로 정보를 수집한 뒤, 역방향으로 정보를 조합하는 기법을 기억하자.
