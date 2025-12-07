---
title: Alpinejs Directive 구현 1 - 문자열을 코드로 실행하기
publishedAt: 2025-12-07
tags: ["alpinejs"]
---

```html
<div x-data="{ count: 0 }">
    <span x-text="count * 2"></span>
    <button @click="count++">증가</button>
</div>
```

alpinejs를 이용하면 이 HTML 코드만으로 인터렉티브한 컴포넌트가 만들어진다. 어떻게 HTML 속성과 문자열 뿐인데 어떻게 그게 가능한걸까? 결론부터 말하면 alpinejs는 런타임에 특별한 HTML Attributes (Alpinejs의 Directives)를 분석하여 이를 자바스크립트 코드로 만들어 실행한다. 

## 문자열은 코드가 아니다.

문자열은 코드가 아닌데, 어떻게 이를 자바스크립트 코드로 해석할 수 있을가? 

```js
const element = document.querySelector("[x-data]")
const value = element.getAttribute("x-data")
console.log(value) // "{ count : 0 }"
```

자바스크립트에서 문자열을 코드로 실행하는 대표적인 두 가지 방법이 있다. `eval`과 `new Function`을 이용하는 것이다.

### eval

```js
const count = 5;
const result = eval("count * 2");
console.log(result);  // 10
```

그런데 `eval`에는 문제가 있다. `eval`은 스코프 제한을 두지 않아서 모든 변수에 접근 가능하다. 따라서 다음이 가능해진다.

```js
const secretKey = "sk-123456789abcdef";

function evaluate() {
  return eval("secretKey");
}

console.log(evaluate()); // "sk-123456789abcdef"
```

### new Function()

new Function()의 장점은 스코프를 제한할 수 있다는 점이고 또 데이터를 명시적으로 전달할 수 있다는 점이다.

```js
const secretKey = "sk-123456789abcdef";

function evaluate() {
  return new Function("return secretKey")();
}

console.log(evaluate()); // ReferenceError: secretKey is not defined
```

`new Function`을 사용하면 데이터 객체의 키를 함수의 매개변수로 만드는 것이다.

```js
function evaluate(expression, data) {
  const keys = Object.keys(data);
  const values = Object.values(data);
  const func = new Function(...keys, `return ${expression};`); 
  return func(...values);
}
const result = evaluate("counter + 10", { counter: 1 });
console.log(result); // 11
```

이 방식은 expression에서 `data` 객체의 키에만 접근할 수 있게 한다. 

```js
evaluate("'Hello ' + name", {counter: 1}) // ReferenceError: name is not defined
```

실제 Apinejs에서는 비동기 처리를 위해 new AsyncFunction을 사용한다.  [Source Code](https://github.com/alpinejs/alpine/blob/main/packages/alpinejs/src/evaluator.js#L61)

#### `with`문 사용

Alpinejs에서는 `with`문을 사용하여 데이터 객체의 키에 접근할 수 있도록 한다. 

```js
function evaluate(expression, data) {
  const func = new Function("data", `
    with (data) { 
      return ${expression}; 
    }
  `); 
  return func(data);
}

`with`문은 객체의 속성들을 마치 지역 변수처럼 접근할 수 있게 해주는 기능을 제공한다. 
```

```js

const user = { name: 'Jake', age: 25 };

with (user) {
    console.log(name);  // 'Jake' - user.name과 동일
    console.log(age);   // 25 - user.age와 동일
}
```

`with`문을 사용하면 여러 매개변수를 전달할 필요가 없어지기 때문에 코드의 간결성을 높일 수 있다. 하지만 주의가 필요하다. 다음 경우를 살펴보자.

```js
const x = 123;
const data = {
  x: 456
}
with (data) {
    console.log(x);  // 456
}
```

with문만 보고 x가 전역 변수인지 data 객체의 속성인지 알기 어렵다. 따라서 코드의 가독성이 떨어질 수 있다.

## Evaluation

문자열을 코드로 실행하는 법을 알게되었으니 이걸가지고 directive 해석기를 만들어보자. 다음 HTML 코드가 있다.

```html
<div x-data="{ count: 1 }">
    <span x-text="count + 2"></span>
</div>
```

첫 번째 단계는 `x-data` 디렉티브를 가진 엘리먼트를 찾는 것이다. 

```js
const roots = document.querySelectorAll("[x-data]");
```

두 번째 단계는 `x-data` 디렉티브의 값을 읽어와서 자바스크립트 객체로 변환하는 것이다. 이 객체는 컴포넌트의 상태를 나타낸다.

```js
function parseXData(expression) {
  if (!expression || expression.trim() === '') {
        return {};
    }
  return new Function(`return ${expression}`)();
}

// parseXData("{ count: 1 }") => { count: 1 }

roots.forEach(root => {
  const xDataValue = root.getAttribute("x-data");
  const state = parseXData(xDataValue);
});
```

세 번째 단계는 `x-text` 디렉티브를 찾아서 그 값을 평가하는 것이다. 

```js
function evaluate(expression, data) {
  const func = new Function("data", `
    with (data) { 
      return ${expression}; 
    }
  `); 
  return func(data);
}

roots.forEach(root => {
  const xDataValue = root.getAttribute("x-data");
  const state = parseXData(xDataValue);
  const xTextElements = root.querySelectorAll("[x-text]");
  xTextElements.forEach(el => {
    const xTextValue = el.getAttribute("x-text");
    const result = evaluate(xTextValue, state);
    el.textContent = result;
  });
});
```