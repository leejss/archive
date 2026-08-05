---
title: Longest Substring Without Repeating Characters
publishedAt: 2026-08-05
source: "leetcode"
url: "https://leetcode.com/problems/longest-substring-without-repeating-characters/description/"
tags:
  - sliding window
---

이 문제는 문자열 s가 주어졌을 때, 같은 문자가 반복되지 않는 가장 긴 부분 문자열의 길이를 구하는 문제다.

문제를 처음 보고 드는 생각은 start 부터 end 까지 substring을 만들어 나가면서 중복이 있는지 체크하는 것이다.

```ts
let maxLength = 0;
for (let start = 0; i < s.length - 1; start++) {
  const set = new Set<string>();
  for (let end = start + 1; end < s.length; end++) {
    if (set.has(s[end])) {
      maxLength = Math.max(maxLength, end - start);
      break;
    }
    set.add(s[end]);
  }
}
```

하지만 이 방법은 O(n^2) 시간복잡도를 가지기 때문에 효율적이지 않다.

## 슬라이딩 윈도우

부분 문자열은 연속하는 구간이라는 성질을 가진다. 연속하는 구간에 관련한 문제 풀이 기법에 "슬라이딩 윈도우"가 있다. 슬라이딩 윈도우는 배열이나 문자열의 연속된 구간을 유지하면서, 그 구간을 한 칸씩 이동시키는 문제 해결 기법이다. 조건에 만족하면 구간안에 포함하고, 조건에 만족하지 않으면 구간에서 제외한다. 이 문제에서는 중복되는 문자가 없도록 구간을 유지하는 것이 조건이 된다.

구간을 코드로 표현할 수 있어야 한다.

```
left  : 윈도우의 시작
right : 윈도우의 끝
---
right 이동 → 윈도우 확장
left 이동  → 윈도우 축소
```

예를 들어

```
a b c d e
↑
L,R

에서 right가 움직이면 윈도우는

[a b c]
 ↑   ↑
 L   R

이렇게 되고, 조건이 깨지면

a [b c]
   ↑ ↑
   L R


구간은 축소된다.
```

따라서 구간 움직임은 다음 로직을 따른다.

```
확장 → 조건 위반 → 축소 → 다시 유효
```

구간의 길이가 가변적으로 변한다.
코드로 간략히 나타내보면 다음과 같다.

```ts
let left = 0;
for (let right = 0; right < s.length; right++) {

  if (condition not met) {
    // left를 증가시켜서 구간을 축소한다.
  }


  // right을 증가한다 -> 순회하면서 윈두우를 확장한다.

}
```

## 문제 풀이

다시 문제로 돌아와서, 중복되는 문자가 없는 가장 긴 부분 문자열을 찾는 문제를 슬라이딩 윈도우로 해결해보자. 우리는 "중복이 없는 구간의 상태"를 알 수 있어야 한다. 이를 위해 Set 데이터 구조를 사용한다. Set은 구간의 상태를 나타낸다. 구간을 확장하기 전에 right에 위치한 문자가 Set에 있는지 확인한다. 있다면 Set에서 left에 위치한 문자를 제거하고 left를 이동시켜 구간을 축소 한다. left는 중복문자가 제거될 때 까지 이동한다. 중복이 없다면 Set에 right에 위치한 문자를 추가하고, 구간의 길이를 계산하여 maxLength를 갱신한다.

## 코드

```ts
function lengthOfLongestSubstring(s: string): number {
  let left = 0;
  let maxLength = 0;
  const charSet = new Set<string>();

  for (let right = 0; right < s.length; right++) {
    while (charSet.has(s[right])) {
      charSet.delete(s[left]);
      left++;
    }

    charSet.add(s[right]);
    maxLength = Math.max(maxLength, right - left + 1);
  }

  return maxLength;
}
```

## 핵심 인사이트

두 변수를 이용하여 윈도우의 확장과 축소, 길이를 나타낸다. 그리고 별도 데이터구조, 여기서는 Set을 사용하여 윈도우의 상태를 나타낸다. 윈도우는 연속하는 구간을 표현한다. 따라서 부분문자열 처럼 배열 또는 문자열의 연속된 구간을 다루는 문제의 핵심 기법으로 슬라이딩 윈도우를 활용할 수 있다.
