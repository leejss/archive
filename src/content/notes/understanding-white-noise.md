---
title: White Noise 이해하기
publishedAt: 2026-04-04
tags: [canvas, graphics, noise]
---

white noise는 모든 주파수 성분이 고르게 섞여 있는 무작위 신호를 뜻한다. 여기서 핵심은 완전히 무작위적이라는 점이다. 이미지를 예로 들면 특정 픽셀의 밝기가 주변 픽셀의 밝기와 관계없이 결정된다. 다시 말해 각 픽셀의 값이 서로 독립적인 난수처럼 만들어진다.

이런 성질 때문에 white noise는 규칙이나 패턴이 없는 순수한 무작위 데이터로 볼 수 있다. 이름에 white가 붙는 이유도 비슷하다. 가시광선의 여러 색이 섞여 흰색으로 보이는 것처럼, 신호 관점에서는 여러 주파수 성분이 고르게 섞인 상태를 가리킨다.

캔버스에서 white noise를 직접 그리려면 `CanvasRenderingContext2D`와 `ImageData`를 이해해야 한다. `ctx.createImageData(width, height)`는 비어 있는 픽셀 버퍼를 만들고, `ctx.putImageData(imageData, x, y)`는 그 버퍼를 캔버스에 그대로 그린다.

`ImageData.data`는 기본적으로 `Uint8ClampedArray`다. 이름을 풀어 보면 `Uint8`은 0부터 255까지 표현하는 부호 없는 8비트 정수이고, `Clamped`는 값을 이 범위 안으로 강제로 맞춘다는 뜻이다. 픽셀 하나는 RGBA 네 값으로 표현되므로 데이터 배열의 길이는 `width * height * 4`가 된다.

white noise를 만들 때는 각 픽셀마다 임의의 밝기 값을 하나 뽑고, 그 값을 R, G, B에 동일하게 넣으면 회색조 노이즈를 만들 수 있다. 알파 값은 완전히 보이도록 `255`로 두면 된다.

```ts
const canvas = document.createElement('canvas')
canvas.width = 800
canvas.height = 600

const ctx = canvas.getContext('2d')

if (!ctx) {
  throw new Error('2D context를 가져올 수 없습니다.')
}

const imageData = ctx.createImageData(canvas.width, canvas.height)
const data = imageData.data

for (let i = 0; i < data.length; i += 4) {
  const value = Math.floor(Math.random() * 256)

  data[i] = value
  data[i + 1] = value
  data[i + 2] = value
  data[i + 3] = 255
}

ctx.putImageData(imageData, 0, 0)
```

중요한 점은 이 방식이 픽셀 단위에서 아무 상관관계도 만들지 않는다는 것이다. 그래서 화면에는 점들이 제각각 흩어진 것처럼 보인다. 반대로 자연스러운 구름, 지형, 그림자 같은 패턴을 만들고 싶다면 white noise 자체보다 Perlin noise나 value noise처럼 주변 값 사이의 연속성을 만들어 주는 방식이 더 적합하다.

