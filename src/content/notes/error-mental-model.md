---
title: "에러를 분류하고 다루는 방법: Effect 기반의 멘탈 모델"
publishedAt: 2026-04-26
tags: ["effect", "error-handling", "mental-model"]
---

비즈니스 로직을 작성하다 보면 필연적으로 에러를 마주하게 된다. 에러는 크게 우리가 예상할 수 있는 에러와 예상할 수 없는 에러로 나뉜다.

예상 가능한 에러는 시스템 내에서 통제할 수 있는 범주에 속한다. 이는 복구가 가능하다는 뜻이며, 하나의 '값'으로 다룰 수 있다. Railway Oriented Programming 관점에서 이는 기차가 완전히 탈선하는 것이 아니라 실패를 처리하는 별도의 선로로 이동하는 것과 같다.

반면 예상 불가능한 에러는 통제 범위를 벗어난다. 이 경우 개발자가 할 수 있는 것은 기차의 완전한 탈선을 막고, 오작동으로 인한 추가적인 피해를 최소화하는 것뿐이다.

Effect 라이브러리는 이러한 에러 처리 멘탈 모델을 언어적, 식별적 차원에서 지원한다. Effect의 시그니처는 `Effect<A, E, R>` 형태를 띠는데, 여기서 `E`가 바로 예상할 수 있는 에러를 의미한다. 로직에서 발생할 수 있는 에러를 타입으로 명시적으로 표현하는 것이다. 반대로 예상 불가능한 에러는 타입 `E`로 나타내지 않는다. 이는 Effect 내에서 `fail`과 `die`의 차이로 구현된다.

```typescript
import { Effect } from "effect";

// 복구 가능한, 예상된 에러
const failure = Effect.fail("Failure");
// 타입: Effect<never, string, never>

// 복구 불가능한 시스템 결함
const defect = Effect.die("Die");
// 타입: Effect<never, never, never>
```

프로그램의 죽음은 타입으로 나타낼 수 없다. 예측 가능한 실패만이 타입 시스템 안에서 관리된다.

에러 처리를 설계할 때는 어떤 에러가 발생할 수 있는지 사전에 명시해야 한다. 동시에 에러를 발생시키는 로직과 에러를 포착하고 처리하는 영역을 명확히 분리해야 한다. 에러를 잡는 방어선(boundary)은 로직의 안쪽이 아니라 바깥쪽으로 밀어내어 설정한다. 내부 로직에서는 에러의 원론적인 정보를 보존하고, 시스템의 경계에 다다랐을 때 사용자나 외부 모듈이 이해할 수 있는 형태로 에러를 번역하는 방식이 유리하다.

```typescript
import { Effect } from "effect";

class UserRepositoryError {
  readonly _tag = "UserRepositoryError";
  constructor(readonly cause: unknown) {}
}

const findUser = (id: string) => Effect.fail(new Error("Database Timeout"));

// 로직 내부의 에러를 경계에서 도메인 에러로 번역
const program = findUser("user_1").pipe(
  Effect.mapError((error) => new UserRepositoryError(error)),
);
```

결함(defect)을 다루는 관점은 일반적인 에러와 철저히 달라야 한다. 결함이 발생했을 때는 무리해서 복구하려 하지 말고 상태를 기록하고, 모니터링 시스템에 보고하며, 해당 프로세스를 격리하거나 필요하다면 전체를 종료해야 한다.

결함마저 값으로 취급하여 시스템을 억지로 연명시키는 것은 매우 위험하다. 전체 시스템을 오염시킬 수 있기 때문이다.

```typescript
// 지양해야 하는 패턴
// 시스템 결함을 억지로 값으로 변환하여 살려두는 경우
const riskyBusinessLogic = Effect.die("Out of Memory");

const badRecovery = riskyBusinessLogic.pipe(
  Effect.catchAllDefect(() => Effect.succeed("default_fallback_value")),
);
```

예상 가능한 실패인지 치명적인 결함인지 판가름하는 기준은 상황의 맥락에 있다. 실패가 정상적인 사용 흐름 내에서 사용자가 만들어낼 수 있는 상황이거나, 호출자가 실패를 수신하고 재시도 혹은 폴백(fallback) 등 다른 선택을 할 수 있다면 이는 예상 가능한 에러다. 이 경우 에러 채널을 유지하거나 외부로 넘기면 된다.

그러나 특정 상태에 도달했을 때 코드의 기본 가정이 깨졌거나, 실패 이후 프로세스를 유지하는 것이 데이터나 시스템에 더 큰 위험을 초래한다면 이는 무조건 결함으로 다루어야 한다. 안전한 에러 설계는 통제 가능한 것을 값으로 다루는 것과 동시에 예외적인 상황을 단호하게 격리하는 것에서 시작된다.
