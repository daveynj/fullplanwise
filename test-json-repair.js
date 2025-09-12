// Test script for comprehensive JSON repair logic

// Simulate a malformed JSON response that might come from Gemini
const malformedJsonSample = `{
  "title": "Travel Experiences: Sharing Adventure Stories",
  "sections": [
    {
      "type": "warmup",
      "title": "Travel Memories",
      "questions": [
        "What was your most memorable travel experience?",
        "How do you usually plan your trips?" // Missing comma here
        "What type of accommodation do you prefer when traveling?",
      ]
    },
    {
      "type": "vocabulary",
      "title": "Travel Vocabulary"
      "words": [  // Missing comma after title
        {
          "term": "adventure",
          "definition": "An exciting or unusual experience"
          "example": "Our hiking adventure in the mountains was unforgettable." // Missing comma
        }
      ]
    }
  ]
}`;

// Test basic JSON cleanup
function basicJsonCleanup(content) {
  return content
    // Remove BOM and other invisible characters
    .replace(/^\uFEFF/, '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    // Remove JavaScript-style comments (// comments)
    .replace(/\/\/.*$/gm, '')
    // Remove C-style comments (/* comments */)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    // Fix line breaks and normalize whitespace
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Remove trailing whitespace from lines
    .split('\n').map(line => line.trimEnd()).join('\n')
    // Remove empty lines that may have been created by comment removal
    .split('\n').filter(line => line.trim().length > 0).join('\n')
    // Normalize multiple spaces
    .replace(/[ \t]+/g, ' ');
}

// Test structural fixes
function fixStructuralIssues(content) {
  return content
    // Fix trailing commas
    .replace(/,(\s*[}\]])/g, '$1')
    // Fix missing commas between array elements
    .replace(/(\]|\})\s*(\[|\{)/g, '$1,$2')
    // Fix missing commas between object properties
    .replace(/("\s*:\s*"[^"]*")\s*(")/g, '$1,$2')
    .replace(/("\s*:\s*\d+)\s*(")/g, '$1,$2')
    .replace(/("\s*:\s*true|false)\s*(")/g, '$1,$2')
    .replace(/("\s*:\s*null)\s*(")/g, '$1,$2')
    // Fix double commas
    .replace(/,\s*,/g, ',')
    // Fix comma before closing brackets
    .replace(/,(\s*[\}\]])/g, '$1');
}

// Test comprehensive repair
function comprehensiveJsonRepair(content) {
  let repairedContent = content;
  
  console.log('Step 1: Basic cleanup');
  repairedContent = basicJsonCleanup(repairedContent);
  
  console.log('Step 2: Fixing structural issues');
  repairedContent = fixStructuralIssues(repairedContent);
  
  // Additional fixes for missing commas between properties
  console.log('Step 3: Advanced pattern fixes');
  repairedContent = repairedContent
    // Fix missing commas after object values followed by quotes
    .replace(/(".*?")\s+(".*?":\s*)/g, '$1, $2')
    // Fix missing commas after string values
    .replace(/(".*?")\s*(\n\s*".*?":\s*)/g, '$1,$2')
    // Fix missing commas in arrays
    .replace(/("\s*)\s*(\n\s*".*?")/g, '$1,$2');
  
  return repairedContent;
}

// Test the repair logic
console.log('=== Testing JSON Repair Logic ===');
console.log('\nOriginal malformed JSON:');
console.log(malformedJsonSample);

console.log('\n=== Starting Repair Process ===');
const repairedJson = comprehensiveJsonRepair(malformedJsonSample);

console.log('\nRepaired JSON:');
console.log(repairedJson);

console.log('\n=== Testing JSON.parse() ===');
try {
  const parsed = JSON.parse(repairedJson);
  console.log('✅ SUCCESS: JSON parsed successfully!');
  console.log('Parsed object keys:', Object.keys(parsed));
  console.log('Number of sections:', parsed.sections ? parsed.sections.length : 0);
} catch (error) {
  console.log('❌ FAILED: JSON parsing failed:', error.message);
  console.log('Error at position:', error.message.match(/position (\d+)/)?.[1]);
  
  // Show context around error
  if (error.message.includes('position')) {
    const pos = parseInt(error.message.match(/position (\d+)/)?.[1]);
    if (pos) {
      console.log('Context around error:');
      console.log(repairedJson.substring(Math.max(0, pos - 50), pos + 50));
    }
  }
}

console.log('\n=== Test Complete ===');