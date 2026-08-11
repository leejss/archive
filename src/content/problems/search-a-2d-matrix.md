---

title: Search a 2D Matrix
publishedAt: 2026-08-11
source: "leetcode"
url: "https://leetcode.com/problems/search-a-2d-matrix/description/"
tags:

* array
* binary search

---

## Index Mapping

이 문제의 핵심은 2차원 배열을 그대로 탐색하는 것이 아니라, **2차원 배열을 하나의 1차원 배열처럼 해석하는 것**이다.

이를 위해서는 먼저 다음 두 가지 변환에 익숙해질 필요가 있다.

- 2차원 좌표 `(row, col)` → 1차원 인덱스
- 1차원 인덱스 → 2차원 좌표 `(row, col)`

`rows * cols` 크기의 2차원 배열이 있다고 가정해보자. 한 행에는 `cols`개의 원소가 들어 있다.

```text
rows = 3
cols = 4

        col
         0   1   2   3
       ┌───────────────
row 0  │  0   1   2   3
row 1  │  4   5   6   7
row 2  │  8   9  10  11
```

각 좌표를 1차원 인덱스와 대응시키면 다음과 같다.

```text
(0,0) → 0
(0,1) → 1
(0,2) → 2
(0,3) → 3

(1,0) → 4
(1,1) → 5
(1,2) → 6
(1,3) → 7

(2,0) → 8
(2,1) → 9
(2,2) → 10
(2,3) → 11
```

여기서 다음 관계를 확인할 수 있다.

```text
index = row * cols + col
```

왜 이런 식이 나오는지 `(2, 1)`을 예로 생각해보자.

```text
        0   1   2   3
      ┌───────────────
  0   │ 0   1   2   3
  1   │ 4   5   6   7
  2   │ 8  [9] 10  11
```

`row = 2`라는 것은 현재 위치에 도착하기 전에 **2개의 행을 완전히 지나왔다**는 뜻이다.

한 행에는 `cols = 4`개의 원소가 있으므로,

```text
2 * 4 = 8
```

개의 원소를 지나온 셈이다.

즉, `row = 2`인 행은 1차원 인덱스 `8`부터 시작한다.

여기에 `col = 1`, 즉 현재 행에서 한 칸 이동하면 최종 인덱스는 다음과 같다.

```text
8 + 1 = 9
```

따라서 이를 일반화하면 다음 공식이 된다.

```text
index = row * cols + col
```

---

반대로 1차원 인덱스를 다시 2차원 좌표로 변환할 수도 있다.

인덱스 `9`를 다시 `(row, col)` 좌표로 바꿔보자.

한 행에 원소가 4개씩 있으므로 `9`를 `4`로 나누면 된다.

```text
9 / 4

몫 = 2
나머지 = 1
```

몫 `2`는 **몇 개의 행을 완전히 지나왔는지**를 의미하므로 `row`가 된다.

나머지 `1`은 **현재 행에서 몇 칸 이동했는지**를 의미하므로 `col`이 된다.

따라서 다음과 같이 표현할 수 있다.

```text
row = Math.floor(index / cols)
col = index % cols
```

정리하면 두 변환은 서로 반대 방향의 관계를 가진다.

```text
(row, col)
    |
    | index = row * cols + col
    v
  index

  index
    |
    | row = floor(index / cols)
    | col = index % cols
    v
(row, col)
```

여기서 기억해둘 만한 직관은 다음과 같다.

> `cols`로 나눈 몫은 몇 개의 행을 완전히 지나왔는지를 나타내고,
> 나머지는 현재 행에서 얼마나 이동했는지를 나타낸다.

## 문제로 돌아와서

이제 이 개념을 `Search a 2D Matrix`에 적용해보자.

문제의 행렬은 각 행이 오름차순으로 정렬되어 있고, 다음 행의 첫 번째 값은 이전 행의 마지막 값보다 크다.

예를 들어 다음과 같은 행렬이 있다.

```text
[
  [1,  3,  5,  7],
  [10, 11, 16, 20],
  [23, 30, 34, 60]
]
```

이를 논리적으로 펼쳐보면 다음과 같다.

```text
[1, 3, 5, 7, 10, 11, 16, 20, 23, 30, 34, 60]
```

즉, 실제로 배열을 새로 만들지 않아도 **전체 행렬을 하나의 정렬된 1차원 배열로 해석할 수 있다.**

정렬된 1차원 배열로 볼 수 있다면 Binary Search를 그대로 적용할 수 있다.

전체 원소의 개수는 `rows * cols`개이므로 탐색 범위는 다음과 같다.

```text
left = 0
right = rows * cols - 1
```

여기서 `left`, `right`, `mid`는 모두 2차원 좌표가 아니라 **논리적으로 펼친 1차원 배열의 인덱스**를 의미한다.

Binary Search를 진행하면서 `mid`를 구한 뒤, 실제 행렬에서 값을 읽어야 할 때만 `mid`를 다시 `(row, col)` 좌표로 변환하면 된다.

```text
row = floor(mid / cols)
col = mid % cols
```

그러면 현재 비교해야 할 값은 다음과 같이 얻을 수 있다.

```text
matrix[row][col]
```

이후 과정은 일반적인 Binary Search와 동일하다.

자연어로 정리하면 다음과 같다.

1. 행렬을 실제로 펼치지는 않지만 하나의 정렬된 1차원 배열이라고 생각한다.
2. `left = 0`, `right = rows * cols - 1`로 탐색 범위를 설정한다.
3. `left <= right`인 동안 `mid`를 구한다.
4. `mid`를 2차원 좌표로 변환한다.
5. `matrix[row][col]`과 `target`을 비교한다.
6. 현재 값이 `target`보다 작으면 `left = mid + 1`로 이동한다.
7. 현재 값이 `target`보다 크면 `right = mid - 1`로 이동한다.
8. 값이 같다면 `true`를 반환한다.
9. 탐색이 끝날 때까지 찾지 못했다면 `false`를 반환한다.

중요한 점은 **2차원 배열 안에서 직접 포인터를 움직이는 것이 아니라, 1차원 인덱스 공간에서 Binary Search를 수행한다는 것**이다.

2차원 좌표는 값을 읽어야 하는 순간에만 계산한다.

## Code

```ts
function searchMatrix(matrix: number[][], target: number): boolean {
  const rows = matrix.length;
  const cols = matrix[0].length;

  let left = 0;
  let right = rows * cols - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);

    const row = Math.floor(mid / cols);
    const col = mid % cols;

    const value = matrix[row][col];

    if (value === target) {
      return true;
    }

    if (value < target) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return false;
}
```

## 핵심 인사이트

처음 이 문제를 보면 2차원 배열이라는 형태 때문에 행과 열을 어떻게 탐색해야 할지 먼저 고민하게 된다.

하지만 데이터가 저장된 모양과 실제 탐색 공간은 반드시 같을 필요가 없다.

이 문제에서는 행렬 전체가 정렬 조건을 만족하기 때문에 2차원 배열을 하나의 정렬된 1차원 배열로 재해석할 수 있다.

그러면 문제는 더 이상 특별한 2차원 배열 탐색 문제가 아니라, 익숙한 Binary Search 문제가 된다.

즉, 이 문제에서 중요한 사고는 다음과 같다.

> **복잡한 데이터 구조를 그대로 탐색하려고 하기 전에, 더 단순한 탐색 공간으로 재해석할 수 있는지 확인한다.**

그리고 실제 데이터를 변환할 필요도 없다.

`mid`를 1차원 인덱스로 관리하면서 필요한 순간에만 다음 공식으로 실제 좌표를 계산하면 된다.

```text
row = floor(mid / cols)
col = mid % cols
```

이렇게 하면 추가 배열 없이 `O(log(rows * cols))` 시간과 `O(1)` 공간으로 문제를 해결할 수 있다.
