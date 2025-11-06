---
title: Delta Time
publishedAt: 2025-10-29
tags: []
---

## Code

```js

let lastTime = 0;

function loop(time) {

  if (lastTime === 0) {
    lastTime = time;
  }

  const deltaTime = (time - lastTime) / 1000;
  lastTime = time;
  requestAnimationFrame(loop);
}

```

## Delta Time 이란?

```txt
deltaTime = currentTime - prevTime
```

- 하나의 프레임이 그려지는 데 걸리는 시간. 이전 프레임과 현재 프레임 사이 경과한 시간.
- 60 FPS 인경우, 1/60초

## Delta Time의 역할

- 다양한 FPS 환경에 대해 일관된 애니메이션을 보장

```js
// deltaTime을 사용하지 않는 경우
function animate() {
  x += 2 // 매 프레임마다 2px 이동
  requestAnimationFrame(animate);
}


// 60 FPS -> 1초에 60프레임이 그려지므로 60 * 2 = 1초에 120px 이동 = 120px / 1초
// 30 FPS -> 1초에 30프레임이 그려지므로 30 * 2 = 1초에 60px 이동 = 60px / 1초
// FPS 환경에 따라 애니메이션 속도가 달라짐


// deltaTime을 사용하는 경우
function animate(time) {
  const deltaTime = (time - lastTime) / 1000;
  lastTime = time;
  x += 200 * deltaTime;
  requestAnimationFrame(animate);
}


// 60 FPS : deltaTime = 1/60초 = 약 0.016초. 200 * 0.016 = 1 frame당 약 3.2px 이동. 
// 30 FPS : deltaTime = 1/30초 = 약 0.033초. 200 * 0.033 = 1 frame당 약 6.6px 이동
```