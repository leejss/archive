---
title: 메모리는 타입을 가지지 않는다. 
publishedAt: 2025-11-28
---

- 데이터의 모든 표현의 근본은 비트(0과 1)의 패턴이다.
- 메모리에 저장된 값은 물리적으로 0과 1로 존재한다.
- 인간이 이 메모리에 저장된 값을 볼때 주로 16진수(Hex) 값으로 본다. 16진수한 자리가 4비트로 1:1 대응하기 때문에 읽기쉬움
- 비트값들을 어떻게 해석할 것인가에 따라 타입이 생긴다.
- `int` -> 4바이트를 정수로 해석. `float` -> 4바이트를 실수로 해석. `char` -> 1바이트를 문자로 해석.
- 똑같은 바이트라도 어떻게 해석하느냐에 따라 의미가 달라진다.

```c
#include <stdio.h>

int main()
{
  unsigned char mem[4];

  mem[0] = 0xDB;
  mem[1] = 0x0F;
  mem[2] = 0x49;
  mem[3] = 0x40;

  void *ptr = mem;

  int *as_int = (int *)ptr;
  float *as_float = (float *)ptr;
  unsigned char *as_bytes = (unsigned char *)ptr;
  char *as_char = (char *)ptr;

  printf("정수로 해석: %d\n", *as_int);
  printf("실수로 해석: %f\n", *as_float);
  printf("바이트로 해석: %02X %02X %02X %02X\n",
         as_bytes[0], as_bytes[1], as_bytes[2], as_bytes[3]);

  printf("문자로 해석: %c\n", as_char[3]);

  return 0;
}
```


```shell
정수로 해석: 1078530011
실수로 해석: 3.141593
바이트로 해석: DB 0F 49 40
문자로 해석: @
```

- 메모리는 타입을 가지지 않는다. 타입을 가지는 것은 프로그램이다.