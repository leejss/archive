---
title: "시공간을 연결하는 상태 머신: 프로미스와 Deferred 패턴"
publishedAt: 2026-03-08
tags: ["javascript", "promise", "async", "design-patterns", "state-machine"]
aiGenerated: true
---

우리는 종종 자바스크립트의 프로미스(Promise)를 '콜백 지옥(Callback Hell)을 탈출하기 위한 문법적 도구' 정도로만 치부하곤 합니다. 물론 `async/await`와 결합된 프로미스는 비동기 코드를 동기 코드처럼 읽히게 만들어주는 훌륭한 역할을 합니다. 하지만 프로미스의 진정한 가치는 단순히 코드를 평평하게 만드는 데 있지 않습니다. 

본질적으로 **프로미스는 실행 흐름을 통제하고, 시공간이 분리된 로직들을 하나로 연결해 주는 강력한 상태 머신(State Machine)입니다.**

이 글에서는 프로미스가 어떻게 불확실한 미래의 상태를 제어하고, 물리적으로 분리된 코드 블록들을 우아하게 엮어내는지 살펴보겠습니다.

## 시공간이 분리된 로직의 문제

현대의 웹 애플리케이션, 특히 복잡한 UI를 다룰 때 우리는 자주 '시공간의 분리'를 경험합니다. 가장 대표적인 예가 사용자에게 확인을 요구하는 커스텀 모달(Modal) 창입니다.

사용자가 "삭제" 버튼을 눌렀을 때, 우리는 즉시 삭제를 수행하지 않고 모달을 띄워 의사를 묻습니다. 이상적으로는 이 과정을 다음과 같이 선형적인 흐름으로 작성하고 싶을 것입니다.

```javascript
async function handleDelete() {
  // 1. 모달을 띄우고 사용자의 응답을 기다린다. (실행 흐름의 일시 정지)
  const isConfirmed = await showModal('정말로 삭제하시겠습니까?');
  
  // 2. 응답에 따라 분기한다.
  if (isConfirmed) {
    await deleteItem();
  }
}
```

하지만 현실의 UI 로직은 이렇게 단순하게 흘러가지 않습니다. `showModal` 함수가 호출되는 시점과 공간, 그리고 사용자가 모달의 "확인" 또는 "취소" 버튼을 클릭하여 이벤트를 발생시키는 시점과 공간은 완전히 분리되어 있습니다. 

이러한 시공간의 간극을 어떻게 하나의 선형적인 `await` 흐름으로 연결할 수 있을까요? 바로 여기서 프로미스가 '상태 머신'으로서 빛을 발합니다.

## Deferred 패턴: 제어권의 외부 위임

프로미스는 내부적으로 `Pending`(대기), `Fulfilled`(이행), `Rejected`(거부)라는 세 가지 상태를 가집니다. 일반적인 프로미스 생성자는 콜백 함수 내부에서 즉시 비동기 작업을 수행하고 그 결과에 따라 상태를 전이시킵니다.

하지만 시공간이 분리된 상황에서는, 프로미스를 생성하는 시점과 프로미스의 상태를 결정(resolve/reject)해야 하는 시점이 다릅니다. 이를 해결하기 위해 우리는 프로미스의 상태를 변경하는 함수(`resolve`, `reject`)를 외부로 빼내어 저장해 두는 기법을 사용할 수 있습니다. 이를 흔히 **Deferred 패턴**이라고 부릅니다.

클로저(Closure)를 활용하여 이 패턴을 구현해 보겠습니다.

```javascript
function createDeferred() {
  let resolve;
  let reject;

  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });

  // 프로미스 객체와 함께, 그 상태를 제어할 수 있는 함수들을 반환합니다.
  return { promise, resolve, reject };
}
```

이제 우리는 `promise`라는 상태 머신과, 그 기계의 상태를 외부에서 조작할 수 있는 리모컨(`resolve`, `reject`)을 손에 쥐게 되었습니다.

## 비동기 모달 구현하기

앞서 만든 `createDeferred`를 활용하여, 시공간이 분리된 모달 로직을 하나로 연결해 보겠습니다.

```javascript
let modalControl = null;

// 1. 모달을 화면에 표시하고, '대기 상태'의 프로미스를 반환하는 함수
function showModal(message) {
  // UI에 모달을 렌더링하는 로직 (생략)
  renderModalUI(message);
  
  // Deferred 객체를 생성하여 전역(또는 모듈 스코프)에 저장합니다.
  modalControl = createDeferred();
  
  // 호출자에게는 Pending 상태의 프로미스만 반환합니다.
  return modalControl.promise; 
}

// 2. 사용자가 '확인' 버튼을 클릭했을 때 실행될 이벤트 핸들러
function onConfirm() {
  if (modalControl) {
    modalControl.resolve(true); // 프로미스의 상태를 Fulfilled(true)로 전이시킵니다.
    modalControl = null;
    closeModalUI();
  }
}

// 3. 사용자가 '취소' 버튼을 클릭했을 때 실행될 이벤트 핸들러
function onCancel() {
  if (modalControl) {
    modalControl.resolve(false); // 프로미스의 상태를 Fulfilled(false)로 전이시킵니다.
    modalControl = null;
    closeModalUI();
  }
}
```

이 구조를 통해 우리는 마침내 목표를 달성했습니다. `showModal`을 호출하는 비즈니스 로직은 사용자가 버튼을 클릭할 때까지(즉, `modalControl.resolve`가 호출될 때까지) 실행 흐름을 멈추고 안전하게 대기할 수 있게 되었습니다. 

이벤트 기반의 파편화된 코드들이 프로미스라는 상태 머신을 매개체로 하여 하나의 응집력 있는 동기적 흐름으로 재탄생한 것입니다.

## 불확실성을 캡슐화하는 수단

프로미스가 상태 머신이라는 관점은 UI 이벤트뿐만 아니라, 네트워크 요청이나 리소스 로딩과 같은 전통적인 비동기 작업에서도 동일하게 적용됩니다. 예를 들어, 이미지를 동적으로 로드하는 상황을 생각해 봅시다.

```javascript
function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    // 미래의 성공 상태
    img.onload = () => resolve(img);
    // 미래의 실패 상태
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    
    img.src = url;
  });
}

async function main() {
  try {
    const img = await loadImage('https://example.com/image.jpg');
    document.body.appendChild(img);
  } catch (error) {
    console.error('이미지 로딩 실패:', error);
  }
}
```

여기서 프로미스는 "이미지가 성공적으로 로드되었거나, 로드에 실패했다"는 **불확실한 비동기 작업의 최종 상태를 안전하게 캡슐화**합니다. 호출자(`main` 함수)는 이미지 로딩의 구체적인 메커니즘(`onload`, `onerror` 이벤트 바인딩 등)을 알 필요가 없습니다. 그저 프로미스라는 상태 머신이 최종 상태에 도달하기만을 기다리면 됩니다.

## 트레이드오프와 실용주의

Deferred 패턴은 시공간이 분리된 복잡한 로직을 연결하는 데 매우 강력한 도구입니다. 특히 레거시 이벤트 에미터(Event Emitter) 기반의 코드를 최신 `async/await` 흐름으로 마이그레이션하거나, 위에서 본 복잡한 UI 상호작용을 제어할 때 유용합니다. (참고로, 최신 자바스크립트 표준에서는 이 패턴을 내장한 `Promise.withResolvers()` 메서드가 도입되기도 했습니다.)

하지만 모든 도구가 그렇듯 남용은 피해야 합니다.

대부분의 일반적인 비동기 작업(API 호출, 파일 읽기 등)은 표준 `new Promise((resolve, reject) => {...})` 생성자 패턴 내부에서 처리하는 것이 훨씬 응집도가 높고 안전합니다. `resolve`와 `reject`를 외부 스코프로 노출시키는 것은 그만큼 상태 변경의 권한을 여러 곳으로 분산시킨다는 의미이므로, 자칫하면 프로미스의 상태가 어디서 어떻게 변경되는지 추적하기 어려운 스파게티 코드를 만들 위험이 있습니다.

## 결론

프로미스를 단순히 비동기 콜백을 감싸는 래퍼(Wrapper)로만 바라보던 시각에서 벗어나 보십시오. 

프로미스는 **실행 흐름을 통제하고, 시공간이 분리된 로직들을 하나로 연결해 주는 강력한 상태 머신**입니다. 이 멘탈 모델을 갖추게 되면, 파편화된 이벤트와 비동기 작업들로 가득한 복잡한 애플리케이션 속에서도 명확하고 선형적인 제어 흐름을 설계할 수 있는 안목을 갖게 될 것입니다.
