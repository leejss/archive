#!/usr/bin/env node

import { writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * 명령어 인자를 파싱합니다
 * 예: node create-post.js next-middleware --tags=nextjs,javascript
 */
function parseArgs() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error("Usage: npm run post:new <filename> [--tags=tag1,tag2,...]");
    process.exit(1);
  }

  const filename = args[0];
  let tags = [];

  // --tags 옵션 파싱
  const tagsArg = args.find((arg) => arg.startsWith("--tags="));
  if (tagsArg) {
    const tagsValue = tagsArg.split("=")[1];
    tags = tagsValue ? tagsValue.split(",").map((tag) => tag.trim()) : [];
  }

  return { filename, tags };
}

/**
 * kebab-case 파일명을 Title Case로 변환합니다
 * 예: "next-middleware" -> "Next Middleware"
 */
function kebabToTitleCase(str) {
  return str
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/**
 * 현재 날짜를 yyyy-mm-dd 형식으로 반환합니다
 */
function getCurrentDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * frontmatter와 기본 내용을 포함한 마크다운 템플릿을 생성합니다
 */
function createPostTemplate(title, tags, publishedAt) {
  const tagsYaml =
    tags.length > 0 ? tags.map((tag) => `  - ${tag}`).join("\n") : "";

  const tagsSection = tags.length > 0 ? `tags:\n${tagsYaml}` : "tags: []";

  return `---
title: ${title}
publishedAt: ${publishedAt}
${tagsSection}
---
Write your content here...
`;
}

/**
 * 새로운 포스트 파일을 생성합니다
 */
function createPost() {
  const { filename, tags } = parseArgs();

  // 파일명에 .md 확장자가 없으면 추가
  const fullFilename = filename.endsWith(".md") ? filename : `${filename}.md`;

  // 제목 생성 (확장자 제거 후 변환)
  const baseFilename = filename.replace(/\.md$/, "");
  const title = kebabToTitleCase(baseFilename);

  // 현재 날짜
  const publishedAt = getCurrentDate();

  // 파일 경로
  const notesDir = join(__dirname, "..", "src", "content", "notes");
  const filePath = join(notesDir, fullFilename);

  // 파일이 이미 존재하는지 확인
  if (existsSync(filePath)) {
    console.error(`❌ File already exists: ${fullFilename}`);
    process.exit(1);
  }

  // 템플릿 생성
  const content = createPostTemplate(title, tags, publishedAt);

  try {
    // 파일 생성
    writeFileSync(filePath, content, "utf8");

    console.log(`✅ Created new post: ${fullFilename}`);
    console.log(`📝 Title: ${title}`);
    console.log(`📅 Published at: ${publishedAt}`);
    if (tags.length > 0) {
      console.log(`🏷️  Tags: ${tags.join(", ")}`);
    }
    console.log(`📍 Location: src/content/notes/${fullFilename}`);
  } catch (error) {
    console.error(`❌ Error creating file: ${error.message}`);
    process.exit(1);
  }
}

// 스크립트 실행
createPost();
