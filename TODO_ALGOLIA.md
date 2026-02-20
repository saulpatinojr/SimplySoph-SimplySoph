# Algolia Search Migration TODO

This project now uses Algolia for search instead of client-side Fuse.js. Follow these steps to complete the setup.

## 1. Algolia Setup

1.  **Create an Algolia Account**: Sign up at [algolia.com](https://www.algolia.com/).
2.  **Create an Application**: Create a new application in the Algolia dashboard.
3.  **Get API Keys**:
    -   Go to **Settings > API Keys**.
    -   Copy the **Application ID**.
    -   Copy the **Search-Only API Key** (for frontend).
    -   Copy the **Admin API Key** (for backend functions - keep this secret!).
4.  **Create an Index**: Create an index named `dev_content` (or your preferred name).

## 2. Frontend Configuration

1.  Update your local `.env` file (based on `.env.example`):

    ```env
    VITE_ALGOLIA_APP_ID=YOUR_APP_ID
    VITE_ALGOLIA_SEARCH_KEY=YOUR_SEARCH_ONLY_API_KEY
    VITE_ALGOLIA_INDEX_NAME=dev_content
    ```

2.  Redeploy your frontend.

## 3. Backend Configuration (Cloud Functions)

The Cloud Functions are located in the `functions` directory. They automatically sync Firestore changes to Algolia.

1.  **Install Dependencies**:
    ```bash
    cd functions
    npm install
    ```

2.  **Set Environment Variables**:
    You need to set the Algolia credentials in the Firebase Functions environment.

    *Option A: Using .env file (Recommended for development)*
    Create `functions/.env`:
    ```env
    ALGOLIA_APP_ID=YOUR_APP_ID
    ALGOLIA_ADMIN_KEY=YOUR_ADMIN_API_KEY
    ALGOLIA_INDEX_NAME=dev_content
    ```

    *Option B: Using Firebase Config (Production)*
    ```bash
    firebase functions:config:set algolia.app_id="YOUR_APP_ID" algolia.key="YOUR_ADMIN_API_KEY" algolia.index="dev_content"
    ```
    *(Note: You'll need to update `functions/src/index.ts` to read from `functions.config()` if you use this method, currently it reads from `process.env`)*.

3.  **Deploy Functions**:
    ```bash
    firebase deploy --only functions
    ```

## 4. Algolia Index Configuration

Go to your Algolia Dashboard > Index > Configuration:

1.  **Searchable Attributes**: Add `title`, `description`, `tags`, `category`, `content`.
    -   Order them by importance (e.g., Title > Tags > Description).
2.  **Ranking and Sorting**:
    -   Set **Custom Ranking** to `publishedAt` (descending) to prioritize newer content.

## 5. Backfill Data (One-time)

The Cloud Functions only trigger on *new* writes. To index existing Firestore data:

1.  You can manually trigger an update by "touching" documents (e.g., adding a temporary field and removing it).
2.  Or, write a simple script using `firebase-admin` and `algoliasearch` to loop through all `blogPosts`, `videos`, and `photoAlbums` and save them to the index.

## 6. Verification

1.  Create or update a blog post in your CMS/Firestore.
2.  Check the Algolia Dashboard to see if the record appears in the `dev_content` index.
3.  Search for the post on the frontend.
