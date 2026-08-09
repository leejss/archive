---
title: Longest Repeating Character Replacement
publishedAt: 2026-08-09
source: "leetcode"
url: "https://leetcode.com/problems/longest-repeating-character-replacement/description/"
tags:
  - sliding window
---

문제를 처음 봤을 때 풀이가 쉽게 떠오르지 않았다.

문자열 `s`가 주어지고, 최대 `k`개의 문자를 다른 문자로 바꿀 수 있다. 이때 같은 문자로만 이루어진 가장 긴 부분 문자열의 길이를 구하면 된다.

그런데 막상 코드로 옮기려고 하면 갑자기 애매해진다.

`k`번 문자를 바꾼다는 것을 어떻게 코드로 표현해야 하지?

어떤 문자를 어떤 문자로 바꿔야 하지?

A를 B로 바꿔야 하는가, B를 A로 바꿔야 하는가?

모든 경우를 직접 시도해야 하는가?

이 문제에서 내가 막혔던 이유는 **문제의 설명을 그대로 코드로 옮기려고 했기 때문**이었다.

## 문제를 그대로 구현하지 말고 조건으로 바꿔보기

우리가 찾는 것은 연속된 구간이다.

어떤 구간 하나를 이미 선택했다고 생각해보자.

예를 들어 다음과 같은 구간이 있다.

```text
A A B A
```

이 구간을 모두 같은 문자로 만들기 위해 최소 몇 개의 문자를 바꿔야 할까?

문자 빈도를 세어보면 다음과 같다.

```text
A: 3
B: 1
```

A가 이미 세 개 존재하기 때문에 A는 그대로 두고 B 하나만 A로 바꾸는 것이 가장 적은 변경을 사용한다.

따라서 필요한 변경 횟수는 1이다.

이것을 조금 일반화하면 다음과 같은 관계를 발견할 수 있다.

```text
필요한 변경 횟수
= 구간의 길이 - 구간에서 가장 많이 등장하는 문자의 빈도
```

예를 들어

```text
A A A B B C
```

라는 구간이 있다면 길이는 6이고 가장 많이 등장하는 A의 빈도는 3이다.

따라서 같은 문자로 만들기 위해 필요한 최소 변경 횟수는

```text
6 - 3 = 3
```

이다.

이제 원래 문제를 완전히 다르게 표현할 수 있다.

> `windowLength - maxFrequency <= k`를 만족하는 가장 긴 연속 구간을 찾아라.

이 변환이 이 문제의 핵심이었다.

처음에는 "어떤 문자를 어떻게 바꿀 것인가?"라는 선택 문제처럼 보였다.

하지만 실제로는 목표 문자를 직접 선택할 필요가 없다.

변경 횟수를 최소화하려면 현재 구간에서 **가장 많이 존재하는 문자를 그대로 남기는 것이 항상 유리하기 때문**이다.

결국 우리가 알아야 하는 것은 특정 목표 문자가 아니라 `maxFrequency` 하나뿐이다.

## 이제 Sliding Window가 보인다

문제를 다음과 같이 바꾸고 나면 Sliding Window가 자연스럽게 보인다.

> 조건을 만족하는 가장 긴 연속 구간을 찾아라.

여기서 단순히 "부분 문자열 문제이기 때문에 Sliding Window를 사용한다"고 생각하는 것은 조금 부족하다.

이 문제에서 Sliding Window가 잘 맞는 더 중요한 이유는 **구간을 확장하다가 조건이 깨지면 왼쪽을 줄여 다시 조건을 만족시킬 수 있기 때문**이다.

두 개의 포인터를 사용한다.

```text
left
right
```

`right`의 역할은 더 긴 답을 찾기 위해 현재 구간을 확장하는 것이다.

```text
right → 구간 확장
```

반면 `left`의 역할은 조건이 깨졌을 때 다시 유효한 구간으로 복구하는 것이다.

```text
left → 조건 복구
```

즉 Sliding Window를 다음과 같이 생각할 수 있다.

```text
확장
→ 조건 검사
→ 조건이 깨졌다면 축소
→ 다시 확장
```

이 문제에서는 구간의 유효 조건이 이미 정해져 있다.

```text
windowLength - maxFrequency <= k
```

따라서 반대로

```text
windowLength - maxFrequency > k
```

가 되는 순간 현재 윈도우는 유효하지 않다.

그때 `left`를 이동시키면 된다.

## 왜 left는 한 번이 아니라 계속 움직여야 할까?

처음에는 조건을 위반하면 `left`를 한 칸만 움직여도 될 것처럼 생각할 수 있다.

하지만 그렇지 않다.

`left`를 하나 제거했는데도 여전히 변경해야 하는 문자의 수가 `k`보다 많을 수 있기 때문이다.

따라서 필요한 것은 `if`가 아니라 `while`이다.

```text
조건을 만족하지 않는 동안
    left를 이동한다.
```

즉 `left`를 움직이는 목적은 단순히 윈도우의 크기를 줄이는 것이 아니다.

**윈도우의 유효성을 복구하는 것**이다.

그래서 다음과 같은 구조가 된다.

```text
while windowLength - maxFrequency > k:
    left를 윈도우에서 제거
    left 이동
```

`while`이 종료됐다는 것은 다시

```text
windowLength - maxFrequency <= k
```

가 만족된다는 뜻이다.

따라서 이 시점에서 현재 윈도우의 길이를 정답 후보로 사용할 수 있다.

## 현재 Window의 상태를 어떻게 기억할까?

구간의 유효성을 판단하려면 현재 구간에서 각 문자가 몇 번 등장하는지 알아야 한다.

이를 위해 Map을 사용할 수 있다.

예를 들어 현재 윈도우가

```text
A A B A
```

라면 상태를 다음처럼 저장한다.

```text
A → 3
B → 1
```

여기서 Map은 단순한 카운터라기보다 **현재 `[left, right]` 구간의 상태를 압축해 저장하는 자료구조**라고 생각할 수 있다.

`right`가 새로운 문자를 포함시키면 해당 문자의 빈도를 증가시킨다.

```text
frequency[s[right]] += 1
```

반대로 `left`가 윈도우에서 빠져나가면 해당 문자의 빈도를 감소시킨다.

```text
frequency[s[left]] -= 1
left += 1
```

중요한 것은 실제 `[left, right]` 구간과 Map이 나타내는 상태가 항상 일치해야 한다는 점이다.

## maxFrequency는 어떻게 구할까?

현재 윈도우의 정확한 `maxFrequency`를 알고 싶다면 Map의 value들을 확인해서 가장 큰 값을 찾으면 된다.

예를 들어

```text
A → 3
B → 2
C → 1
```

이라면 `maxFrequency`는 3이다.

TypeScript에서는 다음처럼 구할 수 있다.

```ts
const maxFrequency = Math.max(...frequency.values());
```

그리고 `left`를 이동해서 빈도가 변경됐다면 현재 윈도우의 정확한 상태를 유지하기 위해 `maxFrequency`도 다시 계산한다.

LeetCode의 대표적인 최적화 풀이에서는 `maxFrequency`를 매번 감소시키지 않는 방법도 사용한다.

하지만 처음 이 문제를 이해할 때는 그 최적화를 섞지 않는 편이 좋다.

먼저 다음 불변식을 정확하게 유지하는 풀이부터 이해하는 것이 훨씬 중요하다.

> 정답을 갱신하는 순간 현재 `[left, right]`는 실제로 `k`번 이하의 변경으로 같은 문자로 만들 수 있는 유효한 구간이다.

## 자연어 풀이

지금까지의 내용을 코드 없이 설명하면 다음과 같다.

`left`를 0에서 시작한다.

`right`를 문자열의 처음부터 끝까지 한 칸씩 이동시키면서 현재 구간을 확장한다.

새롭게 윈도우에 들어온 `s[right]`의 빈도를 Map에서 증가시킨다.

현재 구간에서 가장 많이 등장하는 문자의 빈도인 `maxFrequency`를 계산한다.

현재 구간을 하나의 문자로 만들기 위해 필요한 변경 횟수는

```text
현재 구간 길이 - maxFrequency
```

이다.

이 값이 `k`보다 크다면 현재 구간은 유효하지 않다.

따라서 조건을 다시 만족할 때까지 `left`가 가리키는 문자를 윈도우에서 제거하고 `left`를 오른쪽으로 이동한다.

윈도우의 상태가 변할 때마다 현재 `maxFrequency`도 다시 계산한다.

조건을 복구한 뒤에는 현재 윈도우가 유효하므로 현재 길이를 최대 길이와 비교하여 갱신한다.

문자열을 모두 순회한 후 기록한 최대 길이를 반환한다.

## 자연어를 코드로 번역하기

이 문제를 풀면서 또 하나 중요했던 부분은 자연어로 알고리즘을 설명할 수 있어도 그것을 코드로 옮기는 과정에서 막힐 수 있다는 점이었다.

이때 자연어를 바로 프로그래밍 언어로 번역하려고 하지 않는 것이 도움이 된다.

다음과 같은 중간 단계를 하나 추가할 수 있다.

```text
자연어
↓
코드의 구조
↓
실제 프로그래밍 언어
```

예를 들어

```text
"right를 하나씩 이동한다"
```

는 코드의 관점에서는 **반복**이다.

```ts
for (let right = 0; right < s.length; right++)
```

"현재 문자의 빈도를 증가시킨다"는 **상태 갱신**이다.

```ts
frequency.set(s[right], (frequency.get(s[right]) ?? 0) + 1);
```

"조건을 만족하지 않는 동안 left를 이동한다"는 **조건부 반복**이다.

```ts
while ((right - left + 1) - maxFrequency > k)
```

"가장 긴 구간을 기록한다"는 **정답 상태 갱신**이다.

```ts
maxLength = Math.max(maxLength, right - left + 1);
```

따라서 자연어 풀이를 작성한 뒤 각 문장에 다음 네 가지 라벨을 붙여보는 것이 유용하다.

```text
상태
반복
조건
상태 갱신
```

이렇게 분해한 다음 실제 문법으로 번역하면 코드 작성의 부담이 크게 줄어든다.

## TypeScript 구현

```ts
function characterReplacement(s: string, k: number): number {
  let left = 0;
  let maxLength = 0;

  const frequency = new Map<string, number>();

  for (let right = 0; right < s.length; right++) {
    const rightChar = s[right];

    frequency.set(rightChar, (frequency.get(rightChar) ?? 0) + 1);

    let maxFrequency = Math.max(...frequency.values());

    while (right - left + 1 - maxFrequency > k) {
      const leftChar = s[left];

      frequency.set(leftChar, frequency.get(leftChar)! - 1);

      left++;

      maxFrequency = Math.max(...frequency.values());
    }

    maxLength = Math.max(maxLength, right - left + 1);
  }

  return maxLength;
}
```

코드의 구조를 보면 자연어 풀이와 거의 동일하다.

```text
right 확장
→ frequency 갱신
→ maxFrequency 계산
→ 조건 검사
→ 필요하면 left 축소
→ maxLength 갱신
```

## 시간 복잡도

문제의 문자열은 대문자 알파벳으로 구성되어 있으므로 가능한 문자는 최대 26개이다.

현재 구현에서는 `maxFrequency`를 구할 때 frequency의 값을 순회한다.

따라서 최대 26개를 확인한다.

전체적으로는

```text
O(26N)
```

이고 26은 상수이므로 일반적으로

```text
O(N)
```

으로 볼 수 있다.

공간 복잡도 역시 최대 26개의 문자 빈도만 저장하므로

```text
O(1)
```

로 볼 수 있다.

## 이 문제에서 얻은 핵심 인사이트

이 문제에서 가장 중요한 것은 Sliding Window 자체가 아니었다.

처음 문제를 읽으면 "최대 `k`번 문자를 바꾼다"라는 동작에 시선이 간다.

그러면 어떤 문자를 바꿀지, 어떤 문자를 목표로 할지, `k`번의 변경을 어떻게 시뮬레이션할지 고민하게 된다.

하지만 문제를 직접 구현하는 대신 **정답이 되기 위한 조건을 찾으면 문제의 모습이 바뀐다.**

이 문제에서는

```text
구간을 같은 문자로 만들기 위한 최소 변경 횟수
= 구간 길이 - 가장 많이 등장하는 문자의 빈도
```

라는 관계를 발견하는 것이 핵심이었다.

그 결과 문제는

```text
windowLength - maxFrequency <= k
```

를 만족하는 가장 긴 연속 구간을 찾는 문제로 바뀐다.

그리고 이 조건을 유지하면서 구간을 확장하고 축소할 수 있기 때문에 Sliding Window가 자연스럽게 연결된다.

앞으로 비슷한 문제를 만난다면 알고리즘 이름부터 떠올리기보다 먼저 다음 질문을 던져보려고 한다.

> **정답이 되는 구간은 정확히 어떤 조건을 만족해야 하는가?**

또한 자연어 풀이를 코드로 옮길 때는 한 번에 번역하려 하지 않고,

```text
자연어
→ 상태 / 반복 / 조건 / 갱신
→ 코드
```

의 중간 단계를 거친다.

이 두 가지가 이번 문제에서 얻은 가장 큰 학습 포인트였다.
