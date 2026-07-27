---
title: Valid Palindrome
publishedAt: 2026-07-27
source: "leetcode"
url: "https://leetcode.com/problems/valid-palindrome/"
tags:
  - array
  - two pointers
---

## Two Pointers

문제를 읽고 드는 가장 단순한 생각은 문자열을 정규화한 다음에 문자열을 뒤집어서 원래 문자열과 같은지 비교하는 것이다.

```ts
function isPalindrome(s: string): boolean {
  const normalized = s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const reversed = normalized.split("").reverse().join("");
  return normalized === reversed;
}
```

하지만 이 풀이는 문자열을 뒤집는 과정에서 O(n) 공간 복잡도를 가지게 된다. 공간복잡도를 줄이기 위해서 Two Pointers 기법을 사용할 수 있다. 문자열의 양 끝에서 시작하여 중앙으로 이동하면서 문자를 비교하는 방식이다.
이 문제가 왜 Two Pointers 기법을 사용할 수 있는지 이해하기 위해서는 Palindrome의 정의를 이해해야 한다. Palindrome은 앞에서 읽으나 뒤에서 읽으나 같은 문자열을 의미한다. 즉, 문자열의 양 끝의 관계에 의해서 정의가 된다. 여기서는 문자열 양 끝이 서로 같아야 한다. 따라서 우리는 문자열 양 끝의 쌍을 서로 비교하는 방식을 사용할 수 있다. 이때 문자열의 양 끝을 가리키는 포인터를 사용하여 비교를 진행한다.

풀이를 자연어로 옮기면 다음과 같다.

```
왼쪽 포인터를 첫 문자에 둔다.
오른쪽 포인터를 마지막 문자에 둔다.

아직 양쪽에 비교할 문자가 남아 있다면:
    양쪽 문자를 비교한다.

    다르면 팰린드롬이 아니다.
    같으면 두 포인터를 안쪽으로 이동한다.

모든 비교가 끝나면 팰린드롬이다.
```

## Moving and Stopping Pointers (Looping condition)

투 포인터 문제는 포인터 이동과 포인터 정지 조건을 정의하는 것이 중요하다. 여기서 포인터 이동은 단순히 왼쪽 포인터는 오른쪽으로, 오른쪽 포인터는 왼쪽으로 이동하는 것이다. 하지만 포인터 정지 조건은 조금 더 복잡하다. 왜냐하면 문자열에는 알파벳과 숫자만 고려해야 하기 때문이다. 따라서 알파벳이나 숫자가 아닌 문자를 만나면 포인터를 이동시키고, 알파벳이나 숫자를 만날 때까지 반복한다.

포인터의 의미를 다시 생각해보자. 포인터를 단순히 왼쪽과 오른쪽으로 생각하면 풀이를 제대로 이해하기 힘들다. 왼쪽과 오른쪽이 무엇을 나타내는지를 생각해야 한다. 이 문제에서 포인터는 다음 의미를 같는다.

```
left → 아직 비교하지 않은 가장 왼쪽 문자
right → 아직 비교하지 않은 가장 오른쪽 문자
```

한 번의 루프에서 두 쌍의 값을 비교한다.

`while(left < right)` 조건이 무엇을 의미하는지 이해해야 한다. 이를 단순히 `left`가 `right`보다 작은 동안이라고 이해하면 알고리즘의 의미가 잘 드러나지 않는다. 이를 재해석하면 '아직 비교하지 않은 양쪽 문자 쌍이 남아 있는 동안 반복한다.' 이라고 이해하는 것이 좋다.

```
# 길이가 홀수인 경우
abcba -> left = 1, right = 3 일때 루프는 멈춘다.

# 길이가 짝수인 경우
abba -> left = 1, right = 2 일때 루프는 멈춘다.
```

## 풀이

```ts
function isPalindrome(s: string): boolean {
  let left = 0;
  let right = s.length - 1;

  while (left < right) {
    while (left < right && !isAlphaNumeric(s[left])) {
      left++;
    }

    while (left < right && !isAlphaNumeric(s[right])) {
      right--;
    }

    if (s[left].toLowerCase() !== s[right].toLowerCase()) {
      return false;
    }

    left++;
    right--;
  }

  return true;
}

function isAlphaNumeric(char: string): boolean {
  const code = char.charCodeAt(0);

  const isNumber = code >= 48 && code <= 57;
  const isUppercase = code >= 65 && code <= 90;
  const isLowercase = code >= 97 && code <= 122;

  return isNumber || isUppercase || isLowercase;
}
```
