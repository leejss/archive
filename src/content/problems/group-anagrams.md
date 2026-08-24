---
title: Group Anagrams
publishedAt: 2026-07-21
source: "leetcode"
url: "https://leetcode.com/problems/group-anagrams/"
tags:
  - array
  - hash-table
---

## 문제 제약조건

```
Constraints:

1 <= strs.length <= 10^4
0 <= strs[i].length <= 100
strs[i] consists of lowercase English letters.
```

- 문자열 개수, 즉 들어올 수 있는 입력의 최대 개수는 10,000개.
- 브루트 포스로 모든 비교(O(n^2)) 시, 100,000,000(1억)번 비교를 해야한다.
- 즉, O(n^2) 을 피해야 한다.
- 문자열 개수는 최대 100. 따라서 문자열 정돈 비용은 100 log 100 정도.

## 문제 분석.

- 애너그램이란, 같은 문자들을 같은 개수로 사용, 순서만 다른 문자열.
- 'eat' 과 'tea'는 서로 애너그램.
- 정돈하여 서로 같은 문자열이면 애너그램.

```
sort("eat") === sort("tea") // True
```

- 같은 애너그램끼리 서로 묶어야 한다. -> 그룹화를 해야 한다.
- 그룹을 나타내기 위한 데이터 구조를 사용해야 한다.
- 해시맵을 통해 그룹을 나타낼 수 있다.
- 키는 그룹화의 기준이 되고 값은 해당 기준을 만족하는 요소가 된다.
- 여기서는 정렬된 문자열이 해시맵의 키가 된다.

## 풀이. 사고를 코드로 옮기기.

### Typescript

```ts
function groupAnagrams(strs: string[]): string[][] {
  const map = new Map<string, string[]>();

  for (const str of strs) {
    const key = str.split("").sort().join("");
    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key)!.push(str);
  }

  return Array.from(map.values());
}
```

### Python

```py
from collections import defaultdict
from typing import List

class Solution:
    def groupAnagrams(self, strs: List[str]) -> List[List[str]]:
      groups = defaultdict(list)
      for word in strs:
        key = "".join(sorted(word))
        groups[key].append(word)

      return list(groups.values())
```

## Mental Model

- 그룹화를 위해서 대표값을 정한다.
- 키를 대표값으로 하고 값을 그 키와 비교 시, 같은 대상을 넣는다.
- 어떤 기준에서 동일하다는 것은 같은 대표값을 가진다는 것으로 추상화 할 수 있다.
- 비슷한 문제를 보고 다음 질문에 대답한다. "문제에서 “같다”의 정의는 무엇이며, 그것을 하나의 대표값으로 표현할 수 있는가?"
- 문제 해결 과정에서 불필요한 정보를 제거한다. 여기서는 문자열의 순서가 중요하지 않는다. 따라서 정렬을 사용할 수 있다.
