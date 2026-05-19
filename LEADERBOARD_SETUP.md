# 🏆 Public Leaderboard Setup Guide

This guide explains how to set up a public, GitHub-hosted leaderboard for Bob's Great Refactoring Quest.

## 📋 Overview

The leaderboard can be hosted publicly using GitHub in two ways:

### Option 1: GitHub Pages + JSON File (Recommended)
- **Pros**: Simple, no backend needed, works immediately
- **Cons**: Requires manual approval of submissions (prevents cheating)
- **Best for**: Small to medium communities

### Option 2: GitHub Pages + GitHub Issues API
- **Pros**: Automatic submission, community moderation
- **Cons**: Slightly more complex setup
- **Best for**: Larger communities

---

## 🚀 Option 1: GitHub Pages + JSON File (Recommended)

### Step 1: Create GitHub Repository

1. Go to GitHub and create a new repository
2. Name it: `bobs-refactoring-quest`
3. Make it **Public**
4. Initialize with README

### Step 2: Upload Game Files

Upload these files to the repository:
- `index.html`
- `game.js`
- `styles.css`
- `README.md`
- `leaderboard.json` (create this - see below)

### Step 3: Create `leaderboard.json`

Create a file named `leaderboard.json` with this initial content:

```json
{
  "leaderboard": [],
  "lastUpdated": "2024-01-01T00:00:00Z"
}
```

### Step 4: Enable GitHub Pages

1. Go to repository **Settings**
2. Scroll to **Pages** section
3. Under **Source**, select `main` branch
4. Click **Save**
5. Your game will be live at: `https://[username].github.io/bobs-refactoring-quest/`

### Step 5: Update game.js for Public Leaderboard

Replace the leaderboard functions in `game.js` with:

```javascript
async fetchLeaderboard() {
    try {
        const response = await fetch('leaderboard.json');
        const data = await response.json();
        return data.leaderboard || [];
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        return [];
    }
}

async saveToLeaderboard(endingType) {
    if (!this.completionTime) return;
    
    const playerName = prompt('🎉 Victory! Enter your name for the leaderboard:', 'Anonymous') || 'Anonymous';
    
    const entry = {
        name: playerName,
        time: this.completionTime,
        ending: endingType,
        class: this.gameState.playerClass || 'Unknown',
        date: new Date().toISOString()
    };
    
    // Show submission instructions
    alert(`🏆 Congratulations ${playerName}!\n\nYour time: ${this.formatTime(this.completionTime)}\n\nTo submit to the public leaderboard:\n1. Go to the GitHub repository\n2. Create an Issue with title: "Leaderboard Submission"\n3. Include your stats:\n   - Name: ${playerName}\n   - Time: ${this.formatTime(this.completionTime)}\n   - Class: ${entry.class}\n   - Ending: ${endingType}\n\nThe maintainer will verify and add your score!`);
    
    // Save locally as backup
    let localLeaderboard = JSON.parse(localStorage.getItem('bobLeaderboard') || '[]');
    localLeaderboard.push(entry);
    localLeaderboard.sort((a, b) => a.time - b.time);
    localStorage.setItem('bobLeaderboard', JSON.stringify(localLeaderboard));
    
    this.showLeaderboard();
}

async showLeaderboard() {
    const modal = document.getElementById('leaderboard-modal');
    const leaderboardList = document.getElementById('leaderboard-list');
    
    // Fetch public leaderboard
    const publicLeaderboard = await this.fetchLeaderboard();
    
    // Get local leaderboard
    const localLeaderboard = JSON.parse(localStorage.getItem('bobLeaderboard') || '[]');
    
    // Combine and sort
    const allEntries = [...publicLeaderboard, ...localLeaderboard];
    const uniqueEntries = allEntries.filter((entry, index, self) =>
        index === self.findIndex((e) => e.name === entry.name && e.time === entry.time)
    );
    uniqueEntries.sort((a, b) => a.time - b.time);
    const leaderboard = uniqueEntries.slice(0, 10);
    
    if (leaderboard.length === 0) {
        leaderboardList.innerHTML = '<p class="no-entries">No entries yet. Be the first to complete the quest!</p>';
    } else {
        leaderboardList.innerHTML = `
            <div class="leaderboard-tabs">
                <button class="tab active">🌍 Global Top 10</button>
            </div>
        ` + leaderboard.map((entry, index) => `
            <div class="leaderboard-entry ${index < 3 ? 'top-three' : ''}">
                <span class="rank">${index + 1}</span>
                <span class="player-name">${entry.name}</span>
                <span class="player-class">${entry.class}</span>
                <span class="completion-time">${this.formatTime(entry.time)}</span>
                <span class="ending-type">${entry.ending}</span>
            </div>
        `).join('');
    }
    
    modal.style.display = 'block';
}
```

### Step 6: Accepting Submissions

When players submit via GitHub Issues:

1. Verify the submission looks legitimate
2. Add to `leaderboard.json`:

```json
{
  "leaderboard": [
    {
      "name": "PlayerName",
      "time": 180000,
      "ending": "Debug Master",
      "class": "Frontend",
      "date": "2024-01-15T10:30:00Z"
    }
  ],
  "lastUpdated": "2024-01-15T10:35:00Z"
}
```

3. Commit and push changes
4. Leaderboard updates automatically!

---

## 🔧 Option 2: GitHub Issues API (Advanced)

### Benefits
- Automatic submission
- Community can see all submissions
- Built-in moderation via GitHub

### Setup

1. Follow Steps 1-4 from Option 1
2. Create a GitHub Personal Access Token (PAT)
3. Use GitHub Issues API to submit scores
4. Fetch and display from Issues

### Implementation

Add to `game.js`:

```javascript
async submitToGitHub(entry) {
    const REPO_OWNER = 'your-username';
    const REPO_NAME = 'bobs-refactoring-quest';
    
    const issueBody = `
## 🏆 Leaderboard Submission

**Player:** ${entry.name}
**Time:** ${this.formatTime(entry.time)}
**Class:** ${entry.class}
**Ending:** ${entry.ending}
**Date:** ${entry.date}

---
*Submitted automatically from Bob's Great Refactoring Quest*
    `;
    
    try {
        const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/issues`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title: `Leaderboard: ${entry.name} - ${this.formatTime(entry.time)}`,
                body: issueBody,
                labels: ['leaderboard-submission']
            })
        });
        
        if (response.ok) {
            alert('🎉 Score submitted to public leaderboard!');
        }
    } catch (error) {
        console.error('Submission error:', error);
        alert('Could not submit to public leaderboard. Saved locally!');
    }
}
```

---

## 🎯 Recommended Approach

**For immediate setup:** Use Option 1 (JSON file)
- Simple and works right away
- You control what gets added
- Prevents cheating/spam

**For community growth:** Migrate to Option 2 later
- More automated
- Better for larger player base
- Community engagement through Issues

---

## 📊 Leaderboard Features

### Current Features
- ✅ Top 10 fastest times
- ✅ Player name, class, time, ending type
- ✅ Gold highlighting for top 3
- ✅ Local storage backup
- ✅ Responsive design

### Possible Enhancements
- 🔄 Auto-refresh leaderboard
- 📅 Weekly/Monthly categories
- 🏅 Achievement badges
- 📈 Statistics dashboard
- 🌍 Regional leaderboards
- 🎮 Different difficulty modes

---

## 🔒 Anti-Cheat Measures

### Current Protection
- Manual verification of submissions
- Time validation (must be reasonable)
- GitHub account required for submissions

### Additional Options
- Require video proof for top 10
- Hash validation of game state
- Server-side time verification
- Rate limiting on submissions

---

## 📝 Maintenance

### Regular Tasks
1. Review new submissions (Option 1)
2. Update `leaderboard.json`
3. Monitor for suspicious times
4. Backup leaderboard data

### Automation Ideas
- GitHub Actions to auto-update
- Bot to validate submissions
- Automated backups
- Weekly leaderboard tweets

---

## 🚀 Going Live Checklist

- [ ] Create GitHub repository
- [ ] Upload game files
- [ ] Create `leaderboard.json`
- [ ] Enable GitHub Pages
- [ ] Test game on GitHub Pages URL
- [ ] Update game.js with fetch functions
- [ ] Test leaderboard display
- [ ] Create submission guidelines
- [ ] Announce to community!

---

## 📞 Support

For questions about setup:
1. Check GitHub Pages documentation
2. Review GitHub API docs
3. Test locally before deploying
4. Use browser console for debugging

---

## 🎉 Launch!

Once set up, share your game:
- `https://[username].github.io/bobs-refactoring-quest/`
- Players can compete globally!
- Leaderboard updates in real-time!

**Good luck, and may the fastest coder win!** 🏆