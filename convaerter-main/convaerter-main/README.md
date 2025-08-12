# StreamNext

This is a Next.js application that converts Streamlit (Python) applications into Next.js (TypeScript) ,React + fastapi projects using generative AI.

## Core Features

-   **GitHub Authentication**: Securely sign in with your GitHub account.
-   **Repository Listing**: Fetches and displays your GitHub repositories.
-   **AI-Powered Conversion**: Reads the content of a selected Streamlit application and uses AI to generate an equivalent Next.js project.
-   **Automated Push to GitHub**: Creates a new branch in your repository and pushes the converted Next.js code, ready for you to review and use.

## Tech Stack

-   **Framework**: [Next.js](https://nextjs.org/) (using the App Router)
-   **Language**: [TypeScript](https://www.typescriptlang.org/)
-   **UI**: [React](https://react.dev/), [ShadCN UI](https://ui.shadcn.com/), [Tailwind CSS](https://tailwindcss.com/)
-   **Generative AI**: [Genkit](https://firebase.google.com/docs/genkit) with Google's Gemini models.
-   **Authentication**: [Firebase Authentication](https://firebase.google.com/docs/auth)
-   **GitHub Integration**: [Octokit](https://github.com/octokit/rest.js)

---

## Running Locally

Follow these steps to run the application on your local machine.

### 1. Install Dependencies

First, install the necessary Node.js packages using npm:

```bash
npm install
```

### 2. Set Up Environment Variables

You will need to provide your own credentials for GitHub and Firebase for the application to work.

1.  Create a new file named `.env` in the root of the project. You can do this by copying the example file:
    ```bash
    cp .env.example .env
    ```
2.  Follow the instructions in the `.env.example` file to get the required keys and secrets from the GitHub Developer Settings and the Firebase Console.
3.  Paste your credentials into the `.env` file.

### 3. Run the Development Servers

This application requires two separate processes to run concurrently in two different terminal windows:

-   **Terminal 1: Next.js App**
    This command starts the main web application on [http://localhost:9002](http://localhost:9002).

    ```bash
    npm run dev
    ```

-   **Terminal 2: Genkit AI Flows**
    This command starts the Genkit server, which runs your AI flows and allows them to be called by the Next.js app.

    ```bash
    npm run genkit:watch
    ```

Once both servers are running, you can open your browser to [http://localhost:9002](http://localhost:9002) to use the application.
