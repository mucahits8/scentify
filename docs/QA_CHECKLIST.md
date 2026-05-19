# Release QA Checklist — Scentify

## Critical Path: Onboarding → DNA → Main

| Step | Action | Expected |
|------|--------|----------|
| 1 | Cold-launch app (no session) | Welcome screen appears, no crash |
| 2 | Sign in / use demo mode | Redirects to Gender step |
| 3 | Complete all onboarding steps (Gender → Love ≥3 → Dislike → Owned → Styles → Notes → Context → Budget/Weather → Pro) | Each step advances without flicker |
| 4 | Tap "Skip" or "Continue" on Pro screen | DNA Result screen appears with animation |
| 5 | DNA Result loads radar chart + tags + "Show my matches" | No loading spinner stuck; radar renders |
| 6 | Tap "Show my matches" | Navigates to main feed (Home tab) |

## Navigation Safety

| Scenario | Expected |
|----------|----------|
| Reopen app after onboarding completed | Lands on main screen directly (no onboarding re-entry) |
| Reopen app mid-onboarding (session exists, no `onboardingCompleted`) | Resumes at Gender step |
| Background → foreground while on DNA result | Screen stays, no re-navigation |
| Back gesture on DNA result | Goes to discover/main (not back into onboarding) |

## Perfume Detail

| Step | Action | Expected |
|------|--------|----------|
| 1 | Tap any perfume card from discover or home | Detail screen opens < 600ms |
| 2 | Observe hero image | Shows gradient immediately; image fades in when loaded |
| 3 | If image fails to load | Gradient is shown, no broken image icon |
| 4 | Scroll to "You may also like" | Similar perfumes appear |
| 5 | Tap a similar perfume card | Opens that perfume's detail (no "Perfume not found") |
| 6 | Tap brand pill | Opens brand detail screen |
| 7 | Tap perfumer pill | Opens perfumer detail screen |
| 8 | Tap back | Returns to previous screen cleanly |

## Image Loading — Onboarding Grid

| Step | Action | Expected |
|------|--------|----------|
| 1 | Enter Love/Dislike/Owned step | Grid shows gradient placeholders while images load |
| 2 | Images load | Gradient fades out, image is visible |
| 3 | Poor network / image 404 | Gradient stays as fallback, no spinner stuck |
| 4 | Search for a perfume | Filtered results render correctly |
| 5 | Select ≥3 perfumes (Love) | Selection badge animates; "Continue" becomes active |

## Discover Screen

| Step | Action | Expected |
|------|--------|----------|
| 1 | Open Discover tab | Feed loads < 800ms (perf log visible in dev) |
| 2 | Switch tabs (Perfumes / Brands / Perfumers / Notes) | Tab switches with fade; content appears |
| 3 | Apply filter (Woody, Floral, etc.) | Grid filters correctly |
| 4 | Type in search | Results appear after ~300ms debounce |
| 5 | Clear search | Returns to featured feed |
| 6 | Pull to scroll down | Parallax header and feed scroll smoothly |

## Dark / Light Mode Spot-Check

| Screen | Check |
|--------|-------|
| DNA Result | Title, radar, chips readable in both modes |
| Discover | Header, search bar, cards readable |
| Perfume Detail | Hero overlay text legible; body text readable |
| Onboarding grid | Card borders, text contrast OK |

## Performance Targets (DEV logs)

| Operation | Target |
|-----------|--------|
| `discover.loadFeatured` | < 800ms cold, < 50ms warm (cached) |
| `perfume.loadDetail` | < 600ms cold, < 30ms warm |
| Onboarding catalog first load | < 1200ms |
| DNA result reveal animation | Starts within 100ms of screen mount |

## Regression Checks

- [ ] Onboarding selections (love/dislike/owned) persist when moving between steps
- [ ] Gender preference filters the catalog correctly
- [ ] `i18n` toggles: TR/EN text renders without overlap/truncation
- [ ] Collection add from detail screen works and shows confirmation
- [ ] Rate screen opens from detail screen
- [ ] Journal tab shows expected content
- [ ] Profile tab renders without crash
