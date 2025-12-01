---
title: OIDC (OpenID Connect)
publishedAt: 2025-12-01
tags: []
---


> OpenID Connect (OIDC) is an authentication protocol that builds on top of OAuth 2.0 to allow for identity verification and single sign-on (SSO). 


## OAuth 2.0 의 문제점

OAuth 2.0은 인증 (Authentication)을 위한 프로토콜이 아니다. 인가(Authorization)을 위한  프로토콜이다. 

> The OAuth 2.0 authorization framework enables a third-party
   application to obtain limited access to an HTTP service, either on
   behalf of a resource owner by orchestrating an approval interaction
   between the resource owner and the HTTP service, or by allowing the
   third-party application to obtain access on its own behalf.

예를 들어 유저의 구글 드라이브에 접근해야 하는 앱이 있다고 가정하자. 이 앱은 유저로부터 구글 이메일과 비밀번호를 입력 받는 대신, 유저에게 직접 구글에 로그인하라고 시키고 이에 대한 결과로 구글로 부터 Access Token을 발급 받는다. 이 Access Token은 드라이브 읽기 권한을 가지고 있고 앱은 아 토큰을 이용하여 구글 API 서버로부터 드라이브 데이터를 응답받는다. 여기서 Access Token은 "무엇을 할 수 있는가"를 나타내지, "사용자가 누구 인가"를 (표준화된 방법으로) 나타내지 않는다. 

OAuth 2.0은 인증을 위한 프로토콜이 아님에도 사람들은 이를 인증에 활용하기 시작했다. 자체 회원가입 기능을 추가 할 필요 없이 구글의 유저 데이터를 활용하여 사용자가 누구인지를 알 수 있기 때문이다.  
그런데 여기서 여러 문제가 발생한다.

1. 표준화의 부재

OAuth 제공자마다 API 주소도 다르고 응답 형식도 다르다. 개발자는 제공자하나 하나 늘어날때마다 이에 맞추어 새로운 코드를 작성해야한다.

2. 보안 취약점

Access Token에는 이 토큰이 어떤 클라이언트를 위해 발급받은 토큰인지에 대한 정보가 담겨있지 않다. 이러한 특성을 이용한 [Code substitution](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-v2-threatmodel-08#section-4.4.1.13) 공격이 발생 할 수 있다. 

3. 추가 네트워크 요청

사용자가 로그인 할 때마다 앱은 두 번의 HTTP 요청을 보내야 한다. 


```js
// 두 번의 네트워크 왕복
async function login() {
  // 1번째 요청: 토큰 받기
  const response1 = await fetch('https://oauth.provider.com/token', {
    method: 'POST',
    body: { /* authorization code 등 */ }
  });
  const { access_token } = await response1.json();
  
  // 2번째 요청: 사용자 정보 받기
  const response2 = await fetch('https://api.provider.com/userinfo', {
    headers: { 'Authorization': `Bearer ${access_token}` }
  });
  const userInfo = await response2.json();
}
```

## OIDC의 등장

> OpenID Connect is an interoperable authentication protocol based on the OAuth 2.0 framework of specifications (IETF RFC 6749 and 6750). It simplifies the way to verify the identity of users based on the authentication performed by an Authorization Server and to obtain user profile information in an interoperable and REST-like manner.

OIDC의 철학은 OAuth2.0 위에 안전하고 표준화된 인증 방법을 제공하는 것이다. 이를 위해 OIDC는 ID Token라는 요소를 추가한다. ID Token은 JWT 형식을 가진다. 따라서 디코딩 하면 Header, Payload, Signature으로 나눌 수 있다.

1. 표준화

모든 OpenID 제공자는 동일한 형식의 ID Token을 발급한다. 

```json
// Exmaple
{
  "iss": "https://accounts.google.com",
  "azp": "123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com",
  "aud": "123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com",
  "sub": "101234567890123456789",
  "email": "user@example.com",
  "email_verified": true,
  "at_hash": "some_hash_value",
  "name": "User Name",
  "picture": "https://lh3.googleusercontent.com/a/some_picture_url",
  "given_name": "User",
  "family_name": "Name",
  "locale": "en",
  "iat": 1678886400,
  "exp": 1678890000
}
```

개발자는 한 번의 검증로직만 작성하면 모든 OIDC 제공자와 작동하는 코드를 만들 수 있다.

```js
// OIDC 방식: 모든 제공자에서 동일하게 작동
async function loginWithOIDC(idToken) {
  // 서명 검증
  const decoded = await verifyJWT(idToken);
  
  // 표준화된 클레임 사용
  const userId = decoded.sub;  // 항상 'sub'
  const email = decoded.email;  // 항상 'email'
  const name = decoded.name;    // 항상 'name'
  
  await createOrLoginUser(userId, email, name);
}
```

2. 보안

ID Token의 `aud`는 이 토큰이 어떤 앱을 위한 것인지를 명시한다. 

```js
async function verifyIDToken(idToken) {
  const decoded = jwt.verify(idToken, publicKey, {
    audience: 'your-app-client-id',  // 반드시 일치해야 함
    issuer: 'https://accounts.google.com'
  });
  
  // aud가 일치하지 않으면 jwt.verify가 예외를 던짐
}
```

따라서 클라이언트에서 공격자의 토큰 탈취 공격을 원천 차단할 수 있다. 


3. 성능

유저 정보를 얻기 위해 두 번의 HTTP 요청을 했던 것과 다르게 한 번의 요청으로 Access Token과 유저 정보를 획득 할 수 있다.

```js

// 한 번의 네트워크 왕복으로 모든 정보 획득
async function loginWithOIDC() {
  // 1번의 요청으로 두 토큰을 동시에 받음
  const response = await fetch('https://oauth.provider.com/token', {
    method: 'POST',
    body: {
      grant_type: 'authorization_code',
      code: authorizationCode,
      client_id: 'your-app-id'
    }
  });
  
  const { access_token, id_token } = await response.json();
  
  // ID Token을 로컬에서 검증하고 즉시 사용
  const userInfo = await verifyAndExtract(id_token);
}
```


## ID Token 검증

ID Token은 본질적으로 누가, 언제, 어떤 서비스를 로그인했는지를 암호로 보증한 문서다. (비밀키로 서명한 문서.) 여기서 핵심 원리는 서명한 데이터는 반드시 수신자가 직접 검증해야 한다. 

1. 이 토큰은 진짜인가?
2. 누가 발급했는가?
3. 이 토큰은 누구를 위한건가?
4. 아직 유효한가?
5. 이 로그인 요청이 진짜로 이어진 것인가?

핵심은 ID Token의 위변조를 검증하는 것이다. 헷갈리지 말아야할 것은 ID Token은 암호화된 데이터가 아니다. 일반적인 JWT 형식이기 때문에 누구나 디코딩하여 내용을 볼 수 있다. 하지만 그 정보가 진짜인지는 반드시 서명을 검증하는 과정을 거쳐야 한다.  
OIDC 내 ID Token의 핵심은 클라이언트가 직접 이를 검증하는 것이다.

아래 코드는 서명과 검증을 간단한 코드로 표현한 예시다.

```js
// Google 서버에서 ID Token 생성 (개념적 코드)
function createIDToken(userInfo) {
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: 'https://accounts.google.com',
    sub: userInfo.id,
    aud: 'your-app-client-id',
    exp: Date.now() / 1000 + 3600,
    email: userInfo.email,
    name: userInfo.name
  };
  
  // Header와 Payload를 Base64로 인코딩
  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));
  
  // 연결하고 해시 계산
  const message = `${encodedHeader}.${encodedPayload}`;
  const hash = sha256(message);
  
  // Google의 비밀 키로 해시를 암호화 (서명)
  const signature = rsaSign(hash, googlePrivateKey);
  
  // 최종 ID Token
  return `${message}.${base64url(signature)}`;
}


// 앱에서 ID Token 검증
async function verifyIDToken(idToken) {
  // 1. Google의 공개 키 가져오기
  const jwks = await fetch('https://www.googleapis.com/oauth2/v3/certs');
  const keys = await jwks.json();
  
  // 2. ID Token의 Header에서 kid(Key ID) 확인
  const [encodedHeader, encodedPayload, encodedSignature] = idToken.split('.');
  const header = JSON.parse(base64urlDecode(encodedHeader));
  
  // 3. kid에 해당하는 공개 키 찾기
  const publicKey = keys.keys.find(k => k.kid === header.kid);
  
  // 4. 서명 검증
  const message = `${encodedHeader}.${encodedPayload}`;
  const hash = sha256(message);
  const signature = base64urlDecode(encodedSignature);
  
  // 공개 키로 서명을 복호화하여 원본 해시 추출
  const decryptedHash = rsaVerify(signature, publicKey);
  
  // 5. 해시 비교
  if (hash !== decryptedHash) {
    throw new Error('Invalid signature');
  }
  
  // 6. Payload 검증
  const payload = JSON.parse(base64urlDecode(encodedPayload));
  if (payload.aud !== 'your-app-client-id') {
    throw new Error('Invalid audience');
  }
  if (payload.exp < Date.now() / 1000) {
    throw new Error('Token expired');
  }
  
  return payload;
}
```

OIDC의 암호학적 서명과 검증 과정을 통해 클라이언트는 사용자 인증과정의 신뢰성을 높일 수 있고 성능 또한 높일 수 있다.










