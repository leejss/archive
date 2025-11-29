---
title: Resource Embedding
publishedAt: 2025-11-29
tags: ['ai-generated']
---


# Resource Embedding: N+1 쿼리 해결하기

블로그 게시글 목록을 보여주는데, 각 게시글의 작성자 정보도 함께 표시해야 한다고 생각해봅시다. 전통적인 REST API 방식이라면 이렇게 동작할 것입니다.

```javascript
// 1. 게시글 10개를 가져옴
const posts = await fetch('/api/posts?limit=10');

// 2. 각 게시글마다 작성자 정보를 가져옴
for (const post of posts) {
  const author = await fetch(`/api/users/${post.author_id}`);
}
```

게시글 1번 요청, 작성자 정보 10번 요청. 총 11번의 HTTP 요청이 필요합니다. 만약 게시글이 100개라면? 101번의 요청입니다. 이것이 바로 N+1 쿼리 문제입니다.

## 문제의 근원: 관계형 데이터와 RESTful API의 불일치

관계형 데이터베이스는 테이블 간의 관계를 외래 키로 표현합니다. `posts` 테이블의 `author_id`가 `users` 테이블의 `id`를 참조하는 식입니다. 데이터베이스는 이런 관계를 JOIN으로 효율적으로 처리할 수 있습니다.

```sql
SELECT posts.*, users.name, users.email
FROM posts
JOIN users ON posts.author_id = users.id;
```

단 한 번의 쿼리로 모든 정보를 가져옵니다. 데이터베이스는 이미 답을 알고 있는데, 문제는 RESTful API의 설계 철학에 있습니다. REST는 각 리소스를 독립적인 엔드포인트로 분리합니다. `/posts`는 게시글만, `/users`는 사용자만 다룹니다. 이 명확한 분리가 오히려 성능 문제를 야기합니다.

## PostgREST의 접근: 데이터베이스 스키마를 API로

PostgREST는 이 문제를 근본적으로 다르게 접근합니다. "우리가 API 엔드포인트를 수동으로 정의하는 대신, 데이터베이스 스키마 자체가 API 명세가 되면 어떨까?"

PostgREST는 서버 시작 시 PostgreSQL의 정보 스키마를 읽어들입니다. 정보 스키마란 데이터베이스가 자기 자신에 대한 메타데이터를 저장하는 특별한 테이블들입니다. 마치 책의 목차처럼, 어떤 테이블이 있고, 각 테이블의 컬럼은 무엇이며, 어떤 외래 키 관계가 있는지를 담고 있습니다.

```sql
-- PostgREST가 내부적으로 실행하는 쿼리
SELECT * FROM information_schema.table_constraints
WHERE constraint_type = 'FOREIGN KEY';
```

이 정보를 바탕으로 PostgREST는 메모리에 스키마 맵을 구축합니다. "아, `posts.author_id`는 `users.id`를 참조하는구나. 그럼 클라이언트가 게시글과 작성자를 함께 요청하면, 자동으로 JOIN 쿼리를 만들어주면 되겠네."

## Resource Embedding의 작동 방식

PostgREST의 Resource Embedding은 이 스키마 맵을 활용합니다. 클라이언트는 쿼리 파라미터로 어떤 관계를 함께 가져올지 명시합니다.

```
GET /posts?select=id,title,author:users(name,email)
```

이 한 줄의 HTTP 요청을 PostgREST는 다음과 같은 SQL로 변환합니다.

```sql
SELECT 
  posts.id,
  posts.title,
  json_build_object(
    'name', users.name,
    'email', users.email
  ) as author
FROM posts
LEFT JOIN users ON posts.author_id = users.id;
```

`json_build_object`는 PostgreSQL의 함수로, 조인된 데이터를 JSON 객체로 만들어줍니다. 클라이언트는 이렇게 구조화된 응답을 받습니다.

```json
[
  {
    "id": 1,
    "title": "첫 번째 게시글",
    "author": {
      "name": "김철수",
      "email": "kim@example.com"
    }
  }
]
```

11번의 요청이 1번으로 줄어들었습니다.

## Supabase: PostgREST의 실용적 구현

Supabase는 PostgREST를 백엔드 엔진으로 사용하면서, 개발자 경험을 크게 개선한 플랫폼입니다. Supabase가 제공하는 JavaScript 클라이언트를 사용하면 Resource Embedding을 더욱 직관적으로 작성할 수 있습니다.

```javascript
// PostgREST의 쿼리 파라미터 방식
fetch('/posts?select=id,title,author:users(name,email)')

// Supabase 클라이언트 방식
const { data } = await supabase
  .from('posts')
  .select(`
    id,
    title,
    author:users(name, email)
  `)
```

메서드 체이닝과 백틱 문자열을 사용한 이 문법은 SQL의 SELECT 문과 유사한 느낌을 줍니다. 개발자가 이미 익숙한 패턴이죠.

더 중요한 것은 Supabase가 PostgREST의 스키마 리로드를 자동화했다는 점입니다. Supabase Studio에서 테이블을 생성하거나 외래 키를 추가하면, 즉시 PostgREST에게 알림이 전달되고 스키마 캐시가 갱신됩니다. 개발자는 서버를 재시작할 필요 없이 바로 새로운 관계를 사용할 수 있습니다.

## 예시: 블로그 댓글 시스템

블로그 게시글에 달린 댓글 목록과, 각 댓글 작성자의 정보를 함께 가져와야 한다고 가정해봅시다. Resource Embedding 없이는 이렇게 작성해야 합니다.

```javascript
// ❌ Resource Embedding 없이
const { data: posts } = await supabase
  .from('posts')
  .select('*')
  .limit(10);

// 각 게시글마다 댓글을 가져옴
const postsWithComments = await Promise.all(
  posts.map(async (post) => {
    const { data: comments } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', post.id);

    // 각 댓글마다 작성자를 가져옴
    const commentsWithAuthors = await Promise.all(
      comments.map(async (comment) => {
        const { data: author } = await supabase
          .from('users')
          .select('name, avatar_url')
          .eq('id', comment.user_id)
          .single();

        return { ...comment, author };
      })
    );

    return { ...post, comments: commentsWithAuthors };
  })
);

// 게시글 10개, 댓글이 각각 5개씩, 작성자까지
// 1 + 10 + (10 × 5) = 61번의 HTTP 요청
```

Resource Embedding을 사용하면 이 모든 것이 한 번의 요청으로 해결됩니다.

```javascript
// ✅ Resource Embedding 사용
const { data: posts } = await supabase
  .from('posts')
  .select(`
    *,
    comments (
      *,
      author:users (
        name,
        avatar_url
      )
    )
  `)
  .limit(10);

// 단 1번의 HTTP 요청
```

PostgREST는 이를 중첩된 JOIN으로 변환합니다.

```sql
SELECT 
  posts.*,
  json_agg(
    json_build_object(
      'id', comments.id,
      'content', comments.content,
      'author', json_build_object(
        'name', users.name,
        'avatar_url', users.avatar_url
      )
    )
  ) as comments
FROM posts
LEFT JOIN comments ON comments.post_id = posts.id
LEFT JOIN users ON comments.user_id = users.id
GROUP BY posts.id
LIMIT 10;
```

`json_agg`는 여러 행을 JSON 배열로 집계하는 PostgreSQL 함수입니다. 이를 통해 일대다 관계(한 게시글에 여러 댓글)를 자연스럽게 표현할 수 있습니다.

## 성능의 실제 의미

네트워크 지연이 50ms인 환경에서 61번의 요청과 1번의 요청을 비교해봅시다.

```
61번의 요청: 61 × 50ms = 3,050ms (약 3초)
1번의 요청: 1 × 50ms + 쿼리 실행 시간 = 약 100ms
```

사용자는 3초가 아닌 0.1초 만에 데이터를 볼 수 있습니다. 30배 빠른 속도입니다. 모바일 환경이나 느린 네트워크에서는 이 차이가 더욱 극명해집니다.

## 주의할 점: 카테시안 곱

Resource Embedding은 강력하지만, 잘못 사용하면 성능 문제를 일으킬 수 있습니다. 특히 일대다 관계를 여러 개 동시에 임베딩할 때 조심해야 합니다.

```javascript
// 주의: 성능 문제 가능
const { data } = await supabase
  .from('posts')
  .select(`
    *,
    comments(*),
    likes(*),
    tags(*)
  `);
```

게시글 하나에 댓글 100개, 좋아요 50개, 태그 10개가 있다면? 데이터베이스는 100 × 50 × 10 = 50,000개의 행을 생성한 뒤, 이를 다시 집계해야 합니다. 이것이 카테시안 곱 문제입니다.

해결 방법은 필요한 데이터만 선택적으로 가져오거나, 쿼리를 분리하는 것입니다.

```javascript
// 해결책 1: 필요한 필드만
const { data } = await supabase
  .from('posts')
  .select(`
    *,
    comments(count),
    likes(count)
  `);

// 해결책 2: 쿼리 분리
const { data: posts } = await supabase.from('posts').select('*');
const { data: comments } = await supabase
  .from('comments')
  .select('*')
  .in('post_id', posts.map(p => p.id));
```

## 핵심 요약

- N+1 쿼리 문제는 관계형 데이터를 여러 번의 HTTP 요청으로 가져올 때 발생하는 성능 저하 현상입니다.
- PostgREST는 PostgreSQL의 정보 스키마를 읽어 외래 키 관계를 파악하고, 이를 바탕으로 Resource Embedding 기능을 제공합니다.
- Resource Embedding을 사용하면 관련된 테이블의 데이터를 단 한 번의 HTTP 요청으로 가져올 수 있습니다.
- Supabase는 PostgREST를 기반으로 하며, 더 직관적인 JavaScript API를 제공합니다.
- 중첩된 관계도 자연스럽게 표현할 수 있으며, 이는 내부적으로 JSON 집계 함수를 사용한 JOIN 쿼리로 변환됩니다.
- 일대다 관계를 여러 개 동시에 임베딩하면 카테시안 곱 문제가 발생할 수 있으므로, 필요한 데이터만 선택적으로 가져와야 합니다.