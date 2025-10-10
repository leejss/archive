---
title: WeakMap
publishedAt: 2025-10-10
tags: []
---

## What

> A collection of key/value pairs whose keys must be objects or non-registered symbols, with values of any arbitrary JavaScript type,

## Why

메모리 관점에서 보는 WeakMap 데이터구조의 특징. 

```js

// 객체 생성 후 변수에 할당.
let user = {"name":"Alice"}
// ...

// 객체를 참조하는 곳이 없다. -> GC 대상
user = null
```

`Map`의 경우 객체를 키로 삼을 수 있다.

```js
let user = {"name":"Alice"}
let map = new Map()
map.set(user, "Some Data Attachted")
user = null
```

`Map`은 키로 사용된 객체를 강한 참조로 붙잡아 둔다. 더 이상 객체를 사용하지 않아도 `Map`이 키로 사용 중이라면 GC의 대상이 되지 않는다.  
반면 `WeakMap`은 객체의 참조가 모두 사라지만 더 이상 그 객체를 붙잡아 두지 않는다. 따라서 객체는 GC의 대상이 된다.  
따라서 `WeakMap` 은 객체가 동적으로 추가, 삭제가 이루어지는 환경에서 메모리 누수를 방지 한다.

## How

DOM 요소에 커스텀 스코프를 정의하고 이 DOM요소가 나중에 삭제될 수 있다고 가정. 

```js
// 버튼에 대한 추가 정보를 저장할 WeakMap
const elementMetadata = new WeakMap();

// 버튼 요소가 있다고 가정해봅시다.
const loginButton = document.getElementById('login-btn');

elementMetadata.set(loginButton, { clickCount: 0 });

function onLoginClick() {
  const metadata = elementMetadata.get(loginButton);
  metadata.clickCount++;
  console.log(`클릭 횟수: ${metadata.clickCount}`);
}

loginButton.addEventListener('click', onLoginClick);

// 만약 나중에 이 버튼이 DOM에서 제거.
// loginButton.remove();

// loginButton에 대한 다른 참조가 없다면,
// GC는 loginButton DOM 요소와 함께 elementMetadata에 저장된 메타데이터까지
// 모두 메모리에서 제거.
```

