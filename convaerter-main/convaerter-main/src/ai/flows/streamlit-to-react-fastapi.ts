'use server';

/**
 * @fileOverview Converts Streamlit code to React frontend and FastAPI backend using GenAI.
 *
 * - streamlitToReactFastAPI - A function that handles the conversion process.
 * - StreamlitToReactFastAPIInput - The input type for the streamlitToReactFastAPI function.
 * - StreamlitToReactFastAPIOutput - The return type for the streamlitToReactFastAPI function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const StreamlitToReactFastAPIInputSchema = z.object({
  streamlitCode: z
    .string()
    .describe('The Streamlit (Python) code to convert.'),
  requirementsTxt: z
    .string()
    .describe('The requirements.txt file for the Streamlit application.'),
});
export type StreamlitToReactFastAPIInput = z.infer<typeof StreamlitToReactFastAPIInputSchema>;

const StreamlitToReactFastAPIOutputSchema = z.object({
  reactComponentCode: z
    .string()
    .describe('The converted React (TypeScript) App.tsx code.'),
  fastApiServerCode: z
    .string()
    .describe('The converted FastAPI (Python) main.py code.'),
  reactPackageJson: z
    .string()
    .describe('The package.json for the React frontend.'),
  fastApiRequirementsTxt: z
    .string()
    .describe('The requirements.txt for the FastAPI backend.'),
});
export type StreamlitToReactFastAPIOutput = z.infer<typeof StreamlitToReactFastAPIOutputSchema>;

export async function streamlitToReactFastAPI(input: StreamlitToReactFastAPIInput): Promise<StreamlitToReactFastAPIOutput> {
  return streamlitToReactFastAPIFlow(input);
}

const prompt = ai.definePrompt({
  name: 'streamlitToReactFastAPIPrompt',
  input: {schema: StreamlitToReactFastAPIInputSchema},
  output: {schema: StreamlitToReactFastAPIOutputSchema},
  prompt: `Convert the following Streamlit (Python) code and requirements.txt into a React frontend (App.tsx), a FastAPI backend (main.py), a React package.json, and a FastAPI requirements.txt.

Output a JSON object with four keys: 'reactComponentCode', 'fastApiServerCode', 'reactPackageJson', and 'fastApiRequirementsTxt'.

Guidelines for conversion:
- React Component (App.tsx):
  - Translate Streamlit UI elements to React components.
  - Use functional components and React hooks.
  - Ensure the React app can communicate with the FastAPI backend.
  - Add necessary imports and setup for a standard React application.
  - Assume a typical React project structure.

- FastAPI Server (main.py):
  - Translate Streamlit's Python logic into FastAPI endpoints.
  - Handle data processing and any backend operations.
  - Include necessary imports for FastAPI and any other Python libraries.
  - Ensure the FastAPI server can serve the React frontend (if applicable, or simply provide API endpoints).

- React package.json:
  - Include standard dependencies for a React project (e.g., react, react-dom, react-scripts or vite, axios for API calls).
  - Define a basic "start" script.

- FastAPI requirements.txt:
  - List all Python dependencies required for the FastAPI application, derived from the original Streamlit requirements.txt and any new FastAPI-specific dependencies.

Streamlit code:
{{{streamlitCode}}}

Streamlit requirements.txt:
{{{requirementsTxt}}}

JSON output:`,
});

const streamlitToReactFastAPIFlow = ai.defineFlow(
  {
    name: 'streamlitToReactFastAPIFlow',
    inputSchema: StreamlitToReactFastAPIInputSchema,
    outputSchema: StreamlitToReactFastAPIOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);