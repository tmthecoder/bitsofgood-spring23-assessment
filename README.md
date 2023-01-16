# Bits of Good Spring 2023 Assessment

Hi! This is my implementation of the 2023 Bits of Good Spring Assessment.

It's split into 2 directories `node-server` and `cf-worker`

- `node-server` contains the main API implementation of the Animal Training Management system
- `cf-worker` contains code for the published Cloudflare Worker that handles the upload of files to Cloudflare's R2 Cloud Storage (used in the expert piece of the assessment)

End-to-end tests are available in the tests directory that cover all aspects of the API (including malfrmed and erroneous requests).

To run these tests, just type `npm run test`. There may be some flakiness in the MongoDB implementation, if any socket break errors come up, it has to do with the MongoDB tester failing, so a rerun should fix it.
