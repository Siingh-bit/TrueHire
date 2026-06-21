import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function analyzeCandidateMatch(candidateProfile, job) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is missing from environment variables');
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `
You are an expert technical recruiter and AI resume matcher. 
Evaluate how well the candidate's profile matches the job description.

Job Title: ${job.title}
Job Description: ${job.description}
Required Skills: ${job.required_skills}

Candidate Name: ${candidateProfile.full_name}
Headline: ${candidateProfile.headline || 'N/A'}
Summary: ${candidateProfile.summary || 'N/A'}
Experience Years: ${candidateProfile.total_experience_years}
Skills: ${JSON.stringify(candidateProfile.skills || [])}
Work Experience: ${JSON.stringify(candidateProfile.experience || [])}
Education: ${JSON.stringify(candidateProfile.education || [])}

Provide your analysis strictly as a JSON object with the following structure (NO MARKDOWN WRAPPERS):
{
  "match_score": <number between 0 and 100>,
  "summary_bullets": [
    "<bullet point 1 highlighting strength or weakness>",
    "<bullet point 2 highlighting strength or weakness>",
    "<bullet point 3 highlighting strength or weakness>"
  ]
}
`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    // Strip markdown if it returned code block
    const cleanedText = text.replace(/^```json/i, '').replace(/^```/, '').replace(/```$/, '').trim();
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error('AI Matching Error:', error);
    throw new Error('Failed to analyze candidate match with AI.');
  }
}
