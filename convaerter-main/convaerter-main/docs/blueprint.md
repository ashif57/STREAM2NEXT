# **App Name**: StreamNext

## Core Features:

- GitHub OAuth Login: Connect to GitHub via OAuth.
- Repository Listing: Display a list of the user's GitHub repositories.
- Repository Cloning: Clone the selected repository to a temporary folder on the server.
- Code Conversion: Convert Streamlit (Python) code to Next.js (TypeScript) code using Gemini 2.5 Pro as a tool. Preserve all business logic, convert Streamlit UI elements to React components, and create Next.js API routes.
- Push to GitHub: Create a new branch in the original GitHub repository and push the converted Next.js project to it.
- Conversion Status: Display progress status during the conversion process (Cloning → Analyzing → Converting → Pushing).

## Style Guidelines:

- Primary color: A vibrant blue (#29ABE2) evoking trustworthiness and technology.
- Background color: Light gray (#F0F2F5), very lightly tinted with blue, creating a clean and modern look.
- Accent color: A bright green (#90EE90), drawing attention to important interactive elements and conversion status messages.
- Font: 'Inter' (sans-serif) for both headlines and body text, offering a modern, neutral, and readable style. 
- Use simple, outline-style icons to represent different file types and actions.
- Use subtle transitions and progress animations to enhance the user experience during the conversion process.