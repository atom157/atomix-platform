# X Reply Generator - Інструкція з налаштування

## 1. Налаштування Google OAuth в Supabase

Для роботи кнопки "Connect Account" у розширенні потрібно налаштувати Google OAuth:

### Крок 1: Створіть Google OAuth додаток
1. Відкрийте [Google Cloud Console](https://console.cloud.google.com/)
2. Створіть новий проект або виберіть існуючий
3. Перейдіть до "APIs & Services" → "Credentials"
4. Натисніть "Create Credentials" → "OAuth 2.0 Client ID"
5. Виберіть "Web application"
6. Додайте Authorized redirect URIs:
   - `https://your-project-ref.supabase.co/auth/v1/callback`
   - (Замініть `your-project-ref` на ваш Supabase project ref)
7. Збережіть Client ID та Client Secret

### Крок 2: Налаштуйте в Supabase Dashboard
1. Відкрийте [Supabase Dashboard](https://supabase.com/dashboard)
2. Виберіть ваш проект
3. Перейдіть до "Authentication" → "Providers"
4. Знайдіть "Google" і увімкніть його
5. Вставте ваші Client ID та Client Secret
6. Збережіть зміни

### Крок 3: Перевірте Site URL
В Supabase Dashboard:
1. Authentication → URL Configuration
2. Додайте ваш production URL: `https://v0-supabase-mocha.vercel.app`
3. Додайте Redirect URLs:
   - `https://v0-supabase-mocha.vercel.app/auth/callback`
   - `https://v0-supabase-mocha.vercel.app/auth/extension-connected`

## 2. Альтернатива: Email/Password логін

Якщо не хочете налаштовувати Google OAuth, можете використовувати email/password:
- Перейдіть на `/auth/sign-up` для реєстрації
- Або на `/auth/login` для входу

## 3. Lemon Squeezy (опціонально)

Для роботи платежів додайте змінні середовища:
- `LEMON_SQUEEZY_API_KEY` - API ключ з [Lemon Squeezy Dashboard](https://app.lemonsqueezy.com/settings/api)
- `LEMON_SQUEEZY_STORE_ID` - ID вашого магазину
- `LEMON_SQUEEZY_WEBHOOK_SECRET` - Webhook secret для перевірки платежів

## 4. OpenAI API (для генерації відповідей)

Користувачі можуть додати свій OpenAI API ключ в налаштуваннях дашборду (`/dashboard/settings`)

## Готово! 🎉

Тепер ваш застосунок готовий до використання!
