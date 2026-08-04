import { writeFileSync, existsSync, readFileSync } from "fs";
import { join, dirname, isAbsolute, relative, resolve } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * 명령어 인자를 파싱합니다
 * 예: node create-post.js notes next-middleware --description="..." --tags=nextjs,javascript
 */
function parseArgs() {
  const collection = process.argv[2];
  const args = process.argv.slice(3);

  if (!["notes", "problems"].includes(collection) || args.length === 0) {
    console.error(
      "Usage: npm run post:new <filename> [--description=...] [--tags=tag1,tag2,...]\n" +
        "       npm run problem:new <filename> --source=<source> --url=<problem-url> [--description=...] [--tags=tag1,tag2,...]",
    );
    process.exit(1);
  }

  const filename = args[0].replace(/\.md$/, "");

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(filename)) {
    console.error("❌ Filename must be a lowercase kebab-case slug.");
    process.exit(1);
  }

  let tags = [];

  // --tags 옵션 파싱
  const tagsArg = args.find((arg) => arg.startsWith("--tags="));
  if (tagsArg) {
    const tagsValue = tagsArg.split("=")[1];
    tags = tagsValue
      ? tagsValue
          .split(",")
          .map((tag) => tag.trim().toLowerCase().replace(/\s+/g, "-"))
          .filter(Boolean)
      : [];
  }

  const descriptionArg = args.find((arg) => arg.startsWith("--description="));
  const description = descriptionArg
    ?.slice("--description=".length)
    .trim();

  const sourceArg = args.find((arg) => arg.startsWith("--source="));
  const source = sourceArg?.slice("--source=".length).trim();
  const urlArg = args.find((arg) => arg.startsWith("--url="));
  const url = urlArg?.slice("--url=".length).trim();

  if (collection === "problems" && !source) {
    console.error("❌ --source is required for problem posts.");
    process.exit(1);
  }

  if (collection === "problems") {
    try {
      new URL(url);
    } catch {
      console.error("❌ A valid --url is required for problem posts.");
      process.exit(1);
    }
  }

  return { collection, description, filename, source, tags, url };
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
 * 새로운 포스트 파일을 생성합니다
 */
function createPost() {
  const { collection, description, filename, source, tags, url } = parseArgs();

  // 파일명에 .md 확장자가 없으면 추가
  const fullFilename = `${filename}.md`;

  // 파일 경로
  const contentDir = join(__dirname, "..", "src", "content", collection);
  const filePath = resolve(contentDir, fullFilename);
  const relativePath = relative(contentDir, filePath);

  if (relativePath.startsWith("..") || isAbsolute(relativePath)) {
    console.error("❌ File path must stay inside its content collection.");
    process.exit(1);
  }

  // 파일이 이미 존재하는지 확인
  if (existsSync(filePath)) {
    console.error(`❌ File already exists: ${fullFilename}`);
    process.exit(1);
  }

  // 템플릿 파일 읽기 및 처리
  const templateFilePath = join(__dirname, "template.md");
  let content = readFileSync(templateFilePath, "utf8");

  content = content.replace(
    "$description",
    description ? `description: ${JSON.stringify(description)}` : "",
  );

  // $publishedAt을 현재 날짜로 치환
  const publishedAt = getCurrentDate();
  content = content.replace("$publishedAt", publishedAt);

  if (collection === "problems") {
    content = content.replace(
      `publishedAt: ${publishedAt}`,
      `publishedAt: ${publishedAt}\nsource: ${JSON.stringify(source)}\nurl: ${JSON.stringify(url)}`,
    );
  }

  // 제목 생성 (확장자 제거 후 변환)
  const title = kebabToTitleCase(filename);
  content = content.replace("Post title", title);

  // tags 처리
  if (tags.length > 0) {
    const tagsYaml = tags.map((tag) => `  - ${tag}`).join("\n");
    content = content.replace("tags: []", `tags:\n${tagsYaml}`);
  }

  try {
    // 파일 생성
    writeFileSync(filePath, content, "utf8");

    console.log(`✅ Created new post: ${fullFilename}`);
    console.log(`📝 Title: ${title}`);
    console.log(`📅 Published at: ${publishedAt}`);
    if (source) {
      console.log(`🔗 Source: ${source}`);
      console.log(`🌐 URL: ${url}`);
    }
    if (tags.length > 0) {
      console.log(`🏷️  Tags: ${tags.join(", ")}`);
    }
    console.log(`📍 Location: src/content/${collection}/${fullFilename}`);
  } catch (error) {
    console.error(`❌ Error creating file: ${error.message}`);
    process.exit(1);
  }
}

// 스크립트 실행
createPost();
