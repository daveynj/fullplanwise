import { grammarAnalyzer } from './server/services/grammar-analyzer';

// Real lesson content from the logs
const realLessonContent = `
Natural access control is all about making it clear how people should enter and exit a space. Imagine walking up to a building. If there's a well-lit path leading to a welcoming entrance, you're more likely to follow it. On the other hand, if the area is cluttered with overgrown bushes or poorly marked paths, you might feel confused—or even hesitant to proceed. By carefully planning elements like fencing, gates, and signage, designers can create intuitive routes that discourage wandering into restricted areas.

One powerful tool in natural access control is landscaping. Strategically placed trees, shrubs, and flower beds don't just beautify an area—they also shape how people interact with it. For instance, low hedges along a sidewalk can subtly direct pedestrians toward the main entrance, while tall, dense bushes near windows could provide cover for potential intruders. Visibility plays a crucial role here; open spaces with clear sightlines make it easier for both residents and passersby to spot anything unusual.

Another aspect of natural access control involves creating effective circulation patterns. Think about how people move through a shopping mall. Wide, inviting corridors encourage smooth traffic flow, while narrow or poorly lit hallways might lead to congestion—or worse, unsafe situations. Similarly, in residential neighborhoods, streets designed with gentle curves rather than sharp turns can slow down drivers and improve safety for everyone.

Of course, not every solution needs to be high-tech or expensive. Sometimes, simple changes can have a big impact. Adding bollards at a parking lot entrance, painting crosswalks in bright colors, or installing benches near bus stops can all serve as subtle deterrents to improper behavior. These small adjustments help define boundaries and communicate expectations without feeling restrictive.

Ultimately, natural access control isn't just about preventing crime—it's about fostering a sense of order and belonging. When people understand how to navigate a space comfortably, they're more likely to feel connected to it. And when spaces are designed with care, they become places where communities thrive.
`;

// Test content with more obvious grammar patterns
const testContent = `
The criminals had broken into the house before the police arrived. The security system had been installed only last month, but it was not working properly. If the homeowner had checked the system regularly, the burglary would have been prevented. The windows were left open by the cleaning service, and the doors were unlocked by mistake. This house is more vulnerable than the neighboring houses because it has fewer security measures.
`;

console.log("=== Testing Real Lesson Content ===");
console.log(`Text length: ${realLessonContent.length} characters`);

try {
  const result1 = grammarAnalyzer.analyzeText(realLessonContent, "B2");
  
  if (result1) {
    console.log(`✅ Grammar pattern detected: ${result1.grammarType}`);
    console.log(`Title: ${result1.title}`);
    console.log(`Examples found: ${result1.examples.length}`);
    result1.examples.forEach((example, i) => {
      console.log(`  ${i+1}. "${example.sentence}"`);
      console.log(`     Highlighted: "${example.highlighted}"`);
    });
  } else {
    console.log("❌ No grammar patterns detected in real lesson content");
    console.log("This explains why you didn't get grammar data!");
  }
} catch (error) {
  console.error(`🚨 Error with real content: ${error.message}`);
}

console.log("\n=== Testing Content with Clear Grammar Patterns ===");

try {
  const result2 = grammarAnalyzer.analyzeText(testContent, "B2");
  
  if (result2) {
    console.log(`✅ Grammar pattern detected: ${result2.grammarType}`);
    console.log(`Title: ${result2.title}`);
    console.log(`Examples found: ${result2.examples.length}`);
    result2.examples.forEach((example, i) => {
      console.log(`  ${i+1}. "${example.sentence}"`);
      console.log(`     Highlighted: "${example.highlighted}"`);
    });
  } else {
    console.log("❌ No grammar patterns detected in test content");
  }
} catch (error) {
  console.error(`🚨 Error with test content: ${error.message}`);
}

// Test individual patterns to see if regex is working
console.log("\n=== Testing Individual Patterns ===");

const patterns = [
  { name: 'past_perfect', text: 'had broken' },
  { name: 'past_perfect', text: 'had been installed' },
  { name: 'conditionals', text: 'If the homeowner had checked the system regularly, the burglary would have been prevented' },
  { name: 'passive_voice', text: 'were left open' },
  { name: 'passive_voice', text: 'were unlocked' },
  { name: 'comparatives', text: 'more vulnerable than' }
];

patterns.forEach(pattern => {
  console.log(`Testing "${pattern.name}" with: "${pattern.text}"`);
  const result = grammarAnalyzer.analyzeText(pattern.text, "B2");
  console.log(result ? `✅ Detected: ${result.grammarType}` : '❌ Not detected');
}); 