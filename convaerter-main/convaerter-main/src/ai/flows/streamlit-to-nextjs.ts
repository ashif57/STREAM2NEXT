'use server';

/**
 * @fileOverview Converts Streamlit code to Next.js code using GenAI.
 *
 * - streamlitToNextJS - A function that handles the conversion process.
 * - StreamlitToNextJSInput - The input type for the streamlitToNextJS function.
 * - StreamlitToNextJSOutput - The return type for the streamlitToNextJS function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const StreamlitToNextJSInputSchema = z.object({
  streamlitCode: z
    .string()
    .describe('The Streamlit (Python) code to convert.'),
});
export type StreamlitToNextJSInput = z.infer<typeof StreamlitToNextJSInputSchema>;

const StreamlitToNextJSOutputSchema = z.object({
  nextjsCode: z
    .string()
    .describe('The converted Next.js (TypeScript) code.'),
});
export type StreamlitToNextJSOutput = z.infer<typeof StreamlitToNextJSOutputSchema>;

export async function streamlitToNextJS(input: StreamlitToNextJSInput): Promise<StreamlitToNextJSOutput> {
  return streamlitToNextJSFlow(input);
}

const prompt = ai.definePrompt({
  name: 'streamlitToNextJSPrompt',
  input: {schema: StreamlitToNextJSInputSchema},
  output: {schema: StreamlitToNextJSOutputSchema},
  prompt: `Convert the following Streamlit (Python) code into a single Next.js (TypeScript) file.
- This project uses the Next.js App Router.
- The output should be a single 'page.tsx' file.
- All business logic and UI should be contained within this single file.
- Do not generate any other files or utility functions.
- Convert Streamlit UI elements to React components with Tailwind CSS for styling.
- Maintain the same app functionality.
- **Important**: If you use any React hooks like 'useState' or 'useEffect', you must add the "'use client';" directive at the very top of the file.

Streamlit code:
{{{streamlitCode}}}

Next.js code for 'src/app/page.tsx':`,
});

const streamlitToNextJSFlow = ai.defineFlow(
  {
    name: 'streamlitToNextJSFlow',
    inputSchema: StreamlitToNextJSInputSchema,
    outputSchema: StreamlitToNextJSOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
