# Deploy trial-preview API (anti-reset)

Ship server **before** or **with** the app build that calls `POST /api/trial-preview`.

## Vercel env (website project)

| Variable | Required |
|----------|----------|
| `KV_REST_API_URL` | Yes |
| `KV_REST_API_TOKEN` | Yes |
| `UNTIL_TRIAL_API_SECRET` or `UNTIL_VERIFY_API_SECRET` | Yes (Bearer for app) |
| `UNTIL_TRIAL_PREVIEW_DAYS` | Optional (default `5`) |
| `UNTIL_TRIAL_SALT` | Optional (device hash salt) |

Create KV: Vercel dashboard → Storage → KV → link to `until-website` project.

## App env (optional)

| Variable | Default |
|----------|---------|
| `UNTIL_TRIAL_PREVIEW_URL` | `https://developernick1-until.vercel.app/api/trial-preview` |
| `UNTIL_TRIAL_API_SECRET` | Same as server Bearer |

## Verify

```bash
curl -X POST "$UNTIL_TRIAL_PREVIEW_URL" \
  -H "Authorization: Bearer $SECRET" \
  -H "Content-Type: application/json" \
  -d '{"deviceId":"test-device-1"}'
```

Expect `ok: true`, `trialStartMs`, `trialEndsAt`. Repeat call — `trialStartMs` must not change.

## Play submission

- Paywall copy must not promise a Play billing trial unless Console offers one.
- See [`PLAY_BILLING.md`](PLAY_BILLING.md) subscription policy section.
