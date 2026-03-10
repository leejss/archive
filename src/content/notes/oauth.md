


Q: 구글로그인을 클릭하고 로그인 완료 상태가 될 때 까지 어떤일이 일어나야 하는가 ?

- 권한을 위임하고, 신원을 확인하고, 토큰 위변조를 막기 위해 서명을 검증하고, 공개 클라이언트의 보안을 해야한다.
- OAuth2.0, OIDC, JWT, PKCE

OAuth2.0은 권한 위임 프로토콜이다.

브라우저는 구글서버에 로그인 요청을 한다. 구글 서버는 코드를 발급하여 전달한다. 브라우저는 코드를 받아서 백엔드에 넘긴다. 백엔드는 코드 + client secret을 구글 서버에 전달하고 tokens를 받는다. 

```js
const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
authUrl.searchParams.set("client_id", "YOUR_CLIENT_ID");
authUrl.searchParams.set("redirect_uri", "https://yourapp.com/callback");
authUrl.searchParams.set("response_type", "code");
authUrl.searchParams.set("scope", "openid email profile");
authUrl.searchParams.set("state", generateRandomString()); // CSRF 방어
authUrl.searchParams.set("code_challenge", codeChallenge);  // PKCE
authUrl.searchParams.set("code_challenge_method", "S256");

window.location.href = authUrl.toString();
```

Q. state검증을 하지 않으면 발생할 수 있는 일은 ? -> 로그인 CSRF


구글 서버는 redirect uri로 code와 state를 wjsekfgksek.

```js
// 백엔드에서 실행한다.
const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    code,
    client_id: process.env.GOOGLE_CLIENT_ID!,
    client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    redirect_uri: "https://yourapp.com/callback",
    grant_type: "authorization_code",
    code_verifier: codeVerifier, // PKCE
  }),
});

const { access_token, id_token, refresh_token } = await tokenResponse.json();
```

세 가지 토큰을 최종적으로 받는다. access token은 구글 api 호출용, id token은 신원 확인용, refresh token은 access token 재발급 용

공개 클라이언트를 위한 보안 확장. PKCE (Proof key for code exchange).
코드를 요청한 클라이언트와 코드를 교환하는 클라이언트가 같다는 것을 수학적으로 증명한다.

Authorization request에는 code_challenge를 포함하고, Token exchange 에는 code_verifier를 포함한다. -> 구글 서버는 sha256(code_verifier) === code_challenge임을 검증한다.

scope에 openid를 넣으면 응답에 id token이 포함되나. id token은 jwt형식이다. 공개키로 jwt의 서명을 검증해야 한다.

PKCE가 없다면 ? 모바일 앱 -> 악성 앱이 중복된 URL 스킴을 등록 -> 구글로그인 이후 원래 앱으로 돌아올 때, OS는 정상앱이아닌 악성 앱을 깨울 수 있음 (가로채기 발생) -> 악성앱이 탈취한 코드로 엑세스 토큰으로 교환하여 피해자 권한을 획득.
PKCE가 있다면 악성앱은 code_verifier를 모르기 때문에, 구글서버에서 토큰 교환을 거부. 


OAuth가 해결하려고 하는 것. -> 인가. 인가가 없는 경우를 생각. A서비스가 구글 캘린더에 일정을 추가하려고 하는 상황. A서비스에 내 구글 아이디와 비밀번호를 전부 전달. OAuth는 내 정보를 전부 줄 필요 없이, 즉 비밀번호를 줄 필요없이, 접근권한만 담긴 임시출입증을 발급해주는 시스템.
엑세스 토큰 안에는 누구인지에 대한 정보가 없음. 

`aud` 검증의 필요성

confused deputy problem

공격 시나리오.
