'use server';

import {cookies} from 'next/headers';
import {NextRequest, NextResponse} from 'next/server';
import {initFirebaseAdminApp} from '@/lib/firebase-admin';
import {getAuth} from 'firebase-admin/auth';
import {getApp, getApps, initializeApp} from 'firebase/app';
import {
  getAuth as getClientAuth,
  signInWithCustomToken,
} from 'firebase/auth';
import {streamlitToNextJS} from '@/ai/flows/streamlit-to-nextjs';
import {streamlitToReactFastAPI} from '@/ai/flows/streamlit-to-react-fastapi';
import {generateDependencyList} from '@/ai/flows/generate-dependency-list';
import { Octokit } from '@octokit/rest';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const clientApp =
  getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const clientAuth = getClientAuth(clientApp);

async function getGitHubAccessToken(): Promise<string | null> {
  const customToken = (await cookies()).get('customToken')?.value;
  if (!customToken) {
    return null;
  }

  try {
    const userCredential = await signInWithCustomToken(clientAuth, customToken);
    const user = userCredential.user;

    initFirebaseAdminApp();
    const adminAuth = getAuth();
    const idToken = await user.getIdToken(true);
    const decodedToken = await adminAuth.verifyIdToken(idToken);

    return decodedToken.github_access_token || null;
  } catch (error) {
    console.error('Error getting GitHub access token:', error);
    return null;
  }
}

async function getRepoDetails(
  octokit: Octokit,
  repoId: string
): Promise<{ fullName: string; defaultBranch: string; owner: string, repo: string }> {
  const repoResponse = await octokit.request('GET /repositories/:repo_id', {
    repo_id: parseInt(repoId, 10),
  });
  if (repoResponse.status !== 200) {
    throw new Error('Failed to fetch repository details.');
  }
  const [owner, repo] = repoResponse.data.full_name.split('/');
  return {
    fullName: repoResponse.data.full_name,
    defaultBranch: repoResponse.data.default_branch,
    owner,
    repo
  };
}

async function getFileContent(
  octokit: Octokit,
  owner: string,
  repo: string,
  filePath: string
): Promise<string> {
    try {
        const fileResponse = await octokit.repos.getContent({
            owner,
            repo,
            path: filePath,
            mediaType: {
                format: 'raw',
            },
        });
        // The data is returned as a string for raw format.
        return fileResponse.data as unknown as string;
    } catch (error: any) {
        if (error.status === 404) {
            return ''; // Return empty string if file not found
        }
        throw new Error(`Failed to fetch file: ${filePath}`);
    }
}


export async function POST(req: NextRequest) {
  const accessToken = await getGitHubAccessToken();
  if (!accessToken) {
    return NextResponse.json(
      {error: 'Not authenticated or GitHub token missing.'},
      {status: 401}
    );
  }

  const octokit = new Octokit({ auth: accessToken });

  try {
    const {repoId, targetFramework} = await req.json();
    if (!repoId) {
      return NextResponse.json({error: 'Repository ID is required.'}, {status: 400});
    }
    if (!targetFramework) {
      return NextResponse.json({error: 'Target framework is required.'}, {status: 400});
    }

    const { fullName, defaultBranch, owner, repo } = await getRepoDetails(octokit, repoId);

    const mainPyFile = 'app.py';

    console.log(`Analyzing ${fullName}...`);
    
    const [requirementsContent, streamlitCode] = await Promise.all([
        getFileContent(octokit, owner, repo, 'requirements.txt'),
        getFileContent(octokit, owner, repo, mainPyFile),
    ]);

    if (!streamlitCode) {
        return NextResponse.json({error: `Could not find a '${mainPyFile}' in the repository.`}, {status: 404});
    }

    console.log("Converting files with AI...");

    let filesToCreate: { path: string; content: string }[] = [];
    let newBranchName: string = ''; // Initialize to prevent TS error
    let commitMessage: string = ''; // Initialize to prevent TS error
    let branchUrl: string = ''; // Initialize to prevent TS error

    if (targetFramework === 'nextjs') {
      const [{ nextjsCode }, { packageJsonContent }] = await Promise.all([
          streamlitToNextJS({ streamlitCode }),
          requirementsContent 
              ? generateDependencyList({ requirementsFileContent: requirementsContent })
              // Provide a default package.json if requirements.txt is missing
              : Promise.resolve({ packageJsonContent: '{\n  "name": "converted-app",\n  "version": "0.1.0",\n  "private": true,\n  "scripts": {\n    "dev": "next dev",\n    "build": "next build",\n    "start": "next start",\n    "lint": "next lint"\n  },\n  "dependencies": {\n    "react": "^18",\n    "react-dom": "^18",\n    "next": "14.2.3"\n  },\n  "devDependencies": {\n    "typescript": "^5",\n    "@types/node": "^20",\n    "@types/react": "^18",\n    "@types/react-dom": "^18",\n    "postcss": "^8",\n    "tailwindcss": "^3.4.1",\n    "eslint": "^8",\n    "eslint-config-next": "14.2.3"\n  }\n}\n' })
      ]);

      const packageJson = JSON.parse(packageJsonContent);
      packageJson.devDependencies = {
          ...packageJson.devDependencies,
          "tailwindcss": "^3.4.1",
          "postcss": "^8",
          "autoprefixer": "^10.4.19",
      };

      newBranchName = `converted-nextjs-${Date.now()}`;
      commitMessage = 'feat: Convert Streamlit app to Next.js';
      branchUrl = `https://github.com/${fullName}/tree/${newBranchName}`;

      filesToCreate = [
          { path: 'package.json', content: JSON.stringify(packageJson, null, 2) },
          { path: 'src/app/page.tsx', content: nextjsCode },
          { path: 'src/app/globals.css', content: '@tailwind base;\n@tailwind components;\n@tailwind utilities;\n' },
          { path: 'src/app/layout.tsx', content: `import './globals.css'\n\nexport default function RootLayout({ children }: { children: React.ReactNode }) {\n  return (\n    <html lang="en">\n      <body>{children}</body>\n    </html>\n  )\n}` },
          { path: 'postcss.config.mjs', content: `/** @type {import('postcss-load-config').Config} */\nconst config = {\n plugins: {\n   tailwindcss: {},\n   autoprefixer: {},\n },\n};\n\nexport default config;\n` },
          { path: 'tailwind.config.ts', content: `import type { Config } from "tailwindcss"\n\nconst config = {\n darkMode: ["class"],\n content: [\n   './pages/**/*.{ts,tsx}',\n   './components/**/*.{ts,tsx}',\n   './app/**/*.{ts,tsx}',\n   './src/**/*.{ts,tsx}',\n],\n prefix: "",\n theme: {\n   container: {\n     center: true,\n     padding: "2rem",\n     screens: {\n       "2xl": "1400px",\n     },\n   },\n   extend: {\n     keyframes: {\n       "accordion-down": {\n         from: { height: "0" },\n         to: { height: "var(--radix-accordion-content-height)" },\n       },\n       "accordion-up": {\n         from: { height: "0" },\n         to: { height: "var(--radix-accordion-content-height)" },\n       },\n     },\n     animation: {\n       "accordion-down": "accordion-down 0.2s ease-out",\n       "accordion-up": "accordion-up 0.2s ease-out",\n     },\n   },\n },\n plugins: [require("tailwindcss-animate")],\n} satisfies Config\n\nexport default config` },
          { path: '.gitignore', content: `# See https://help.github.com/articles/ignoring-files/ for more about ignoring files.\n\n# dependencies\n/node_modules\n/.pnp\n.pnp.js\n.yarn/install-state.gz\n\n# testing\n/coverage\n\n# next.js\n/.next/\n/out/\n\n# production\n/build\n\n# misc\n.DS_Store\n*.pem\n\n# debug\nnpm-debug.log*\nyarn-debug.log*\nyarn-error.log*\n.pnpm-debug.log*\n\n# local env files\n.env*.local\n\n# vercel\n.vercel\n\n# typescript\n*.tsbuildinfo\nnext-env.d.ts\n` },
          { path: 'tsconfig.json', content: `{\n "compilerOptions": {\n   "lib": ["dom", "dom.iterable", "esnext"],\n   "allowJs": true,\n   "skipLibCheck": true,\n   "strict": true,\n   "noEmit": true,\n   "esModuleInterop": true,\n   "module": "esnext",\n   "moduleResolution": "bundler",\n   "resolveJsonModule": true,\n   "isolatedModules": true,\n   "jsx": "preserve",\n   "incremental": true,\n   "plugins": [\n     {\n       "name": "next"\n     }\n   ],\n   "paths": {\n     "@/*": ["./src/*"]\n   }\n },\n "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],\n "exclude": ["node_modules"]\n}\n` },
          { path: 'next.config.js', content: `/** @type {import('next').NextConfig} */\nconst nextConfig = {\n   // Your Next.js configuration options here\n};\n\nmodule.exports = nextConfig;\n` },
      ];
    } else if (targetFramework === 'react-fastapi') {
      const [{ reactComponentCode, fastApiServerCode, reactPackageJson, fastApiRequirementsTxt }] = await Promise.all([
          streamlitToReactFastAPI({ streamlitCode, requirementsTxt: requirementsContent }),
      ]);

      newBranchName = `converted-react-fastapi-${Date.now()}`;
      commitMessage = 'feat: Convert Streamlit app to React + FastAPI';
      branchUrl = `https://github.com/${fullName}/tree/${newBranchName}`;

      filesToCreate = [
          { path: 'frontend/src/App.tsx', content: reactComponentCode },
          { path: 'backend/main.py', content: fastApiServerCode },
          { path: 'frontend/package.json', content: reactPackageJson },
          { path: 'backend/requirements.txt', content: fastApiRequirementsTxt },
          { path: 'frontend/.gitignore', content: `# See https://help.github.com/articles/ignoring-files/ for more about ignoring files.\n\n# dependencies\n/node_modules\n/.pnp\n.pnp.js\n.yarn/install-state.gz\n\n# testing\n/coverage\n\n# next.js\n/.next/\n/out/\n\n# production\n/build\n\n# misc\n.DS_Store\n*.pem\n\n# debug\nnpm-debug.log*\nyarn-debug.log*\nyarn-error.log*\n.pnpm-debug.log*\n\n# local env files\n.env*.local\n\n# vercel\n.vercel\n\n# typescript\n*.tsbuildinfo\nnext-env.d.ts\n`},
          { path: 'backend/.gitignore', content: `# Byte-code files\n*.pyc\n__pycache__/\n\n# Distribution / packaging\n.Python\nbuild/\ndist/\n*.egg-info/\n\n# Environments\n.env\nvenv/\nenv/\n\n# IDEs\n.vscode/\n.idea/\n\n# OS generated files\n.DS_Store\n.Trashes\nThumbs.db\n`},
          { path: 'frontend/public/index.html', content: `<!DOCTYPE html>\n<html lang="en">\n  <head>\n    <meta charset="utf-8" />\n    <link rel="icon" href="%PUBLIC_URL%/favicon.ico" />\n    <meta name="viewport" content="width=device-width, initial-scale=1" />\n    <meta name="theme-color" content="#000000" />\n    <meta\n      name="description"\n      content="Web site created using create-react-app"\n    />\n    <link rel="apple-touch-icon" href="%PUBLIC_URL%/logo192.png" />\n    <link rel="manifest" href="%PUBLIC_URL%/manifest.json" />\n    <title>React App</title>\n  </head>\n  <body>\n    <noscript>You need to enable JavaScript to run this app.</noscript>\n    <div id="root"></div>\n  </body>\n</html>\n`},
          { path: 'frontend/src/index.tsx', content: `import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport './index.css';\nimport App from './App';\n\nconst root = ReactDOM.createRoot(\n  document.getElementById('root') as HTMLElement\n);\nroot.render(\n  <React.StrictMode>\n    <App />\n  </React.StrictMode>\n);\n`},
          { path: 'frontend/src/index.css', content: `body {\n  margin: 0;\n  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',\n    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',\n    sans-serif;\n  -webkit-font-smoothing: antialiased;\n  -moz-osx-font-smoothing: grayscale;\n}\n\ncode {\n  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',\n    monospace;\n}\n`},
          { path: 'frontend/tsconfig.json', content: `{\n  "compilerOptions": {\n    "target": "es5",\n    "lib": [\n      "dom",\n      "dom.iterable",\n      "esnext"\n    ],\n    "allowJs": true,\n    "skipLibCheck": true,\n    "esModuleInterop": true,\n    "allowSyntheticDefaultImports": true,\n    "strict": true,\n    "forceConsistentCasingInFileNames": true,\n    "noFallthroughCasesInSwitch": true,\n    "module": "esnext",\n    "moduleResolution": "node",\n    "resolveJsonModule": true,\n    "isolatedModules": true,\n    "noEmit": true,\n    "jsx": "react-jsx"\n  },\n  "include": [\n    "src"\n  ]\n}\n`},
      ];
    } else {
      return NextResponse.json({error: 'Invalid target framework.'}, {status: 400});
    }

    // Create a new branch
    console.log(`Creating new branch: ${newBranchName}`);
    
    const { data: refData } = await octokit.git.getRef({
        owner,
        repo,
        ref: `heads/${defaultBranch}`,
    });

    const mainBranchSha = refData.object.sha;

    await octokit.git.createRef({
        owner,
        repo,
        ref: `refs/heads/${newBranchName}`,
        sha: mainBranchSha,
    });
    
    console.log("Creating and pushing files...");

    const tree = await octokit.git.createTree({
        owner,
        repo,
        tree: filesToCreate.map(({ path, content }) => ({
            path,
            mode: '100644', // file
            type: 'blob',
            content,
        })),
    });

    const commit = await octokit.git.createCommit({
        owner,
        repo,
        message: commitMessage,
        tree: tree.data.sha,
        parents: [mainBranchSha],
    });

    await octokit.git.updateRef({
        owner,
        repo,
        ref: `heads/${newBranchName}`,
        sha: commit.data.sha,
    });


    console.log("Conversion and push successful!");
    return NextResponse.json({
        message: 'Conversion successful!',
        branchUrl,
    });

  } catch (error: any) {
    console.error('Conversion process error:', error);
    // Provide more specific error details if available
    const errorMessage = error.response?.data?.message || error.message;
    return NextResponse.json(
      {error: `Conversion failed: ${errorMessage}`},
      {status: error.status || 500}
    );
  }
}
