# ✅ Copilot AI System - Pre-Launch Checklist

**Complete this checklist before creating your first test issue**

---

## 🔧 Step 1: Verify Files Are In Place

- [ ] `.github/workflows/ai-worker.yml` exists
  ```bash
  ls -la .github/workflows/ai-worker.yml
  ```

- [ ] `.github/workflows/auto-merge-and-deploy.yml` exists
  ```bash
  ls -la .github/workflows/auto-merge-and-deploy.yml
  ```

- [ ] `.github/scripts/copilot-processor.js` exists
  ```bash
  ls -la .github/scripts/copilot-processor.js
  ```

- [ ] `.github/automation-config.json` exists
  ```bash
  ls -la .github/automation-config.json
  ```

---

## 🔐 Step 2: GitHub Secrets Configuration

### Required Secrets (3 total)

- [ ] `OPENAI_API_KEY`
  ```bash
  gh secret list | grep OPENAI_API_KEY
  ```
  - Get from: https://platform.openai.com/account/api-keys
  - Format: `sk-...` (starts with sk-)

- [ ] `GITHUB_TOKEN` (should already exist)
  ```bash
  gh secret list | grep GITHUB_TOKEN
  ```
  - Must have `repo` scope
  - Can be personal access token or automatic token

- [ ] `VERCEL_TOKEN` (should already exist)
  ```bash
  gh secret list | grep VERCEL_TOKEN
  ```
  - Get from: https://vercel.com/account/tokens

### Verify Secrets
```bash
# List all secrets (values hidden)
gh secret list
# Should show: OPENAI_API_KEY, GITHUB_TOKEN, VERCEL_TOKEN
```

---

## 🔒 Step 3: Branch Protection Settings

Navigate to: **Settings → Branches → Branch protection rules → main**

- [ ] **Require pull request reviews before merging**: ✓ Checked
- [ ] **Required approvals**: `2`
- [ ] **Dismiss stale pull request approvals**: ✓ Checked
- [ ] **Require status checks to pass**: ✓ Checked
- [ ] **Require branches to be up to date**: ✓ Checked
- [ ] **Restrict who can push to matching branches**: (optional)

If no rule exists:
1. Click "Add rule"
2. Branch name pattern: `main`
3. Enable the above settings
4. Save

---

## 🤖 Step 4: Verify Workflow Syntax

Check if workflows have any syntax errors:

```bash
# Check ai-worker.yml
gh workflow list

# You should see:
# ai-worker.yml (enabled)
# auto-merge-and-deploy.yml (enabled)
```

If workflow shows "disabled":
1. Go to **Actions** tab
2. Click workflow name
3. Enable workflow

---

## 📋 Step 5: Verify GitHub Actions Enabled

- [ ] Go to **Settings → Actions → General**
- [ ] **Actions permissions**: "Allow all actions and reusable workflows" ✓
- [ ] **Default permissions**: "Read and write permissions" ✓

---

## 🧪 Step 6: Create Test Issue

Copy and paste this test issue:

```
Title: Add hello world endpoint

Task:
Create a new endpoint that returns "Hello World"

Requirement:
- Create GET /api/hello
- Returns JSON: { "message": "Hello World" }
- Simple and straightforward
```

Then create issue:
```bash
gh issue create --title "Add hello world endpoint" --body "Create a new endpoint that returns 'Hello World'\n\nRequirement:\n- Create GET /api/hello\n- Returns JSON: { \"message\": \"Hello World\" }\n- Simple and straightforward"
```

Or manually create at: **Issues → New Issue**

---

## ⏱️ Step 7: Monitor Workflow Execution

After creating issue, watch for workflow:

```bash
# View running workflows (wait 30-60 seconds)
gh run list --workflow=ai-worker.yml --limit 5

# Watch the specific run
gh run view <RUN_ID> --log

# Expected timeline:
# T+0s: Issue created, workflow triggers
# T+30s: Workflow starts (shows "in progress")
# T+60s: OpenAI API call (might take 20-30s)
# T+90s: Files committed
# T+120s: PR created (should see PR appear)
```

---

## 📊 Step 8: Verify PR Creation

A Pull Request should be created automatically:

```bash
# List AI-generated PRs
gh pr list --label "ai-generated"

# View the PR
gh pr view <NUMBER> --web  # Opens in browser
```

**Expected PR Contents:**
- Title: `AI: Resolve issue #<NUMBER> - <issue title>`
- Labels: `ai-generated`
- Linked issue: Shows "Closes #X"
- Has file changes (1+)
- Requests 2+ reviewers
- Comments on original issue

---

## ✅ Step 9: Review & Approve PR

- [ ] Open the PR in browser
- [ ] Click "Files changed" tab
- [ ] Review generated code
- [ ] If satisfied, click "Review changes" → "Approve" → "Submit review"
- [ ] Wait for 2nd reviewer or approve with different account
- [ ] Once 2+ approvals: Auto-merge starts (observe)

**Note**: May take 1-2 minutes for auto-merge after 2nd approval

---

## 🚀 Step 10: Verify Deployment

After auto-merge:

```bash
# Check if deployment started
gh run list --workflow=auto-merge-and-deploy.yml --limit 1
```

Expected flow:
1. PR auto-merges to `main`
2. `auto-merge-and-deploy.yml` workflow triggers
3. Deploys to Vercel
4. Original issue auto-closes
5. Check deployment status at: https://vercel.com/dashboard

---

## 🎯 Success Criteria

Your Copilot AI is working if:

- ✅ Workflow started within 1 minute of issue creation
- ✅ Workflow completed successfully (green checkmark)
- ✅ PR created automatically with AI-generated code
- ✅ PR has correct labels (`ai-generated`)
- ✅ PR correctly linked to original issue
- ✅ File changes are logical and related to issue
- ✅ PR auto-merges after 2+ approvals
- ✅ Deployment completes to Vercel
- ✅ Original issue closes automatically
- ✅ No errors in workflow logs

---

## 🐛 Troubleshooting

### Workflow Doesn't Start

**Check:**
```bash
# 1. Verify Actions enabled
gh api repos/{owner}/{repo} --jq '.has_discussions'

# 2. Check workflow file syntax
cat .github/workflows/ai-worker.yml | head -20

# 3. View recent runs
gh run list --limit 10
```

**Solution:**
- Enable Actions in Settings → Actions
- Check workflow YAML syntax
- Verify branch is `main` (not `master`)

---

### Workflow Fails During Execution

**Check:**
```bash
# View full error logs
gh run view <RUN_ID> --log | tail -50

# Common errors:
# ERROR: OPENAI_API_KEY not found → Add secret
# ERROR: Rate limited → Wait and retry
# ERROR: Invalid JSON → Config file syntax
```

**Solutions:**
1. Missing OpenAI key → `gh secret set OPENAI_API_KEY --body "sk-..."`
2. Invalid key → Generate new one on platform.openai.com
3. Rate limited → Wait 1 minute before retrying
4. JSON error → Check automation-config.json syntax

---

### PR Not Created

**Check:**
```bash
# Verify files were changed
git diff HEAD

# Check if branch was created
git branch -a | grep ai/

# View last workflow step
gh run view <RUN_ID> --log | tail -20
```

**Solutions:**
1. Check if AI generated real changes (might generate empty)
2. Verify git credentials configured
3. Check branch protection settings (might be blocking)

---

### Auto-Merge Not Working

**Check:**
```bash
# Verify approvals exist
gh pr view <NUMBER> --json reviews

# Check branch protection rules
gh api repos/{owner}/{repo}/branches/main/protection
```

**Solutions:**
1. Ensure 2 separate approvals (not same person twice)
2. Verify branch protection: 2+ approvals required
3. Check for blocking reviews (Changes Requested)
4. Verify status checks passing

---

### Deployment Not Triggered

**Check:**
```bash
# Verify PR was merged
gh pr view <NUMBER> --json mergeStateStatus

# Check Vercel webhooks
# Go to: https://vercel.com/dashboard → settings → Integrations → GitHub
```

**Solutions:**
1. Ensure VERCEL_TOKEN is set correctly
2. Verify Vercel GitHub integration connected
3. Check Vercel webhook configuration
4. Review auto-merge-and-deploy.yml for syntax errors

---

## 🆘 Getting Help

**Document to read:**
- **General questions** → README_COPILOT_AI.md
- **Setup problems** → COPILOT_QUICKSTART.md
- **Workflow issues** → COPILOT_AUTOMATION_GUIDE.md
- **What changed** → MIGRATION_GUIDE.md

**Debug commands:**
```bash
# Full workflow log
gh run view <RUN_ID> --log

# Issue details
gh issue view <ISSUE_NUMBER>

# PR details
gh pr view <PR_NUMBER> --json body,reviewDecisions

# Recent runs
gh run list --limit 20
```

---

## 📝 Checklist Summary

**Before first test issue:**
- [ ] All 4 files exist in correct locations
- [ ] OPENAI_API_KEY secret configured
- [ ] GITHUB_TOKEN secret exists
- [ ] VERCEL_TOKEN secret exists
- [ ] Branch protection enabled (2+ approvals)
- [ ] Actions enabled in settings
- [ ] Workflows show as "enabled"

**After creating test issue:**
- [ ] Workflow starts within 1 minute
- [ ] Workflow completes successfully
- [ ] PR created automatically
- [ ] PR has correct changes
- [ ] PR auto-merges after 2 approvals
- [ ] Deployment starts on Vercel
- [ ] Issue closes automatically

**System is ready when:**
- ✅ All checks above pass
- ✅ Test deployment successful
- ✅ No errors in logs
- ✅ You're confident with the flow

---

## 🎉 Ready to Launch!

Once checklist complete, create your first real issue:

```
Title: [Your real task here]

Description: [Clear requirements]

Example:
Title: Add login page UI
Description:
- Create login form component
- Email and password inputs
- Submit button
- Link to signup page
- Validate inputs client-side
```

**Then watch your Copilot AI in action!** 🚀

---

**Verification Status**: Ready to check
**Last Updated**: April 16, 2026
**System**: GitHub Copilot AI Automation
