# Git Commit Guide - Client Portal Self-Service Module

**Note:** This repository is the `Mifos/` folder. All paths are relative to this folder.

## ✅ **SHOULD BE COMMITTED** (All Source Code & Configuration)

### Frontend (Angular)

```
src/app/clientportal/
├── pages/
│   ├── login/
│   ├── dashboard/
│   ├── loans/
│   │   ├── loans.component.*
│   │   └── loan-details/
│   ├── transactions/
│   ├── notifications/
│   └── support/
├── services/
│   └── auth.service.ts
├── clientportal.module.ts
└── clientportal-routing.module.ts
```

### Backend (Django)

```
portal_backend/
├── core/
│   ├── views.py          ✅ (All API endpoints)
│   ├── urls.py           ✅
│   ├── admin.py          ✅
│   ├── apps.py           ✅
│   └── migrations/       ✅ (Database migrations)
├── mifos_client/
│   ├── __init__.py       ✅
│   └── client.py         ✅ (Fineract client wrapper)
├── portal_backend/
│   ├── settings.py       ✅ (But check for secrets!)
│   ├── urls.py           ✅
│   ├── wsgi.py           ✅
│   └── asgi.py           ✅
├── manage.py             ✅
├── requirements.txt      ✅ (Python dependencies)
└── README.md             ✅
```

### Configuration Files

```
.gitignore                 ✅ (Updated with portal_backend ignores)
package.json               ✅
package-lock.json          ✅
angular.json               ✅
tsconfig.json              ✅
```

## ❌ **SHOULD NEVER BE COMMITTED**

### Environment Variables & Secrets

```
.env                       ❌ NEVER!
.env.local                 ❌
portal_backend/.env        ❌ NEVER!
portal_backend/db.sqlite3  ❌ (Local database)
src/assets/env.js          ❌ (Already in .gitignore)
```

### Build Artifacts

```
node_modules/              ❌
dist/                      ❌
portal_backend/__pycache__/ ❌
portal_backend/**/*.pyc    ❌
```

### IDE & Editor Files

```
.idea/                     ❌
.vscode/                   ❌ (except settings.json, tasks.json, etc.)
*.iml                      ❌
```

### OS Files

```
.DS_Store                  ❌
Thumbs.db                  ❌
```

### Temporary Files

```
portal_backend/cookies.txt ❌
*.log                      ❌
*.bak                      ❌
```

## 📝 **Recommended Git Workflow**

### 1. Navigate to the Mifos folder:

```bash
cd Mifos
```

### 2. Check what will be committed:

```bash
git status
```

### 3. Review changes:

```bash
git diff
```

### 4. Stage only the files that should be committed:

```bash
# Add all changes (respects .gitignore)
git add -A

# Or add specific files
git add src/app/clientportal/
git add portal_backend/core/
git add portal_backend/mifos_client/
git add .gitignore
```

### 5. Review staged files (IMPORTANT!):

```bash
git status
# Make sure no .env files or db.sqlite3 are listed!
```

### 6. Commit with a descriptive message:

```bash
git commit -m "feat: Add Client Portal Self-Service Module

- Implement login, dashboard, loans, transactions, notifications, and support pages
- Add Django backend API endpoints for Fineract integration
- Add Angular frontend components with responsive design
- Configure routing and module structure
- Update .gitignore for portal_backend"
```

### 7. Push to remote:

```bash
git push origin main
# or
git push origin master
# or
git push origin <your-branch-name>
```

## 🔒 **Security Checklist Before Committing**

- [ ] No `.env` files in the commit
- [ ] No hardcoded passwords or API keys in `settings.py`
- [ ] No `portal_backend/db.sqlite3` file
- [ ] No `node_modules/` or `dist/` folders
- [ ] `.gitignore` is properly updated
- [ ] Review `git status` before committing
- [ ] Review `git diff` to see actual changes

## 📦 **What Was Added in This Module**

### New Files Created:

1. **Frontend Components:**
   - `src/app/clientportal/pages/login/`
   - `src/app/clientportal/pages/dashboard/`
   - `src/app/clientportal/pages/loans/` (loans list + loan details)
   - `src/app/clientportal/pages/transactions/`
   - `src/app/clientportal/pages/notifications/`
   - `src/app/clientportal/pages/support/`
   - `src/app/clientportal/services/auth.service.ts`

2. **Backend Views:**
   - `portal_backend/core/views.py` (updated with new endpoints)
   - `portal_backend/core/urls.py` (updated with new routes)
   - `portal_backend/mifos_client/client.py` (Fineract client wrapper)

3. **Configuration:**
   - `.gitignore` (updated with portal_backend ignores)

4. **Module Configuration:**
   - `src/app/clientportal/clientportal.module.ts` (updated)
   - `src/app/clientportal/clientportal-routing.module.ts` (updated)

## 🚀 **Quick Commit Command**

If everything looks good:

```bash
cd Mifos
git add -A
git status  # ⚠️ REVIEW THIS FIRST!
git commit -m "feat: Add Client Portal Self-Service Module with all pages and backend integration"
git push
```

**Always review `git status` first to ensure no sensitive files are included!**
