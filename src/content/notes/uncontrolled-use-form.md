---
title: Uncontrolled useForm
publishedAt: 2025-09-22
tags: []
---

## Source of truth: DOM vs React State

핵심 아이디어는 데이터를 리액트 상태가 아닌 DOM에 두는 것.

```tsx

// React state
const [data, setData] = useState("") 
<input value={data} onChange={(e) => setData(e.target.value)} />


// DOM Reference
const inputRef = useRef<HTMLInputElement>(null);
<input ref={inputRef} />

// value getter
const getData = () => {
    return inputRef.current?.value;
}

```

## Free from re-rendering

`useRef`를 사용하는 이유

`ref` 객체에 저장된 값은 렌더링 사이클에서 살아남는다. `ref` 객체의 값을 변경해도 리렌더링을 유발하지 않는다.

## Core API

`register` 와 `handleSubmit`

`register`는 Node를 훅에 등록하는 역할. 등록에 필요한 `name`과 `ref`를 반환한다.

```tsx

const register = (name: string) => ({
  name,
  ref: (element: HTMLElement | null) => {
    if (element) {
      formRef.current[name] = element;
    }
  },
})


```

`handleSubmit` 제출 함수를 인자로 받아, 폼 제출 시 필요한 사전 작업을 처리한 후 실행하는 고차 함수(Higher-Order Function)입니다.

```tsx
import { useCallback } from 'react';

// useForm 훅 내부
const formRef = useRef<{ [key: string]: any }>({});
const handleSubmit = (onSubmit: (values: any) => void) =>
  useCallback(
    (event: React.FormEvent) => {
      event.preventDefault(); // 폼의 기본 제출 동작 방지

      const values = {};
      const formElements = formRef.current;

      // formRef에 저장된 모든 DOM 노드를 순회하며 값을 읽어온다.
      for (const name in formElements) {
        const element = formElements[name] as HTMLInputElement; // 타입 단언
        if (element) {
          values[name] = element.type === 'checkbox' ? element.checked : element.value;
        }
      }

      // 수집된 데이터로 사용자의 onSubmit 함수를 호출한다.
      onSubmit(values);
    },
    [onSubmit]
  );
```

이 함수는 다음 순서로 동작합니다.

1. 브라우저의 기본 폼 제출 동작을 막습니다.
2. `formRef`에 등록된 모든 DOM 요소를 순회합니다.
3. 각 요소의 타입에 맞게 `.value`나 `.checked`를 읽어 `values` 객체를 만듭니다.
4. 마지막으로, 완성된 `values` 객체를 인자로 하여 사용자가 전달한 `onSubmit` 함수를 실행합니다.
