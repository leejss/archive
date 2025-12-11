---
title: Alpinejs Directive 구현 2 - reactivity
publishedAt: 2025-12-11
tags: ["alpinejs"]
---

```html
<div x-data="{ count: 1 }">
    <span x-text="count * 2"></span>
    <button @click="count++">증가</button>
</div>
```

alpinejs로 쓰여진 위 코드에서 증가버튼을 누르면 x-text 내용은 변경된다. 이걸 다시 말하면, x-text의 내용은 x-data의 내용에 의존하고 있다고 말한다. 이렇게 의존성을 추적하여 상태의 변경에 따라 자동으로 내용이 바뀌는 것을 **reactivity** 라고 한다. Alpinejs의 reactivity 구조를 직접 구현함으로써 어떻게 동작하는지 파악하도록 한다.

## reactivity

[자바스크립트 코드를 살펴보자](https://alpinejs.dev/advanced/reactivity)

```js
const data = reactive({count: 1})
effect(() => {
  console.log(`count change ${data.count}`)
})

count += 1;

// count change 1
// count change 2
```

어딘가에 정의된 `reactive`와 `effect` 함수가 있다고 가정한다.`reactive`는 어떤 객체를 말하자면 구독 가능하게 만든다. 그리고 이 객체는 `effect`의 함수를 구독자로 등록한다. 이후 이 객체의 프로퍼티 값이 변하면 구독자인 `effect`의 함수를 호출한다.

그럼 이제 이걸 Alpinejs의 Directive 시스템에 적용해보자. Alpinejs는 스크립트가 로드 되면서 x-data directive를 평가하는 초기화 과정을 거친다. 그리고 x-data 엘리먼트의 스코프 내에서 이 x-data에 의존하고 있는 또 다른 Directive들을 x-data의 변경에 반응하도록 한다. 이걸 매우 간단하게 코드로 나타내보면 이렇다.

```js
function start() {
    document.querySelectorAll('[x-data]').forEach(root => {
        // 반응형 데이터 생성
        const expr = root.getAttribute('x-data');
        const data = reactive(new Function(`return ${expr}`)());
        
        root.querySelectorAll('[x-text]').forEach(el => {
            const textExpr = el.getAttribute('x-text');
            effect(() => {
                el.textContent = evaluate(textExpr, data);
            });
        });
        
    });
}

```

Alpinejs가 위 코드로 구현되어 있는 것은 아니지만, 비슷한 과정을 거쳐서 Directive를 반응형으로 만든다. 그럼 이제 내부 구현인 `reactive`와 `effect`를 살펴보자.

`reactive`는 자바스크립트의 `Proxy`문법을 활용한다. `Proxy`는 객체의 프로퍼티에 대한 접근과 설정을 핸들링할 수 있는 특수한 방법을 제시한다.

```js

const data = {count : 1}
const proxy = new Proxy(data,  { 
  get(target, key) {
    console.log(`inside proxy ${key}`)
    return target[key]
  }, 
  set(target, key, value) {
    console.log(`set ${key} to ${value}`)
    target[key] = value
    return true
  }
})

console.log(proxy.count) 
// 1
// inside proxy count

proxy.count = 2
// set count to 2
console.log(proxy.count) 
// 2
```

프록시의 `get`과 `set` 헨들러를 통해서 반응형 시스템을 만든다.

```js
function reactive(target) {
  const hnadlers = {
    get(target, key) {
      // 여기서 의존성 추적이 이루어진다.
      track(target, key)
      return target[key]
    },
    set(target, key, value) {
      // 여기서 effect 트리거가 이루어진다.
      trigger(target, key)
      return true
    }
  }
  return new Proxy(target, handlers)
}

```

`track`과 `trigger`는 각각 의존성을 추적하고 트리거하는 함수다.

```js
let activeEffect = null;
const targetMap = new WeakMap<object, Map<string, Set<() => void>>>();

function trigger<T extends object>(target: T, key: string) {
  const depsMap = targetMap.get(target);
  if (!depsMap) return;
  const deps = depsMap.get(key as string);
  if (!deps) return;
  deps.forEach((effect) => effect());
}

function track<T extends object>(target: T, key: string) {
  if (!activeEffect) return;
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    depsMap = new Map<string, Set<() => void>>();
    targetMap.set(target, depsMap);
  }
  let deps = depsMap.get(key);
  if (!deps) {
    deps = new Set<() => void>();
    depsMap.set(key, deps);
  }

  deps.add(activeEffect);
}
```

`targetMap`이라는 키를 객체로 하고 값을 `Map`으로 하는 `WeakMap`을 사용한다. `Map`의 키는 객체의 프로퍼티 이름이고 값은 `Set`으로 하는데, `Set`의 값은 `effect` 함수다. `track`과정을 마지막 라인만 보면, `activeEffect`를 `Set`에 추가한다. 이걸 시작화해보면 다음과 같다.

```txt
targetMap
  └─ target(object) -> Map
         └─ "propertyKey" -> Set(effect, effect, ...)
```

이 후, 객체의 속성을 설정하면 `trigger` 함수가 호출된다. `trigger` 함수는 `targetMap`에서 해당 객체의 `Map`을 찾아서 해당 프로퍼티 이름의 `Set`을 찾아서 그 `Set`의 모든 `effect` 함수를 호출한다. 이렇게 하면 객체의 속성이 변경되면 그 속성에 의존하고 있는 모든 `effect` 함수가 자동으로 호출된다.

이런 반응형 시스템을 통해서 alpinejs의 directive를 반응형으로 만들 수 있다.