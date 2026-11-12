# AGENTS Instructions

## Git

- Write commits in [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/) format.
- Start the type, the scope and the description in lowercase. Keep the case of code identifiers and proper nouns.
- For a non-trivial change, write a commit body that explains why.
- Mark a breaking change with `!` and a `BREAKING CHANGE:` footer.
- Author commits as the user alone. Add no agent trailers or links, such as `Co-Authored-By` or a session URL.
- Commit as the plan progresses. Keep one commit for each plan step.
- Before you push, squash fixup and work-in-progress commits into the step commit that they fix.
- Push only after the user approves that push.

## Releases

- Version releases with [Semantic Versioning 2.0.0](https://semver.org/).
- Name each release tag with the bare version, such as `1.2.3`. If the repo already uses a tag prefix, such as `v`, keep it.
- When you create a changelog, use [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/) format. Keep the format of an existing changelog.
- The site has no release workflow yet. Each push to `main` deploys the site.
- Release in this order:
  1. Update the version files and the changelog in one commit, such as `chore(release): prepare 1.2.3`.
  2. Push the commit to the default branch.
  3. Wait until the branch pipeline of that commit passes.
  4. Tag that commit with an annotated tag: `git tag -a 1.2.3 -m "Release 1.2.3" <commit>`. Tag a release candidate as `1.2.3-rc.1`.
  5. Push the tag alone: `git push origin 1.2.3`. The tag pipeline creates the release and publishes any package.
- Push the commit and the tag in separate pushes. Do not use `git push --follow-tags`. One push starts two overlapping pipelines, and a single runner queues the tag pipeline.

## Tests

- Add a test to the repo only when it guards behavior that no existing test covers.
- The test must fail when that behavior breaks. Weigh this before you add each test.
- Run throwaway tests freely to check your work.
- Keep throwaway tests out of the repo unless they meet the bar above.
- When you change a prose linter rule, change the writing guide and the linter tests in the same commit.

## CI

- Keep a CI check only when it catches a concrete failure that no existing check covers.
- Identify that failure before you add or keep the check.
- Apply the test rules to CI checks too.
- Run the repo's entry points against real inputs or isolated fixtures.
- Reject duplicate checks, source-text assertions, copied inventories and checks that only prove that a command or file exists.
- Propagate command failures.
- Count a missing prerequisite or skipped required coverage as a failure.
- Run the checks in branch and pull request pipelines, never in tag pipelines. A tag pipeline builds and smoke-tests any package, publishes it, and then creates the release.
- Start each release job with a check that the tagged commit is on the default branch.
- Match release jobs to the tag format of the version, such as `/^[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?$/`.
- Protect the release tags. Only protected refs can read the release credentials.
- A tag pipeline uses the CI config of the tagged commit. Merge a CI change to the default branch before you tag.
- After you change these rules, audit the repo against them.
- Validate changes locally. Then verify the required CI on the pushed commit.
- Report each uncovered contract and each unavailable check.
- Name CI files in kebab-case by purpose, such as `deploy-production.yml`.
- Keep reserved host filenames, including `.gitlab-ci.yml`.
- Name workflows in Title Case, such as `Deploy Production`.
- Keep the repository name out of workflow names.
- Name the workflow that validates the whole repository by its action alone, such as `Validate`.
- Name job IDs in snake_case, such as `build_image`.
- Start each GitHub step name with a verb, such as `Install Dependencies` or `Run Tests`.
- Preserve proper nouns and code identifiers when applying case.
- Prefer a specific purpose, such as `deploy-production.yml`, over a vague name, such as `production.yml`.
- Omit redundant host or artifact words, as in `github-action-build.yml` and `build-workflow.yml`.
- Name each workflow, job and step by its target and action.
- Keep job display names unique within the repository.
- Update dispatch references, dependencies, release gates, required check contexts and badges together when renaming CI artifacts.
- Run the checks in a workflow on `pull_request` and on `push` to branches.
- Run the release in a separate workflow on `push` of tags that match `[0-9]+.[0-9]+.[0-9]+`. GitHub tag filters are globs, such as `[0-9]+.[0-9]+.[0-9]+` and `[0-9]+.[0-9]+.[0-9]+-*`.
- Check out release jobs with `fetch-depth: 0`, so that the ancestry check sees the default branch.
- Keep release secrets in an environment that allows only the release tags. Protect the tags with a tag ruleset.
- Keep `Validate` reusable through `workflow_call`. `Deploy Pages` calls it and deploys only after it passes.
- Keep the Node.js major version in `.nvmrc` and the `node-version` input of `withastro/action` the same. Change both in one commit.

## Site

- Keep all content under `src/content/docs/zh-tw/`. Give a new language its own locale directory, so that no existing URL moves.
- Keep `src/content/docs/404.md` at the docs root. Starlight looks up the `404` entry there for the localized 404 page.
- Write internal links as absolute paths with the base and a trailing slash, such as `/handbook/zh-tw/ci/gitlab-runner/`. The links validator rejects relative links.
- Write sidebar entries with `slug` or `autogenerate`, never `link`, so that the build checks them. Leave the locale out of these paths.
- Keep smart punctuation off. It turns half-width quotes and dashes into typographic characters that the writing guide forbids.
- After a Starlight upgrade, search its `dist/translations/zh-TW.js` and `en.js` for forbidden punctuation. Override each match in `src/content/i18n/zh-TW.json`.
- Start the dev server in background mode with `astro dev --background`. Manage it with `astro dev stop`, `astro dev status` and `astro dev logs`.

## Docs

- Read `src/content/docs/zh-tw/contributing/writing-guide.mdx` before you write or edit a page.
- Read `src/content/docs/zh-tw/contributing/structure.mdx` before you add a handbook, a section or a language.
- Run `npm run lint:prose` after each content change.
- Keep each doc concise and plain. Each sentence must carry information.
- Write only standing rules in `AGENTS.md`. A standing rule changes how an agent does later, unrelated tasks.
- Record a fact about one place or one failure at its source: a code comment, a test, a commit body, an ADR or an issue.
- Write English docs in US English, to the [ASD-STE100](https://www.asd-ste100.org/) writing rules:
  - Give one instruction in each sentence.
  - Write instructions in the imperative and in the active voice.
  - Use one word for one meaning, and one meaning for one word.
  - An instruction has 20 words or fewer. A description has 25 words or fewer.
- Review each sentence over these limits. Split it if it holds more than one instruction or fact.
- Use a numbered list for three or more instructions in a fixed order, also across sentences.
- Write a set of full-sentence items, or of more than five items, as a bullet list. Otherwise, the set can stay in one sentence, even when the sentence is over the limits.
- Write a non-English doc in two passes:
  1. Write an English draft to these rules.
  2. Translate the draft:
     1. Keep its sentence boundaries and one term for each concept.
     2. Keep commands, paths and code unchanged.
     3. Use the natural word order of the target language.
