<!-- Mentor map: Project submission doc with rubric coverage, walkthrough, and setup context. -->

# Web Development Final Project - Crewmates HQ + Challenge Feed

Submitted by: **Mohammad Sultan**

This web app: **A Supabase-powered two-part app with Week 8 Crewmates CRUD plus Week 9 final challenge threads. Users can create, view, update, and delete crewmates, then create threaded challenge posts with comments, image uploads, video sharing, post flags, repost references, loading states, and pseudo-auth protection for edit/delete.**

Time spent: **8** hours spent in total

## Required Features

The following **required** functionality is completed:

- [x] **The web app contains a page that features a create form to add a new crewmate**
  - Users can name the crewmate
  - Users can set the crewmate's attributes by clicking on one of several values
- [x] **The web app includes a summary page of all the user's added crewmates**
  - The web app contains a summary page dedicated to displaying all the crewmates the user has made so far
  - The summary page is sorted by creation date such that the most recently created crewmates appear at the top
- [x] **A previously created crewmate can be updated from the list of crewmates in the summary page**
  - Each crewmate has an edit button that will take users to an update form for the relevant crewmate
  - Users can see the current attributes of their crewmate on the update form
  - After editing the crewmate's attribute values using the form, the user can immediately see those changes reflected in the update form and on the summary page
- [x] **A previously created crewmate can be deleted from the crewmate list**
  - Using the edit form detailed in the previous _crewmates can be updated_ feature, there is a button that allows users to delete that crewmate
  - After deleting a crewmate, the crewmate should no longer be visible in the summary page
- [x] **Each crewmate has a direct, unique URL link to an info page about them**
  - Clicking on a crewmate in the summary page navigates to a detail page for that crewmate
  - The detail page contains extra information about the crewmate not included in the summary page
  - Users can navigate to the edit form from the detail page

The following **optional** features are implemented:

- [x] A crewmate can be given a category upon creation which restricts their attribute value options
  - User can choose a `category` option to describe their crewmate before any attributes are specified
  - Based on the category value, users are allowed to access only a subset of the possible attributes
- [x] A section of the summary page displays summary statistics about a user's crew on their crew page
  - Example included: total crewmates, average speed, average stamina, ready-for-launch percentage, and dominant category
- [x] The summary page displays a custom "success" metric about a user's crew which changes the look of the crewmate list
  - Example included: a computed crew success score that applies an `elite`, `steady`, or `scrappy` board theme

The following **additional** features are implemented:

- [x] Live preview panel on the create/edit form that updates in real time
- [x] Readiness label and score for each crewmate
- [x] Shareable URL display on each crewmate detail page
- [x] Polished responsive UI with custom styling and accessibility-friendly keyboard navigation on crewmate cards

## Week 9 Final Features

The following Week 9 final features are implemented:

- [x] Week 8 CRUD app remains intact and fully usable
- [x] Deploy-ready app structure for Netlify hosting
- [x] Pseudo-authentication with random session user ID assigned on launch
- [x] Secret key protection for post update/delete and comment delete actions
- [x] Author-only post editing and deleting (must be original session user)
- [x] Repost support by referencing previous post ID
- [x] Thread linkage showing referenced post on detail page
- [x] Interface customization for feed theme and content/image visibility
- [x] Additional post characteristics field
- [x] Web video sharing (YouTube embed + direct links)
- [x] Post flags (Question, Opinion, Showcase, Resource)
- [x] Feed filtering by flag
- [x] Local image upload via Supabase Storage
- [x] Loading animation while fetching posts/thread data

## Netlify Deployment

1. Create a new site in Netlify from this GitHub repo.
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Add environment variables in Netlify:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SUPABASE_TABLE` (optional, defaults to `Crewmates`)
- `VITE_SUPABASE_POSTS_TABLE` (optional, defaults to `Posts`)
- `VITE_SUPABASE_COMMENTS_TABLE` (optional, defaults to `Comments`)
- `VITE_SUPABASE_MEDIA_BUCKET` (optional, defaults to `post-media`)

5. In Supabase SQL editor, run `supabase-setup.sql` once.
6. Redeploy the site and test all routes.

## Video Walkthrough

Here's a walkthrough of implemented user stories:

Walkthrough name: **Week 8 Project 7 - Crewmates**

<img src='Week%208=%20Project%207%20-%20Crewmates%20walkthrough-revised.gif' title='Video Walkthrough' width='' alt='Video Walkthrough' />

GIF created with ScreenToGif

## Notes

Main challenge areas were wiring Supabase correctly for a Vite app (using `VITE_` env variables), setting up row level security policies, and making sure CRUD updates reflected immediately across summary/detail/edit views.

## Mentor Tips (Commented)

```js
// 20+ year backend mentor tip:
// Keep schema setup idempotent (CREATE IF NOT EXISTS + policy existence checks)
// so you can re-run setup safely in new environments.

// Production mindset:
// Keep client env vars in .env.local and only commit .env.example templates.
// Never commit service-role keys to frontend repos.

// Data integrity first:
// Put validation in BOTH places:
// 1) UI validation for user experience
// 2) DB constraints/checks for data correctness

// CRUD reliability trick:
// After write actions (create/update/delete), redirect to a page that re-queries
// source-of-truth data, instead of trusting stale local state.

// Future scale tip:
// Add migrations early (Supabase CLI) when projects get larger than one SQL file.
// It saves pain when you need rollback/history.
```

## License

Copyright 2026 Mohammad Sultan

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
