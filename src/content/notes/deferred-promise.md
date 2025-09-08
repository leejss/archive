---
title: Deferred Promise
draft: false
publishedAt: 2025-09-08
tags: []
---

# Deferred Promise Examples

```js

// Deferred 객체의 일반적인 형태
const deferred = {
  promise: /* a new Promise object */,
  resolve: /* the resolve function of the promise */,
  reject:  /* the reject function of the promise */
};

// Deferred 객체를 생성하는 헬퍼 함수
function createDeferred() {
  let resolve, reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

// 1. Deferred 객체를 생성합니다.
const myDeferred = createDeferred();

// 2. Promise는 소비자에게 전달됩니다.
// 소비자는 이 Promise가 언젠가 해결될 것이라고 믿고 후속 작업을 등록합니다.
myDeferred.promise
  .then(result => console.log(`성공: ${result}`))
  .catch(error => console.log(`실패: ${error.message}`));

console.log("Promise는 이제 'pending' 상태입니다.");

// 3. 생산자는 나중에, 원하는 시점에 Promise를 해결하거나 거부할 수 있습니다.
// 예를 들어 2초 후에 성공으로 처리해봅시다.
setTimeout(() => {
  console.log("2초 후... Promise를 resolve 합니다.");
  myDeferred.resolve("외부에서 성공시킴!");
}, 2000);

// 만약 실패시키고 싶다면 myDeferred.reject(new Error("외부에서 실패시킴!"))를 호출하면 됩니다.




// 가상의 Modal Manager
class ConfirmationModal {
  constructor(message) {
    this.message = message;
    this.deferred = this.createDeferred(); // Deferred 객체 생성
    this._createUI(); // 모달 UI 생성
  }

  // Deferred 객체를 생성하는 헬퍼 함수
  createDeferred() {
    let resolve, reject;
    const promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  }

  _createUI() {
    // 실제로는 여기에 DOM 요소를 생성하는 로직이 들어갑니다.
    console.log(`[모달 생성] 메시지: "${this.message}"`);
    console.log("사용자의 선택을 기다립니다...");
  }
  
  // 외부에서 이 메서드를 호출하여 모달을 띄우고 Promise를 반환
  ask() {
    return this.deferred.promise;
  }

  // '확인' 버튼을 눌렀을 때 호출될 메서드
  _handleConfirm() {
    console.log("[모달] '확인' 버튼 클릭됨");
    this.deferred.resolve(true); // Promise를 true 값으로 이행
  }

  // '취소' 버튼을 눌렀을 때 호출될 메서드
  _handleCancel() {
    console.log("[모달] '취소' 버튼 클릭됨");
    this.deferred.reject(new Error('사용자가 작업을 취소했습니다.')); // Promise를 에러와 함께 거부
  }
}

// 사용 시나리오
async function deleteItem() {
  const modal = new ConfirmationModal("정말로 이 항목을 삭제하시겠습니까?");
  
  try {
    const userConfirmed = await modal.ask(); // Promise가 해결될 때까지 대기
    if (userConfirmed) {
      console.log("삭제 작업 실행!");
      // 여기에 실제 삭제 로직을 넣습니다.
    }
  } catch (error) {
    console.warn(error.message); // 사용자가 취소했을 때의 로직
  } finally {
      console.log("모달 작업 완료.");
  }
}

const myModal = new ConfirmationModal("데이터를 저장할까요?");
myModal.ask().then(confirmed => console.log("저장됨")).catch(err => console.log(err.message));

// 2초 후에 사용자가 '확인'을 눌렀다고 가정
setTimeout(() => myModal._handleConfirm(), 2000);

```
