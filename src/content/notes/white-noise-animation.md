---
title: Canvas로 White Noise 애니메이션 만들기
publishedAt: 2026-04-05
tags: [canvas, graphics, noise, animation]
---

이전 글에서 white noise를 정적인 이미지로 만드는 방법을 정리했다면, 이번에는 그 노이즈를 계속 갱신해서 애니메이션으로 만드는 방법을 정리해 보려고 한다. 목표는 단순하다. 매 프레임마다 픽셀 버퍼를 새 난수로 다시 채우고, 그 결과를 캔버스에 덮어쓰면 된다.

아이디어는 단순하지만, 막상 구현하려고 보면 두 가지를 이해해야 한다. 하나는 브라우저 렌더링 루프를 어떻게 타는지이고, 다른 하나는 픽셀 데이터를 얼마나 직접 만질 것인지다. white noise는 픽셀마다 독립적인 값을 넣는 방식이라 구현은 쉽지만, 해상도가 커질수록 연산량도 정직하게 같이 커진다.

브라우저 렌더링 루프를 연결할 때 가장 자연스러운 선택은 `requestAnimationFrame()`이다. 이 API는 다음 repaint 직전에 콜백을 한 번 실행해 준다. 중요한 점은 이 호출이 one-shot이라는 것이다. 즉 한 프레임만 예약해 주므로, 계속 움직이게 만들려면 콜백 안에서 다시 `requestAnimationFrame()`을 호출해야 한다.

## 가장 단순한 구현

가장 먼저 떠올릴 수 있는 방법은 작은 캔버스를 하나 만들고, `ImageData`의 `data` 배열을 매 프레임 다시 채운 뒤 `putImageData()`로 화면에 반영하는 방식이다.

`createImageData(width, height)`로 만든 버퍼는 처음에는 투명한 검은색으로 채워져 있다. 그리고 `imageData.data`는 RGBA 순서의 배열이므로, 픽셀 하나를 채우려면 인덱스를 4칸씩 건너뛰며 값을 써야 한다.

```ts
const width = 320
const height = 240

const canvas = document.createElement("canvas")
canvas.width = width
canvas.height = height

canvas.style.width = "100vw"
canvas.style.height = "100vh"
canvas.style.display = "block"
canvas.style.imageRendering = "pixelated"

document.body.append(canvas)

const ctx = canvas.getContext("2d")

if (!ctx) {
  throw new Error("2D context를 가져올 수 없습니다.")
}

const imageData = ctx.createImageData(width, height)
const pixels = imageData.data

function updateNoise() {
  for (let i = 0; i < pixels.length; i += 4) {
    const value = Math.floor(Math.random() * 256)

    pixels[i] = value
    pixels[i + 1] = value
    pixels[i + 2] = value
    pixels[i + 3] = 255
  }
}

let animationFrameId: number | null = null

function animate() {
  updateNoise()
  ctx.putImageData(imageData, 0, 0)
  animationFrameId = requestAnimationFrame(animate)
}

function stop() {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }
}

animate()
```

흐름은 꽤 단순하다.

1. `ImageData` 버퍼를 만든다.
2. 매 프레임마다 모든 픽셀에 난수를 다시 쓴다.
3. `putImageData()`로 그 버퍼를 캔버스에 복사한다.
4. 다음 프레임을 다시 예약한다.

이 방식은 white noise의 원리를 가장 잘 드러낸다. 각 픽셀은 주변 픽셀과 아무 관계도 없이 새 난수를 받기 때문에, 화면 전체가 프레임마다 독립적으로 흔들리는 것처럼 보인다. 일종의 TV 잡음 같은 효과가 바로 여기서 나온다.

참고로 이런 예제는 매 프레임마다 “얼마나 이동했는가”를 계산하는 애니메이션이 아니기 때문에 delta time이 꼭 필요하지는 않다. 프레임마다 화면 전체를 새로 샘플링하는 효과이기 때문이다. 다만 `requestAnimationFrame()` 자체는 디스플레이 주기에 맞춰 호출되므로, 고주사율 환경에서는 더 자주 갱신된다.

## 문제가 되는 지점

문제는 이 방식이 해상도에 아주 정직하다는 점이다. 예를 들어 1920 × 1080 화면이라면 한 프레임에 처리해야 할 픽셀 수가 2,073,600개다. 그리고 각 픽셀마다 R, G, B, A 네 값을 써야 하므로 실제 메모리 쓰기 횟수는 더 많다.

white noise처럼 규칙이 없는 데이터는 픽셀 하나하나를 모두 다시 계산해야 하므로, 해상도가 커질수록 비용도 그대로 증가한다. 브라우저 입장에서는 매 프레임마다 거대한 버퍼를 다시 채우고 다시 그려야 하니, 풀스크린에서 무턱대고 돌리면 금방 무거워질 수 있다.

## Buffer canvas로 연산량 줄이기

여기서 떠올릴 수 있는 최적화가 buffer canvas를 따로 두는 방식이다. 핵심은 “굳이 화면 해상도만큼의 노이즈를 직접 계산할 필요가 있을까?”라는 질문이다.

예를 들어 최종 화면이 1920 × 1080이어도, 실제 노이즈를 계산하는 버퍼는 그보다 훨씬 작은 240 × 135 크기로 만들 수 있다. 만약 픽셀 스케일을 8로 잡았다면 가로와 세로를 각각 8분의 1로 줄인 셈이고, 전체 픽셀 수는 대략 64분의 1 수준으로 줄어든다.

이렇게 하면 매 프레임에 난수를 채우는 대상은 작은 buffer canvas뿐이다. 그다음 실제 화면에 그릴 때는 `drawImage()`로 이 작은 캔버스를 크게 확대해서 붙이면 된다.

```ts
const screenCanvas = document.createElement("canvas")
screenCanvas.width = window.innerWidth
screenCanvas.height = window.innerHeight
screenCanvas.style.display = "block"

document.body.append(screenCanvas)

const screenCtx = screenCanvas.getContext("2d")

if (!screenCtx) {
  throw new Error("screen canvas의 2D context를 가져올 수 없습니다.")
}

const pixelScale = 8
const bufferWidth = Math.ceil(screenCanvas.width / pixelScale)
const bufferHeight = Math.ceil(screenCanvas.height / pixelScale)

const bufferCanvas = document.createElement("canvas")
bufferCanvas.width = bufferWidth
bufferCanvas.height = bufferHeight

const bufferCtx = bufferCanvas.getContext("2d")

if (!bufferCtx) {
  throw new Error("buffer canvas의 2D context를 가져올 수 없습니다.")
}

const imageData = bufferCtx.createImageData(bufferWidth, bufferHeight)
const pixels = imageData.data

screenCtx.imageSmoothingEnabled = false

function updateNoise() {
  for (let i = 0; i < pixels.length; i += 4) {
    const value = Math.floor(Math.random() * 256)

    pixels[i] = value
    pixels[i + 1] = value
    pixels[i + 2] = value
    pixels[i + 3] = 255
  }
}

function render() {
  updateNoise()
  bufferCtx.putImageData(imageData, 0, 0)

  screenCtx.clearRect(0, 0, screenCanvas.width, screenCanvas.height)
  screenCtx.drawImage(
    bufferCanvas,
    0,
    0,
    screenCanvas.width,
    screenCanvas.height,
  )

  requestAnimationFrame(render)
}

render()
```

이 방식에서 중요한 점은 두 가지다.

첫째, 픽셀 데이터를 직접 채우는 대상은 작은 버퍼라는 점이다. 즉 비싼 연산은 축소된 해상도에서만 수행한다.

둘째, 확대는 `drawImage()`에게 맡긴다는 점이다. 브라우저는 이미 이미지 확대와 복사에 최적화되어 있으므로, 직접 큰 버퍼를 전부 채우는 것보다 훨씬 유리할 수 있다.

그리고 픽셀의 경계를 또렷하게 유지하고 싶다면 `screenCtx.imageSmoothingEnabled = false`가 중요하다. `drawImage()`로 확대할 때 기본값은 smoothing이 켜져 있어서 픽셀이 부드럽게 섞여 보일 수 있다. 반대로 일부러 거친 블록 느낌을 원한다면 이 값을 꺼 두는 편이 더 어울린다.

여기서 한 가지 구분해 둘 점이 있다. `canvas.style.imageRendering = "pixelated"`는 CSS로 캔버스 요소 자체를 확대해서 보여 줄 때 유용하고, `imageSmoothingEnabled = false`는 캔버스 내부에서 `drawImage()`로 이미지를 확대할 때 영향을 준다. 겉보기엔 비슷해 보여도 적용되는 레이어가 다르다.

## 정리

white noise 애니메이션의 핵심은 결국 매 프레임마다 픽셀 버퍼를 새 난수로 다시 채우는 것이다. 구현 자체는 `ImageData`와 `requestAnimationFrame()`만 알면 어렵지 않다.

다만 해상도가 커질수록 비용도 그대로 커지기 때문에, 실제로 화면 전체에 적용할 때는 buffer canvas를 두고 축소된 해상도에서 노이즈를 만든 다음 `drawImage()`로 확대하는 방식이 훨씬 실용적이다.

즉 정리하면 흐름은 이렇다.

- 가장 단순한 버전: 전체 해상도의 `ImageData`를 매 프레임 다시 채운다.
- 더 실용적인 버전: 작은 buffer canvas에만 노이즈를 만들고, 최종 화면에는 확대해서 그린다.

white noise 자체는 매우 단순한 데이터지만, 애니메이션으로 만들기 시작하면 브라우저의 렌더링 루프, 픽셀 버퍼, 확대 보간 같은 개념이 한 번에 연결된다. 그래서 작은 실험치고는 꽤 많은 걸 배울 수 있는 주제다.


