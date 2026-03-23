# Detective Simulator - Directus Backend

Directus tabanli ana backend ve oyuna ozel extension servisleri.

Bu repo su iki ana islevi saglar:

- Directus API ve admin paneli
- Oyun akisi icin custom extension endpointleri (auth, game)

## Tech Stack

- Node.js 22
- Directus 11
- MySQL
- Custom Directus Extensions

## Repository Structure

- index.cjs: Directus server baslatma giris noktasi
- build-and-start.js: Ana proje ve extension build + start akisi
- start-all.js: Tum extensionlari build edip Directus calistirir
- extensions/auth: Kimlik dogrulama ve hesap akislari
- extensions/game: Oyun session, sorgulama ve AI akis endpointleri
- uploads: Yerel dosya depolama alani

## Prerequisites

- Node.js 22.x
- npm
- MySQL (calisir durumda bir veritabani)

## Environment Setup

1. Ornek dosyayi kopyalayin:

   cp .env.example .env

2. .env icindeki en kritik alanlari doldurun:

- DB_CLIENT, DB_HOST, DB_PORT, DB_DATABASE, DB_USER, DB_PASSWORD
- SECRET
- ADMIN_USER_ID
- FRONTEND_URL
- SENDER_NET_ACCESS_TOKEN
- OPENROUTER_API_KEY
- OPENROUTER_MODEL

Not:

- Gercek gizli anahtarlarin repoya commitlenmemesi gerekir.
- .env dosyasi gitignore ile korunur.

## Database Setup

Projede SQL dump dosyalari bulunur:

- detectivesimulator.sql
- empty-detectivesimulator.sql

Ortam tipine gore uygun dosyayi import ederek baslangic veritabani kurabilirsiniz.

## Run Commands

Bagimliliklari yukleyin:

    npm install

Normal baslatma:

    npm start

Ilk kurulum + extension build + baslatma:

    npm run first-start

Tum extensionlari build edip baslatma:

    npm run start-all

## Scripts

- npm start: Directus server calistirir
- npm run first-start: Ana bagimlilik + extension bagimlilik + build + start
- npm run start-all: Extension build + start

## Security Notes

- .sql dump, .env ve anahtar dosyalari gitignore ile disarda tutulur.
- Eger herhangi bir gizli anahtar yanlislikla paylasildiysa anahtari derhal rotate edin.
- Domain kontrolu ve rate limit logic'i extension katmaninda uygulanir.

## Related Repository

Frontend uygulamasi ayri repoda tutulur:

- detectivesimulator-website
