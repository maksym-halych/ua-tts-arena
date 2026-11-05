# UA TTS Arena

UA TTS Arena is a web application. It compares Ukrainian text-to-speech (TTS) models with votes from human raters.

The application shows one sentence and two anonymous audio samples of that sentence. The rater selects the sample that sounds more natural. The application calculates a rating for each model from these votes.

The application gets its audio and its automatic metrics from the [`ua-tts-bench`](https://github.com/maksym-halych/ua-tts-bench) package. The format of the model folders is the only connection between the two projects.

## Contents

- [Function](#function)
- [Requirements](#requirements)
- [Start the application on a local computer](#start-the-application-on-a-local-computer)
- [Prepare a model folder](#prepare-a-model-folder)
- [Configuration](#configuration)
- [Enable Google sign-in](#enable-google-sign-in)
- [Use a hosted database](#use-a-hosted-database)
- [Admin pages](#admin-pages)
- [Commands](#commands)
- [Database](#database)
- [Troubleshooting](#troubleshooting)
- [Commit messages](#commit-messages)
- [Third-party code](#third-party-code)

## Function

The application has these parts for raters:

| Page         | Function                                                                          |
| ------------ | --------------------------------------------------------------------------------- |
| Vote         | Shows a comparison. The rater must sign in to vote. The rater can skip a sentence. |
| Leaderboard  | Shows the rating, win rate, votes, average WER and average CER of each model. The rater can sort by rank, rating, win rate, WER or CER. |
| Sign in      | Signs in with a Google account, or with a local form on a local computer.         |

The pages for raters are available in English and Ukrainian. The admin pages are available in English only.

These rules protect the results:

- A rater can vote one time for each item and model pair.
- The audio URLs do not contain model names. The browser does not get the names before the vote.
- The server does not accept a vote before the rater had time to hear the two samples.
- A rater can send a maximum of 15 votes each minute.
- The browser has no direct access to the database. Only the server of the application has the secret key.

## Requirements

Install these items before you start:

| Item                                | Purpose                                                   |
| ----------------------------------- | --------------------------------------------------------- |
| [Bun](https://bun.sh)               | Installs the packages and runs the application.           |
| [Docker](https://www.docker.com)    | Runs the local database.                                  |
| The `ua-tts-bench` repository       | Contains the dataset and the model folders.               |

The default configuration expects this folder layout:

```
projects/
├── ua-tts-arena/
└── ua-tts-bench/
    ├── src/ua_tts_bench/data/dataset.jsonl
    └── .cache/ua-tts-bench/
        ├── holos/
        └── omnivoice/
```

## Start the application on a local computer

CAUTION: Use the local sign-in form only on a local computer. This form does not check the email address.

Do these steps in the `ua-tts-arena` folder:

1. Install the packages.

   ```bash
   bun install
   ```

2. Start the local database. The first start downloads the Docker images, and this can take some minutes.

   ```bash
   bun run db:start
   ```

3. Make a copy of the configuration file.

   ```bash
   cp .env.example .env.local
   ```

4. Show the keys of the local database.

   ```bash
   bunx supabase status
   ```

5. In `.env.local`, write the publishable key in `SUPABASE_PUBLISHABLE_KEY`.
6. In `.env.local`, write the secret key in `SUPABASE_SECRET_KEY`.
7. In `.env.local`, write your email address in `ADMIN_USERS`.
8. Make sure that `MODELS_SOURCE` and `DATASET_SOURCE` show the correct paths. See [Configuration](#configuration).
9. Make sure that each model folder has MP3 copies. See [Prepare a model folder](#prepare-a-model-folder).
10. Start the application.

    ```bash
    bun run dev
    ```

11. Open <http://localhost:3000> in a browser.
12. Select **Sign in**, and sign in with your email address in the local form.
13. Select **Admin**, then select **Models**.
14. Select **Add** for each model folder. The application checks each folder before it adds the model.
15. Select **Vote**, and compare the samples.

NOTE: The `dev`, `build` and `start` commands use the Bun runtime. To use Node.js, run `npx next dev`.

NOTE: The votes stay in the database after you stop it. Only `bun run db:reset` deletes them.

## Prepare a model folder

The application reads one folder for each model. The folder name is the model name.

```
<model>/
├── manifest.json
├── metrics.json
└── mp3/
    └── <item id>.mp3
```

The `ua-tts-bench` package makes these files. The `export_mp3` function makes the MP3 copies with aligned loudness.

Do these steps in the `ua-tts-bench` folder to make the MP3 copies for an existing folder:

1. Make sure that `ffmpeg` is on the `PATH`.
2. Run the `export_mp3` function. Replace `holos` with the name of the model.

   ```bash
   uv run python -c "from pathlib import Path; from ua_tts_bench import export_mp3; export_mp3(Path('.cache/ua-tts-bench/holos'))"
   ```

A new model is not available to raters until an admin adds it on the **Models** page. A paused model does not get new comparisons.

CAUTION: After voting starts on a folder, do not replace its audio with different audio. Votes refer to specific audio, so the old votes would become incorrect. You can replace `metrics.json`.

## Configuration

The application reads these values from `.env.local`:

| Variable                   | Required | Value                                                                                       |
| -------------------------- | -------- | ------------------------------------------------------------------------------------------- |
| `APP_URL`                  | Yes      | The address of the application, with no slash at the end.                                   |
| `SUPABASE_URL`             | Yes      | The address of the Supabase project.                                                        |
| `SUPABASE_PUBLISHABLE_KEY` | Yes      | The publishable key of the Supabase project.                                                |
| `SUPABASE_SECRET_KEY`      | Yes      | The secret key of the Supabase project. Keep this key on the server.                        |
| `ADMIN_USERS`              | No       | The email addresses of the admins, separated by commas. With no value, the application has no admins. |
| `MODELS_SOURCE`            | Yes      | The root of the model folders: a local path, or `hf://datasets/<user>/<name>`.              |
| `HF_TOKEN`                 | No       | A Hugging Face token. A private dataset needs this token.                                   |
| `DATASET_SOURCE`           | Yes      | The location of `dataset.jsonl`: a local path or a URL.                                     |
| `LOCAL_SIGN_IN`            | No       | `true` shows the local sign-in form. The form stays off if `SUPABASE_URL` is not on this computer. |

The application reads `metrics.json` and the dataset again after a maximum of five minutes.

## Enable Google sign-in

Raters use Google to sign in to a deployed application. Do these steps to use Google with the local database:

1. In the [Google Cloud console](https://console.cloud.google.com/apis/credentials), make an OAuth client of type **Web application**.
2. Add this address to the authorized redirect URIs of the client: `http://127.0.0.1:54321/auth/v1/callback`
3. Make the file `supabase/.env`, and write the two values of the client in it.

   ```
   SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=<client id>
   SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=<client secret>
   ```

4. In `supabase/config.toml`, find `[auth.external.google]` and set `enabled` to `true`.
5. Stop the local database.

   ```bash
   bun run db:stop
   ```

6. Start the local database.

   ```bash
   bun run db:start
   ```

The sign-in page shows the Google button when the auth server has Google enabled.

## Use a hosted database

WARNING: Do not put `SUPABASE_SECRET_KEY` in a file that you commit, or in code that runs in the browser. This key gives full access to the votes.

Do these steps to use a Supabase project:

1. Make a project on [Supabase](https://supabase.com).
2. Connect this repository to the project. Replace `<project ref>` with the reference of the project.

   ```bash
   bunx supabase link --project-ref <project ref>
   ```

3. Apply the database schema to the project.

   ```bash
   bunx supabase db push
   ```

4. In the Google Cloud console, add this redirect URI to the client: `https://<project ref>.supabase.co/auth/v1/callback`
5. In the Supabase dashboard, enable the Google provider and write the two values of the client.
6. In the Supabase dashboard, disable the Email provider. The application does not use it.
7. In the Supabase dashboard, write the address of the application in **Site URL**.
8. In the Supabase dashboard, add `<APP_URL>/auth/callback` to the redirect URLs.
9. On the server, set the variables from [Configuration](#configuration). Set `MODELS_SOURCE` to `hf://datasets/<user>/<name>`, and do not set `LOCAL_SIGN_IN`.
10. Build the application.

    ```bash
    bun run build
    ```

11. Start the application.

    ```bash
    bun run start
    ```

NOTE: The free Supabase plan has no automatic backups. Export the votes regularly with **Export all votes as CSV** on the **Votes** page.

## Admin pages

Only the addresses in `ADMIN_USERS` can open these pages. The server checks the address for each page and each action.

| Page     | Shows                                                                                        | Actions                                         |
| -------- | -------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| Overview | Total votes and raters, votes per day, and the pairs and items that need votes.              | None                                            |
| Models   | Registered models and their status, and the folders that are not added yet.                  | Add, pause or resume a model.                   |
| Results  | The rating with `±`, win rate and metrics of each model, and a head-to-head grid.            | None                                            |
| Raters   | The vote count, typical decision time, side A share and agreement of each rater.             | Exclude or restore all votes of a rater.        |
| Votes    | All votes, with filters for rater, model and item.                                           | Exclude or restore a vote. Export votes as CSV. |
| Settings | The current settings.                                                                        | Turn each setting on or off.                    |

There are two settings. Both are on by default.

| Setting                              | Effect when it is off                         |
| ------------------------------------ | --------------------------------------------- |
| Show the model names after each vote | The rater does not see the names after a vote. |
| Make the leaderboard public          | Only admins can see the leaderboard.          |

Each vote records if the names were shown at that time. An exclusion stores a reason and a date. The application does not delete votes.

## Commands

| Command             | Function                                                       |
| ------------------- | -------------------------------------------------------------- |
| `bun run dev`       | Starts the application for development.                        |
| `bun run build`     | Builds the application for production.                         |
| `bun run start`     | Starts the built application.                                  |
| `bun test`          | Runs the tests.                                                |
| `bun run typecheck` | Checks the TypeScript types.                                   |
| `bun run lint`      | Runs ESLint.                                                   |
| `bun run db:start`  | Starts the local database.                                     |
| `bun run db:stop`   | Stops the local database. The data stays.                      |
| `bun run db:reset`  | Deletes the local data and applies all migrations again.       |
| `bun run db:types`  | Makes `src/server/database.types.ts` again from the local database. |

CAUTION: `bun run db:reset` deletes all local votes and all local accounts.

## Database

The migrations are in `supabase/migrations`. The database has these tables:

| Table      | Contents                                                                                    |
| ---------- | ------------------------------------------------------------------------------------------- |
| `models`   | The registered models, with the items that have an MP3 copy, and the pause date.            |
| `raters`   | One row for each rater who opened a comparison, with the exclusion data.                    |
| `rounds`   | The open comparison of each rater. The application deletes the row after the vote.          |
| `votes`    | All votes, with the winner, loser, side, decision time and exclusion data.                  |
| `settings` | One row with the two admin settings.                                                        |

The `counted_votes` view has the votes that the results use. The `pair_tallies`, `item_tallies` and `daily_tallies` views count these votes.

## Troubleshooting

| Problem                                              | Cause                                         | Remedy                                                                 |
| ---------------------------------------------------- | --------------------------------------------- | ---------------------------------------------------------------------- |
| `bun: command not found`                             | The terminal started before you installed Bun. | Open a new terminal.                                                  |
| All pages show an error.                             | A variable in `.env.local` is missing or incorrect. | Read the message in the server log. Correct the variable. Start the application again. |
| The sign-in page has no form and no button.          | `LOCAL_SIGN_IN` is not `true`, or `SUPABASE_URL` is not local. | Correct the variable. Start the application again.    |
| The **Admin** link does not show.                    | Your address is not in `ADMIN_USERS`.         | Add your address. Start the application again.                         |
| A folder shows `mp3/ is missing or empty`.           | The folder has no MP3 copies.                 | Do the steps in [Prepare a model folder](#prepare-a-model-folder).     |
| The **Models** page shows `cannot read MODELS_SOURCE`. | The path or the dataset name is incorrect.  | Correct `MODELS_SOURCE`.                                               |
| The **Vote** page shows that no comparisons are available. | The arena has fewer than two active models. | Add two models that have items in common.                            |
| The **Vote** page shows an error, and the server log shows a dataset error. | `DATASET_SOURCE` is incorrect. | Correct the path or the URL. The file must be available at that URL. |
| `bun run db:start` shows that a port is in use.      | Another application uses a port from 54321 to 54324. | Stop the other application, or change the ports in `supabase/config.toml`. |

## Commit messages

This repository uses [Commitizen](https://commitizen-tools.github.io/commitizen/) with the conventional commits format. Run this command to write a commit message:

```bash
uvx --from commitizen cz commit
```

## Third-party code

This repository contains code from [TTS Arena](https://github.com/TTS-AGI/TTS-Arena), under the Apache License 2.0. See `NOTICE` for the list of files, and `LICENSES/TTS-Arena-Apache-2.0.txt` for the license.
