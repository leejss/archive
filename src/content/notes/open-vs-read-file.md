---
title: Open VS ReadFile
publishedAt: 2025-09-23
tags: []
---

## Memory Usage

`os.ReadFile` 은 파일 크기만큼 메모리를 할당한다.

`os.Open`은 파일을 바로 읽지 않고 파일과 연결되는 통로(`*os.File`)를 반환한다.


## JSON -> struct

```go

// os.ReadFile + json.Unmarshal

j, err := os.ReadFile("config.json")
if err != nil {
  log.Fatal(err)
}
var config Config
err = json.Unmarshal(j, &config)
if err != nil {
  log.Fatal(err)
}

// os.Open + json.NewDecoder

f, err := os.Open("config.json")
if err != nil {
  log.Fatal(err)
}
defer f.Close()
var config Config
err = json.NewDecoder(f).Decode(&config)
if err != nil {
  log.Fatal(err)
}


```



