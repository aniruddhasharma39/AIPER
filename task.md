## Backend
- [ ] Update `TestInstance.js` model (new statuses, reviewHistory, previousResults, version/parentInstanceId for future reopening)
- [ ] Update `testRoutes.js` — change ASSISTANT submission to set PENDING_HEAD_REVIEW
- [ ] Add HEAD review route (`PUT /instances/:id/review`)
- [ ] Add LAB_HEAD review route (`PUT /instances/:id/lab-review`)
- [ ] Update GET /instances query logic for HEAD and LAB_HEAD

## Frontend — HEAD
- [ ] Add ReviewQueue component to HeadDashboard.jsx
- [ ] Add `/review` route to HeadDashboard router
- [ ] Add "Review" nav link for HEAD in App.jsx sidebar
- [ ] Update HEAD Dashboard stats for review count

## Frontend — LAB_HEAD
- [ ] Add LabReviewQueue component to LabHeadDashboard.jsx
- [ ] Add `/review` route to LabHeadDashboard router
- [ ] Add "Review" nav link for LAB_HEAD in App.jsx sidebar
- [ ] Update LAB_HEAD Dashboard stats for review count

## Frontend — ASSISTANT
- [ ] Update AssistantDashboard to show rejection note banner
- [ ] Show previous values as reference text on reassigned tasks
- [ ] Show "Reassigned" badge on task cards

## Frontend — Misc
- [ ] Update JobTimeline for new statuses
- [ ] Verify end-to-end flow
