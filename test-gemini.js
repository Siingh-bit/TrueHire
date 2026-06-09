import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';

async function test() {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Create a dummy PDF file buffer (just the signature)
    const pdfBuffer = Buffer.from('%PDF-1.4\n%EOF\n');
    
    const prompt = "What is this file?";
    const pdfPart = {
      inlineData: {
        data: pdfBuffer.toString("base64"),
        mimeType: "application/pdf"
      },
    };

    console.log("Calling model...");
    const result = await model.generateContent([prompt, pdfPart]);
    console.log("Success:", result.response.text());
  } catch (err) {
    console.error("Error:", err.message);
  }
}
test();
