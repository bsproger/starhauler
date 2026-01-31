# GitHub Pages Deployment Setup

This repository is configured to automatically deploy to GitHub Pages.

## Automatic Setup

The deployment workflow is configured to automatically enable and configure GitHub Pages for this repository. No manual setup is required!

When you push changes to the `main` branch, the workflow will:
1. Automatically enable GitHub Pages (if not already enabled)
2. Build and deploy your game
3. Make it available at: https://bsproger.github.io/starhauler/

## Testing the Deployment

1. Push changes to the `main` branch (or merge this PR)
2. Go to the **Actions** tab in your repository
3. You should see a "Deploy to GitHub Pages" workflow running
4. Once complete, your game will be live at: https://bsproger.github.io/starhauler/

## Manual Deployment

You can also trigger a deployment manually:
1. Go to the **Actions** tab
2. Click on "Deploy to GitHub Pages" workflow
3. Click "Run workflow" button
4. Select the `main` branch and click "Run workflow"

## Troubleshooting

If the deployment fails:
- Check the Actions tab for error messages
- Verify the repository is public (or you have GitHub Pro for private repos with Pages)
- Ensure the workflow has the necessary permissions (pages: write, id-token: write)
