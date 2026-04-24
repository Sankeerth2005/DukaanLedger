# Deployment Guide: DukaanLedger

Everything is working flawlessly! The TypeScript checks passed with zero errors, and the Next.js optimized production build completed perfectly.

Since we are using **Next.js 15, Prisma, and Neon PostgreSQL**, the most seamless and robust way to deploy this application is via **Vercel**. 

Here is your step-by-step checklist to deploy DukaanLedger to production.

---

## 🚀 Step 1: Prepare the Repository
1. Make sure all your recent changes are committed:
   ```bash
   git add .
   git commit -m "Finalizing production build and adding core features"
   ```
2. Push your code to a remote GitHub repository.
   ```bash
   git push origin main
   ```

## 🌍 Step 2: Configure Vercel
1. Log in to [Vercel](https://vercel.com/) (Sign up with GitHub if you haven't).
2. Click **Add New...** → **Project**.
3. Select your `dukaan-ledger` GitHub repository and click **Import**.
4. In the "Configure Project" screen, ensure the Framework Preset is set to **Next.js**.

## 🔐 Step 3: Environment Variables
Vercel needs to know your database connection and authentication secrets. Expanding the **Environment Variables** section, copy the variables exactly from your local `.env` file into Vercel. 

**Required Keys:**
| Key | Purpose |
| :--- | :--- |
| `DATABASE_URL` | Your Neon Postgres connection string. |
| `NEXTAUTH_SECRET` | A secure randomized string for signing cookies. |
| `NEXTAUTH_URL` | **IMPORTANT:** Set this to your actual Vercel deployment URL (e.g., `https://dukaan-ledger.vercel.app`). *Leave this out on the very first deploy if you don't know the URL yet, but remember to add it right after!* |
| `GOOGLE_ID` | Your Google Cloud OAuth Client ID. |
| `GOOGLE_SECRET` | Your Google Cloud OAuth Client Secret. |

## 📦 Step 4: The Build Command
Vercel automatically detects Next.js, but since you are using Prisma, you need to ensure the Prisma client is generated before Next.js builds the app. 

Go to **Build and Output Settings** and set the Build Command to:
```bash
npx prisma generate && next build
```
*(If Vercel's default auto-detects Prisma, it will use `prisma generate && next build` automatically).*

## 🪪 Step 5: Update Google Cloud Console (Crucial)
Once your app is deployed and you receive your live `.vercel.app` domain:
1. Go to your [Google Cloud Console](https://console.cloud.google.com/).
2. Navigate to **APIs & Services** → **Credentials**.
3. Edit your OAuth 2.0 Client ID.
4. **Add Authorized JavaScript origins:** `https://your-deployment-url.vercel.app`
5. **Add Authorized redirect URIs:** `https://your-deployment-url.vercel.app/api/auth/callback/google`

*If you do not do this, Google Login will throw a `redirect_uri_mismatch` error in production.*

---

## 🎉 Step 6: Deploy & DB Migrations
1. Hit the **Deploy** button on Vercel.
2. Vercel will install dependencies, generate the Prisma client, and run the optimized production build (which we just verified works locally!).
3. Visit your live URL. 

> [!TIP]
> **Database Note:** Because you are connecting to your hosted Neon database, your production environment is already in sync with your local schema. There is no need to run `npx prisma db push` on Vercel; it’s already handled!
