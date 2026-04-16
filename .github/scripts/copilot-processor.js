#!/usr/bin/env node
/**
 * GitHub Copilot AI Processor
 * Processes GitHub issues and generates code changes using OpenAI API
 * 
 * Usage: node copilot-processor.js "Issue title and description"
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

if (!OPENAI_API_KEY) {
  console.error('❌ Error: OPENAI_API_KEY environment variable is required');
  process.exit(1);
}

const issueTask = process.argv[2] || process.env.ISSUE_TASK;

if (!issueTask) {
  console.error('❌ Error: Issue task is required');
  console.error('Usage: node copilot-processor.js "Issue description"');
  process.exit(1);
}

console.log('🤖 GitHub Copilot AI Processor Started');
console.log(`📋 Task: ${issueTask.substring(0, 100)}...`);

/**
 * Call OpenAI API to get AI suggestions
 */
async function getAISuggestions(task) {
  try {
    console.log('\n🔄 Calling OpenAI API for suggestions...');
    
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4-turbo',
        messages: [
          {
            role: 'system',
            content: `You are a GitHub Copilot AI assistant. Your job is to analyze GitHub issues and suggest code changes, new files, or modifications. 
            
            When responding:
            1. First, provide a brief analysis of the task
            2. Then suggest specific files to create/modify with JSON format
            3. For each file, provide the full content or changes needed
            4. Format file suggestions as JSON like: {"action": "create|modify", "path": "file/path.js", "content": "..."}
            5. Keep responses focused and practical
            6. Only suggest changes that are necessary and valid`
          },
          {
            role: 'user',
            content: `I have a GitHub issue that needs to be resolved. Please analyze it and suggest the code changes needed:\n\n${task}\n\nProvide your suggestions in a clear, actionable format.`
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const suggestion = response.data.choices[0].message.content;
    console.log('✅ AI suggestions received');
    return suggestion;
  } catch (error) {
    console.error('❌ OpenAI API Error:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Parse AI suggestions to extract files to create/modify
 */
function parseAISuggestions(suggestion) {
  const files = [];
  
  // Look for file paths in code blocks or JSON
  const codeBlockRegex = /```(?:javascript|js|json|typescript|ts|python|jsx|tsx|.*?)?\n([\s\S]*?)```/g;
  const jsonRegex = /\{"action":\s*"(create|modify)"[^}]*"path":\s*"([^"]+)"[^}]*"content":\s*"([\s\S]*?)"\}/g;
  
  let match;
  
  // Try JSON format first
  while ((match = jsonRegex.exec(suggestion)) !== null) {
    files.push({
      action: match[1],
      path: match[2],
      content: match[3].replace(/\\n/g, '\n')
    });
  }
  
  // If no JSON found, try extracting from code blocks
  if (files.length === 0) {
    console.log('\n📝 AI Suggestions:\n');
    console.log(suggestion);
    console.log('\n⚠️ Could not parse structured file changes from AI response');
    console.log('Note: AI suggestions are shown above for reference');
  }
  
  return files;
}

/**
 * Apply file changes from AI suggestions
 */
function applyChanges(files) {
  let appliedCount = 0;
  
  for (const file of files) {
    try {
      const filePath = path.join(process.cwd(), file.path);
      const dir = path.dirname(filePath);
      
      // Create directories if needed
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Created directory: ${dir}`);
      }
      
      if (file.action === 'create') {
        if (fs.existsSync(filePath)) {
          console.log(`⚠️ File already exists, skipping: ${file.path}`);
        } else {
          fs.writeFileSync(filePath, file.content, 'utf-8');
          console.log(`✅ Created file: ${file.path}`);
          appliedCount++;
        }
      } else if (file.action === 'modify') {
        // For modify, append or replace
        if (fs.existsSync(filePath)) {
          fs.writeFileSync(filePath, file.content, 'utf-8');
          console.log(`✅ Modified file: ${file.path}`);
          appliedCount++;
        } else {
          // If file doesn't exist, create it
          fs.writeFileSync(filePath, file.content, 'utf-8');
          console.log(`✅ Created file: ${file.path}`);
          appliedCount++;
        }
      }
    } catch (error) {
      console.error(`❌ Error applying changes to ${file.path}:`, error.message);
    }
  }
  
  return appliedCount;
}

/**
 * Create a summary of changes
 */
function createChangeSummary(suggestion, appliedCount) {
  const summary = {
    timestamp: new Date().toISOString(),
    aiAnalysis: suggestion.substring(0, 500),
    filesApplied: appliedCount,
    status: appliedCount > 0 ? 'success' : 'review-needed'
  };
  
  const summaryPath = path.join(process.cwd(), '.github', 'ai-processing-summary.json');
  const summaryDir = path.dirname(summaryPath);
  
  if (!fs.existsSync(summaryDir)) {
    fs.mkdirSync(summaryDir, { recursive: true });
  }
  
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), 'utf-8');
  return summary;
}

/**
 * Main execution
 */
async function main() {
  try {
    // Get AI suggestions for the issue
    const suggestion = await getAISuggestions(issueTask);
    
    // Parse the suggestions to extract file changes
    const files = parseAISuggestions(suggestion);
    
    console.log(`\n📊 Parsed ${files.length} file changes from AI suggestions`);
    
    // Apply the changes
    if (files.length > 0) {
      console.log('\n🔧 Applying changes...\n');
      const appliedCount = applyChanges(files);
      console.log(`\n✅ Applied ${appliedCount} changes`);
    } else {
      console.log('\n📌 No structured file changes found, but AI analysis is available');
    }
    
    // Create summary
    const summary = createChangeSummary(suggestion, files.length);
    
    console.log('\n🎉 Copilot AI Processing Complete!');
    console.log(`📊 Summary: ${summary.filesApplied} files affected`);
    console.log(`📁 Summary saved to: .github/ai-processing-summary.json`);
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error during AI processing:', error.message);
    process.exit(1);
  }
}

// Run the main function
main();
