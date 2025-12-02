---
title: Array Decay
publishedAt: 2025-12-02
---


```c
#include <stdio.h>

int main()
{
  int arr[3] = {1, 2, 3};
  printf("%lu\n", sizeof(arr)); // 12
}
```

- C언어에서 배열은 연속된 바이트 덩어리. 
- 그런데 배열을 함수 인자로 넘길때는 전체 배열이 넘어가는 것이 아니라 첫번째 원소의 주소만 담긴 포인터 변수가 넘어간다.
- 이를 array decay라 한다.
- 이런 현상은 왜 발생할까? 
- 함수에 배열을 넘길때 전체 배열이 넘어가게 되면 매번 복사가 이루어 진다. 배열의 사이즈가 크다면 이는 비효율적이다.
- 따라서 C는 복사 대신, 배열의 첫번째 요소의 주소를 넘기는 방식을 채택했다. 배열이 포인터로 붕괴(decay)되었다.
- 하지만 착각하지 말아야 할 것은 배열은 포인터가 아니다.

```c
#include <stdio.h>

void size_of(int *a)
{
  printf("%lu\n", sizeof(a)); // 8
}

int main()
{
  int arr[3] = {1, 2, 3};
  printf("%lu\n", sizeof(arr)); // 12
  size_of(arr);
}
```

- 배열은 연속된 메모리 블록이고 포인터는 특정 주소를 가리키는 변수다. 둘은 엄연히 다르다.
- 그러면 배열은 언제 "배열"인 채로 남을까?
- Array Decay는 배열을 표현식에서 사용할 때 발생한다. 그 외에는 배열로 남는다.

```c
printf("%lu\n", sizeof(arr)); // 4가 아니라 12
```




