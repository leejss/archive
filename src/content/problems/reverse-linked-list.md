---
title: Reverse Linked List
publishedAt: 2026-08-18
source: "leetcode"
url: "https://leetcode.com/problems/reverse-linked-list/"
tags:
  - linked list
  - pointer
---

## 문제를 어떻게 바라봐야 하는가

이 문제는 주어진 연결 리스트의 순서를 뒤집고, 뒤집힌 리스트의 새로운 `head`를 반환하는 문제다.

```text
1 → 2 → 3 → null

3 → 2 → 1 → null
```

배열이라면 양 끝의 값을 교환할 수 있지만, 연결 리스트는 각 노드가 `next`를 통해 다음 노드를 가리키는 구조다. 따라서 노드의 위치를 직접 옮기는 것이 아니라 **각 노드의 `next`가 가리키는 방향을 반대로 바꿔야 한다.**

이 문제의 핵심은 단순히 `current.next`를 이전 노드로 바꾸는 데 있지 않다. 연결 방향을 바꾸는 순간 아직 방문하지 않은 나머지 리스트로 가는 경로가 사라진다는 점을 처리해야 한다.

## 연결을 바꾸기 전에 다음 노드를 저장해야 한다

현재 노드가 `1`이고 다음 노드가 `2`라고 해보자.

```text
1 → 2 → 3 → null
```

리스트를 뒤집기 위해 다음과 같이 연결을 바꾸고 싶다.

```ts
current.next = previous;
```

첫 번째 반복에서 `previous`는 `null`이므로 `1.next`는 `null`이 된다.

```text
1 → null    2 → 3 → null
```

그런데 연결을 바꾸기 전에 `2`의 위치를 따로 저장하지 않았다면, 이제 `current`를 통해 `2`로 이동할 수 없다. 뒤집는 과정에서 아직 처리하지 않은 리스트를 잃어버린 것이다.

따라서 연결을 수정하기 전에 원래의 다음 노드를 먼저 저장해야 한다.

```ts
const next = current.next;
current.next = previous;
```

`next`는 연결을 바꾼 이후에도 나머지 리스트로 이동할 수 있게 해주는 임시 포인터다.

## 세 개의 포인터

반복문에서는 다음 세 포인터가 서로 다른 역할을 맡는다.

- `previous`: 이미 뒤집은 구간의 첫 번째 노드
- `current`: 이번에 연결 방향을 바꿀 노드
- `next`: 연결을 바꾸기 전에 저장한 다음 노드

처음에는 아직 뒤집은 노드가 없으므로 `previous`는 `null`이고, `current`는 기존 `head`에서 시작한다.

```ts
let previous: ListNode | null = null;
let current = head;
```

각 반복에서는 다음 순서를 지켜야 한다.

1. `current.next`를 `next`에 저장한다.
2. `current.next`가 `previous`를 가리키도록 바꾼다.
3. `previous`를 현재 노드로 이동한다.
4. `current`를 저장해 둔 다음 노드로 이동한다.

```ts
const next = current.next;
current.next = previous;
previous = current;
current = next;
```

중요한 것은 1번과 2번의 순서다. 먼저 연결을 바꾸면 원래 다음 노드에 대한 정보를 잃는다.

## 뒤집히는 과정

`1 → 2 → 3 → null`을 예로 들면 포인터는 다음과 같이 이동한다.

| 시점 | `previous`가 가리키는 구간 | `current`가 가리키는 구간 |
| --- | --- | --- |
| 시작 | `null` | `1 → 2 → 3 → null` |
| 1회 반복 후 | `1 → null` | `2 → 3 → null` |
| 2회 반복 후 | `2 → 1 → null` | `3 → null` |
| 3회 반복 후 | `3 → 2 → 1 → null` | `null` |

반복이 끝나면 `current`는 리스트의 끝을 지나 `null`이 된다. 반면 `previous`는 완전히 뒤집힌 리스트의 첫 번째 노드, 즉 새로운 `head`를 가리킨다. 따라서 마지막에는 `current`가 아니라 `previous`를 반환해야 한다.

## 불변식으로 이해하기

반복문이 실행되는 동안 다음 상태는 계속 유지된다.

> `previous`가 가리키는 구간은 이미 뒤집혀 있고, `current`부터 시작하는 구간은 아직 처리하지 않은 원래 리스트다.

한 번 반복할 때마다 `current`의 노드 하나가 미처리 구간에서 빠져나와 뒤집힌 구간의 맨 앞에 추가된다. 결국 미처리 구간은 비어 `current`가 `null`이 되고, 모든 노드가 `previous` 쪽으로 이동한다.

이 불변식을 이해하면 포인터를 외우지 않아도 된다. 매 반복에서 해야 할 일은 **미처리 구간의 첫 노드 하나를 떼어 뒤집힌 구간의 앞에 붙이는 것**이다.

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

function reverseList(head: ListNode | null): ListNode | null {
  let previous: ListNode | null = null;
  let current = head;

  while (current !== null) {
    const next = current.next;

    current.next = previous;
    previous = current;
    current = next;
  }

  return previous;
}
```

빈 리스트가 들어오면 `current`가 처음부터 `null`이므로 반복문은 실행되지 않고 `previous`의 초기값인 `null`을 반환한다. 노드가 하나뿐인 경우에도 동일한 로직으로 해당 노드의 `next`를 `null`로 만든 뒤 그 노드를 반환한다. 별도의 예외 처리가 필요하지 않다.

## 복잡도

모든 노드를 한 번씩 방문하므로 시간 복잡도는 `O(n)`이다. 리스트 크기와 관계없이 몇 개의 포인터만 사용하므로 추가 공간 복잡도는 `O(1)`이다.

## 이 문제에서 얻을 수 있는 핵심 인사이트

연결 리스트를 다룰 때는 값을 기준으로 생각하기보다 **어떤 노드가 어떤 노드를 가리키고 있는지**를 추적해야 한다. 특히 연결을 수정하는 문제에서는 기존 연결을 끊었을 때 잃어버리는 정보가 무엇인지 먼저 생각해야 한다.

이 문제에서는 `current.next`를 수정하는 순간 나머지 리스트로 가는 경로가 사라진다. 그래서 수정 전에 다음 노드를 저장한다. 이는 연결 리스트 문제 전반에서 반복되는 중요한 패턴이다.

또한 연결 리스트의 `head`는 리스트 자체가 아니라 첫 번째 노드를 가리키는 참조다. 리스트를 뒤집으면 기존의 마지막 노드가 새로운 첫 번째 노드가 되므로, 최종적으로 그 노드를 가리키는 `previous`를 새로운 `head`로 반환해야 한다.

결국 이 문제의 핵심은 다음 한 문장으로 정리할 수 있다.

> 연결을 바꾸기 전에 기존 경로를 저장하고, 미처리 노드를 하나씩 뒤집힌 구간 앞으로 옮긴다.

## 연관 문제

- **92. Reverse Linked List II**: 리스트의 일부 구간만 뒤집기
- **234. Palindrome Linked List**: 리스트의 절반을 뒤집어 양쪽 비교하기
- **143. Reorder List**: 중간 지점 탐색, 후반부 뒤집기, 두 리스트 병합하기

