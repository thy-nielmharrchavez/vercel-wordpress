#!/usr/bin/env node
/**
 * GitHub Issue to AI Prompt Converter
 * Converts issue details into a structured prompt for AI processing
 */

const GitHub = require('@octokit/rest');

async function getIssueDetails(owner, repo, issueNumber, token) {
  const octokit = new GitHub.Octokit({ auth: token });
  
  try {
    const { data: issue } = await octokit.issues.get({
      owner,
      repo,
      issue_number: issueNumber
    });
    
    return {
      number: issue.number,
      title: issue.title,
      body: issue.body,
      labels: issue.labels.map(l => l.name),
      assignee: issue.assignee?.login || 'unassigned',
      created_at: issue.created_at,
      updated_at: issue.updated_at
    };
  } catch (error) {
    console.error('Failed to fetch issue:', error.message);
    throw error;
  }
}

async function convertToPrompt(issueDetails) {
  const { number, title, body, labels } = issueDetails;
  
  let prompt = `# GitHub Issue #${number}: ${title}\n\n`;
  prompt += `## Labels\n${labels.map(l => `- ${l}`).join('\n')}\n\n`;
  prompt += `## Description\n${body}\n\n`;
  prompt += `## Instructions\n`;
  prompt += `1. Analyze the issue description and requirements\n`;
  prompt += `2. Extract the target URL or resource\n`;
  prompt += `3. Perform the requested action (crawl, convert, copy, etc.)\n`;
  prompt += `4. Create necessary files and commit changes\n`;
  prompt += `5. Ensure the code is production-ready\n`;
  
  return prompt;
}

async function main() {
  const token = process.env.GITHUB_TOKEN;
  const issueNumber = process.argv[2];
  const owner = process.argv[3];
  const repo = process.argv[4];
  
  if (!token || !issueNumber || !owner || !repo) {
    console.error('Usage: node issue-to-prompt.js <issue-number> <owner> <repo>');
    process.exit(1);
  }
  
  try {
    const issueDetails = await getIssueDetails(owner, repo, parseInt(issueNumber), token);
    const prompt = await convertToPrompt(issueDetails);
    
    console.log(prompt);
    
    // Also output as JSON for programmatic use
    console.log('\n\n---\nJSON OUTPUT:\n');
    console.log(JSON.stringify({
      issue: issueDetails,
      prompt: prompt
    }, null, 2));
  } catch (error) {
    process.exit(1);
  }
}

main();
