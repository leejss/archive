---
title: contentEditable에서 한글 입력을 처리하는 방법
publishedAt: 2026-06-21
tags: ["Browser"]
---


## 한글 입력은 일반 input과 다르다.

한글은 IME(Input Method Editor)를 거쳐야 하는 조합형 언어다. 하나의 글자가 만들어지기 위해서는 자음과 모음이 결합하는 '조합 상태'를 유지해야 합니다.

```
영문 입력: g → g (즉시 완성)
한글 입력: ㄱ → 구 → 국 (조합 중... 최종 완성)
```

`input` 에서는 브라우저가 IME 조합을 알아서 해결해 준다. 반면 `contentEditable`에서는 이를 직접 처리해야 한다. 한글을 입력하는 상황에서 contentEditable의 내용과 상태를 동기화 하려고하면 브라우저의 내장 IME 메커니즘과 충돌하여 글자가 중복 입력되거나, 커서(Caret)가 튀는 등 입력 흐름이 완전히 깨지게 된다.

## composition 이벤트의 역할

브라우저는 IME 조합과정을 추적할 수 있도록 `composition` 이벤트를 제공한다. `compostion` 이벤트를 통해 조합의 생명주기를 추적할 수 있다. 

- **`compositionstart`**: 사용자가 한글 자음/모음을 누르는 순간, 즉 IME 입력 창이나 조합 상태가 시작될 때 최초 1회 발생합니다.
- **`compositionupdate`**: 글자가 조합되는 과정(예: `ㄱ` -> `구` -> `국`)에서 자음/모음이 추가되거나 바뀔 때마다 지속적으로 발생합니다. 현재 조합 중인 실시간 텍스트를 제공합니다.
- **`compositionend`**: 글자 조합이 완료되어 IME가 브라우저 DOM에 최종 문자를 확정(Commit) 짓는 순간 발생합니다. 한글에서는 보통 공백(Space)을 입력하거나, 엔터를 치거나, 화살표 키를 누르거나, 영문/숫자 등 다른 문자를 입력하여 글자 조합의 경계가 바뀔 때 유발됩니다.

## isComposing을 확인해야 하는 이유

한글을 입력하는 과정에서 일반 키보드 이벤트(keydown, input, keyup)와 조합이벤트가 같이 발생한다. 만약 일반 키보드 입력 핸들러에서 isComposing 상태를 확인하지 않으면, 특정 입력 동작이 중복 실행되는 심각한 버그가 발생할 수 있다.

### Enter 중복

가장 대표적인 예시가 바로 엔터(Enter) 키 입력 시 발생하는 중복 실행입니다. 한글로 '국'을 입력하고 enter를 입력하면 keydown 이벤트에는 다음 이벤트가 연달아 들어온다.

```
keydown Enter isComposing=true -> 조합확정
... compositionEnd
keydown Enter isComposing=false -> contnetEditable의 enter 처리
```

만약 에디터에서 엔터 키를 감지하여 본문을 분할하거나 줄바꿈을 수행하는 커스텀 로직이 있다면, isComposing을 체크하지 않았을 때 1번과 3번 이벤트에서 모두 로직이 실행되어 글자가 두 번 들어가거나 줄바꿈이 두 번 일어난다. 

따라서 다음 Short-circuit 방어로직이 필요하다.

```ts
element.addEventListener('keydown', (e) => {
  if (e.isComposing) return; 
  if (e.key === 'Enter') {
    // (isComposing: false)에서 들어온 두 번째 엔터만 이 문을 통과하여 실행됩니다!
    split()
  }
});
```

## 원칙

물리적인 키 입력은 하나라도 브라우저는 조합 전/후로 나누어 이벤트를 여러 번 발생시킬 수 있다. e.isComposing 플래그를 통해 중복 이벤트를 처리해야 한다.

