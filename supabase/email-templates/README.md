# Email Setup Guide

Step-by-step instructions for configuring authentication emails (magic links,
signup confirmations) for ByteBoundless. This is a one-time setup you do in
the Supabase dashboard + your email provider's dashboard — not something that
gets deployed with the code.

The HTML templates in this folder (`magic-link.html`, `confirm-signup.html`)
are the source of truth for the branded email layout. Supabase stores its own
copy in its dashboard; you have to paste them in yourself. Treat the files
here as the canonical version — when you update a template, update the file
first, then paste into Supabase so git history tracks changes.

---

## Priority order

These four sections are listed in dependency order. Don't skip ahead — later
steps assume earlier ones are done.

1. [Paste email templates into Supabase](#1-paste-email-templates-into-supabase)
2. [Configure Site URL and redirect whitelist](#2-configure-site-url-and-redirect-whitelist)
3. [Set up Resend for custom SMTP](#3-set-up-resend-for-custom-smtp)
4. [Connect Supabase to Resend SMTP](#4-connect-supabase-to-resend-smtp)
5. [Test end-to-end](#5-test-end-to-end)

---

## 1. Paste email templates into Supabase

Supabase has its own storage for email templates — it does NOT read from this
repo automatically.

1. Go to https://supabase.com/dashboard → your ByteBoundless project
2. Sidebar: **Authentication → Emails → Email Templates**
3. For each of these three templates, do the following:
   - **Magic Link**
   - **Confirm signup**
   - **Change Email Address** _(optional — not critical for beta)_

   a. Click the template name to open it
   b. Scroll down — you'll see a subject field and an HTML body field
   c. **Subject line** (critical — blank subjects get auto-spammed):
      - Magic Link: `Sign in to ByteBoundless`
      - Confirm signup: `Welcome to ByteBoundless — confirm your email`
   d. **HTML body:** open the corresponding file in this folder, copy the
      entire contents, and paste it into the Message body field, replacing
      whatever's there
   e. Click **Save**

4. Verify the placeholders are correct. Supabase uses Go template syntax:
   - `{{ .ConfirmationURL }}` — the magic link / confirmation URL
   - `{{ .SiteURL }}` — your site URL (used in privacy/terms footer links)

---

## 2. Configure Site URL and redirect whitelist

Without this, Supabase silently drops `emailRedirectTo` values that don't
match the whitelist and sends users to the root of your Site URL, which
causes confusing "magic link took me to the wrong page" bugs.

1. Sidebar: **Authentication → URL Configuration**
2. **Site URL** — set to your production domain. Pick one:
   - `https://byteboundless.com` (your custom domain, once live)
   - `https://byteboundless.vercel.app` (Vercel default)
3. **Redirect URLs** — add EVERY URL pattern that could ever appear in
   `emailRedirectTo` from the app. Add these:
   ```
   https://byteboundless.com/**
   https://byteboundless.vercel.app/**
   https://*.vercel.app/**
   http://localhost:3000/**
   http://localhost:3001/**
   ```
   The `**` wildcard at the end is important — it lets any sub-path match.

4. Click **Save**

---

## 3. Set up Resend for custom SMTP

Supabase's default email sender is heavily rate-limited (~3-4 per hour) AND
ships from a `noreply@supabase.io` address that lands in spam. You MUST
replace it before beta invites go out.

Resend is the recommended provider — free tier is 3,000 emails/month,
100/day, 10/second. More than enough for beta.

### 3a. Create a Resend account

1. Go to https://resend.com/signup and sign up
2. You'll land on the dashboard

### 3b. Verify your sending domain

This is the important part for deliverability. Skip the "use onboarding@resend.dev
for testing" option for anything beyond the first five minutes — it's shared
infrastructure and will get your emails marked as spam.

1. Dashboard sidebar: **Domains → Add Domain**
2. Enter `byteboundless.com` (or whatever domain you're sending from)
3. Resend shows you a list of DNS records to add:
   - **1× TXT record** for SPF (`v=spf1 include:amazonses.com ~all` or similar)
   - **1× TXT record** for DKIM (long public key)
   - **1× MX record** for return-path (optional but recommended)
   - **1× TXT record** for DMARC (set this to `v=DMARC1; p=none; rua=mailto:you@byteboundless.com;` to start)
4. Add these records at your domain registrar (Cloudflare, Namecheap, Vercel
   Domains, etc.) exactly as shown
5. Click **Verify** back in Resend. Propagation takes 5-60 minutes. You'll
   know it's done when all four rows show a green checkmark.

**If you don't have a custom domain yet**, you can TEMPORARILY use the
shared `onboarding@resend.dev` sender for early testing, but plan to
migrate before any real beta invites.

### 3c. Get an API key

1. Dashboard sidebar: **API Keys → Create API Key**
2. Name: `ByteBoundless SMTP`
3. Permission: **Sending access** (not Full access — principle of least privilege)
4. Copy the key — you'll only see it once. It looks like `re_abc123...`

> **Note:** if you've already added `RESEND_API_KEY` to `.env.local`, that
> key is for the app to send emails DIRECTLY via the Resend API (e.g., for
> future features like search-complete notifications). It's separate from
> the SMTP credentials Supabase uses — they'll point at the same Resend
> account but go through different infrastructure (SMTP vs HTTP API).
>
> You only NEED the SMTP connection for auth emails right now. The env-var
> API key will become useful when we build task #83 (search-complete
> notifications).

---

## 4. Connect Supabase to Resend SMTP

1. Go to https://supabase.com/dashboard → your project
2. Sidebar: **Authentication → Emails → SMTP Settings**
3. Toggle **Enable Custom SMTP** on
4. Fill in the fields:
   - **Sender email:** `hello@byteboundless.com` (or `noreply@byteboundless.com`)
   - **Sender name:** `ByteBoundless`
   - **Host:** `smtp.resend.com`
   - **Port:** `465`
   - **Username:** `resend`
   - **Password:** the API key from step 3c (starts with `re_`)
   - **Minimum interval between emails:** leave default (60 seconds)
5. Click **Save**

**Why port 465 and not 587:**
Both work. 465 uses implicit TLS (connection encrypted from the start).
587 uses STARTTLS (plain connection, upgraded to TLS). 465 is slightly
more reliable with Supabase's outbound infrastructure.

---

## 5. Test end-to-end

Once both Supabase and Resend are configured, run this test BEFORE inviting
any beta users:

1. Go to your production signup page and sign up with a Gmail address
2. Check your inbox within 30 seconds
3. Verify:
   - [ ] Email arrived (check spam folder if not in inbox)
   - [ ] Sender shows as `ByteBoundless <hello@byteboundless.com>`, not Resend
     or Supabase
   - [ ] Subject line reads correctly (`Welcome to ByteBoundless…`)
   - [ ] Layout renders — logo, button, privacy/terms links
   - [ ] Clicking the button takes you to the app (not the wrong domain)
4. Check the Resend dashboard → **Emails** tab → verify the email shows as
   "delivered"
5. Also test with a Gmail address, Outlook address, and iCloud address —
   the three most common consumer providers. Each has different spam filters
   and you want to confirm deliverability across all of them.

**If the email lands in spam:**
- Most common cause: SPF/DKIM not yet propagated. Wait 15 minutes and re-test.
- Check Gmail's "Show original" on the email → look for `SPF=PASS` and
  `DKIM=PASS` in the authentication results. Any FAIL means your DNS records
  need attention.

**If the email never arrives:**
- Resend dashboard → Emails — see if it shows as sent, bounced, or failed
- If sent but not received: deliverability issue at the receiving provider
  (usually spam folder). Try another test recipient.
- If not sent at all: Supabase didn't call Resend. Check the Supabase project
  logs (Dashboard → Logs → Auth) for SMTP errors.

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Magic link sends user to wrong page | `emailRedirectTo` doesn't match redirect whitelist | Add the URL pattern to **Authentication → URL Configuration → Redirect URLs** |
| User says "I didn't get the email" | Default Supabase SMTP rate limit or spam | Complete step 3 + 4 |
| Email lands in spam on Gmail | SPF/DKIM not set up on sending domain | Complete step 3b |
| "Rate limit exceeded" error when clicking Send | Supabase's per-email OTP throttle (60s default) | Wait a minute and retry. Not the same as SMTP rate limit. |
| Email template shows `{{ .ConfirmationURL }}` as literal text | Template was edited in the dashboard and broke the placeholder | Re-paste from the canonical file in this folder |
| Footer privacy/terms links point to `http://localhost:3000/privacy` in production emails | Supabase's Site URL is still localhost | Fix in **Authentication → URL Configuration → Site URL** |

---

## Priority checklist for beta launch

Print this out or paste it somewhere you can check off:

- [ ] Magic Link template pasted into Supabase dashboard with correct subject
- [ ] Confirm Signup template pasted into Supabase dashboard with correct subject
- [ ] Supabase Site URL set to production domain (not localhost)
- [ ] Redirect whitelist includes `https://<production>/**` and `http://localhost:3000/**`
- [ ] Resend account created
- [ ] Sending domain added to Resend with all DNS records verified (green)
- [ ] Resend API key generated with Sending-only permissions
- [ ] Supabase SMTP toggled to custom and pointed at Resend
- [ ] Tested with a real Gmail address → arrived in inbox, not spam
- [ ] Tested with an Outlook or iCloud address → same

Once all boxes are checked, magic-link auth is beta-ready.
