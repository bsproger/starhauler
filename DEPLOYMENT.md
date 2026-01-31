# GitHub Pages Deployment Setup

This repository is configured to automatically deploy to GitHub Pages.

## Initial Setup Required

Before the deployment workflow can run successfully, you need to enable GitHub Pages in the repository settings:

1. Go to your repository **Settings** → **Pages**
2. Under "Build and deployment", set:
   - **Source**: GitHub Actions
3. Save the settings

Once GitHub Pages is enabled, the deployment workflow will automatically build and deploy your game whenever you push changes to the `main` branch.

Your game will be available at: https://bsproger.github.io/starhauler/

## Automatic Deployment

After the initial setup, when you push changes to the `main` branch, the workflow will:
1. Build your game
2. Deploy it to GitHub Pages
3. Make it available at the URL above

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
