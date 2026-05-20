// Bob's Great Refactoring Quest - Interactive Fiction Game Engine

class AdventureGame {
    constructor() {
        this.currentScene = 'start';
        this.inventory = [];
        this.gameState = {
            health: 100,
            sanity: 100,
            bobMood: 'cheerful', // cheerful, concerned, passive-aggressive
            playerClass: null
        };
        this.storyTextElement = document.getElementById('story-text');
        this.choicesElement = document.getElementById('choices');
        this.locationElement = document.getElementById('location');
        this.inventoryElement = document.getElementById('inventory');
        this.restartBtn = document.getElementById('restart-btn');
        this.timerElement = document.getElementById('timer-display');
        this.leaderboardBtn = document.getElementById('leaderboard-btn');
        
        // Timer properties
        this.startTime = null;
        this.timerInterval = null;
        this.completionTime = null;
        this.nameSubmitted = false; // Track if name was already submitted this session
        
        this.init();
    }
    
    init() {
        this.restartBtn.addEventListener('click', () => this.restart());
        this.leaderboardBtn.addEventListener('click', () => this.showLeaderboard());
        this.startTimer();
        this.loadScene(this.currentScene);
        this.setupLeaderboardModal();
    }
    
    startTimer() {
        this.startTime = Date.now();
        this.timerInterval = setInterval(() => this.updateTimer(), 1000);
    }
    
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        if (this.startTime) {
            this.completionTime = Date.now() - this.startTime;
        }
    }
    
    updateTimer() {
        if (!this.startTime) return;
        const elapsed = Date.now() - this.startTime;
        const minutes = Math.floor(elapsed / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);
        this.timerElement.textContent = `⏱️ Time: ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    
    formatTime(milliseconds) {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    
    saveToLeaderboard(endingType) {
        if (!this.completionTime) return;
        
        // If name already submitted this session, just show leaderboard
        if (this.nameSubmitted) {
            this.showLeaderboard();
            return;
        }
        
        // Show custom name entry modal
        const nameModal = document.getElementById('name-entry-modal');
        const nameInput = document.getElementById('gaming-name-input');
        const submitBtn = document.getElementById('submit-name-btn');
        const skipBtn = document.getElementById('skip-name-btn');
        
        nameInput.value = '';
        nameModal.style.display = 'block';
        nameInput.focus();
        
        // Handle submit
        const handleSubmit = () => {
            const playerName = nameInput.value.trim();
            
            if (playerName !== '') {
                const entry = {
                    name: playerName,
                    time: this.completionTime,
                    ending: endingType,
                    class: this.gameState.playerClass || 'Unknown',
                    date: new Date().toISOString()
                };
                
                let leaderboard = JSON.parse(localStorage.getItem('bobLeaderboard') || '[]');
                leaderboard.push(entry);
                leaderboard.sort((a, b) => a.time - b.time);
                leaderboard = leaderboard.slice(0, 10); // Keep top 10
                
                localStorage.setItem('bobLeaderboard', JSON.stringify(leaderboard));
            }
            
            this.nameSubmitted = true; // Mark as submitted
            nameModal.style.display = 'none';
            this.showLeaderboard();
            cleanup();
        };
        
        // Handle skip
        const handleSkip = () => {
            this.nameSubmitted = true; // Mark as submitted (skipped)
            nameModal.style.display = 'none';
            this.showLeaderboard();
            cleanup();
        };
        
        // Handle Enter key
        const handleKeyPress = (e) => {
            if (e.key === 'Enter') {
                handleSubmit();
            }
        };
        
        // Cleanup function to remove event listeners
        const cleanup = () => {
            submitBtn.removeEventListener('click', handleSubmit);
            skipBtn.removeEventListener('click', handleSkip);
            nameInput.removeEventListener('keypress', handleKeyPress);
        };
        
        submitBtn.addEventListener('click', handleSubmit);
        skipBtn.addEventListener('click', handleSkip);
        nameInput.addEventListener('keypress', handleKeyPress);
    }
    
    showLeaderboard() {
        const modal = document.getElementById('leaderboard-modal');
        const leaderboardList = document.getElementById('leaderboard-list');
        const leaderboard = JSON.parse(localStorage.getItem('bobLeaderboard') || '[]');
        
        if (leaderboard.length === 0) {
            leaderboardList.innerHTML = '<p class="no-entries">No entries yet. Be the first to complete the quest!</p>';
        } else {
            leaderboardList.innerHTML = leaderboard.map((entry, index) => `
                <div class="leaderboard-entry ${index < 3 ? 'top-three' : ''}">
                    <span class="rank">${index + 1}</span>
                    <span class="player-name">${entry.name}</span>
                    <span class="completion-time">${this.formatTime(entry.time)}</span>
                </div>
            `).join('');
        }
        
        modal.style.display = 'block';
    }
    
    setupLeaderboardModal() {
        const modal = document.getElementById('leaderboard-modal');
        const closeBtn = document.querySelector('.close');
        
        closeBtn.onclick = () => modal.style.display = 'none';
        
        window.onclick = (event) => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        };
    }
    
    loadScene(sceneId) {
        const scene = this.scenes[sceneId];
        if (!scene) {
            console.error(`Scene ${sceneId} not found`);
            return;
        }
        
        this.currentScene = sceneId;
        
        // Check if this is a victory scene and handle leaderboard
        if (sceneId.startsWith('victory_')) {
            this.stopTimer();
            const endingTypes = {
                'victory_debug': 'Debug Master',
                'victory_duck': 'Rubber Duck Champion',
                'victory_brute': 'Brute Force Victor',
                'victory_team': 'Team Victory'
            };
            const endingType = endingTypes[sceneId] || 'Victory';
            
            // Automatically show name entry modal for victory
            setTimeout(() => this.saveToLeaderboard(endingType), 500);
        }
        
        // Check if this is a game over scene (non-victory ending)
        if (sceneId === 'struggle_ending') {
            this.stopTimer();
        }
        
        this.displayStory(scene.text);
        this.displayChoices(scene.choices);
        this.updateLocation(scene.location);
        this.updateInventory();
        
        // Display time for game over screen
        if (sceneId === 'struggle_ending') {
            setTimeout(() => {
                const timeElement = document.getElementById('game-over-time');
                if (timeElement && this.completionTime) {
                    timeElement.innerHTML = `<strong>Your Time: ${this.formatTime(this.completionTime)}</strong>`;
                }
            }, 100);
        }
        
        // Display time for victory screen
        if (sceneId.startsWith('victory_')) {
            setTimeout(() => {
                const timeElement = document.getElementById('victory-time');
                if (timeElement && this.completionTime) {
                    timeElement.innerHTML = `<strong>Your Time: ${this.formatTime(this.completionTime)}</strong>`;
                }
            }, 100);
        }
    }
    
    displayStory(text) {
        this.storyTextElement.innerHTML = '';
        
        // Handle text as array or string
        const textArray = Array.isArray(text) ? text : [text];
        
        textArray.forEach(paragraph => {
            const p = document.createElement('p');
            p.innerHTML = paragraph;
            this.storyTextElement.appendChild(p);
        });
        
        this.storyTextElement.scrollTop = 0;
        
        // Check if content is scrollable and add indicator
        setTimeout(() => {
            const isScrollable = this.storyTextElement.scrollHeight > this.storyTextElement.clientHeight;
            if (isScrollable) {
                this.storyTextElement.classList.add('has-scroll');
                
                // Auto-hide indicator after 3 seconds on mobile
                setTimeout(() => {
                    this.storyTextElement.classList.remove('has-scroll');
                }, 3000);
            } else {
                this.storyTextElement.classList.remove('has-scroll');
            }
            
            // Hide indicator when scrolled to bottom
            this.storyTextElement.addEventListener('scroll', () => {
                const isAtBottom = this.storyTextElement.scrollHeight - this.storyTextElement.scrollTop <= this.storyTextElement.clientHeight + 10;
                if (isAtBottom) {
                    this.storyTextElement.classList.remove('has-scroll');
                } else if (isScrollable) {
                    this.storyTextElement.classList.add('has-scroll');
                }
            });
        }, 100);
    }
    
    displayChoices(choices) {
        this.choicesElement.innerHTML = '';
        
        choices.forEach((choice, index) => {
            if (choice.condition && !this.checkCondition(choice.condition)) {
                return;
            }
            
            const button = document.createElement('button');
            button.className = 'choice-btn';
            button.textContent = `${index + 1}. ${choice.text}`;
            button.addEventListener('click', () => this.makeChoice(choice));
            this.choicesElement.appendChild(button);
        });
    }
    
    makeChoice(choice) {
        if (choice.action) {
            this.executeAction(choice.action);
        }
        
        if (choice.next) {
            this.loadScene(choice.next);
        }
    }
    
    executeAction(action) {
        if (action.addItem) {
            this.inventory.push(action.addItem);
        }
        if (action.removeItem) {
            const index = this.inventory.indexOf(action.removeItem);
            if (index > -1) {
                this.inventory.splice(index, 1);
            }
        }
        if (action.setState) {
            Object.assign(this.gameState, action.setState);
        }
        if (action.modifyHealth) {
            this.gameState.health = Math.max(0, Math.min(100, this.gameState.health + action.modifyHealth));
        }
        if (action.modifySanity) {
            this.gameState.sanity = Math.max(0, Math.min(100, this.gameState.sanity + action.modifySanity));
        }
    }
    
    checkCondition(condition) {
        if (condition.hasItem) {
            return this.inventory.includes(condition.hasItem);
        }
        if (condition.stateEquals) {
            return this.gameState[condition.stateEquals.key] === condition.stateEquals.value;
        }
        if (condition.minHealth) {
            return this.gameState.health >= condition.minHealth;
        }
        if (condition.minSanity) {
            return this.gameState.sanity >= condition.minSanity;
        }
        return true;
    }
    
    updateLocation(location) {
        this.locationElement.textContent = `Location: ${location}`;
    }
    
    updateInventory() {
        if (this.inventory.length === 0) {
            this.inventoryElement.textContent = 'Inventory: Empty';
        } else {
            this.inventoryElement.textContent = `Inventory: ${this.inventory.join(', ')}`;
        }
        
        // Update health/sanity display
        const healthDisplay = document.getElementById('health-display');
        if (healthDisplay) {
            healthDisplay.textContent = `Health: ${this.gameState.health} | Sanity: ${this.gameState.sanity}`;
        }
    }
    
    restart() {
        this.inventory = [];
        this.gameState = {
            health: 100,
            sanity: 100,
            bobMood: 'cheerful',
            playerClass: null
        };
        this.stopTimer();
        this.startTimer();
        this.completionTime = null;
        this.nameSubmitted = false; // Reset name submission flag
        this.loadScene('start');
    }
    
    // Game Story Scenes
    scenes = {
        start: {
            location: "System Boot",
            text: [
                "The screen flickers. Lines of code scroll past. Then... a cheerful figure materializes.",
                "<img src='https://ibm.biz/ibm-bob-app-icon' alt='Bob' class='bob-avatar'> <strong>BOB:</strong> \"Hi there! I'm Bob! Your friendly system guide!\"",
                "<img src='https://ibm.biz/ibm-bob-app-icon' alt='Bob' class='bob-avatar'> <strong>BOB:</strong> \"Things are... well, not great. The system is falling apart. The NullPointer King is corrupting everything!\"",
                "<img src='https://ibm.biz/ibm-bob-app-icon' alt='Bob' class='bob-avatar'> <strong>BOB:</strong> \"But don't worry! Together, we can fix this! What's your specialty?\""
            ],
            choices: [
                {
                    text: "Frontend Developer (UI/UX focus)",
                    action: { setState: { playerClass: 'frontend' }, addItem: 'React Toolkit' },
                    next: "class_selected_frontend"
                },
                {
                    text: "Backend Developer (Logic & APIs)",
                    action: { setState: { playerClass: 'backend' }, addItem: 'API Documentation' },
                    next: "class_selected_backend"
                },
                {
                    text: "DevOps Engineer (Infrastructure master)",
                    action: { setState: { playerClass: 'devops' }, addItem: 'Docker Container' },
                    next: "class_selected_devops"
                }
            ]
        },
        
        class_selected_frontend: {
            location: "System Boot",
            text: [
                "<img src='https://ibm.biz/ibm-bob-app-icon' alt='Bob' class='bob-avatar'> <strong>BOB:</strong> \"Excellent! A frontend wizard! We need someone who can make sense of this UI chaos!\"",
                "<img src='https://ibm.biz/ibm-bob-app-icon' alt='Bob' class='bob-avatar'> <strong>BOB:</strong> \"Your React Toolkit will come in handy. Now, let's meet the team!\""
            ],
            choices: [
                {
                    text: "Meet the team",
                    next: "meet_team"
                }
            ]
        },
        
        class_selected_backend: {
            location: "System Boot",
            text: [
                "<img src='https://ibm.biz/ibm-bob-app-icon' alt='Bob' class='bob-avatar'> <strong>BOB:</strong> \"Perfect! A backend engineer! Someone who speaks the language of servers and databases!\"",
                "<img src='https://ibm.biz/ibm-bob-app-icon' alt='Bob' class='bob-avatar'> <strong>BOB:</strong> \"Your API Documentation will be invaluable. Let's meet your teammates!\""
            ],
            choices: [
                {
                    text: "Meet the team",
                    next: "meet_team"
                }
            ]
        },
        
        class_selected_devops: {
            location: "System Boot",
            text: [
                "<img src='https://ibm.biz/ibm-bob-app-icon' alt='Bob' class='bob-avatar'> <strong>BOB:</strong> \"Wonderful! A DevOps mastermind! We need someone who can keep this infrastructure running!\"",
                "<img src='https://ibm.biz/ibm-bob-app-icon' alt='Bob' class='bob-avatar'> <strong>BOB:</strong> \"Your Docker Container will be crucial. Time to meet the crew!\""
            ],
            choices: [
                {
                    text: "Meet the team",
                    next: "meet_team"
                }
            ]
        },
        
        meet_team: {
            location: "Developer Hub",
            text: [
                "Three developers materialize around you:",
                "👩‍💻 <strong>PRIYA:</strong> \"Hey! Frontend specialist here. I can make anything look good... if it works.\"",
                "👨‍💻 <strong>MARCO:</strong> \"Backend engineer. I deal with the *real* problems. *Dramatically sighs*\"",
                "🧑‍💻 <strong>LIN:</strong> \"DevOps. I keep everything running. Usually.\"",
                "<img src='https://ibm.biz/ibm-bob-app-icon' alt='Bob' class='bob-avatar'> <strong>BOB:</strong> \"Great! Now, our first challenge: The Legacy Codebase. It's... massive. And poorly documented.\""
            ],
            choices: [
                {
                    text: "Let's tackle this together!",
                    next: "legacy_codebase"
                }
            ]
        },
        
        legacy_codebase: {
            location: "The Legacy Codebase",
            text: [
                "You arrive at a towering wall of code. It stretches infinitely in all directions.",
                "Comments are sparse. Variable names are cryptic. The last commit was 5 years ago.",
                "👨‍💻 <strong>MARCO:</strong> \"This is... beautiful. In a horrifying way.\"",
                "<img src='https://ibm.biz/ibm-bob-app-icon' alt='Bob' class='bob-avatar'> <strong>BOB:</strong> \"So, what's your approach?\""
            ],
            choices: [
                {
                    text: "Dive straight into the code (brave but risky)",
                    action: { modifySanity: -20 },
                    next: "dive_in"
                },
                {
                    text: "Search for documentation first",
                    action: { addItem: 'Old Docs' },
                    next: "find_docs"
                },
                {
                    text: "Ask Bob for help",
                    action: { addItem: 'Debug Tool' },
                    next: "bob_help"
                },
                {
                    text: "Consult with the team",
                    next: "team_consult"
                }
            ]
        },
        
        dive_in: {
            location: "The Legacy Codebase - Deep Dive",
            text: [
                "You charge in bravely! The code is... dense.",
                "Nested loops within nested loops. Functions that call themselves recursively without base cases.",
                "Your sanity drops by 20 points.",
                "👩‍💻 <strong>PRIYA:</strong> \"Oof. That's rough. But you found something!\""
            ],
            choices: [
                {
                    text: "Continue exploring",
                    next: "spaghetti_encounter"
                }
            ]
        },
        
        find_docs: {
            location: "The Legacy Codebase - Archives",
            text: [
                "You discover ancient documentation buried in a forgotten /docs folder!",
                "It's outdated... but somewhat useful. You gain 'Old Docs'.",
                "🧑‍💻 <strong>LIN:</strong> \"Nice find! This might help us understand the architecture.\"",
                "<img src='https://ibm.biz/ibm-bob-app-icon' alt='Bob' class='bob-avatar'> <strong>BOB:</strong> \"See? Preparation pays off! 😊\""
            ],
            choices: [
                {
                    text: "Study the docs and proceed",
                    next: "spaghetti_encounter"
                }
            ]
        },
        
        bob_help: {
            location: "The Legacy Codebase - Debug Mode",
            text: [
                "<img src='https://ibm.biz/ibm-bob-app-icon' alt='Bob' class='bob-avatar'> <strong>BOB:</strong> \"Great idea! I LOVE helping! 😊\"",
                "Bob's interface glows. A hidden debug panel materializes.",
                "You gain 'Debug Tool' - this will be very useful!",
                "👨‍💻 <strong>MARCO:</strong> \"Whoa. Bob's more powerful than I thought.\""
            ],
            choices: [
                {
                    text: "Use the debug tool to explore",
                    next: "spaghetti_encounter"
                }
            ]
        },
        
        team_consult: {
            location: "The Legacy Codebase - Team Meeting",
            text: [
                "You gather the team for a quick strategy session.",
                "👩‍💻 <strong>PRIYA:</strong> \"I can handle the UI layer if we find it.\"",
                "👨‍💻 <strong>MARCO:</strong> \"I'll tackle the business logic. Probably.\"",
                "🧑‍💻 <strong>LIN:</strong> \"I'll check the infrastructure. Something's definitely wrong there.\"",
                "You gain 'Team Strategy' - collaboration bonus!"
            ],
            choices: [
                {
                    text: "Move forward as a team",
                    action: { addItem: 'Team Strategy' },
                    next: "spaghetti_encounter"
                }
            ]
        },
        
        spaghetti_encounter: {
            location: "The Spaghetti Function",
            text: [
                "🍝 You encounter the dreaded <strong>SPAGHETTI FUNCTION</strong>!",
                "It's 2000 lines long. No comments. Variables named 'x', 'xx', 'xxx'.",
                "It's constantly mutating global state.",
                "👨‍💻 <strong>MARCO:</strong> \"This... this is a crime against programming.\"",
                "<img src='https://ibm.biz/ibm-bob-app-icon' alt='Bob' class='bob-avatar'> <strong>BOB:</strong> \"What's your move?\""
            ],
            choices: [
                {
                    text: "Refactor carefully (requires skill)",
                    next: "refactor_attempt"
                },
                {
                    text: "Rewrite everything from scratch",
                    action: { modifySanity: -30 },
                    next: "rewrite_attempt"
                },
                {
                    text: "Use Debug Tool to analyze it",
                    condition: { hasItem: 'Debug Tool' },
                    next: "debug_analysis"
                },
                {
                    text: "Ignore it and move on (dangerous)",
                    action: { modifyHealth: -20 },
                    next: "ignore_spaghetti"
                }
            ]
        },
        
        refactor_attempt: {
            location: "The Spaghetti Function - Refactoring",
            text: [
                "You carefully begin refactoring...",
                "Extract method. Rename variables. Add comments.",
                "It's tedious but... it's working!",
                "✨ Success! You've cleaned up the code!",
                "You gain 'Refactored Module'!",
                "<img src='https://ibm.biz/ibm-bob-app-icon' alt='Bob' class='bob-avatar'> <strong>BOB:</strong> \"Excellent work! That's the spirit! 😊\""
            ],
            choices: [
                {
                    text: "Continue deeper into the system",
                    action: { addItem: 'Refactored Module' },
                    next: "merge_conflict"
                }
            ]
        },
        
        rewrite_attempt: {
            location: "The Spaghetti Function - Rewrite",
            text: [
                "Bold move! You delete everything and start fresh.",
                "The code is cleaner... but the system crashes temporarily!",
                "You lose 30 sanity points from the stress.",
                "👩‍💻 <strong>PRIYA:</strong> \"Brave... but maybe too brave?\"",
                "Eventually, you get it working. You gain 'Fresh Module'."
            ],
            choices: [
                {
                    text: "Recover and continue",
                    action: { addItem: 'Fresh Module' },
                    next: "merge_conflict"
                }
            ]
        },
        
        debug_analysis: {
            location: "The Spaghetti Function - Debug Mode",
            text: [
                "You activate Bob's Debug Tool!",
                "The code structure becomes visible. Dependencies light up.",
                "You can see exactly what's wrong!",
                "<img src='https://ibm.biz/ibm-bob-app-icon' alt='Bob' class='bob-avatar'> <strong>BOB:</strong> \"See? Tools make everything easier! 😊\"",
                "You quickly fix the issues. You gain 'Debugged Module'!"
            ],
            choices: [
                {
                    text: "Proceed with confidence",
                    action: { addItem: 'Debugged Module' },
                    next: "merge_conflict"
                }
            ]
        },
        
        ignore_spaghetti: {
            location: "The Spaghetti Function - Ignored",
            text: [
                "You decide to skip it. \"Not my problem,\" you think.",
                "The bug grows stronger in the shadows...",
                "You lose 20 health points as system errors cascade.",
                "🧑‍💻 <strong>LIN:</strong> \"Uh... that might come back to haunt us.\"",
                "<img src='https://ibm.biz/ibm-bob-app-icon' alt='Bob' class='bob-avatar'> <strong>BOB:</strong> \"Well... let's keep moving! 😅\""
            ],
            choices: [
                {
                    text: "Continue anyway",
                    next: "merge_conflict"
                }
            ]
        },
        
        merge_conflict: {
            location: "Git Repository - Conflict Zone",
            text: [
                "⚠️ <strong>MERGE CONFLICT DETECTED</strong>",
                "Someone (probably Marco) pushed to main without pulling first.",
                "<<<<<<< HEAD",
                "Your changes conflict with the remote branch.",
                "👨‍💻 <strong>MARCO:</strong> \"That... might have been me. Sorry.\"",
                "<img src='https://ibm.biz/ibm-bob-app-icon' alt='Bob' class='bob-avatar'> <strong>BOB:</strong> \"No worries! We can resolve this!\""
            ],
            choices: [
                {
                    text: "Carefully resolve conflicts manually",
                    next: "resolve_conflict_success"
                },
                {
                    text: "Accept all incoming changes (risky)",
                    action: { modifyHealth: -15 },
                    next: "resolve_conflict_risky"
                },
                {
                    text: "Use Team Strategy to coordinate",
                    condition: { hasItem: 'Team Strategy' },
                    next: "resolve_conflict_team"
                }
            ]
        },
        
        resolve_conflict_success: {
            location: "Git Repository - Resolved",
            text: [
                "You carefully review each conflict.",
                "Line by line, you merge the changes intelligently.",
                "✅ Conflict resolved! Code pushed successfully!",
                "👩‍💻 <strong>PRIYA:</strong> \"Nice! That's how it's done.\"",
                "You gain 'Merge Master' achievement!"
            ],
            choices: [
                {
                    text: "Push forward",
                    action: { addItem: 'Merge Master' },
                    next: "stackoverflow_scroll"
                }
            ]
        },
        
        resolve_conflict_risky: {
            location: "Git Repository - Risky Resolution",
            text: [
                "You accept all incoming changes without reviewing.",
                "The merge completes... but you've lost some of your work.",
                "You lose 15 health points from the frustration.",
                "👨‍💻 <strong>MARCO:</strong> \"Ouch. That's gonna need fixing later.\"",
                "<img src='https://ibm.biz/ibm-bob-app-icon' alt='Bob' class='bob-avatar'> <strong>BOB:</strong> \"Well... at least it's merged! 😬\""
            ],
            choices: [
                {
                    text: "Deal with it later",
                    next: "stackoverflow_scroll"
                }
            ]
        },
        
        resolve_conflict_team: {
            location: "Git Repository - Team Resolution",
            text: [
                "You call a team sync!",
                "Everyone reviews their changes together.",
                "The conflict is resolved perfectly with everyone's input.",
                "🧑‍💻 <strong>LIN:</strong> \"This is how it should be done!\"",
                "<img src='https://ibm.biz/ibm-bob-app-icon' alt='Bob' class='bob-avatar'> <strong>BOB:</strong> \"Teamwork makes the dream work! 😊\"",
                "You gain 'Perfect Merge' achievement!"
            ],
            choices: [
                {
                    text: "Continue as a united team",
                    action: { addItem: 'Perfect Merge' },
                    next: "stackoverflow_scroll"
                }
            ]
        },
        
        stackoverflow_scroll: {
            location: "The Ancient Library",
            text: [
                "You discover a mystical artifact: The Stack Overflow Scroll! 📜",
                "It contains answers to questions you haven't even asked yet.",
                "But beware - some answers are from 2009 and no longer work.",
                "<img src='https://ibm.biz/ibm-bob-app-icon' alt='Bob' class='bob-avatar'> <strong>BOB:</strong> \"This could be useful! Or... confusing. Probably both!\""
            ],
            choices: [
                {
                    text: "Take the Stack Overflow Scroll",
                    action: { addItem: 'Stack Overflow Scroll' },
                    next: "rubber_duck"
                },
                {
                    text: "Leave it (you're confident enough)",
                    next: "rubber_duck"
                }
            ]
        },
        
        rubber_duck: {
            location: "The Debug Shrine",
            text: [
                "You find a sacred rubber duck! 🦆",
                "Legend says explaining your code to it reveals all bugs.",
                "👩‍💻 <strong>PRIYA:</strong> \"I never code without one!\"",
                "<img src='https://ibm.biz/ibm-bob-app-icon' alt='Bob' class='bob-avatar'> <strong>BOB:</strong> \"The ancient art of rubber duck debugging!\""
            ],
            choices: [
                {
                    text: "Take the Rubber Duck",
                    action: { addItem: 'Rubber Duck' },
                    next: "coffee_break"
                },
                {
                    text: "You don't need debugging help",
                    next: "coffee_break"
                }
            ]
        },
        
        coffee_break: {
            location: "The Break Room",
            text: [
                "☕ You find the legendary Coffee Machine!",
                "It dispenses infinite coffee (and restores sanity).",
                "👨‍💻 <strong>MARCO:</strong> \"Finally! Something that makes sense!\"",
                "<img src='https://ibm.biz/ibm-bob-app-icon' alt='Bob' class='bob-avatar'> <strong>BOB:</strong> \"Take a moment to recharge!\""
            ],
            choices: [
                {
                    text: "Drink coffee (restore 30 sanity)",
                    action: { modifySanity: 30 },
                    next: "approach_core"
                },
                {
                    text: "Skip it and push forward",
                    next: "approach_core"
                }
            ]
        },
        
        approach_core: {
            location: "Core System Entrance",
            text: [
                "You approach the CORE SYSTEM.",
                "The air crackles with corrupted data.",
                "<img src='https://ibm.biz/ibm-bob-app-icon' alt='Bob' class='bob-avatar'> <strong>BOB:</strong> \"This is it. The NullPointer King is beyond this door.\"",
                "<img src='https://ibm.biz/ibm-bob-app-icon' alt='Bob' class='bob-avatar'> <strong>BOB:</strong> \"Are you ready?\"",
                "The team gathers around you, ready for the final challenge."
            ],
            choices: [
                {
                    text: "We're ready. Let's do this!",
                    next: "final_boss"
                },
                {
                    text: "Wait, let me prepare more",
                    next: "final_preparation"
                }
            ]
        },
        
        final_preparation: {
            location: "Core System Entrance",
            text: [
                "You take a moment to prepare.",
                "Check your inventory. Review your tools.",
                "👩‍💻 <strong>PRIYA:</strong> \"Smart. Let's make sure we're ready.\"",
                "<img src='https://ibm.biz/ibm-bob-app-icon' alt='Bob' class='bob-avatar'> <strong>BOB:</strong> \"Take your time! 😊\""
            ],
            choices: [
                {
                    text: "Now I'm ready!",
                    next: "final_boss"
                }
            ]
        },
        
        final_boss: {
            location: "Core System - Throne Room",
            text: [
                "👑 The NullPointer King materializes!",
                "\"You dare access uninitialized memory?\"",
                "\"Your references are WEAK! Your pointers are NULL!\"",
                "The system trembles. Errors cascade everywhere.",
                "<img src='https://ibm.biz/ibm-bob-app-icon' alt='Bob' class='bob-avatar'> <strong>BOB:</strong> \"Stay calm! Use what you've learned!\""
            ],
            choices: [
                {
                    text: "Use Debug Tool to identify the flaw",
                    condition: { hasItem: 'Debug Tool' },
                    next: "victory_debug"
                },
                {
                    text: "Use Rubber Duck to explain the problem",
                    condition: { hasItem: 'Rubber Duck' },
                    next: "victory_duck"
                },
                {
                    text: "Brute force with high health",
                    condition: { minHealth: 60 },
                    next: "victory_brute"
                },
                {
                    text: "Team coordination attack",
                    condition: { hasItem: 'Team Strategy' },
                    next: "victory_team"
                },
                {
                    text: "Try to fight anyway",
                    next: "struggle_ending"
                }
            ]
        },
        
        victory_debug: {
            location: "Core System - Victory",
            text: [
                "<h2 style='font-size: 1.5em; color: #00ff88; text-align: center; margin-bottom: 15px; text-shadow: 0 0 10px rgba(0, 255, 136, 0.5);'>🎉 VICTORY: Debug Master! 🎉</h2>",
                "<span id='victory-time'></span>",
                "You activate Bob's Debug Tool!",
                "The NullPointer King's code becomes visible.",
                "You identify the flaw: an uninitialized pointer in the constructor!",
                "You patch it with a single line of code.",
                "✨ The King dissolves into properly managed memory!",
                "<img src='https://ibm.biz/ibm-bob-app-icon' alt='Bob' class='bob-avatar'> <strong>BOB:</strong> \"You did it! The system is saved! 😊\"",
                "You won by using Bob's Debug Tool to identify and fix the NullPointer King's core flaw. Your technical expertise and the right tools led you to victory!"
            ],
            choices: []
        },
        
        victory_duck: {
            location: "Core System - Victory",
            text: [
                "<h2 style='font-size: 1.5em; color: #00ff88; text-align: center; margin-bottom: 15px; text-shadow: 0 0 10px rgba(0, 255, 136, 0.5);'>🎉 VICTORY: Rubber Duck Debugging Champion! 🎉</h2>",
                "<span id='victory-time'></span>",
                "You pull out the Rubber Duck! 🦆",
                "You begin explaining the system architecture to it.",
                "As you talk, the solution becomes clear!",
                "The NullPointer King's weakness: he's just a memory leak!",
                "You implement proper garbage collection.",
                "✨ The King is cleaned up by the garbage collector!",
                "<img src='https://ibm.biz/ibm-bob-app-icon' alt='Bob' class='bob-avatar'> <strong>BOB:</strong> \"The duck method never fails! 😊\"",
                "You won by using the ancient art of Rubber Duck Debugging! By explaining the problem out loud, you discovered the solution yourself."
            ],
            choices: []
        },
        
        victory_brute: {
            location: "Core System - Victory",
            text: [
                "<h2 style='font-size: 1.5em; color: #00ff88; text-align: center; margin-bottom: 15px; text-shadow: 0 0 10px rgba(0, 255, 136, 0.5);'>🎉 VICTORY: Brute Force Victor! 🎉</h2>",
                "<span id='victory-time'></span>",
                "You're in good shape! Time for a direct approach!",
                "You brute-force a solution, trying every possible fix.",
                "It's exhausting, but your high health carries you through!",
                "Eventually, you find the right combination.",
                "⚔️ The NullPointer King crashes with a segmentation fault!",
                "<img src='https://ibm.biz/ibm-bob-app-icon' alt='Bob' class='bob-avatar'> <strong>BOB:</strong> \"Not elegant, but effective! 😊\"",
                "You won through sheer determination and high health! Your resilience allowed you to try every solution until you found the right one."
            ],
            choices: []
        },
        
        victory_team: {
            location: "Core System - Victory",
            text: [
                "<h2 style='font-size: 1.5em; color: #00ff88; text-align: center; margin-bottom: 15px; text-shadow: 0 0 10px rgba(0, 255, 136, 0.5);'>🎉 VICTORY: Team Victory! 🎉</h2>",
                "<span id='victory-time'></span>",
                "You signal the team! Everyone springs into action!",
                "👩‍💻 <strong>PRIYA:</strong> \"I'll handle the UI layer!\"",
                "👨‍💻 <strong>MARCO:</strong> \"I've got the backend logic!\"",
                "🧑‍💻 <strong>LIN:</strong> \"Infrastructure is mine!\"",
                "Together, you systematically dismantle the King's code!",
                "✨ The NullPointer King is refactored into oblivion!",
                "<img src='https://ibm.biz/ibm-bob-app-icon' alt='Bob' class='bob-avatar'> <strong>BOB:</strong> \"THAT'S teamwork! I'm so proud! 😊\"",
                "You won through the power of teamwork! By coordinating with your team and using everyone's strengths, you achieved a perfect victory."
            ],
            choices: []
        },
        
        struggle_ending: {
            location: "Core System - Struggle",
            text: [
                "<h1 style='font-size: 2.5em; color: #ff3366; text-align: center; margin-bottom: 20px; text-shadow: 0 0 10px rgba(255, 51, 102, 0.5);'>💀 GAME OVER 💀</h1>",
                "<span id='game-over-time'></span>",
                "You fight valiantly, but you're not quite prepared enough.",
                "The NullPointer King's attacks are relentless.",
                "System errors cascade. Memory leaks everywhere.",
                "The system crashes... but not completely.",
                "<img src='https://ibm.biz/ibm-bob-app-icon' alt='Bob' class='bob-avatar'> <strong>BOB:</strong> \"Don't worry! We can try again! 😊\"",
                "<img src='https://ibm.biz/ibm-bob-app-icon' alt='Bob' class='bob-avatar'> <strong>BOB:</strong> \"Maybe gather more tools next time?\"",
                "You didn't have the right tools or preparation to defeat the NullPointer King. Try collecting items like the Debug Tool, Rubber Duck, or Team Strategy, and maintain your health to unlock victory paths!"
            ],
            choices: []
        }
    };
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new AdventureGame();
});

// Made with Bob
