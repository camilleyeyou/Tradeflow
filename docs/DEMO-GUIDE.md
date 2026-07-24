# Tradeflow Demo Dashboard — Guide for Sales & PR

This guide explains how to demo the Tradeflow dashboard to a prospect using our
demo account. The demo shows a **fully fake** company — "Summit Air & Plumbing
(Demo)" — with realistic-looking leads, calls, and text conversations. Every
name and phone number in it is invented (all numbers are 555 numbers), so
there is nothing confidential on screen.

---

## 1. Logging in

1. Go to **https://www.tradeflow-technologies.com/login**
2. Sign in with the demo account:
   - **Email:** `demo@tradeflow-technologies.com`
   - **Password:** ask the admin (it is never written in this document)
3. You'll land on the demo company's dashboard.

> Tip: log in *before* the sales call starts so the dashboard is already on
> screen when you share.

## 2. What to show on a sales call (suggested 5-minute flow)

1. **Overview page** — start here. Point at the month's lead count, the
   **revenue figure** ("this is real job value the contractor reports, not a
   guess"), and the **average speed-to-lead** ("your missed calls get a text
   back in under a minute").
2. **Leads page** — show the list: every call, form fill, and missed call in
   one place. Point out the **hot leads at the top** — "our AI reads each
   lead and scores how urgent it is, so you call the burst pipe before the
   maintenance request."
3. **Open one lead** — show the status flow (new → contacted → booked →
   completed), the notes, and the **text-message thread**: "you can text the
   homeowner right from here; and when you mark a job completed, the customer
   automatically gets a text asking for a Google review."
4. **Calls page** — show the call log with missed calls flagged: "every one
   of these missed calls got an automatic text within 60 seconds."
5. **Settings** — briefly show that the business controls its own review
   link, notification preferences, and timezone.

**One-sentence close:** "Everything you just saw runs by itself — you answer
the phone when you can, and Tradeflow catches everything you miss."

## 3. Things to know

- The demo data always looks **fresh** — lead dates are generated relative to
  today every time the data is reseeded.
- The demo company is invisible to the public: it has no public landing page,
  is not in Google, and receives no report emails.
- Don't change the demo password without telling the admin.
- It's fine to click anything. You cannot break real client data from this
  account — it can only see the demo company.

## 4. Refreshing the demo data (admin task)

If the demo starts looking stale (dates drift, or someone changed statuses
mid-demo), an admin refreshes it in about 30 seconds:

1. Open the **Supabase SQL editor** for the production project.
2. Paste the entire contents of `supabase/seed_demo.sql` and run it.
3. Done — the demo company is wiped and recreated with fresh dates, and the
   demo login is automatically re-attached.

## 5. If the login stops working

Ask the admin to reset the demo user's password in Supabase
(**Authentication → Users → demo@tradeflow-technologies.com → Reset
password**), or to re-run the provisioning step. The demo data itself is
unaffected by login issues.
