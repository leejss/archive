---
title: MessageChannel을 이용한 비동기 작업
publishedAt: 2025-12-10
tags: []
---

React 소스코드 중 [enqueueTask.js](https://github.com/facebook/react/blob/main/packages/shared/enqueueTask.js)를 보면 MessageChannel을 활용한다는 점이 눈에 띈다. MessageChannel은 원래 서로 다른 브라우징 컨텍스트가 안전하게 메시지를 주고받을 수 있게 해주는 API다. 브라우징 컨텍스트란 웹 페이지가 실행되는 독립적인 환경을 의미한다. 예를 들어 메인 페이지와 iframe, 또는 웹 페이지와 Web Worker가 각각 별도의 컨텍스트를 가진다. 자세한 내용은 [Channel Messaging API](https://developer.mozilla.org/en-US/docs/Web/API/Channel_Messaging_API)를 참고할 수 있다.

하지만 enqueueTask에서는 MessageChannel을 이렇게 쓴다.

```jsx
const channel = new MessageChannel();
channel.port1.onmessage = callback;
channel.port2.postMessage(undefined);

```

채널을 생성하고 port1의 메시지 핸들러에 task를 콜백으로 등록한다. 그리고 곧바로 port2를 통해 메시지를 전송한다. 두 포트를 모두 같은 컨텍스트에서 사용하는 것이다. 이것은 본래 의도된 사용법이 아니지만, 이유가 있다. 특정 태스크를 비동기 작업으로 등록하기 위함이고 비동기 작업을 Microtask가 아닌 Macrotask로 관리하기 위함이다.

## 이벤트 루프의 실행 순서.

자바스크립트 실행환경은 이벤트루프를 가지고 있다. 이를 통해 싱글 스레드 언어인 자바스크립트가 비동기 작업을 할 수 있게 만든다. 현재 실행중인 함수는 콜스택으로 관리하지만 비동기 작업은 큐(Queue)로 관리한다. 브라우저 환경의 경우, 큐는 두 가지 종류가 있다. 바로 Microtask Queue와 Macrotask Queue 이다. 이벤트 루프는 다음 순서로 작업을 처리한다. 

**1단계: Macrotask Queue에서 작업 하나를 꺼내 실행한다.** 이 작업이 콜스택에 올라가고, 작업이 호출하는 모든 함수들이 차례로 콜스택에 쌓였다가 완료되면서 빠져나간다. 이 과정이 끝나면 콜스택이 비워진다.

**2단계: Microtask Queue의 모든 작업을 실행한다.** 이 과정에서 새로운 Microtask가 추가되어도 큐가 완전히 비워질 때까지 계속 실행한다. (Flush)

**3단계: 브라우저가 필요하다면 화면을 렌더링한다.** DOM이 변경되었고 충분한 시간(약 16.6ms)이 지났다면 브라우저는 렌더링 파이프라인을 실행한다.

**4단계: 다시 1단계로 돌아간다.**

여기서 주목할 점은 Microtask Queue와 Macrotask Queue가 비워지는 방식이다. Microtask Queue는 한 번에 전부 비워지지만, Macrotask Queue는 하나씩만 꺼낸다. (이 차이가 React의 스케줄링 전략에 핵심적인 역할을 한다.)

## 왜 MessageChannel인가?

Macrotask로 분류되는 작업들은 여러 개있다. 대표적으로 DOM 이벤트 헨들러, `setTimeout`, `setInterval`, `<script>` 로 추가된 스크립트 실행 등. 그 중 `MessageChannel`의 메시지 헨들러 실행도 Macrotask로 분류가 된다. 여기서 궁금한 건 어째서 `MessageChannel`을 선택했는 가 이다. 간단하게 생각해보면 `setTimeout`이 더 용도에 맞는 선택이 아닌가 한다.

```js
setTimeout(task, 0) // task를 Macrotask Queue에 등록
```

하지만 `setTimeout(fn, 0)` 방식에는 문제가 있다. 

1. 4ms최소 지연: [HTML표준에 따르면](https://html.spec.whatwg.org/multipage/timers-and-user-prompts.html#timers) `setTimeout` 호출이 5회 이상 발생하면 최소 4ms의 지연을 강제해야 합니다. 이것은 오래된 웹사이트들이 무한히 빠른 타이머 루프를 만들어 브라우저를 멈추게 하는 것을 방지하기 위한 안전장치입니다.

```js
let count = 0;
function test() {
  const start = performance.now();
  setTimeout(() => {
    const delay = performance.now() - start;
    console.log(`호출 ${count}: ${delay}ms`);
    if (count++ < 10) test();
  }, 0);
}
test();


// 호출 1: 0ms
// 호출 2: 0ms
// 호출 3: 0ms
// 호출 4: 0ms
// 호출 5: 0ms
// 호출 6: 4.600000023841858ms <- 4ms강제
// 호출 7: 4.299999952316284ms
// 호출 8: 4.600000023841858ms
// 호출 9: 4.5ms
// 호출 10: 4.5ms
```

2. 백그라운드 Throttling: 브라우저는 백그라운드 탭의 타이머를 제한한다.
3. setTimeout같은 타이머는 테스트 프레임워크에서 mock 가능하다.

그러면 `MessageChannel`은 어떨까? `MessageChannel`은 4ms강제가 없다. 그리고 백그라운드 Throttling도 최소화 된다. 

```js
console.time('MessageChannel');
count = 0;
const start = performance.now()
function testMessageChannel() {
  const delay = performance.now()-start
  console.log(`호출 ${count}: ${delay}ms`)
  if (count++ < 10) {
    const channel = new MessageChannel();
    channel.port1.onmessage = testMessageChannel;
    channel.port2.postMessage(undefined);
  } else {
    console.timeEnd('MessageChannel');
  }
}
testMessageChannel();


// 호출 1: 0.2999999523162842ms
// 호출 2: 0.3999999761581421ms
// 호출 3: 0.3999999761581421ms
// 호출 4: 0.3999999761581421ms
// 호출 5: 0.5ms
// 호출 6: 0.5ms
// 호출 7: 0.6000000238418579ms
// 호출 8: 0.6999999284744263ms
// 호출 9: 0.6999999284744263ms
// 호출 10: 0.6999999284744263ms
// MessageChannel: 0.781005859375 ms
```

React가 MessageChannel을 이용하여 비동기 작업을 관리하는 것은 이러한 브라우저의 특성을 잘 이용한 전략적 판단인 것이다. 