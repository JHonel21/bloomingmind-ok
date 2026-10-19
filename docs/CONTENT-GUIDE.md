# Content guide: Groups, Intensives, & CEUs

Staff-facing steps for adding or changing programs. Nothing here requires touching page layout.
Always make changes on the `preview` branch first, check the Netlify branch deploy, then merge to `main`.

## Group Programs (`public/data/programs.json`)

The Group Programs page builds its cards, filters, and the form dropdown from this one file.
Each program is one object in the list. To add a group, copy an existing entry and edit it.
`docs/programs.sample.json` holds 10 placeholder entries. To preview the layout with a full page,
paste its contents into `public/data/programs.json` on the preview branch (do not merge the samples to `main`).

| Field | Required | Notes |
|---|---|---|
| `id` | yes | Short unique slug, lowercase with hyphens. Never reuse or change one once the group has had inquiries. |
| `title` | yes | Shown on the card, in the dropdown, and in the staff email. |
| `status` | yes | `open`, `forming`, `full`, `coming-soon`, or `hidden` (hides it everywhere without deleting). |
| `schedule` | yes | Free text, shown prominently. Example: `Thursdays, 6:00 - 7:30 PM` |
| `day` | recommended | Full weekday name, or a list like `["Monday", "Wednesday"]`. Powers the "Day" filter. |
| `category` | recommended | Topic label. Powers the filter chips. Entries sharing the exact same text are grouped. |
| `summary` | recommended | One or two sentences. |
| `audience` | optional | Example: `Adults 18+` |
| `format` | optional | Example: `In person (Jenks)` or `Telehealth` |
| `facilitator` | optional | Name and credentials. |
| `startDate` | optional | `YYYY-MM-DD`. Shown as "Starts". |
| `cost` | optional | Free text. |
| `signupUrl` | optional | If set on an `open` group, the card shows a "Sign Up" button to this link (for example a Google Calendar appointment page) instead of the interest form. |

Status controls the card badge and button: `open` (I'm Interested), `forming` (Join Interest List), `full` (Join Waitlist), `coming-soon` (Notify Me).

## 8-Hour Intensives (`public/data/intensives.json` plus `public/intensives.html`)

Each intensive has two parts:

1. A catalog entry in `intensives.json`. It drives the overview card, the form dropdown, and the date dropdown.
2. An optional detail section in `intensives.html`. Copy the template comment in that file, give the section a unique `id`, and set the same value as `detailId` in the catalog entry. That adds a "Learn more" link to the card.

Catalog fields: `id`, `title`, `tagline`, `audience`, `facilitator`, `price`, `detailId`, and `dates`.

Add upcoming dates like this (past dates drop off the page automatically):

    "dates": [
      { "date": "2026-12-05", "time": "9:00 AM - 5:00 PM", "format": "In person (Jenks)" }
    ]

With an empty `dates` list the card says dates will be announced soon, and the form offers "No preference, notify me of future dates".

## How inquiries are handled

Both forms post to the `send-program-inquiry` Netlify Function. It accepts only programs that exist in the two JSON files,
so new entries become valid automatically. Emails are tagged `[Group Inquiry]` or `[Intensive Inquiry]` in the subject, which makes a Gmail filter easy.
Set `PROGRAM_INQUIRY_TO` in Netlify environment variables to route them to a different mailbox than `info@bloomingmindok.com`.

Direct links can preselect a program: `groups.html?program=<id>` and `intensives.html?program=<id>`.

## CEUs

`ceus.html` is a "Coming soon!" placeholder. It is set to `noindex` and left out of `sitemap.xml` so a thin page does not get indexed.
When real content goes live, remove the `noindex` meta tags, add the page to `sitemap.xml`, and add the page to the Search Console indexing queue.
