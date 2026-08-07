---
title: Daily Temperatures
publishedAt: 2026-08-07
source: "leetcode"
url: "https://leetcode.com/problems/daily-temperatures/description/"
tags:
  - stack
  - monotonic
---

문제를 읽고 드는 가장 단순한 풀이는 이중 루프다. 루프안에 또 루프를 돌면서 현재 날짜 온도보다 더 높은 온도의 인덱스를 찾는 것이다.

```ts
function dailyTemperatures(temperatures: number[]): number[] {
  const result: number[] = new Array(temperatures.length).fill(0);
  for (let i = 0; i < temperatures.length; i++) {
    for (let j = i + 1; j < temperatures.length; j++) {
      if (temperatures[j] > temperatures[i]) {
        result[i] = j - i;
        break;
      }
    }
  }
  return result;
}
```

각 날짜 i에서 시작해 오른쪽으로 이동하면서 처음으로 더 따뜻한 날짜 j를 찾는다. 찾았다면 j-i를 답으로 기록한다.

하지만 이 풀이는 역시 O(n^2)으로 타임아웃이 발생할 것이다.

한 번의 순회로 풀 수 있어야 한다.

## 관점 바꿔보기.

이중 루프를 한 번의 루프로 해결할 수 있는지를 볼 때, 중복을 해결할 수 있는지를 검사해야 한다.

```
인덱스:  0   1   2   3   4   5
온도:   73  74  75  71  69  72
```

위 상황에서 원래 방법은 각 날짜에서 미래의 더 따뜻한 날짜를 찾으러 가는 것이었다. 그런데 index 5에 위치한 72를 보게 되면 4번, 3번의 답도 찾게 된다.

이중 루프 방식에서는 각 날짜가 오른쪽을 직접 탐색한다. 71은 69 -> 72 순으로 찾게 되고, 69는 72를 보고 답을 찾는다. 여기서 중복이 발생한다. 71도 72를 보고, 69도 72를 본다. 여기서 관점의 변화가 발생한다.

```
기존:
71이 미래의 72를 찾으러 감
69가 미래의 72를 찾으러 감

개선:
72가 도착하면서
71과 69를 한꺼번에 해결
```

즉, 현재 날짜를 기준으로 미래의 더 따뜻한 날짜를 찾는 것이 아니라, 미래의 날짜를 기준으로 현재 날짜를 찾는 것이다.

## 단조스택 (Monotonic Stack)

현재 날짜를 봤을 때, 이 날짜를 기준으로 답이 정해지는 과거의 값이 있는지 확인 하려면 과거의 값들을 저장해야 하는 데이터 구조가 필요하다. 여기서는 스택, 특히 단조 스택을 활용한다.

단조 스택은 스택 안의 값이 한 방향으로만 정렬된 상태를 유지하는 스택이다. 이 문제 같은 경우, non-decreasing 순서를 가진 스택이 된다. 예를 들어

```
인덱스:  0   1   2   3   4   5
온도:   73  74  75  71  69  72
```

위 경우에도,

```
[75,71,69]
```

까지 스택이 쌓이다가 72에 위치하게 되면, 69 -> 71 순으로 해결이 되고, 스택에는

```
[75]
```

이렇게 남게 된다. 즉, 이 문제에서 단조스택은 아직 해결하지 못한 온도를 저장하는 역할을 한다. 그리고 쌓이는 순서가 최신이라는 특성도 가지기 때문에 스택 데이터 구조가 어울리다.

## 풀이

일단 정답 배열을 모두 0으로 초기화 한다. 이렇게 하면 나중에 별도로 남아 있는 날짜를 계산할 필요가 없다. 스택에는 아직 더 따뜻한 날을 찾지 못한 날짜의 인덱스를 저장한다. 인덱스를 저장하는 이유는 날짜의 차이를 계산하기 위함이다. 온도를 왼쪽 부터 순회한다. 현재 온도가 스택의 top 인덱스가 가리키는 온도보다 높다면, top 날짜는 처음으로 더 따뜻한 날짜를 만난 것이다. 따라서 해당 인덱스를 pop하고, 현재 인덱스 - 과거 인덱스를 정답에 기록한다. 현재 온도로 여러 과거 날짜를 해결할 수 있으므로 이 과정을 while로 반복한다. 더 이상 해결할 수 있는 과거 날짜가 없으면 현재 인덱스를 스택에 넣는다. 순회가 끝난 뒤 스택에 남아 있는 날짜는 더 따뜻한 날이 없으므로 초기값 0이 그대로 정답이 된다.

여기서 신경써야 하는 부분은 현재 날짜를 이용하여 스택을 pop하는 부분이다. 단순히 if 조건만으로 top에 있는 인덱스가 가리키는 온도와 현재 온도와 비교하면 스택은 한 번만 pop하게 된다. 그게 아니라 조건을 만족할 때 까지 pop해야 한다.

```ts
const top = stack[stack.length - 1];
while (stack.length > 0 && temperatures[i] > temperatures[top]) {
  const prev = stack.pop();
  answer[prev] = i - prev; // 날짜의 차이를 결과 배열에 넣는다
}
```

이 풀이를 코드로 옮기면 다음과 같다.

```ts
function dailyTemperatures(temperatures: number[]): number[] {
  const answer = new Array(temperatures.length).fill(0);
  const stack: number[] = [];

  for (let i = 0; i < temperatures.length; i++) {
    while (
      stack.length > 0 &&
      temperatures[i] > temperatures[stack[stack.length - 1]]
    ) {
      const prevIndex = stack.pop()!;
      answer[prevIndex] = i - prevIndex;
    }

    stack.push(i);
  }

  return answer;
}
```

## 인사이트

이 문제의 핵심은 “미래를 반복해서 탐색하지 말고, 아직 답이 확정되지 않은 과거 후보를 저장해 두었다가 현재 값이 도착했을 때 해결한다”는 사고다. 단조 스택은 그 사고를 효율적으로 구현하기 위한 데이터 구조다.
