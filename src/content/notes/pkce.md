---
title: PKCE (Proof Key for Code Exchange)
publishedAt: 2025-11-21
tags: []
---

## 등장 배경

일반적인 OAuth 2.0 인증 플로우에서 클라이언트가 Access Token을 Auth Server로 부터 발급받기 위해서는 client secret을 전달해야 한다. 클라이언트를 Credential Client, Public Client로 나눌 수 있는데, Public client인 환경에서는 client secret을 안전하게 보관할 수 없다. 예를 들어 다음과 같은 시나리오가 가능해진다.
자바스크립트 코드에 client secret 문자열이 하드코딩되어 있고 이 값으로 Access Token을 발급받으려고 하면 해커가 자바스크립트 소스코드를 통해서 client secret을 추출할 수 있다. 또한 모바일 앱의 경우에도 소스 코드 분석을 통해 client secret을 추출할 수 있다. 만약 악성 앱이 유저 디바이스에 설치가 되어 있고 탈취하고자 한 앱의 Custom URI scheme과 동일하게 등록을 해놓는다. 유저가 원래 앱에서 인증요청을 보내면 Auth server는 Authorization Code와 함께 redirect 시키는데, 이때 악성 앱이 Code를 가로챈다. 그리고 탈취한 client secret을 사용하여 엑세스 토큰을 발급받는다.

## 문제 해결

고정되어 있는 client secret 대신, 요청마다 암호화된 비밀번호를 생성하고 이를 Auth Server가 검증하도록 하는 것이다. [RFC 7636](https://datatracker.ietf.org/doc/html/rfc7636#section-1.1)에서 구체적은 플로우를 정의하고 있다. 클라이언트는 Authorization Code를 요청하기 전에, 랜덤한 Code Verifier를 동적으로 생성한다. 그리고 이룰 해시하여 Code Challenge를 만든다음 Auth Server에 전달한다. (사용한 해싱 알고리즘도 함께 전달한다.) Auth Server는 Authroization Code와 함께 유저를 클라이언트로 다시 리다이렉트 한다. 클라이언트는 Authorization Code와 함께 Code Verifier를 전달하여 Access Token 발급을 시도한다. Auth Server는 이때 전달받은 Code Verifier와 이전에 받은 Code Challenge를 비교하여 검증한다. 검증에 성공하면 Access Token을 발급한다. 

만약 해커가 중간에 Authorization Code와 Code Challenge를 가로챈다 하더라도 Code Verifier를 알 수 없기 때문에 Access Token 발급에 실패한다. Code Verifier를 통해 Code Challenge를 생성한다고 했는데, 무작정 생성하는 게 아니라 정해진 규칙이 있다. [RFC 7636 Section 4.1](https://datatracker.ietf.org/doc/html/rfc7636#section-4.1)에서 규칙을 명시하고 있다. 그리고 단방향 해시 알고리즘인 SHA-256을 사용하여 Code Challenge를 생성한다. 따라서 Code Challenge 값을 알 고 있다고 하더라도 Code Verifier를 아는 것은 불가능하다.

## 구현

```js
/**
 * Code Verifier 생성 함수
 * 암호학적으로 안전한 난수를 생성하여 Base64URL 인코딩된 문자열을 반환합니다.
 */
function generateCodeVerifier() {
  // 1. 난수 생성 (32바이트 = 256비트)
  // 충분한 엔트로피를 위해 32바이트 정도의 길이를 권장합니다.
  const buffer = new Uint8Array(32);
  window.crypto.getRandomValues(buffer);

  // 2. Base64URL 인코딩
  // 표준 Base64와 달리 URL에서 안전하지 않은 '+', '/' 문자를 치환하고
  // 패딩('=')을 제거해야 합니다.
  return base64UrlEncode(buffer);
}

/**
 * ArrayBuffer를 Base64URL 문자열로 변환하는 헬퍼 함수
 */
function base64UrlEncode(buffer) {
  // String.fromCharCode.apply는 스택 오버플로우 가능성이 있으므로,
  // 대용량 데이터에는 적합하지 않으나 토큰 길이 정도에는 안전합니다.
  return btoa(String.fromCharCode.apply(null, new Uint8Array(buffer)))
    .replace(/\+/g, '-') // '+'를 '-'로 치환
    .replace(/\//g, '_') // '/'를 '_'로 치환
    .replace(/=+$/, ''); // 끝부분의 패딩 '=' 제거
}

/**
 * Code Challenge 생성 함수 (비동기)
 * Web Crypto API의 digest() 함수를 사용하여 SHA-256 해시를 생성합니다.
 */
async function generateCodeChallenge(verifier) {
  // 1. 문자열을 바이너리 데이터(Uint8Array)로 변환
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);

  // 2. SHA-256 해싱 수행
  // crypto.subtle.digest는 Promise를 반환합니다.
  const hashedBuffer = await window.crypto.subtle.digest('SHA-256', data);

  // 3. 해싱된 바이너리를 다시 Base64URL 문자열로 인코딩
  return base64UrlEncode(hashedBuffer);
}


async function startLogin() {
  // 1. PKCE 값 생성
  const verifier = generateCodeVerifier();
  const challenge = await generateCodeChallenge(verifier);

  // 2. Verifier 임시 저장 (매우 중요!)
  // 보안을 위해 localStorage보다는 sessionStorage를 권장합니다.
  // 탭이 닫히면 사라지도록 하여 공격 표면을 줄입니다.
  sessionStorage.setItem('oauth_code_verifier', verifier);

  // 3. Authorization URL 구성
  const authUrl = "https://authorization-server.com/authorize";
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('client_id', 'YOUR_CLIENT_ID');
  authUrl.searchParams.append('redirect_uri', 'YOUR_REDIRECT_URI');
  authUrl.searchParams.append('scope', 'openid profile email');
  authUrl.searchParams.append('code_challenge', challenge);
  authUrl.searchParams.append('code_challenge_method', 'S256'); // 반드시 S256 사용

  // 4. 리다이렉트
  window.location.href = authUrl.toString();
}


// Redirect URI에서 호출되는 함수
async function handleCallback() {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');

  if (!code) {
    console.error("인증 코드가 없습니다.");
    return;
  }

  // 2. 저장해 둔 Verifier 조회
  const verifier = sessionStorage.getItem('oauth_code_verifier');
  if (!verifier) {
    console.error("Code Verifier를 찾을 수 없습니다. 세션이 만료되었을 수 있습니다.");
    return;
  }

  // 3. 토큰 교환 요청 (POST)
  // Content-Type은 반드시 application/x-www-form-urlencoded 여야 합니다.
  const response = await fetch('https://authorization-server.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: 'YOUR_CLIENT_ID',
      redirect_uri: 'YOUR_REDIRECT_URI', // 요청 시와 동일해야 함
      code: code,
      code_verifier: verifier, // 여기서 원본 Verifier 전송!
    }),
  });

  const data = await response.json();

  if (response.ok) {
    console.log("액세스 토큰 발급 성공:", data.access_token);
    // 성공 후 verifier 삭제 (재사용 방지)
    sessionStorage.removeItem('oauth_code_verifier');
  } else {
    console.error("토큰 발급 실패:", data);
  }
}

```
