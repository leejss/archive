---
title: Why Array.isArray exists?
draft: true
publishedAt: 2025-08-14
tags: []
---

## Realm agnostic

```js
const arr = [1,2,3]
console.log(arr instanceof Array) // true

// iframe creates a new realm
const iframe = document.createElement('iframe');
document.body.appendChild(iframe);

// Different realm = different Array constructor
const iframeArray = iframe.contentWindow.Array(1, 2, 3);
console.log(iframeArray instanceof Array); // false!

console.log(Array.isArray(iframeArray));   // true (cross-realm safe)
```


