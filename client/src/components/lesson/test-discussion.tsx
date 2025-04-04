import React, { useEffect, useState } from "react";
import { DiscussionSection } from "./discussion-section";
import { extractDiscussionQuestions } from "../../lib/utils";

export function TestDiscussion() {
  const [discussionSection, setDiscussionSection] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch the test data from the public directory
    fetch('/data/test_discussion.json')
      .then(response => response.json())
      .then(testData => {
        // Get the discussion section from the test data
        const section = testData.sections.find((s: any) => s.type === "discussion");
        if (section) {
          // Process the discussion section to match our expected format
          const processedSection = {
            ...section,
            questions: extractDiscussionQuestions(testData)
          };
          console.log("Processed discussion section:", processedSection);
          setDiscussionSection(processedSection);
        }
        setLoading(false);
      })
      .catch(error => {
        console.error("Error loading test data:", error);
        setLoading(false);
      });
  }, []);

  if (loading || !discussionSection) {
    return <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Loading Test Discussion...</h1>
      <div className="animate-pulse bg-gray-200 h-40 rounded-md"></div>
    </div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Test Discussion Component</h1>
      <DiscussionSection section={discussionSection} />
    </div>
  );
}