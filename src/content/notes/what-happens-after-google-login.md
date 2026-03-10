---
title: OAuth 2.0, OIDC, PKCE로 이해하는 구글 로그인 플로우
publishedAt: 2026-03-10
tags: []
aiGenerated: true
---

구글 로그인을 구현할 때 개발자가 실제로 풀어야 하는 문제는 하나가 아니다. 우리는 권한을 위임받아야 하고, 사용자가 누구인지 확인해야 하며, 중간에서 토큰이 바뀌지 않았는지도 검증해야 한다. 브라우저나 모바일 앱처럼 비밀을 안전하게 보관할 수 없는 공개 클라이언트도 방어해야 한다.

이 요구사항을 한 번에 설명하려고 하면 보통 OAuth 2.0, OIDC, JWT, PKCE라는 네 개의 약어가 한꺼번에 등장한다. 하지만 이들은 같은 문제를 해결하지 않는다. 각자 맡은 역할이 다르다.

- OAuth 2.0은 권한 위임을 다룬다.
- OIDC는 로그인한 사용자의 신원 확인을 표준화한다.
- JWT는 그 신원 정보를 담는 표현 형식으로 자주 쓰인다.
- PKCE는 공개 클라이언트가 authorization code를 안전하게 교환하도록 돕는다.

이제 질문을 조금 더 구체적으로 바꿔보자.

> 사용자가 "구글 로그인" 버튼을 누른 뒤, 애플리케이션이 로그인 완료 상태가 되기까지 실제로 무슨 일이 일어나는가?

내가 보기에 이 흐름은 다섯 단계로 나누어 이해하는 것이 가장 좋다.

## 1. 브라우저는 구글에게 권한과 신원 확인을 요청한다

애플리케이션은 사용자를 곧바로 로그인시키지 않는다. 먼저 사용자를 구글의 authorization endpoint로 보낸다. 이때 요청에는 단순히 "로그인 시켜줘"라는 뜻만 담기지 않는다. 어떤 앱이 요청하는지, 어디로 돌아와야 하는지, 어떤 범위의 정보가 필요한지, 그리고 이 요청이 위조되지 않았는지를 판단할 정보가 함께 담긴다.

```js
const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
authUrl.searchParams.set("client_id", "YOUR_CLIENT_ID");
authUrl.searchParams.set("redirect_uri", "https://yourapp.com/callback");
authUrl.searchParams.set("response_type", "code");
authUrl.searchParams.set("scope", "openid email profile");
authUrl.searchParams.set("state", generateRandomString());
authUrl.searchParams.set("code_challenge", codeChallenge);
authUrl.searchParams.set("code_challenge_method", "S256");

window.location.href = authUrl.toString();
```

여기서 `scope=openid`는 중요하다. 이 값이 들어가면 요청은 단순한 OAuth 2.0 인가 요청이 아니라 OIDC 요청이 된다. 다시 말해, 애플리케이션은 "권한"뿐 아니라 "이 사용자가 누구인지 확인할 수 있는 정보"도 함께 원한다고 선언하는 셈이다.

`state`는 CSRF 방어를 위한 값이다. 애플리케이션은 요청을 보낼 때 생성한 `state`를 저장해두고, 콜백으로 돌아왔을 때 같은 값이 들어왔는지 확인해야 한다. 이 검증을 하지 않으면 로그인 CSRF가 가능해진다. 공격자는 자신의 구글 계정으로 정상 로그인 절차를 완료한 뒤, 그 결과를 피해자의 브라우저에 주입할 수 있다. 그러면 피해자는 자신이 로그인했다고 생각하지 않았는데도 공격자의 계정으로 로그인된 상태가 된다.

## 2. 구글은 비밀번호 대신 authorization code를 돌려준다

구글은 사용자를 인증한 뒤 비밀번호를 애플리케이션에 넘기지 않는다. 그 대신 짧은 수명의 authorization code를 `redirect_uri`로 보낸다. 이것이 OAuth 2.0의 핵심적인 분리다. 서드파티 앱은 사용자의 자격 증명을 직접 다루지 않고, 제한된 목적을 가진 임시 코드만 받는다.

이 설계가 중요한 이유는 간단하다. 만약 일정 관리 앱이 구글 캘린더에 접근하기 위해 사용자의 구글 비밀번호 자체를 받아야 한다면, 사용자는 자신의 모든 권한을 그 앱에 넘기는 셈이 된다. OAuth 2.0은 이런 모델을 피하기 위해 만들어졌다. 앱은 비밀번호가 아니라 제한된 권한을 표현하는 토큰만 받는다.

하지만 code를 받았다고 해서 로그인 구현이 끝난 것은 아니다. 이 시점의 code는 아직 권한과 신원을 모두 증명하지 않는다. 단지 다음 단계를 진행할 수 있게 해주는 교환권에 가깝다.

## 3. 백엔드는 code를 token으로 교환한다

브라우저는 콜백으로 받은 code를 백엔드로 전달하고, 백엔드는 구글의 token endpoint와 서버 대 서버로 통신한다. confidential client라면 이 단계에서 `client_secret`을 안전하게 보관한 채 사용할 수 있다. 공개 클라이언트라면 secret 대신 PKCE 검증에 의존하게 된다.

```js
const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    code,
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    redirect_uri: "https://yourapp.com/callback",
    grant_type: "authorization_code",
    code_verifier: codeVerifier,
  }),
});

const { access_token, id_token, refresh_token } = await tokenResponse.json();
```

이 응답에서 각 토큰은 서로 다른 의미를 가진다.

- `access_token`은 구글 API를 호출하기 위한 토큰이다.
- `id_token`은 사용자의 신원을 설명하는 토큰이다.
- `refresh_token`은 조건이 맞을 때만 발급되며, 새 `access_token`을 받는 데 사용된다.

여기서 자주 생기는 오해가 하나 있다. `access_token`이 있다고 해서 사용자가 누구인지 안전하게 알 수 있는 것은 아니다. OAuth 2.0의 본래 관심사는 인가이며, access token은 "무엇을 할 수 있는가"를 표현하는 데 초점이 있다. 로그인 처리는 `id_token` 쪽에서 다뤄야 한다.

## 4. PKCE는 code를 훔쳐도 토큰으로 바꾸지 못하게 만든다

PKCE는 원래 공개 클라이언트를 위한 보안 확장이다. 공개 클라이언트는 `client_secret`을 안전하게 숨길 수 없기 때문이다. 모바일 앱, SPA, 데스크톱 앱에서는 소스 코드 분석이나 리디렉션 가로채기 같은 문제가 현실적이다.

PKCE의 아이디어는 단순하다. 클라이언트는 authorization request를 보내기 전에 임의의 `code_verifier`를 만들고, 이를 SHA-256으로 변환한 `code_challenge`를 authorization request에 포함한다. 그리고 나중에 token exchange 단계에서 원래 값인 `code_verifier`를 제출한다. 서버는 `sha256(code_verifier) === code_challenge`인지 확인한다.

이 구조 덕분에 공격자가 중간에서 authorization code를 가로채더라도, 원래 요청자가 갖고 있던 `code_verifier`를 모르면 토큰 교환에 실패한다. 특히 모바일 환경에서 악성 앱이 동일한 URL 스킴을 등록해 callback을 가로채는 시나리오를 생각해보면 PKCE의 목적이 분명해진다. code만 훔쳐서는 충분하지 않게 만드는 것이다.

정리하면 PKCE는 "코드를 요청한 클라이언트"와 "코드를 토큰으로 교환하는 클라이언트"가 같다는 점을 증명하려는 장치다.

## 5. OIDC는 `id_token`으로 신원 확인을 완성한다

`scope`에 `openid`가 포함되면 구글은 `id_token`을 함께 발급할 수 있다. 이 토큰은 대개 JWT 형식이며, 사용자의 식별자와 발급자, 대상 애플리케이션, 만료 시각 같은 정보를 담는다.

중요한 점은 JWT가 암호화된 봉투가 아니라는 것이다. 누구나 디코딩해서 payload를 읽을 수 있다. 따라서 핵심은 내용을 읽는 일이 아니라, 그 내용이 진짜 구글이 서명한 것인지 검증하는 일이다.

애플리케이션은 최소한 다음을 검증해야 한다.

- 서명이 유효한가?
- `iss`가 기대한 발급자인가?
- `aud`가 내 애플리케이션의 클라이언트 ID인가?
- `exp`가 지나지 않았는가?

`aud` 검증이 특히 중요하다. 어떤 토큰이 진짜라고 해서 곧바로 내 앱을 위한 토큰이라는 뜻은 아니기 때문이다. 공격자가 자신의 앱을 대상으로 발급받은 토큰을 가져와 다른 앱에 제출하는 상황을 생각해보자. 수신자가 `aud`를 확인하지 않으면, "진짜이긴 하지만 나를 위한 것은 아닌 토큰"을 받아들이게 된다. 이런 종류의 혼동은 흔히 confused deputy 문제로 설명된다.

즉, `aud` 검증은 토큰의 진위만이 아니라 토큰의 귀속을 확인하는 과정이다.

## 로그인 완료는 토큰 수신이 아니라 세션 확정이다

실제 애플리케이션에서 로그인 완료 상태는 구글로부터 토큰을 받는 순간이 아니라, 애플리케이션이 그 토큰을 검증하고 자체 세션을 만든 순간에 비로소 성립한다.

보통 서버는 다음과 같은 순서로 마무리한다.

1. `state`를 검증한다.
2. authorization code를 token으로 교환한다.
3. `id_token`의 서명과 클레임을 검증한다.
4. `sub` 같은 안정적인 식별자로 로컬 사용자와 매핑한다.
5. 자체 세션이나 세션 쿠키를 발급한다.

이 마지막 단계가 빠지면 애플리케이션은 외부 IdP의 응답만 받았을 뿐, 자신의 로그인 상태를 아직 확정하지 못한 것이다.

## 이 흐름을 한 문장씩 줄이면

OAuth 2.0은 사용자의 비밀번호를 받지 않고도 제한된 권한을 위임받게 해준다. OIDC는 그 위에 신원 확인을 덧씌운다. JWT는 그 신원 정보를 담는 표준 형식이고, PKCE는 code가 탈취되어도 토큰 교환이 되지 않도록 막는다.

그래서 구글 로그인 버튼 하나 뒤에는 사실 네 가지 질문이 숨어 있다.

- 누구에게 권한을 위임받고 있는가?
- 지금 돌아온 사용자는 누구인가?
- 이 토큰은 위조되지 않았는가?
- 이 요청을 시작한 바로 그 클라이언트가 응답을 마무리하고 있는가?

구글 로그인을 이해한다는 것은 이 약어들을 외우는 일이 아니라, 이 네 질문이 서로 다른 계층에서 해결된다는 사실을 이해하는 일에 더 가깝다.
