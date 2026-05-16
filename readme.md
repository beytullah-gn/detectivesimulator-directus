# Detective Simulator Directus Backend

Detective Simulator için Directus 11 backend, custom auth/game endpointleri ve schema bootstrap araçları.

## Requirements

- Node.js 22
- MySQL
- Directus 11

Repo içinde `.nvmrc` bulunur:

```bash
nvm use
```

## Environment

`.env` dosyasında en az şu alanlar tanımlı olmalıdır:

```bash
KEY=...
SECRET=...
PUBLIC_URL=http://localhost:8057
DB_CLIENT=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=detectivesimulator
DB_USER=...
DB_PASSWORD=...
ADMIN_USER_ID=...
FRONTEND_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
ALLOW_API_TEST_CLIENTS=false
OPENROUTER_API_KEY=...
OPENROUTER_MODEL=openai/gpt-oss-120b:free
OPENROUTER_MAX_TOKENS=450
```

`OPENROUTER_MODEL` yalnızca `openrouter/free` veya `:free` ile biten modelleri kabul eder. Varsayılan model `openai/gpt-oss-120b:free` olarak kalmalıdır; yanlış veya ücretli model ayarında OpenRouter çağrısı yapılmadan hata döner.

## Bootstrap

Yeni schema ve gerekli prompt kayıtlarını kurmak için:

```bash
DIRECTUS_TOKEN=your-admin-or-agent-token npm run bootstrap:schema
```

Boş instance için demo vaka da eklemek isterseniz:

```bash
DIRECTUS_TOKEN=your-admin-or-agent-token npm run bootstrap:demo
```

Kategori yapısı ve çoklu vaka katalog seed'i için:

```bash
DIRECTUS_TOKEN=your-admin-or-agent-token npm run seed:catalog
```

## Run

```bash
npm install
npm run start-all
```

veya yalnızca Directus:

```bash
npm start
```

## Architecture

- `extensions/auth`: sade kayit ve aktif kullanici endpointleri
- `extensions/game`: session, hint, interrogation ve final answer akisi
- `scripts/bootstrap-v2-schema.mjs`: idempotent schema/prompt/demo seed bootstrap
- `scripts/seed-catalog-v2.mjs`: kategori ve coklu vaka katalog seed scripti

## MCP And Smoke Checks

Local doğrulama için:

```bash
curl http://localhost:8057/server/info
curl http://localhost:8057/game/health
```

MCP endpoint'i `http://localhost:8057/mcp` üstünden tokenlı initialize çağrısını destekler. İçerik güncellemelerinde schema değiştirmeden mevcut koleksiyonlar kullanılmalıdır: `scenarios`, `characters`, `scenario_media`, `hints`, `ai_prompts`, `scenario_categories`.

## Verified Flow

- kayıt oluşturma
- login
- published senaryo okuma
- karakter listesi çekme
- session başlatma
- hint kullanma
- interrogation
- session detail okuma
