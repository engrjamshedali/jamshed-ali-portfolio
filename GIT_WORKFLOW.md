# Git Workflow & Deployment Guide

This guide outlines standard Git workflows for maintaining and updating the **Jamshed Ali Portfolio & Admin CMS** repository.

---

## 📌 Standard Update Workflow

Whenever you make changes, add new projects, update content, or modify styling, follow this sequential 3-step workflow in your terminal:

```bash
# 1. Stage all modified and new files (respecting .gitignore)
git add .

# 2. Commit your changes with a clear, descriptive message
git commit -m "Describe your changes here"

# 3. Push your committed updates to GitHub on the main branch
git push origin main
```

> **Note:** Background auto-pushing is strictly disabled. All repository updates must be explicitly reviewed, committed, and pushed manually with developer approval.

---

## 🛠️ Step-by-Step Production Update Procedure

### 1. Build and Test Locally First
Before committing frontend changes, ensure your bundles compile cleanly without errors:
```bash
# Compile bundles
npm run build

# Run syntax & bundle integrity checks
npm run check
```

### 2. Verify Git Status
Inspect modified and staged files:
```bash
git status
```
Ensure that no `.env`, database (`.db`), or secret files are listed in the untracked/staged list.

### 3. Stage & Commit
```bash
git add .
git commit -m "feat(portfolio): update research papers and featured projects"
```

### 4. Push to GitHub
```bash
git push origin main
```

---

## 🌿 Branching Strategy for Feature Work (Optional)

For large structural overhauls or experimenting with major features:

```bash
# Create and switch to a feature branch
git checkout -b feature/new-telemetry-widget

# Work, test, and commit your work
git add .
git commit -m "feat: implement real-time network telemetry canvas"

# Push feature branch to GitHub
git push -u origin feature/new-telemetry-widget

# Merge into main when ready
git checkout main
git merge feature/new-telemetry-widget
git push origin main
```

---

## 🔒 Security Reminders Before Committing
- **Never commit `.env` files** containing production credentials or tokens.
- **Never commit SQLite runtime files** (`data/portfolio.db`).
- Check `git diff --staged` if you are ever unsure what changes are queued.
