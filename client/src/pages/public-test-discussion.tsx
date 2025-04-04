import React from "react";
import { TestDiscussion } from "@/components/lesson/test-discussion";

// This page is not protected by authentication
export default function PublicTestDiscussionPage() {
  return <TestDiscussion />;
}