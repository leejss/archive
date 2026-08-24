---
title: Merge Two Sorted Lists
publishedAt: 2026-08-25
source: "leetcode"
url: "https://leetcode.com/problems/merge-two-sorted-lists/description/"
tags:
  - linked list
  - two pointers
---

## 문제를 어떻게 바라봐야 하는가

오름차순으로 정렬된 두 연결 리스트가 주어졌을 때, 두 리스트의 노드를 이어 붙여 하나의 정렬된 연결 리스트를 만드는 문제다.

```text
list1: 1 → 2 → 4 → null
list2: 1 → 3 → 4 → null

result: 1 → 1 → 2 → 3 → 4 → 4 → null
```

두 리스트가 이미 정렬되어 있으므로 모든 값을 한곳에 모아 다시 정렬할 필요는 없다. 각 리스트의 맨 앞 노드만 비교하면 **병합된 리스트에 다음으로 들어갈 노드**를 결정할 수 있다.

예를 들어 `list1`의 현재 값이 `2`이고 `list2`의 현재 값이 `3`이라면, `2`보다 앞에 와야 할 노드는 `list2`의 나머지 구간에 존재할 수 없다. `list2`는 정렬되어 있고 그 구간의 최솟값이 이미 `3`이기 때문이다. 따라서 더 작은 `2`를 결과에 연결한 뒤 `list1`의 포인터만 다음 노드로 이동하면 된다.

이 과정을 반복하면 두 정렬 배열을 병합하는 것과 같은 방식으로 문제를 풀 수 있다. 차이는 값을 새 배열에 넣는 대신 **기존 노드의 `next`를 바꾸어 결과 리스트를 만든다**는 점이다.

## 두 포인터로 다음 노드를 선택한다

두 포인터 `current1`, `current2`는 각 리스트에서 아직 결과에 연결하지 않은 첫 번째 노드를 가리킨다.

```text
          current1
             ↓
list1:      1 → 2 → 4 → null

          current2
             ↓
list2:      1 → 3 → 4 → null
```

두 노드의 값을 비교해 더 작은 쪽을 결과 리스트의 끝에 연결한다.

```ts
if (current1.val <= current2.val) {
  tail.next = current1;
  current1 = current1.next;
} else {
  tail.next = current2;
  current2 = current2.next;
}

tail = tail.next;
```

노드를 하나 연결할 때마다 세 가지 일이 일어난다.

1. 두 후보 중 더 작은 노드를 `tail.next`에 연결한다.
2. 선택한 노드가 속한 리스트의 포인터를 다음 노드로 옮긴다.
3. 결과 리스트의 끝을 나타내는 `tail`을 방금 연결한 노드로 옮긴다.

값이 같은 경우에는 어느 쪽을 먼저 선택해도 최종 결과는 정렬 상태를 유지한다. 여기서는 `<=`를 사용해 `list1`의 노드를 먼저 연결한다.

## 첫 번째 노드를 예외 처리하지 않는 방법

결과 리스트가 비어 있을 때는 아직 `tail`이 가리킬 노드가 없다. 이 때문에 첫 번째 노드를 연결하는 코드와 그 이후의 노드를 연결하는 코드를 따로 작성할 수도 있다.

```ts
let head: ListNode | null = null;
let tail: ListNode | null = null;
```

하지만 이렇게 시작하면 노드를 선택할 때마다 “지금 연결하는 노드가 첫 번째인가?”를 검사해야 한다. 이 예외를 없애기 위해 실제 결과 앞에 임시 노드인 `dummy`를 둔다.

```text
dummy → null
  ↑
 tail
```

`dummy`는 결과에 포함되지 않는 시작점이다. `tail`은 처음에 `dummy`를 가리키므로 첫 번째 노드도 이후의 노드와 똑같이 `tail.next`에 연결할 수 있다.

```ts
const dummy = new ListNode();
let tail = dummy;
```

병합이 끝나면 실제 결과의 첫 번째 노드는 `dummy.next`에 있다.

```text
dummy → 1 → 1 → 2 → 3 → 4 → 4 → null
        ↑
   실제 결과의 head
```

따라서 `dummy`가 아니라 `dummy.next`를 반환한다.

## 병합되는 과정

`list1 = [1, 2, 4]`, `list2 = [1, 3, 4]`를 병합하는 과정을 표로 나타내면 다음과 같다.

| 비교 | 선택한 노드 | 병합된 구간 | `current1` | `current2` |
| --- | --- | --- | --- | --- |
| `1 <= 1` | `list1`의 `1` | `1` | `2` | `1` |
| `2 > 1` | `list2`의 `1` | `1 → 1` | `2` | `3` |
| `2 <= 3` | `list1`의 `2` | `1 → 1 → 2` | `4` | `3` |
| `4 > 3` | `list2`의 `3` | `1 → 1 → 2 → 3` | `4` | `4` |
| `4 <= 4` | `list1`의 `4` | `1 → 1 → 2 → 3 → 4` | `null` | `4` |

이 시점에 `current1`이 `null`이 되었으므로 두 노드를 비교하는 반복은 끝난다. `list2`에는 `4 → null`이 남아 있다.

## 한 리스트가 먼저 끝나면 나머지를 그대로 연결한다

반복문은 두 포인터가 모두 노드를 가리키는 동안에만 실행한다.

```ts
while (current1 !== null && current2 !== null) {
  // 더 작은 노드를 선택해 연결한다.
}
```

한 리스트가 먼저 끝나면 다른 리스트의 남은 구간은 이미 정렬되어 있고, 그 구간의 모든 값은 지금까지 연결한 값보다 작지 않다. 따라서 남은 노드를 하나씩 순회할 필요 없이 전체 구간을 `tail.next`에 한 번만 연결하면 된다.

```ts
tail.next = current1 ?? current2;
```

둘 중 하나는 반드시 `null`이므로 `null`이 아닌 쪽이 결과 뒤에 연결된다. 두 리스트가 동시에 끝났다면 둘 다 `null`이고, 결과 리스트의 끝도 자연스럽게 `null`이 된다.

이 로직은 입력 중 하나가 처음부터 빈 리스트인 경우도 처리한다. 반복문은 실행되지 않고 비어 있지 않은 리스트가 곧바로 `dummy.next`에 연결된다. 두 리스트가 모두 비어 있다면 `dummy.next`의 초기값인 `null`을 반환한다.

## 불변식으로 이해하기

반복문이 실행되는 동안 다음 상태가 유지된다.

> `dummy.next`부터 `tail`까지는 지금까지 확인한 노드로 만든 정렬된 구간이고, `current1`과 `current2`는 각 리스트에서 아직 연결하지 않은 구간의 첫 노드다.

각 반복에서는 `current1`과 `current2` 중 더 작은 노드를 선택한다. 두 포인터가 각 미처리 구간의 최솟값을 가리키므로, 선택한 노드는 전체 미처리 노드 중에서도 최솟값이다. 이 노드를 `tail` 뒤에 붙여도 결과 구간의 정렬 상태는 깨지지 않는다.

또한 한 번 선택한 노드는 결과에 연결된 뒤 해당 리스트의 포인터가 다음으로 이동하므로 다시 선택되지 않는다. 결국 모든 노드는 정확히 한 번씩 결과 리스트에 포함된다.

## TypeScript 풀이

```ts
class ListNode {
  val: number;
  next: ListNode | null;

  constructor(val = 0, next: ListNode | null = null) {
    this.val = val;
    this.next = next;
  }
}

function mergeTwoLists(
  list1: ListNode | null,
  list2: ListNode | null,
): ListNode | null {
  const dummy = new ListNode();
  let tail = dummy;
  let current1 = list1;
  let current2 = list2;

  while (current1 !== null && current2 !== null) {
    if (current1.val <= current2.val) {
      tail.next = current1;
      current1 = current1.next;
    } else {
      tail.next = current2;
      current2 = current2.next;
    }

    tail = tail.next;
  }

  tail.next = current1 ?? current2;

  return dummy.next;
}
```

이 풀이는 새로운 결과 노드를 매번 생성하지 않는다. `dummy` 하나만 새로 만들고, 입력으로 받은 노드들의 연결을 바꾸어 하나의 리스트로 합친다. 즉, 문제에서 요구하는 것처럼 두 리스트의 기존 노드를 이어 붙이는 방식이다.

## 복잡도

`list1`의 노드 수를 `n`, `list2`의 노드 수를 `m`이라고 하자. 각 노드는 최대 한 번 선택되고, 한 리스트가 끝난 뒤 남은 구간은 한 번에 연결한다. 따라서 시간 복잡도는 `O(n + m)`이다.

입력 크기와 관계없이 몇 개의 포인터와 하나의 `dummy` 노드만 사용하므로 추가 공간 복잡도는 `O(1)`이다. 반환하는 리스트는 기존 노드를 재사용하므로 추가 공간에 포함하지 않는다.

## 이 문제에서 얻을 수 있는 핵심 인사이트

이미 정렬된 두 집합을 병합할 때는 전체를 다시 정렬하지 않아도 된다. 각 집합에서 아직 처리하지 않은 최솟값만 비교하면 전체에서 다음으로 작은 값을 결정할 수 있다. 연결 리스트에서는 이 최솟값을 각 리스트의 현재 포인터가 가리킨다.

또한 `dummy` 노드는 결과 리스트의 첫 노드를 정하는 예외를 없애 준다. 연결 리스트를 새로 만들거나 일부 구간을 조립하는 문제에서 시작점이 아직 정해지지 않았다면, 임시 시작 노드를 두고 모든 연결을 동일한 방식으로 처리할 수 있는지 생각해 볼 수 있다.

결국 이 문제의 핵심은 다음과 같이 정리할 수 있다.

> 두 미처리 구간의 첫 노드 중 더 작은 노드를 결과의 끝에 붙이고, 한쪽이 끝나면 다른 쪽의 남은 정렬 구간을 그대로 연결한다.

## 연관 문제

- **23. Merge k Sorted Lists**: 여러 정렬 리스트를 분할 정복 또는 우선순위 큐로 병합하기
- **88. Merge Sorted Array**: 배열의 뒤쪽부터 두 정렬 배열 병합하기
- **148. Sort List**: 연결 리스트를 나눈 뒤 병합 정렬로 정렬하기
