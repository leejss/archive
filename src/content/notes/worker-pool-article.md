---
title: "제어 가능한 동시성: 자바스크립트에서의 워커 풀(Worker Pool) 패턴"
publishedAt: 2026-02-28
tags: ["javascript", "concurrency", "worker-pool", "design-pattern"]
aiGenerated: true
---

# 제어 가능한 동시성: 자바스크립트에서의 워커 풀(Worker Pool) 패턴

소프트웨어 개발을 하다 보면 종종 성능과 안정성 사이의 딜레마에 직면하게 됩니다. 수천 개의 웹 페이지를 스크래핑하거나 대량의 API 요청을 처리해야 하는 상황을 상상해 보십시오. 우리는 이 작업이 최대한 빨리 끝나기를 원하지만, 시스템의 자원은 결코 무한하지 않습니다. 

자바스크립트 환경에서 대량의 비동기 작업을 다룰 때, 개발자들이 가장 먼저 떠올리는 도구는 `Promise.all`입니다. 하지만 이 순진한 접근(Naive Approach)은 종종 시스템을 붕괴시키는 원인이 됩니다. 오늘은 시스템의 자원을 보호하면서도 최적의 처리 속도를 이끌어내는 실용적인 동시성 제어 기법, **워커 풀(Worker Pool) 패턴**에 대해 이야기해 보겠습니다.

---

## 제어 불가능한 동시성의 위험 (The Danger of Uncontrolled Concurrency)

10,000개의 URL을 스크래핑해야 한다고 가정해 봅시다. `Promise.all`을 사용해 모든 작업을 한 번에 실행하면 어떤 일이 발생할까요?

```typescript
// ❌ 위험한 방식: 제어 불가능한 동시성
const results = await Promise.all(
  urls.map(url => fetch(url))
);
```

이 코드는 논리적으로는 단순하지만, 물리적인 현실을 무시하고 있습니다. 10,000개의 네트워크 요청이 동시에 발생하면 우리 시스템의 메모리는 순식간에 고갈(OOM, Out Of Memory)될 수 있으며, 운영체제의 파일 디스크립터 한계를 초과하게 됩니다. 더 나아가, 대상 서버 입장에서는 이를 디도스(DDoS) 공격으로 간주하여 우리의 IP를 영구적으로 차단할 것입니다. 

우리가 겪는 진짜 문제는 작업의 '양'이 아니라 **'제어 불가능한 동시성(Uncontrolled Concurrency)'**에 있습니다. 이를 해결하기 위해 우리는 자원 고갈(Resource Exhaustion)을 막을 수 있는 제어 장치가 필요합니다.

## 청크(Chunk) 방식의 환상과 비효율

가장 직관적인 타협안은 작업을 일정한 크기(Chunk)로 쪼개는 것입니다. "한 번에 10개씩만 처리하자"는 식이죠.

```typescript
// ⚠️ 한계점: 가장 느린 작업에 발목이 잡힙니다.
for (let i = 0; i < tasks.length; i += chunkSize) {
  const chunk = tasks.slice(i, i + chunkSize);
  await Promise.all(chunk.map(doWork)); 
}
```

이 방식은 시스템을 보호한다는 목적은 달성하지만, 심각한 비효율을 낳습니다. 10개의 작업 중 9개가 1초 만에 끝났더라도, 단 1개의 작업이 5초가 걸린다면 나머지 9명의 '논리적 일꾼'은 4초 동안 아무 일도 하지 않고 대기해야 합니다. 우리는 자원을 보호하면서도, 시스템이 허용하는 한계치 내에서는 자원을 빈틈없이 활용하기를 원합니다.

## 워커 풀(Worker Pool) 패턴의 도입

이러한 비효율을 해결하는 우아한 방법이 바로 **워커 풀(Worker Pool)** 패턴입니다. 핵심 아이디어는 매우 실용적입니다. **"시스템이 감당할 수 있는 정해진 수의 일꾼(Worker)만 고용하고, 중앙의 대기열(Queue)에서 각 일꾼이 스스로 다음 작업을 가져가게 하자"**는 것입니다.

여기서 자바스크립트의 특성을 짚고 넘어갈 필요가 있습니다. 자바스크립트 환경에서 말하는 'Worker'는 운영체제의 무거운 스레드(Thread)를 의미하지 않습니다. 이벤트 루프 위에서 돌아가는 **'독립적인 비동기 작업 흐름(Promise Chain)'**을 논리적인 일꾼으로 비유한 것입니다.

이 패턴의 핵심은 **클로저(Closure)를 활용한 안전한 상태 공유**에 있습니다.

```typescript
async function basicWorkerPool(tasks: string[], concurrency: number) {
  let cursor = 0; // 공유 대기열의 인덱스 (번호표 기계)

  async function worker() {
    while (true) {
      const currentIndex = cursor;
      cursor += 1; // 번호표를 뽑고 다음 번호로 넘김

      if (currentIndex >= tasks.length) {
        return; // 더 이상 남은 작업이 없으면 퇴근
      }

      await doWork(tasks[currentIndex]);
    }
  }

  // 정해진 수(concurrency)만큼의 일꾼만 투입
  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);
}
```

여기서 `cursor` 변수는 워커 풀 전체의 진행 상태를 나타내는 핵심 데이터입니다. 만약 이 변수를 전역(Global)으로 관리한다면 다른 코드에 의해 오염될 위험이 있습니다. 반대로 워커 함수 내부에 둔다면 각 워커가 독립적인 `cursor`를 가지게 되어 작업을 분배할 수 없습니다.

클로저는 이 딜레마를 우아하게 해결합니다. `worker` 함수는 자신이 생성된 환경(Lexical Environment)인 `basicWorkerPool` 함수의 스코프를 기억합니다. 덕분에 여러 개의 `worker` 인스턴스들이 단 하나의 `cursor` 변수를 안전하게 '공유'하면서도, 외부 세계로부터는 완벽하게 캡슐화(Encapsulation)하여 보호할 수 있습니다. 

더욱 흥미로운 점은 동시성 제어의 안전성입니다. 멀티 스레드 언어(예: Java, C++)에서는 여러 스레드가 동시에 `cursor += 1`을 실행할 때 경쟁 상태(Race Condition)를 막기 위해 뮤텍스(Mutex)나 락(Lock) 같은 복잡한 동기화 장치가 필수적입니다. 하지만 자바스크립트는 싱글 스레드 기반의 이벤트 루프 모델을 사용합니다. 비록 여러 비동기 흐름(Promise)이 동시에 실행되는 것처럼 보이지만, 실제 메모리의 `cursor` 값을 읽고 쓰는 동기적인 연산(`cursor += 1`)은 한 번에 하나씩만 원자적(Atomic)으로 실행됩니다. 따라서 우리는 복잡한 락 메커니즘 없이도 클로저 하나만으로 완벽하게 안전한 작업 분배기를 구현할 수 있습니다.

이 구조에서 일꾼들은 쉬지 않습니다. 어떤 작업이 일찍 끝나면, 해당 일꾼은 즉시 `while` 루프를 돌아 다음 `cursor`의 작업을 가져옵니다. 낭비되는 시간 없이 시스템이 허용하는 최대의 효율을 뽑아냅니다.

## 실전 도입을 위한 트레이드오프와 견고함 (Production Readiness)

기본적인 워커 풀 개념을 실제 프로덕션 환경에 적용하려면 두 가지 실용적인 문제를 더 해결해야 합니다.

**1. 순서의 보장 (Order Preservation)**
비동기 작업은 시작된 순서대로 끝난다는 보장이 없습니다. 결과를 단순히 배열에 `push()` 하게 되면, 입력된 데이터의 순서와 결과 데이터의 순서가 뒤섞이게 됩니다. 이를 해결하기 위해 입력 배열과 동일한 크기의 빈 배열을 미리 할당하고, 부여받은 `currentIndex` 위치에 정확히 결과를 꽂아 넣어야 합니다.

**2. 에러의 격리 (Fault Tolerance)**
수천 개의 작업 중 단 하나의 작업에서 네트워크 에러가 발생했다고 해서 워커 전체(while 루프)가 죽어버려서는 안 됩니다. 반드시 개별 작업을 `try-catch`로 감싸 에러를 수집하고, 워커는 다음 작업을 계속 이어가도록 보호해야 합니다.

이 두 가지 원칙을 적용한 실전 코드는 다음과 같습니다.

```typescript
async function advancedWorkerPool<T, R>(
  items: T[], 
  concurrency: number, 
  taskFn: (item: T) => Promise<R>
) {
  let cursor = 0;
  
  // 순서 보장을 위한 사전 배열 할당
  const results: (R | undefined)[] = new Array(items.length).fill(undefined);
  const errors: { index: number; error: any }[] = [];

  const workers = Array.from({ length: concurrency }, async () => {
    while (true) {
      const currentIndex = cursor++;
      if (currentIndex >= items.length) return;

      try {
        const result = await taskFn(items[currentIndex]);
        results[currentIndex] = result; // 순서 보장
      } catch (error) {
        errors.push({ index: currentIndex, error }); // 에러 격리 및 수집
      }
    }
  });

  await Promise.all(workers);
  return { results, errors };
}
```

## 결론

소프트웨어 설계에서 무조건적으로 빠른 것만이 정답은 아닙니다. 진정으로 훌륭한 시스템은 예측 가능하고 제어 가능해야 합니다. 

워커 풀 패턴은 단순히 속도를 높이기 위한 기술이 아닙니다. 이는 시스템의 메모리와 네트워크 커넥션, 그리고 대상 서버의 한계를 존중하면서도 우리가 가진 자원을 가장 효율적으로 짜내는 **'안전 장치이자 최적화 도구'**입니다. 대규모 비동기 처리가 필요한 상황이라면, 무작정 `Promise.all`을 호출하기 전에 시스템의 적정 동시성(Concurrency)을 고민하고 이 패턴을 적용해 보시길 권합니다.
