'use server';

/**
 * @fileOverview A flow to analyze a Python requirements.txt file and generate a package.json file.
 *
 * - generateDependencyList - A function that handles the dependency list generation.
 * - GenerateDependencyListInput - The input type for the generateDependencyList function.
 * - GenerateDependencyListOutput - The return type for the generateDependencyList function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateDependencyListInputSchema = z.object({
  requirementsFileContent: z
    .string()
    .describe('The content of the requirements.txt file.'),
});
export type GenerateDependencyListInput = z.infer<
  typeof GenerateDependencyListInputSchema
>;

const GenerateDependencyListOutputSchema = z.object({
  packageJsonContent: z
    .string()
    .describe('The content of the generated package.json file.'),
});
export type GenerateDependencyListOutput = z.infer<
  typeof GenerateDependencyListOutputSchema
>;

export async function generateDependencyList(
  input: GenerateDependencyListInput
): Promise<GenerateDependencyListOutput> {
  return generateDependencyListFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateDependencyListPrompt',
  input: {schema: GenerateDependencyListInputSchema},
  output: {schema: GenerateDependencyListOutputSchema},
  prompt: `You are a software engineer tasked with converting a Streamlit Python application to Next.js.
  You are provided with the content of the requirements.txt file from the Python application.
  Your task is to generate the content of a package.json file that includes the equivalent JavaScript dependencies for the Next.js application.

  Here is the content of the requirements.txt file:
  ------------------------------------
  {{{requirementsFileContent}}}
  ------------------------------------

  Ensure that the generated package.json file includes the necessary dependencies for React, Next.js, and any other libraries required by the converted code.
  The output should be a valid JSON format.
`,
});

const generateDependencyListFlow = ai.defineFlow(
  {
    name: 'generateDependencyListFlow',
    inputSchema: GenerateDependencyListInputSchema,
    outputSchema: GenerateDependencyListOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
