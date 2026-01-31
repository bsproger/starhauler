# GitHub Pages Deployment Setup

This repository is configured to automatically deploy to GitHub Pages.

## One-Time Setup Required

After merging this PR, you need to enable GitHub Pages in your repository settings:

### Steps:

1. Go to your repository on GitHub: https://github.com/bsproger/starhauler
2. Click on **Settings** (top right)
3. Scroll down to **Pages** in the left sidebar
4. Under **Source**, select **GitHub Actions**
5. Save the changes

That's it! The workflow will automatically deploy your game whenever you push to the `main` branch.

## Testing the Deployment

1. Merge this PR to the `main` branch
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
- Ensure GitHub Pages is enabled in repository settings
- Verify the source is set to "GitHub Actions"
- Check that the repository is public (or you have GitHub Pro for private repos)
