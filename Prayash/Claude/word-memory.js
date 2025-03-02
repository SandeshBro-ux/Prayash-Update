// Word Memory Game
document.addEventListener('DOMContentLoaded', function() {
    console.log("Word Memory Game loaded");
    
    // Get the Word Memory game card in the game selection grid
    const wordMemoryGameCard = document.querySelector('.game-card[data-game="word-memory"]');
    if (wordMemoryGameCard) {
        wordMemoryGameCard.addEventListener('click', initializeWordMemoryGame);
    }
    
    // Main initialization function
    function initializeWordMemoryGame() {
        console.log("Initializing Word Memory Game");
        
        // Show game area and hide other game containers
        const gameArea = document.getElementById('game-area');
        if (gameArea) {
            gameArea.classList.remove('hidden');
            
            // Hide all other game containers
            document.querySelectorAll('.game-container').forEach(container => {
                container.classList.add('hidden');
            });
        }
        
        // Get word memory container
        const wordMemoryContainer = document.getElementById('word-memory-container');
        if (!wordMemoryContainer) {
            console.error("Word Memory container not found!");
            return;
        }
        
        // Show word memory container
        wordMemoryContainer.classList.remove('hidden');
        
        // Set game title in the main game header
        const titleElement = document.getElementById('current-game-title');
        if (titleElement) {
            titleElement.textContent = 'Word Memory Game';
        }
        
        // Initialize and start the game
        const wordMemoryGame = new WordMemoryGame(wordMemoryContainer);
        wordMemoryGame.start();
        
        // Store reference for game controller
        if (typeof gameController !== 'undefined') {
            gameController.currentGame = wordMemoryGame;
        }
    }
    
    class WordMemoryGame {
        constructor(container) {
            // Game container reference
            this.container = container;
            
            // Game elements
            this.wordDisplay = container.querySelector('#word-display');
            this.wordInputArea = container.querySelector('#word-input-area');
            this.wordInput = container.querySelector('#word-input');
            this.wordSubmit = container.querySelector('#word-submit');
            this.statusDisplay = container.querySelector('#word-memory-status');
            this.scoreElement = document.getElementById('game-score');
            
            // Game state
            this.score = 0;
            this.round = 1;
            this.gameActive = false;
            this.currentPhase = 'memorize'; // memorize, recall
            this.memorizationTime = 3000; // time in ms to memorize words - 3 seconds
            
            // Original background music volume (to restore later)
            this.originalMusicVolume = typeof gameController !== 'undefined' && gameController.backgroundMusic ? 
                gameController.backgroundMusic.volume : 1.0;
            
            // Round configuration - words per round
            this.roundWords = {
                1: 3,  // Round 1: 3 words
                2: 5,  // Round 2: 5 words
                3: 6,  // Round 3: 6 words
                4: 6,  // Round 4: 6 words 
                5: 7,  // Round 5: 7 words
                6: 7,  // Round 6: 7 words
                7: 8,  // Round 7: 8 words
                8: 8,  // Round 8: 8 words
                9: 9,  // Round 9: 9 words
                10: 10 // Final Round: all 10 words
            };
            
            // Current word count based on round
            this.wordCount = this.roundWords[this.round] || 3;
            
            // Word set - using scientific words as provided
            this.wordPool = [
                'Hypothesis',
                'Phenomenon',
                'Evidence',
                'Experimentation',
                'Formulation',
                'Observation',
                'Verification',
                'Prediction',
                'Analysis',
                'Conclusion'
            ];
            
            this.currentWords = [];
            this.enteredWords = [];
            this.countdownTimer = null;
            this.countdownSeconds = this.memorizationTime / 1000; // Set initial countdown to 3 seconds
            this.timerAnimation = null;
            
            // Create timer and round display elements
            this.createTimerElements();
            this.createRoundDisplay();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Create audio elements for sounds
            this.gameStartSound = new Audio('sounds/Memory-game start.wav');
            this.winSound = this.createWinSound(); // Create win sound
            
            // Sound enabled flag
            this.soundEnabled = true;
        }

        createTimerElements() {
            // Create the timer container
            this.timerContainer = document.createElement('div');
            this.timerContainer.className = 'timer-container';
            
            // Create the circular timer
            this.circularTimer = document.createElement('div');
            this.circularTimer.className = 'circular-timer';
            
            // Create the timer progress
            this.timerProgress = document.createElement('div');
            this.timerProgress.className = 'timer-progress';
            
            // Create the timer text
            this.timerText = document.createElement('div');
            this.timerText.className = 'timer-text';
            this.timerText.textContent = '3'; // Set initial value to 3 instead of defaulting to 0
            
            // Create sound toggle button
            this.soundToggle = document.createElement('button');
            this.soundToggle.className = 'sound-toggle';
            this.soundToggle.innerHTML = '<i class="fas fa-volume-up"></i>';
            this.soundToggle.addEventListener('click', () => this.toggleSound());
            
            // Assemble timer elements
            this.circularTimer.appendChild(this.timerProgress);
            this.circularTimer.appendChild(this.timerText);
            this.timerContainer.appendChild(this.circularTimer);
            this.timerContainer.appendChild(this.soundToggle);
            
            // Add timer to the game container
            this.container.appendChild(this.timerContainer);
            
            // Hide the timer initially - will be shown when countdown starts
            this.timerContainer.classList.add('hidden');
        }
        
        toggleSound() {
            this.soundEnabled = !this.soundEnabled;
            
            // Update icon
            if (this.soundEnabled) {
                this.soundToggle.innerHTML = '<i class="fas fa-volume-up"></i>';
            } else {
                this.soundToggle.innerHTML = '<i class="fas fa-volume-mute"></i>';
            }
        }
        
        createRoundDisplay() {
            // Create round display container
            this.roundDisplay = document.createElement('div');
            this.roundDisplay.className = 'round-display';
            this.updateRoundDisplay();
            
            // Add round display to the game container
            this.container.appendChild(this.roundDisplay);
        }
        
        updateRoundDisplay() {
            // Update the round display text
            if (this.roundDisplay) {
                const isFinalRound = this.round === 10;
                this.roundDisplay.textContent = isFinalRound ? 'FINAL ROUND' : `Round ${this.round}`;
                
                // Add special styling for final round
                if (isFinalRound) {
                    this.roundDisplay.style.backgroundColor = '#dc2626';
                    this.roundDisplay.style.fontWeight = 'bold';
                } else {
                    this.roundDisplay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
                }
            }
        }
        
        setupEventListeners() {
            // Word submission event
            this.wordSubmit.addEventListener('click', () => this.checkAnswers());
            
            // Also submit on Enter key
            this.wordInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.checkAnswers();
                }
            });
            
            // Reset game when clicking restart button
            document.getElementById('restart-game').addEventListener('click', () => {
                this.reset();
            });
        }
        
        start() {
            this.gameActive = true;
            this.score = 0;
            this.round = 1;
            this.wordCount = this.roundWords[this.round] || 3;
            this.updateScore();
            this.updateRoundDisplay();
            this.startLevel();
        }
        
        startLevel() {
            this.currentPhase = 'memorize';
            this.currentWords = this.getRandomWords(this.wordCount);
            
            // Clear the input field
            this.wordInput.value = '';
            
            // Make sure timer shows correct number before displaying
            this.timerText.textContent = (this.memorizationTime / 1000).toString();
            
            // Display words in a formatted way
            this.displayWords();
            
            // Show timer container but don't start countdown yet
            this.timerContainer.classList.remove('hidden');
            this.countdownSeconds = this.memorizationTime / 1000;
            
            // First update status display
            this.updateStatusDisplay(`Memorize these words!`);
            
            // Get the status text box and memory area section
            const memoryArea = this.container.querySelector('.word-memory-area');
            
            // Add spotlight effect - keep status text normal while dimming the rest
            if (this.statusDisplay && memoryArea) {
                // Create an overlay element for the entire viewport
                const overlay = document.createElement('div');
                overlay.className = 'dimming-overlay';
                
                // Create a clone of the status display to show above the overlay
                const statusClone = this.statusDisplay.cloneNode(true);
                statusClone.classList.add('super-spotlight');
                statusClone.id = 'spotlight-clone';
                
                // Position the clone correctly before adding it to the DOM
                const wordDisplay = this.wordDisplay;
                const wordDisplayRect = wordDisplay.getBoundingClientRect();
                
                statusClone.style.position = 'fixed';
                statusClone.style.left = `${wordDisplayRect.left + (wordDisplayRect.width / 2)}px`;
                statusClone.style.top = `${wordDisplayRect.bottom + 20}px`;
                statusClone.style.zIndex = '10000';
                statusClone.style.margin = '0';
                
                // Now add elements to the DOM
                document.body.appendChild(overlay);
                document.body.appendChild(statusClone);
                
                // Fine-tune position after adding to DOM
                setTimeout(() => this.positionStatusClone(statusClone), 10);
                
                // Add window resize listener to keep the clone properly positioned
                const resizeHandler = () => this.positionStatusClone(statusClone);
                window.addEventListener('resize', resizeHandler);
                
                // Hide the original status display during the spotlight effect
                this.statusDisplay.style.visibility = 'hidden';
                
                // Start the timer only after spotlight effect finishes
                setTimeout(() => {
                    // Remove the overlay and clone
                    document.body.removeChild(overlay);
                    document.body.removeChild(statusClone);
                    
                    // Show the original status display again
                    this.statusDisplay.style.visibility = 'visible';
                    
                    // Remove the resize listener
                    window.removeEventListener('resize', resizeHandler);
                    
                    // Only start the countdown after the spotlight effect
                    this.startCountdown();
                }, 2000);
            } else {
                // Fallback if elements not found
                this.startCountdown();
            }
            
            // Hide the input area during memorization phase
            this.wordInputArea.classList.add('hidden');
        }
        
        // Helper function to position the status clone below the word display
        positionStatusClone(statusClone) {
            // Get the word display element
            const wordDisplay = this.wordDisplay;
            const wordDisplayRect = wordDisplay.getBoundingClientRect();
            
            // Position the clone below the word display
            statusClone.style.position = 'fixed';
            statusClone.style.left = `${wordDisplayRect.left + (wordDisplayRect.width / 2)}px`; // Center point of word display
            statusClone.style.top = `${wordDisplayRect.bottom + 20}px`; // 20px gap below the words
            statusClone.style.zIndex = '10000';
            statusClone.style.margin = '0'; // Reset any margins
        }
        
        getRandomWords(count) {
            // Shuffle the word pool
            const shuffled = [...this.wordPool].sort(() => 0.5 - Math.random());
            
            // Return the first 'count' elements
            return shuffled.slice(0, count);
        }
        
        displayWords() {
            // Clear the display first
            this.wordDisplay.innerHTML = '';
            
            // Create a word list container
            const wordList = document.createElement('div');
            wordList.className = 'word-list';
            
            // Add each word as an animated element
            this.currentWords.forEach((word, index) => {
                const wordElement = document.createElement('div');
                wordElement.className = 'word-item';
                wordElement.textContent = word;
                wordElement.style.animationDelay = `${index * 0.2}s`;
                wordList.appendChild(wordElement);
            });
            
            this.wordDisplay.appendChild(wordList);
        }
        
        startCountdown() {
            // Clear any existing timer
            if (this.countdownTimer) {
                clearInterval(this.countdownTimer);
            }
            
            // Cancel any existing animation
            if (this.timerAnimation) {
                this.timerAnimation.cancel();
            }
            
            // Set the starting time
            this.countdownSeconds = this.memorizationTime / 1000;
            
            // Play initial tick sound
            if (this.soundEnabled) {
                this.playTickSound(this.countdownSeconds);
            }
            
            // Lower background music volume during countdown
            this.lowerBackgroundMusic();
            
            // Set initial timer text
            this.timerText.textContent = this.countdownSeconds;
            
            // Reset timer style
            this.timerProgress.style.transform = 'scale(1)';
            this.timerProgress.style.backgroundColor = '#3b82f6';
            
            // Start the timer animation
            const duration = this.memorizationTime;
            
            this.timerAnimation = this.timerProgress.animate(
                [
                    { transform: 'scale(1)' },
                    { transform: 'scale(0)' }
                ],
                {
                    duration: duration,
                    easing: 'linear',
                    fill: 'forwards'
                }
            );
            
            // Change color as time runs out
            this.timerAnimation.onfinish = () => {
                this.switchToRecallPhase();
                // Restore background music volume
                this.restoreBackgroundMusic();
            };
            
            // Start the interval for text update
            this.countdownTimer = setInterval(() => {
                this.countdownSeconds--;
                
                // Update the timer text
                this.timerText.textContent = this.countdownSeconds;
                
                // Play appropriate tick sound for the countdown
                if (this.soundEnabled && this.countdownSeconds > 0) {
                    this.playTickSound(this.countdownSeconds);
                }
                
                // Change color as time runs low
                if (this.countdownSeconds <= 1) {
                    this.timerProgress.style.backgroundColor = '#dc2626';
                } else if (this.countdownSeconds <= 2) {
                    this.timerProgress.style.backgroundColor = '#f59e0b';
                }
                
                // If time is up
                if (this.countdownSeconds <= 0) {
                    clearInterval(this.countdownTimer);
                    this.timerText.textContent = '0';
                }
            }, 1000);
        }
        
        lowerBackgroundMusic() {
            // Lower background music volume if gameController exists
            if (typeof gameController !== 'undefined' && gameController.backgroundMusic) {
                // Store original volume to restore later
                this.originalMusicVolume = gameController.backgroundMusic.volume;
                // Lower volume by 70-80% (keeping 20-30% of original)
                gameController.backgroundMusic.volume = this.originalMusicVolume * 0.25;
            }
        }
        
        restoreBackgroundMusic() {
            // Restore background music volume if gameController exists
            if (typeof gameController !== 'undefined' && gameController.backgroundMusic) {
                // Restore to original volume (100%)
                gameController.backgroundMusic.volume = this.originalMusicVolume;
            }
        }
        
        switchToRecallPhase() {
            this.currentPhase = 'recall';
            
            // Play game start sound after timer ends
            if (this.soundEnabled) {
                this.gameStartSound.play();
            }
            
            // Hide the timer
            this.timerContainer.classList.add('hidden');
            
            // Clear the word display
            this.wordDisplay.innerHTML = '';
            
            // Show the input area
            this.wordInputArea.classList.remove('hidden');
            
            // Update status
            this.updateStatusDisplay('Now type all the words you remember (separated by commas)');
            
            // Focus on the input field
            this.wordInput.focus();
        }
        
        checkAnswers() {
            if (this.currentPhase !== 'recall') return;
            
            // Get the entered words, clean and normalize them
            const enteredText = this.wordInput.value.trim();
            if (!enteredText) {
                this.updateStatusDisplay('Please enter the words you remember');
                return;
            }
            
            // Split by commas and normalize each word
            this.enteredWords = enteredText.split(',')
                .map(word => word.trim().toLowerCase())
                .filter(word => word.length > 0);
            
            // Convert current words to lowercase for comparison
            const currentWordsLower = this.currentWords.map(word => word.toLowerCase());
            
            // Count correct and incorrect answers
            let correctCount = 0;
            let incorrectCount = 0;
            let duplicateCount = 0;
            
            // Track which words have been correctly identified
            const foundWords = new Set();
            
            // Check each entered word
            this.enteredWords.forEach(word => {
                if (foundWords.has(word)) {
                    duplicateCount++;
                } else if (currentWordsLower.includes(word)) {
                    correctCount++;
                    foundWords.add(word);
                } else {
                    incorrectCount++;
                }
            });
            
            // Calculate score
            const possiblePoints = this.currentWords.length;
            const earnedPoints = Math.max(0, correctCount - incorrectCount);
            
            // Update the score
            this.updateScore(earnedPoints);
            
            // Display results
            this.displayResults(correctCount, incorrectCount, duplicateCount, foundWords, currentWordsLower);
        }
        
        displayResults(correctCount, incorrectCount, duplicateCount, foundWords, currentWordsLower) {
            // Create results container
            const resultsContainer = document.createElement('div');
            resultsContainer.className = 'word-results';
            
            // Add header
            const header = document.createElement('h3');
            header.textContent = 'Results:';
            resultsContainer.appendChild(header);
            
            // Create lists for correct, missed, and incorrect words
            const correctList = document.createElement('div');
            correctList.className = 'correct-words';
            correctList.innerHTML = '<h4>Correct Words:</h4>';
            
            const missedList = document.createElement('div');
            missedList.className = 'missed-words';
            missedList.innerHTML = '<h4>Missed Words:</h4>';
            
            const incorrectList = document.createElement('div');
            incorrectList.className = 'incorrect-words';
            incorrectList.innerHTML = '<h4>Incorrect Words:</h4>';
            
            // Fill the lists
            currentWordsLower.forEach(word => {
                const wordElement = document.createElement('div');
                wordElement.className = foundWords.has(word) ? 'word-correct' : 'word-missed';
                wordElement.textContent = this.wordPool.find(w => w.toLowerCase() === word);
                
                if (foundWords.has(word)) {
                    correctList.appendChild(wordElement);
                } else {
                    missedList.appendChild(wordElement);
                }
            });
            
            // Add incorrect words
            this.enteredWords.forEach(word => {
                if (!currentWordsLower.includes(word)) {
                    const wordElement = document.createElement('div');
                    wordElement.className = 'word-incorrect';
                    wordElement.textContent = word;
                    incorrectList.appendChild(wordElement);
                }
            });
            
            // Add the lists to the results container
            resultsContainer.appendChild(correctList);
            resultsContainer.appendChild(missedList);
            
            if (incorrectCount > 0) {
                resultsContainer.appendChild(incorrectList);
            }
            
            // Play win sound if all words are remembered correctly
            if (correctCount === this.currentWords.length && this.soundEnabled) {
                this.winSound.play();
            }
            
            // Add summary stats
            const statsContainer = document.createElement('div');
            statsContainer.className = 'results-stats';
            statsContainer.innerHTML = `
                <p>You remembered ${correctCount} out of ${this.currentWords.length} words.</p>
                <p>Incorrect words: ${incorrectCount}</p>
                ${duplicateCount > 0 ? `<p>Duplicate entries: ${duplicateCount}</p>` : ''}
            `;
            resultsContainer.appendChild(statsContainer);
            
            // Add next round or retry buttons
            const buttonsContainer = document.createElement('div');
            buttonsContainer.className = 'results-buttons';
            
            // Modified passing threshold logic:
            // In rounds 1-3: require 100% accuracy (all words correct)
            // In rounds 4-7: require 80% accuracy
            // In rounds 8-10: require 60% accuracy
            let passingThreshold;
            
            if (this.round <= 3) {
                passingThreshold = this.currentWords.length; // 100% required for first 3 rounds
            } else if (this.round <= 7) {
                passingThreshold = Math.ceil(this.currentWords.length * 0.8); // 80% for middle rounds
            } else {
                passingThreshold = Math.ceil(this.currentWords.length * 0.6); // 60% for final rounds
            }
            
            if (correctCount >= passingThreshold) {
                // They remembered enough words, they can advance
                if (this.round < 10) {
                    const nextButton = document.createElement('button');
                    nextButton.textContent = 'Next Round';
                    nextButton.className = 'next-level-btn';
                    nextButton.addEventListener('click', () => this.nextRound());
                    buttonsContainer.appendChild(nextButton);
                } else {
                    // Game completed - final round passed
                    const completeButton = document.createElement('button');
                    completeButton.textContent = 'Game Completed!';
                    completeButton.className = 'next-level-btn';
                    completeButton.addEventListener('click', () => this.gameCompleted());
                    buttonsContainer.appendChild(completeButton);
                }
            } else {
                // They didn't remember enough words, they need to retry
                const retryButton = document.createElement('button');
                retryButton.textContent = `Retry Round ${this.round}`;
                retryButton.className = 'retry-level-btn';
                retryButton.addEventListener('click', () => this.startLevel());
                buttonsContainer.appendChild(retryButton);
            }
            
            resultsContainer.appendChild(buttonsContainer);
            
            // Clear and add to the word display
            this.wordDisplay.innerHTML = '';
            this.wordDisplay.appendChild(resultsContainer);
            
            // Hide the input area
            this.wordInputArea.classList.add('hidden');
        }
        
        nextRound() {
            // Move to the next round
            this.round++;
            
            // Clear the input field
            this.wordInput.value = '';
            
            // Update the word count based on round
            this.wordCount = this.roundWords[this.round] || 10;
            
            // Update the round display
            this.updateRoundDisplay();
            
            // Start the next level
            this.startLevel();
        }
        
        gameCompleted() {
            // Restore background music volume if needed
            this.restoreBackgroundMusic();
            
            // Display a victory screen or return to game selection
            const gameArea = document.getElementById('game-area');
            const gamesSection = document.getElementById('games-section');
            
            if (gameArea && gamesSection) {
                gameArea.classList.add('hidden');
                gamesSection.classList.remove('hidden');
            }
            
            // Show result modal if available
            const resultModal = document.getElementById('result-modal');
            if (resultModal) {
                const resultTitle = document.getElementById('result-title');
                const resultMessage = document.getElementById('result-message');
                
                if (resultTitle && resultMessage) {
                    resultTitle.textContent = 'Congratulations!';
                    resultMessage.textContent = `You completed all rounds with a score of ${this.score}!`;
                }
                
                resultModal.classList.remove('hidden');
            }
        }
        
        updateScore(points = 0) {
            this.score += points;
            
            // Update the score display
            if (this.scoreElement) {
                this.scoreElement.textContent = `Score: ${this.score}`;
            }
        }
        
        updateStatusDisplay(message) {
            if (this.statusDisplay) {
                // Update text content
                this.statusDisplay.textContent = message;
                
                // If this is the memorize message, make it more prominent
                if (message === 'Memorize these words!') {
                    this.statusDisplay.style.fontSize = '1.6rem';
                    this.statusDisplay.style.fontWeight = 'bold';
                    this.statusDisplay.style.padding = '14px 22px';
                    this.statusDisplay.style.backgroundColor = 'rgba(37, 99, 235, 0.5)';
                    this.statusDisplay.style.border = '2px solid rgba(255, 255, 255, 0.4)';
                    this.statusDisplay.style.borderRadius = '10px';
                    this.statusDisplay.style.boxShadow = '0 0 10px rgba(255, 255, 255, 0.2)';
                } else {
                    // Reset to default styles for other messages
                    this.statusDisplay.style.fontSize = '1.3rem';
                    this.statusDisplay.style.fontWeight = 'normal';
                    this.statusDisplay.style.padding = '10px 15px';
                    this.statusDisplay.style.backgroundColor = 'rgba(37, 99, 235, 0.2)';
                    this.statusDisplay.style.border = 'none';
                    this.statusDisplay.style.borderRadius = '5px';
                    this.statusDisplay.style.boxShadow = 'none';
                }
            }
        }
        
        reset() {
            // Clear any timers
            if (this.countdownTimer) {
                clearInterval(this.countdownTimer);
            }
            
            // Clear any animations
            if (this.timerAnimation) {
                this.timerAnimation.cancel();
            }
            
            // Restore background music volume if needed
            this.restoreBackgroundMusic();
            
            // Reset game state
            this.score = 0;
            this.round = 1;
            this.wordCount = this.roundWords[this.round] || 3;
            this.memorizationTime = 3000;
            
            // Reset UI
            this.wordInput.value = '';
            
            // Update score and round display
            this.updateScore();
            this.updateRoundDisplay();
            
            // Start fresh
            this.startLevel();
        }
        
        createComplexSound(notes) {
            return {
                play: () => {
                    try {
                        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                        
                        notes.forEach(note => {
                            // Create oscillator and gain node for each note
                            const oscillator = audioContext.createOscillator();
                            const gainNode = audioContext.createGain();
                            
                            // Set up oscillator
                            oscillator.type = note.type;
                            oscillator.frequency.value = note.frequency;
                            oscillator.connect(gainNode);
                            gainNode.connect(audioContext.destination);
                            
                            // Set gain envelope
                            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
                            
                            // Determine start and end times
                            const startTime = audioContext.currentTime + (note.delay || 0);
                            
                            // Create a shorter, more percussive envelope for square/tuk sounds
                            if (note.type === 'square' || note.type === 'triangle') {
                                // Very fast attack for percussive sounds
                                gainNode.gain.linearRampToValueAtTime(0.7, startTime + 0.005);
                                // Quick decay for "tuk" sound
                                gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + note.duration);
                            } else {
                                // Normal ADSR for other sounds
                                gainNode.gain.linearRampToValueAtTime(0.8, startTime + 0.01); // Quick attack
                                gainNode.gain.linearRampToValueAtTime(0.5, startTime + 0.05); // Short decay to sustain
                                gainNode.gain.setValueAtTime(0.5, startTime + note.duration - 0.05); // Sustain
                                gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + note.duration); // Release
                            }
                            
                            // Start and stop the oscillator
                            oscillator.start(startTime);
                            oscillator.stop(startTime + note.duration + 0.05); // Add a bit of time for the release
                        });
                    } catch (e) {
                        console.error('Error playing complex sound:', e);
                    }
                }
            };
        }
        
        // Method to play the appropriate tick sound based on the countdown value
        playTickSound(secondsLeft) {
            try {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                // Set frequency based on countdown value
                if (secondsLeft === 3) {
                    oscillator.frequency.value = 440; // A note
                } else if (secondsLeft === 2) {
                    oscillator.frequency.value = 494; // B note
                } else if (secondsLeft === 1) {
                    oscillator.frequency.value = 523; // C note
                }
                
                oscillator.type = 'sine';
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                gainNode.gain.setValueAtTime(1, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);
                
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.1);
            } catch (e) {
                console.error('Error playing tick sound:', e);
            }
        }

        // Create a winning sound
        createWinSound() {
            return {
                play: () => {
                    try {
                        // Temporarily reduce background music volume by 10%
                        if (typeof gameController !== 'undefined' && gameController.backgroundMusic) {
                            // Store current volume
                            const currentVolume = gameController.backgroundMusic.volume;
                            // Reduce by 10%
                            gameController.backgroundMusic.volume = currentVolume * 0.9;
                            
                            // Set timeout to restore volume after sound effect finishes (1 second)
                            setTimeout(() => {
                                gameController.backgroundMusic.volume = currentVolume;
                            }, 1000);
                        }
                        
                        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                        
                        // Create a short "You Won" sound (about 1 second)
                        // First note (higher pitch)
                        const oscillator1 = audioContext.createOscillator();
                        const gainNode1 = audioContext.createGain();
                        oscillator1.type = 'triangle';
                        oscillator1.frequency.value = 800; // Higher pitch
                        oscillator1.connect(gainNode1);
                        gainNode1.connect(audioContext.destination);
                        
                        // Second note (lower pitch)
                        const oscillator2 = audioContext.createOscillator();
                        const gainNode2 = audioContext.createGain();
                        oscillator2.type = 'triangle';
                        oscillator2.frequency.value = 600; // Lower pitch
                        oscillator2.connect(gainNode2);
                        gainNode2.connect(audioContext.destination);
                        
                        // Third note (highest pitch)
                        const oscillator3 = audioContext.createOscillator();
                        const gainNode3 = audioContext.createGain();
                        oscillator3.type = 'triangle';
                        oscillator3.frequency.value = 1000; // Highest pitch
                        oscillator3.connect(gainNode3);
                        gainNode3.connect(audioContext.destination);
                        
                        // Set up timing for the win sound pattern
                        const currentTime = audioContext.currentTime;
                        
                        // First note
                        gainNode1.gain.setValueAtTime(0, currentTime);
                        gainNode1.gain.linearRampToValueAtTime(0.5, currentTime + 0.05);
                        gainNode1.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.3);
                        oscillator1.start(currentTime);
                        oscillator1.stop(currentTime + 0.3);
                        
                        // Second note
                        gainNode2.gain.setValueAtTime(0, currentTime + 0.3);
                        gainNode2.gain.linearRampToValueAtTime(0.5, currentTime + 0.35);
                        gainNode2.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.6);
                        oscillator2.start(currentTime + 0.3);
                        oscillator2.stop(currentTime + 0.6);
                        
                        // Third note (victorious finale)
                        gainNode3.gain.setValueAtTime(0, currentTime + 0.6);
                        gainNode3.gain.linearRampToValueAtTime(0.7, currentTime + 0.65);
                        gainNode3.gain.exponentialRampToValueAtTime(0.001, currentTime + 1.0);
                        oscillator3.start(currentTime + 0.6);
                        oscillator3.stop(currentTime + 1.0);
                        
                    } catch (e) {
                        console.error('Error playing win sound:', e);
                    }
                }
            };
        }
    }
});

// Add the script tag to the HTML document
const scriptTag = document.createElement('script');
scriptTag.src = 'word-memory.js';
document.body.appendChild(scriptTag); 