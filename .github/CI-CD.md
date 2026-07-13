# CI/CD

`ci-cd.yml` runs for pushes and pull requests targeting `dev` or `main`.

- CI installs the locked npm dependency tree, type-checks/builds the Vite app, uploads `dist`, and verifies the production container.
- Pushes to `dev` publish GHCR tags `dev` and `dev-<sha>` in the `development` environment.
- Pushes to `main` publish GHCR tags `main`, `main-<sha>`, and `latest` in the `production` environment.
- Pull requests never publish packages.

The image name is `ghcr.io/<owner>/<repository>` in lowercase. At runtime, set `BACKEND_URL` to the backend origin; it defaults to `http://backend:8000`. Nginx proxies `/api/` and `/orderImg/` to that origin.

No custom secret is required to publish. The workflow uses the repository-scoped `GITHUB_TOKEN` with only `contents: read` and `packages: write` in the publish job.
