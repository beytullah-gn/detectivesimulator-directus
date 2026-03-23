const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const EXTENSIONS_DIR = path.join(__dirname, "extensions");

console.log("📦 Ana proje bağımlılıkları yükleniyor...");
execSync("npm install --silent", { cwd: __dirname, stdio: "inherit" });

console.log("🚀 Tüm eklentiler için build işlemi başlıyor...");

fs.readdirSync(EXTENSIONS_DIR, { withFileTypes: true })
  .filter(dirent => dirent.isDirectory())
  .forEach(dirent => {
    const extPath = path.join(EXTENSIONS_DIR, dirent.name);
    const pkgJsonPath = path.join(extPath, "package.json");

    if (fs.existsSync(pkgJsonPath)) {
      console.log(`📦 ${dirent.name} build ediliyor...`);
      execSync("npm install --silent", { cwd: extPath, stdio: "inherit" });
      execSync("npm run build", { cwd: extPath, stdio: "inherit" });
    }
  });

console.log("✅ Tüm eklentiler build edildi. Directus başlatılıyor...");
execSync("npx directus start", { stdio: "inherit" });
