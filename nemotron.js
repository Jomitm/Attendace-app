require('dotenv').config();
const fetch = require('node-fetch');

const API_KEY = process.env.NVIDIA_API_KEY;

async function callNemotron() {
  const response = await fetch("https://api.nvcf.nvidia.com/v2/nim/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "nvidia/nemotron-3-ultra-550b-a55b",
      messages: [
        { role: "system", content: "You are a helpful coding assistant." },
        { role: "user", content: "Write a SQL query for attendance logs grouped by date." }
      ]
    })
  });

  const data = await response.json();

  // Debug: print full response
  console.log("Full response:", data);

  // Correct output field
  if (data.output_text) {
    console.log("Nemotron says:", data.output_text);
  }
}

callNemotron();
