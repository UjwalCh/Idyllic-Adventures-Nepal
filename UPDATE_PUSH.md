# How to Manually Push Updates Live

Whenever you make changes to the code or files in your project and want those changes to appear on your live website, follow this step-by-step guide.

---

## Step 1: Save and Test Locally
Before pushing anything to the internet, always make sure it works on your computer.

1. **Save your files**: Ensure all files in VS Code are saved (Ctrl + S or Cmd + S).
2. **Run your local server**:
   Open a terminal in VS Code and run:
   ```bash
   npm run dev
   ```
   *Check `http://localhost:5173` to make sure your changes look correct.*
3. **Test the build** (Optional but highly recommended):
   Run this command to make sure Vercel won't crash when building:
   ```bash
   npm run build
   ```
   *If this finishes without red errors, your code is safe to push.*

---

## Step 2: Push Code to GitHub

Your live site on Vercel is directly connected to your GitHub repository. To update the site, you simply need to send your new code to GitHub. 

Open a terminal in VS Code and run these three commands one by one:

**1. Stage all your changes:**
```bash
git add .
```
*(This tells Git to prepare all modified files for an update. Don't forget the dot `.` at the end)*

**2. Commit your changes with a message:**
```bash
git commit -m "Updated the homepage text and fixed a bug"
```
*(Replace the text inside the quotes with a short description of what you changed)*

**3. Push to GitHub:**
```bash
git push
```
*(This uploads the code from your computer to your GitHub repository)*

---

## Step 3: Vercel Auto-Deployment

Once you run `git push`, **Vercel takes over automatically**. You rarely need to do anything manually here!

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard).
2. Click on your project (`idyllic-adv-nepal`).
3. You will see a "Building" status indicator. 
4. Vercel is downloading your new code from GitHub and running `npm run build`.
5. After 1 to 2 minutes, the status will change to **"Ready"** (in green).
6. Your live website URL is now fully updated!

---

## Step 4: Supabase Database Updates (Only if needed)

You **only** need to do this step if your code changes involved creating new database tables, adding new columns, or changing Row Level Security (RLS) policies. If you just changed UI (colors, text, React components), skip this step.

If you *did* make database changes:
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Open your project ("Idyllic Adv Nepal").
3. Go to the **SQL Editor** on the left menu.
4. Click **New query**.
5. Copy the SQL commands from your local project (e.g., from a `.sql` file in your `supabase` folder) and paste them into the editor.
6. Click **Run**.
7. Test your live website to ensure it's communicating with the updated database correctly.

---

## Troubleshooting Quick Guide

- **Error during `git push`**: Someone else (or you from another computer/browser) might have pushed changes to GitHub. Run `git pull` first, then try `git push` again.
- **Vercel Build Failed**: Go to the Vercel dashboard, click on the failed deployment, and read the "Build Logs". It usually points to the exact file and line number with the error (e.g., a missing import or a syntax error). Fix the error in VS Code, and repeat Steps 1 & 2.