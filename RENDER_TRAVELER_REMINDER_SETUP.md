# BridgeX automatic traveler reminder — Render setup

The database procedure and the protected endpoint are already included in the BridgeX release. Configure the following once in the existing Render account to run it automatically each day.

## 1. Add one secret to the BridgeX web service

Open the existing **BridgeX** Render web service, then open **Environment** and add:

| Key | Value |
|---|---|
| `REMINDER_CRON_SECRET` | A new random long secret that you create and save privately. |

Use a password manager to generate at least 32 random characters. The same exact value is required in the scheduled job header below. Do not commit this value to GitHub or paste it into public messages.

## 2. Create the daily Render scheduled job

Create a **Cron Job** in the same Render account with the following values.

| Field | Value |
|---|---|
| Name | `bridgex-daily-traveler-reminders` |
| Schedule | `0 9 * * *` |
| Command | `curl --fail --silent --show-error -X POST https://bridgex.abdullahbinfahad.info/api/scheduled/traveler-reminders -H "x-bridgex-reminder-secret: $REMINDER_CRON_SECRET"` |
| Environment variable | Add the exact same `REMINDER_CRON_SECRET` value used by the web service. |

The schedule above runs at **09:00 UTC** each day. It sends a private reminder only when an active traveler-managed order has gone at least one day without a traveler milestone update. After the third reminder day, it sends administrator attention notifications.

## 3. Verify safely

After Render deploys the web release and the secret is added, use the cron job’s manual run action. A successful response has an `ok: true` result and the number of reminders processed. Do not manually call the endpoint without the secret header.
