---
title: Insecure Direct Object Reference (IDOR) 이해하기
publishedAt: 2026-07-23
tags: [security, architecture, frontend, backend]
---

백엔드 로직이나 API를 작성하다 보면 필연적으로 객체의 식별자를 클라이언트와 주고받게 된다. 이때 흔히 발생하는 보안 취약점이 바로 Insecure Direct Object Reference(IDOR)다.

IDOR가 무엇인지, 왜 반드시 이해해야 하는지부터 시작해 발생 원인과 프론트엔드/백엔드 각각에서의 방어 조치까지 정리해본다.

## Insecure Direct Object Reference (IDOR)란 무엇인가

IDOR(Insecure Direct Object Reference)는 웹 애플리케이션 보안에서 가장 빈번하게 언급되는 취약점 중 하나다.

간단히 말해, 시스템 내부의 데이터나 객체 식별자(e.g., 데이터베이스 Primary Key, 파일명, 계좌번호 등)가 URL이나 요청 파라미터에 직접 노출되어 있고, 사용자가 이 식별자를 임의로 수정했을 때 권한 검증 없이 해당 객체에 접근할 수 있는 상태를 의미한다.

예를 들어, 내가 내 프로필 정보를 조회할 때 웹 브라우저가 `/api/users/1042`라는 요청을 보낸다고 가정해보자. 이때 URL 뒤의 숫자 `1042`를 `1043`으로 살짝 바꿔서 요청했는데, 서버가 어떠한 권한 확인도 없이 다른 사용자인 1043번의 개인정보를 그대로 응답해준다면 이것이 바로 전형적인 IDOR 취약점이다.

### 왜 IDOR를 반드시 알아야 할까?

IDOR를 다루고 이해해야 하는 이유는 세 가지다.

첫째, **발생 빈도가 매우 높다.** OWASP Top 10에서 'Broken Access Control(부러진 접근 제어)' 항목의 핵심 원인으로 항상 상위권을 차지한다. 복잡한 공격 도구나 해킹 기술이 필요 없이, 단순히 브라우저 주소창이나 개발자 도구에서 파라미터 값 몇 개를 바꾸는 것(Parameter Tampering)만으로 공격이 성립하기 때문이다.

둘째, **자동화된 보안 스캐너로 감지하기 어렵다.** SQL Injection이나 XSS 같은 취약점은 정적 분석 도구나 자동화 스캐너가 비교적 잘 잡아낸다. 하지만 IDOR는 "이 사용자가 1043번 데이터에 접근 권한이 있는가 없는가"라는 **비즈니스 로직(Business Logic)상의 문제**다. 코드의 구문 오류가 아니라 비즈니스 맥락의 문제이기 때문에, 개발자가 의도적으로 설계하고 검증하지 않으면 서비스 오픈 직전까지도 모르고 넘어가는 경우가 다반사다.

셋째, **피해가 매우 크다.** 개인정보 유출, 타인의 금융/결제 내역 조회, 심지어 타인의 데이터 수정 및 삭제까지 이어질 수 있다. 기술적으로는 파라미터 한 줄 수정에 불과하지만, 비즈니스 측면에서는 치명적인 보안 사고로 이어진다.

## IDOR는 왜 발생하는가

IDOR가 발생하는 근본적인 이유는 개발자가 **식별(Identification)**과 **인가(Authorization)**를 동일한 개념으로 착각하고, 시스템 경계에서 **암묵적 신뢰(Implicit Trust)**를 적용하기 때문이다.

### 식별(Identification)과 인가(Authorization)의 혼동

시스템 설계 시 가장 많이 범하는 실수가 있다.

- **식별(Identification)**: "이 데이터 객체가 시스템 내부에서 1042번으로 정의된 객체인가?" (객체의 주소를 찾는 과정)
- **인가(Authorization)**: "현재 요청을 보낸 사용자가 1042번 객체에 접근할 정당한 자격을 갖고 있는가?" (권한을 검증하는 과정)

개발을 진행하다 보면 "데이터베이스에서 `1042`번 데이터가 조회되었으니, 요청이 정상 처리되었다"고 생각하기 쉽다. 즉, 데이터가 존재한다는 사실(식별)을 권한이 있다는 사실(인가)과 동일시하는 것이다. 하지만 식별자를 알고 있다는 사실은 해당 객체에 접근할 권한이 있다는 증거가 되지 못한다.

### 암묵적 신뢰 (Implicit Trust)

많은 서비스가 로그인(Authentication, "너는 누구인가") 절차를 거친 사용자라는 이유만으로, 그 사용자가 보내는 모든 요청의 파라미터를 무비판적으로 신뢰한다.

```typescript
// Anti-Pattern: 식별자를 그대로 신뢰하고 조회가 곧 권한이라 착각하는 백엔드 코드
app.get("/api/documents/:documentId", async (req, res) => {
  const { documentId } = req.params;

  // documentId가 현재 요청한 로그인 사용자의 것인지 전혀 검증하지 않는다.
  const document = await documentRepository.findById(documentId);

  if (!document) {
    return res.status(404).json({ error: "Document Not Found" });
  }

  return res.json(document);
});
```

위 코드는 "로그인된 사용자가 요청했으니 당연히 본인 문서겠지"라는 잘못된 암묵적 신뢰에 기반한다. 결국 IDOR는 단순 버그라기보다는, 객체 참조와 인가 경계에 대한 설계 부족에서 기인하는 아키텍처 스멜에 가깝다.

## IDOR 방지를 위한 조치: 프론트엔드와 백엔드의 역할

IDOR 방지는 백엔드와 프론트엔드 양쪽에서 각각 역할을 나누어 대응해야 한다. 보안의 주 방어선은 백엔드에 존재하지만, 프론트엔드 역시 안전한 상태 관리와 사용자 경험 측면에서 중요한 역할을 수행한다.

### 백엔드(Backend)에서의 대응 조치

백엔드는 모든 데이터 접근의 최종 관문이므로, 백엔드의 방어 조치가 곧 IDOR 방지의 핵심이다.

#### 1) 명시적 인가 검증 (Explicit Authorization Guard)

객체를 조회하거나 수정할 때, 요청 주체(Authentication Context)와 대상 객체(Resource Ownership) 간의 권한 관계를 명시적으로 검증해야 한다.

```typescript
// 백엔드: 객체 소유권 명시적 검증
app.get("/api/documents/:documentId", async (req, res) => {
  const { documentId } = req.params;
  const currentUser = req.user; // 인증된 사용자 정보

  const document = await documentRepository.findById(documentId);
  if (!document) {
    return res.status(404).json({ error: "Not Found" });
  }

  // 요청한 사용자가 문서의 소유자이거나 관리자인지 검증
  if (document.ownerId !== currentUser.id && !currentUser.isAdmin) {
    // 403 Forbidden 대신 404를 반환하면 리소스 존재 여부 유출도 방지할 수 있다.
    return res.status(404).json({ error: "Not Found" });
  }

  return res.json(document);
});
```

#### 2) 쿼리 수준의 스코프 강제 (Scoped Repository Queries)

컨트롤러마다 `if` 문으로 권한을 일일이 확인하다 보면 개발자의 실수로 누락될 위험이 있다. 이를 방지하기 위해 쿼리 생성 시점부터 현재 사용자의 ID를 조건으로 강제하는 패턴을 적용한다.

```typescript
// 백엔드: 데이터베이스 쿼리 수준에서 사용자 스코프 격리
const document = await documentRepository.findOneBy({
  id: documentId,
  ownerId: currentUser.id, // 타인의 데이터는 DB 조회 단계에서부터 차단된다.
});
```

#### 3) 간접 참조 키 및 UUID 활용 (Indirect Object Reference & UUID)

`1`, `2`, `3`과 같이 추측하기 쉬운 시퀀스형 Auto-Increment ID(Primary Key)를 API 경로에 직접 노출하지 않는다. 무작위성이 보장되는 `UUID(v4)`나, 세션별 맵핑(Indirect Reference Map) 기법을 활용하여 식별자의 무단 추측을 무력화한다.

```typescript
// 예시: 무작위 UUID 사용
// /api/documents/550e8400-e29b-41d4-a716-446655440000
```

### 프론트엔드(Frontend)에서의 대응 조치

프론트엔드는 백엔드의 검증 조치를 클라이언트 단에서 우회할 수 있기 때문에 **프론트엔드 단독으로는 보안을 완성할 수 없다.** 하지만 프론트엔드는 사용자 경험을 보호하고 불필요한 직관적 키 노출을 줄이는 역할을 한다.

#### 1) 불필요한 Direct Key 요청 파라미터 배제

내 정보 조회(Profile, Settings 등)처럼 현재 로그인한 사용자 본인의 데이터를 다룰 때는, 프론트엔드가 굳이 `userId`를 URL이나 쿼리 파라미터로 넘기지 않도록 설계한다.

```typescript
// BAD (프론트엔드): 사용자 ID를 직접 파라미터로 전달
fetch(`/api/users/${user.id}/profile`);

// GOOD (프론트엔드): 내 정보는 매개변수 없이 /me 또는 /profile 엔드포인트 호출
// 백엔드가 인증 토큰(JWT/Session)에서 유저 식별자를 직접 추출한다.
fetch(`/api/users/me/profile`);
```

#### 2) 인가 실패 응답(401/403/404) 시 안전한 UI 처리 및 상태 초기화

사용자가 주소창의 파라미터를 임의로 바꿔 조작하거나 권한이 없는 페이지로 접근했을 때, 백엔드로부터 전송된 에러 응답을 바탕으로 안전하게 예외 처리를 해야 한다. 민감한 이전 데이터가 화면에 잔재하지 않도록 클라이언트 상태를 초기화하고, 접근 거부 안내 페이지나 로그인 화면으로 리다이렉트한다.

#### 3) 클라이언트 상태(State)의 맹신 금지

프론트엔드의 Redux, Zustand, Context 등에 저장된 `isAdmin`, `userRole` 같은 상태값은 화면 UI를 제어하는 용도로만 사용해야 한다. "프론트엔드에서 버튼을 숨겼으니 안전하겠지"라고 착각해서는 안 되며, 모든 중요한 액션과 데이터 요청은 백엔드의 인가 검증 결과를 신뢰해야 한다.

---

IDOR 취약점을 다루면서 명심해야 할 핵심은 분명하다.

1. **식별자는 권한이 아니다.** 클라이언트가 전달한 객체 ID는 찾고자 하는 대상일 뿐, 접근 자격을 증명하지 않는다.
2. **백엔드가 주 방어선이다.** 백엔드는 모든 요청에 대해 `요청 주체(User)`와 `대상 객체(Resource)` 간의 접근 권한을 명시적으로 검증해야 한다.
3. **프론트엔드는 엔드포인트 간소화와 안전한 상태 관리에 집중한다.** `/me` 형태의 암묵적 자기 자신 조회 패턴을 활용하고, 백엔드의 권한 에러 응답에 유연하게 대응한다.

결국 보안은 기능을 구현한 뒤 위에 덧씌우는 패치가 아니라, 올바른 추상화와 경계 설정에서 자연스럽게 얻어지는 부산물이다.
