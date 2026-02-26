# AtomiX - AI-Powered Replies for X

A monorepo containing the AtomiX Chrome Extension and its companion Next.js Dashboard.

## Project Structure

This project follows a professional monorepo-style structure to keep concerns separated while allowing for shared resources.

- `/extension`: Contains all the code for the Chrome Extension (Manifest V3). Includes background service workers, content scripts, and the popup UI.
- `/dashboard`: The Next.js web application. This handles the marketing landing page, user authentication, billing (Lava.top/LemonSqueezy), and account settings.
- `/shared`: A directory for shared TypeScript types, constants, and utility functions used by both the dashboard and the extension.

## Getting Started

### Prerequisites

- Node.js (v18+)
- Supabase Project (for Authentication & Database)
- OpenAI API Key

### 1. Dashboard Setup

The dashboard is a Next.js 14 application using the App Router.

1. Navigate to the dashboard directory:
   \`\`\`bash
   cd dashboard
   \`\`\`
2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`
3. Set up environment variables:
   Copy `.env.example` to `.env.local` and fill in your Supabase and payment provider keys.
   \`\`\`bash
   cp .env.example .env.local
   \`\`\`
4. Run the development server:
   \`\`\`bash
   npm run dev
   \`\`\`
   The dashboard will be available at `http://localhost:3000`.

### 2. Extension Setup

The Chrome Extension is built with vanilla JavaScript/HTML/CSS for maximum performance and zero build-step complexity during development.

1. Navigate to the extension directory (optional, for viewing):
   \`\`\`bash
   cd extension
   \`\`\`
2. Set up environment variables:
   Copy `.env.example` to `.env` and provide your specific keys (if building/bundling in the future).
   \`\`\`bash
   cp .env.example .env
   \`\`\`
   *(Note: The current extension relies on the dashboard for authentication and uses native fetch, so env vars might be configured directly in your build step or fetched dynamically).*
3. Load into Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top right corner.
   - Click "Load unpacked" and select the `/extension` directory from this repository.

## Naming Conventions

This repository strictly adheres to **kebab-case** for all files and directories (e.g., `billing-plans.tsx`, `extension-auth.js`) to ensure cross-platform compatibility and consistency.

## Deployment

- **Dashboard**: Deploy seamlessly to Vercel by linking the repository. Ensure all environment variables from `.env.example` are configured in your Vercel project settings.
- **Extension**: Zip the contents of the `/extension` directory and upload it to the Chrome Web Store Developer Dashboard.
