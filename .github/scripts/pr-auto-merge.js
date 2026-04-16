#!/usr/bin/env node
/**
 * PR Auto-Merge Checker
 * Monitor PR approvals and trigger merge when threshold is met
 */

const GitHub = require('@octokit/rest');

async function checkAndMergePR(token, owner, repo, prNumber, minApprovals = 2) {
  const octokit = new GitHub.Octokit({ auth: token });
  
  try {
    const { data: pr } = await octokit.pulls.get({
      owner,
      repo,
      pull_number: prNumber
    });
    
    const { data: reviews } = await octokit.pulls.listReviews({
      owner,
      repo,
      pull_number: prNumber
    });
    
    // Count approvals
    const approvals = reviews.filter(r => r.state === 'APPROVED').length;
    const blockers = reviews.filter(r => r.state === 'CHANGES_REQUESTED').length;
    
    console.log(`PR #${prNumber}:`);
    console.log(`  Approvals: ${approvals}/${minApprovals}`);
    console.log(`  Blocking reviews: ${blockers}`);
    console.log(`  Status: ${pr.mergeable ? 'Mergeable' : 'Not mergeable'}`);
    
    if (approvals >= minApprovals && blockers === 0 && pr.mergeable) {
      console.log('✅ Conditions met for merge');
      
      try {
        await octokit.pulls.merge({
          owner,
          repo,
          pull_number: prNumber,
          merge_method: 'squash'
        });
        console.log('✅ PR merged successfully');
        return true;
      } catch (error) {
        console.error('Failed to merge PR:', error.message);
        return false;
      }
    } else {
      console.log('⏳ Waiting for more approvals or resolution of blocking reviews');
      return false;
    }
  } catch (error) {
    console.error('Failed to check PR:', error.message);
    throw error;
  }
}

async function main() {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.argv[2];
  const repo = process.argv[3];
  const prNumber = parseInt(process.argv[4]);
  const minApprovals = parseInt(process.argv[5]) || 2;
  
  if (!token || !owner || !repo || !prNumber) {
    console.error('Usage: node pr-auto-merge.js <owner> <repo> <pr-number> [min-approvals]');
    process.exit(1);
  }
  
  try {
    const merged = await checkAndMergePR(token, owner, repo, prNumber, minApprovals);
    process.exit(merged ? 0 : 1);
  } catch (error) {
    process.exit(1);
  }
}

main();
