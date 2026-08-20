import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(root, "dist", "public");
const release = path.join(root, "external-release", "aladel-optics");
const media = path.join(release, "assets", "media");
const sourceAssets = "/home/ubuntu/webdev-static-assets";

const assetMap = {
  "/manus-storage/aladel-logo-source_a78b8dd9.png": "./assets/media/aladel-logo-source.png",
  "/manus-storage/aladel-eye-mark_fbd659ce.png": "./assets/media/aladel-eye-mark.png",
  "/manus-storage/aladel-hero-editorial_84f83a17.jpg": "./assets/media/aladel-hero-editorial.jpg",
  "/manus-storage/aladel-frame-amber_064d1abb.jpg": "./assets/media/aladel-frame-amber.jpg",
  "/manus-storage/aladel-sunwear-charcoal_f71447f2.jpg": "./assets/media/aladel-sunwear-charcoal.jpg",
  "/manus-storage/aladel-optometry-detail_544ccead.jpg": "./assets/media/aladel-optometry-detail.jpg",
};

const filesToCopy = [
  "aladel-logo-source.png",
  "aladel-eye-mark.png",
  "aladel-hero-editorial.jpg",
  "aladel-frame-amber.jpg",
  "aladel-sunwear-charcoal.jpg",
  "aladel-optometry-detail.jpg",
];

const readme = `# بصريات العادل — حزمة الاستضافة

هذه الحزمة مستقلة وجاهزة للرفع على الاستضافات الثابتة مثل الاستضافة المشتركة أو GitHub Pages أو Netlify أو Cloudflare Pages.

## طريقة الرفع

فك ضغط الملف، ثم ارفع **محتويات** مجلد \`aladel-optics\` إلى مجلد الموقع العام في استضافتك، ويكون عادةً باسم \`public_html\` أو \`www\`. يجب أن يكون ملف \`index.html\` في جذر ذلك المجلد، وليس داخل مجلد إضافي.

يشمل مجلد \`assets/media\` جميع الصور والشعارات التي يحتاجها الموقع. لا تحذف هذا المجلد ولا تغيّر أسماء ملفاته ما لم تعدّل الروابط داخل ملفات الموقع.

## قبل الإطلاق

راجع بيانات التواصل وساعات العمل وعنوان الفرع في الموقع وأدخل بياناتكم الرسمية. الموقع ثابت ولا يحتاج إلى قاعدة بيانات أو خادم Node.js؛ الاستضافة التي تدعم ملفات HTML وCSS وJavaScript كافية.

## ملاحظة

يمكن استخدام نفس رابط الموقع المنشور لاحقًا لتضمينه في Google Sites، أو ربط هذه النسخة مباشرة بنطاقك الخاص بعد رفعها إلى استضافتك.
`;

await rm(release, { recursive: true, force: true });
await mkdir(media, { recursive: true });
await cp(source, release, { recursive: true, filter: (entry) => !entry.includes(`${path.sep}__manus__`) });

for (const filename of filesToCopy) {
  await cp(path.join(sourceAssets, filename), path.join(media, filename));
}

const walk = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const output = [];
  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) output.push(...await walk(entryPath));
    else output.push(entryPath);
  }
  return output;
};

for (const filePath of await walk(release)) {
  if (!/\.(html|js|css)$/i.test(filePath)) continue;
  let content = await readFile(filePath, "utf8");
  for (const [from, to] of Object.entries(assetMap)) content = content.split(from).join(to);
  content = content.replaceAll('src="/assets/', 'src="./assets/').replaceAll('href="/assets/', 'href="./assets/');
  content = content.replace(/\s*<script src="\/__manus__\/debug-collector\.js" defer><\/script>/, "");
  await writeFile(filePath, content, "utf8");
}

await writeFile(path.join(release, "README.md"), readme, "utf8");
console.log(`حزمة الاستضافة جاهزة في: ${release}`);
