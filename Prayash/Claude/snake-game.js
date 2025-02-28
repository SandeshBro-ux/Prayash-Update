// Snake Game with 3-second instruction animation and auto-start
document.addEventListener('DOMContentLoaded', function() {
    console.clear();
    console.log("=== SNAKE GAME WITH ANIMATION AND AUTO-START ===");
    
    // Store original start game function
    const originalStartGame = gameController.startGame;
    
    // Override start game function
    gameController.startGame = function(gameType) {
        if (gameType === 'snake') {
            console.log("Starting Snake Game with instruction animation and auto-start");
            
            // Set up game area
            const gameArea = document.getElementById('game-area');
            gameArea.classList.remove('hidden');
            
            // Hide all game containers and show snake container
            document.querySelectorAll('.game-container').forEach(container => {
                container.classList.add('hidden');
            });
            document.getElementById('snake-container').classList.remove('hidden');
            
            // IMPORTANT: Hide the start screen so "Start Game" doesn't show again
            const startScreen = document.getElementById('snake-start-screen');
            if (startScreen) {
                startScreen.classList.add('hidden');
                startScreen.style.display = 'none';
            }
            
            // Show canvas with LARGER size
            const canvas = document.getElementById('snake-canvas');
            canvas.width = 500;  // Increased canvas width
            canvas.height = 500; // Increased canvas height
            canvas.classList.remove('hidden');
            canvas.style.display = 'block';
            
            // Additional styling to ensure proper display
            canvas.style.maxWidth = '100%';
            canvas.style.margin = '0 auto';
            canvas.style.boxShadow = '0 0 20px rgba(0, 0, 0, 0.3)';
            canvas.style.borderRadius = '8px';
            
            // Rest of your existing code...// Update game title
            document.getElementById('current-game-title').textContent = 'Snake Game';
            
            // Initialize the game immediately
            const ctx = canvas.getContext('2d');
            
            // Clear canvas with a background color
            ctx.fillStyle = '#1a1a2e';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Update cell size for larger canvas
            const cellSize = 25; // Larger cell size for the bigger canvas
            
            // Create and initialize SnakeGame object
            const SnakeGame = {
                canvas: canvas,
                ctx: ctx,
                gridSize: 20,
                cellSize: cellSize, // Using the larger cell size
                snake: [
                    {x: 10, y: 10},
                    {x: 9, y: 10},
                    {x: 8, y: 10}
                ],
                food: null,
                direction: '',
                nextDirection: '',
                score: 0,
                gameStarted: false,
                gameOver: false,
                gameInterval: null,
                // Add sounds object with munch sound
                sounds: {
                    munch: new Audio('https://www.myinstants.com/media/sounds/munch-sound-effect.mp3'),
                    burp: new Audio('./sounds/burp.mp3')
                },
                
                init: function() {
                    // Reset game state
                    this.snake = [
                        {x: 10, y: 10},
                        {x: 9, y: 10},
                        {x: 8, y: 10}
                    ];
                    // Initialize with a direction so it's not empty
                    this.direction = 'right';
                    this.nextDirection = 'right';
                    this.score = 0;
                    this.gameStarted = false;
                    this.gameOver = false;
                    
                    // Generate initial food
                    this.generateFood();
                    
                    // Set up event listeners
                    this.setupControls();
                    
                    // Clear any existing game loops
                    if (this.gameInterval) {
                        clearInterval(this.gameInterval);
                    }
                    
                    // Start game loop
                    this.gameInterval = setInterval(() => this.update(), 150);
                    
                    // Render initial state
                    this.draw();
                    
                    // Preload and prepare sounds for instant playback
                    this.sounds.munch.load();
                    this.sounds.burp.load();
                    // Set to low latency mode
                    this.sounds.munch.preload = 'auto';
                    this.sounds.burp.preload = 'auto';
                    
                    // Create a second copy of each sound for faster response
                    this.sounds.munch2 = new Audio('https://www.myinstants.com/media/sounds/munch-sound-effect.mp3');
                    this.sounds.burp2 = new Audio('./sounds/burp.mp3');
                    this.sounds.munch2.load();
                    this.sounds.burp2.load();
                    this.sounds.munch2.preload = 'auto';
                    this.sounds.burp2.preload = 'auto';
                    
                    console.log("Snake game initialized with sounds loaded");
                },
                
                setupControls: function() {
                    // Keyboard controls
                    document.addEventListener('keydown', (e) => {
                        // Prevent default browser scrolling for arrow keys
                        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 
                             'Space', ' ', 'KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) {
                            e.preventDefault();
                        }
                        
                        if (!this.gameStarted) {
                            // Start game on any direction key
                            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 's', 'a', 'd'].includes(e.key)) {
                                this.gameStarted = true;
                                
                                // Remove the overlay when a key is pressed
                                const overlay = document.getElementById('snake-animation-overlay');
                                if (overlay) {
                                    overlay.style.opacity = '0';
                                    overlay.style.transition = 'opacity 0.5s ease';
                                    
                                    setTimeout(() => {
                                        overlay.remove();
                                    }, 500);
                                }
                                
                                // Start the game
                                this.startGame();
                            }
                            return;
                        }
                        
                        switch (e.key) {
                            case 'ArrowUp':
                            case 'w':
                            case 'W':
                                if (this.direction !== 'down') this.nextDirection = 'up';
                                break;
                            case 'ArrowDown':
                            case 's':
                            case 'S':
                                if (this.direction !== 'up') this.nextDirection = 'down';
                                break;
                            case 'ArrowLeft':
                            case 'a':
                            case 'A':
                                if (this.direction !== 'right') this.nextDirection = 'left';
                                break;
                            case 'ArrowRight':
                            case 'd':
                            case 'D':
                                if (this.direction !== 'left') this.nextDirection = 'right';
                                break;
                        }
                    });
                    
                    // Touch controls
                    const touchControls = document.querySelectorAll('.arrow-key');
                    touchControls.forEach(control => {
                        control.addEventListener('click', () => {
                            if (!this.gameStarted) {
                                this.gameStarted = true;
                            }
                            
                            if (control.classList.contains('up')) {
                                if (this.direction !== 'down') this.nextDirection = 'up';
                            } else if (control.classList.contains('down')) {
                                if (this.direction !== 'up') this.nextDirection = 'down';
                            } else if (control.classList.contains('left')) {
                                if (this.direction !== 'right') this.nextDirection = 'left';
                            } else if (control.classList.contains('right')) {
                                if (this.direction !== 'left') this.nextDirection = 'right';
                            }
                        });
                    });
                },
                
                generateFood: function() {
                    let x, y;
                    let validPosition = false;
                    
                    while (!validPosition) {
                        x = Math.floor(Math.random() * this.gridSize);
                        y = Math.floor(Math.random() * this.gridSize);
                        
                        validPosition = true;
                        
                        // Check if food overlaps with snake
                        for (let segment of this.snake) {
                            if (segment.x === x && segment.y === y) {
                                validPosition = false;
                                break;
                            }
                        }
                    }
                    
                    this.food = {x, y};
                },
                
                update: function() {
                    if (!this.gameStarted || this.gameOver) return;
                    
                    // Apply nextDirection to direction
                    if (this.nextDirection) {
                        this.direction = this.nextDirection;
                    }
                    
                    // Calculate new head position
                    let newHead = {x: this.snake[0].x, y: this.snake[0].y};
                    
                    switch (this.direction) {
                        case 'up': newHead.y -= 1; break;
                        case 'down': newHead.y += 1; break;
                        case 'left': newHead.x -= 1; break;
                        case 'right': newHead.x += 1; break;
                        default: return; // No movement if no direction
                    }
                    
                    // Fix: Calculate actual grid size based on canvas and cell size
                    const actualGridWidth = Math.floor(this.canvas.width / this.cellSize);
                    const actualGridHeight = Math.floor(this.canvas.height / this.cellSize);
                    
                    // Check for collisions with walls using the actual grid dimensions
                    if (
                        newHead.x < 0 || 
                        newHead.x >= actualGridWidth ||
                        newHead.y < 0 || 
                        newHead.y >= actualGridHeight
                    ) {
                        console.log("Wall collision at", newHead, "Grid size:", actualGridWidth, "x", actualGridHeight);
                        this.gameOver = true;
                        this.draw();
                        return;
                    }
                    
                    // Check for collisions with self
                    for (let segment of this.snake) {
                        if (segment.x === newHead.x && segment.y === newHead.y) {
                            this.gameOver = true;
                            this.draw();
                            return;
                        }
                    }
                    
                    // Check for collision with food
                    const ateFood = (newHead.x === this.food.x && newHead.y === this.food.y);
                    
                    // Add new head to snake
                    this.snake.unshift(newHead);
                    
                    // If not eating food, remove tail
                    if (!ateFood) {
                        this.snake.pop();
                    } else {
                        // Play munching sound when snake eats food
                        this.playSound('munch');
                        
                        // Generate new food
                        this.generateFood();
                        
                        // Store previous score
                        const previousScore = this.score;
                        
                        // Update score
                        this.score += 10;
                        
                        // Check if we crossed a 100-point threshold
                        if (Math.floor(this.score / 100) > Math.floor(previousScore / 100)) {
                            // Play burp sound when reaching multiples of 100
                            this.playSound('burp');
                        }
                        
                        this.updateScoreDisplay();
                    }
                    
                    // Draw updated state
                    this.draw();
                },
                
                draw: function() {
                    // Clear the canvas with background
                    this.ctx.fillStyle = '#1a1a2e';
                    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                    
                    // Draw grid lines for better visibility
                    this.ctx.strokeStyle = 'rgba(255,255,255,0.1)';
                    for (let x = 0; x <= this.canvas.width; x += this.cellSize) {
                        this.ctx.beginPath();
                        this.ctx.moveTo(x, 0);
                        this.ctx.lineTo(x, this.canvas.height);
                        this.ctx.stroke();
                    }
                    for (let y = 0; y <= this.canvas.height; y += this.cellSize) {
                        this.ctx.beginPath();
                        this.ctx.moveTo(0, y);
                        this.ctx.lineTo(this.canvas.width, y);
                        this.ctx.stroke();
                    }
                    
                    // Draw food
                    if (this.food) {
                        this.ctx.fillStyle = '#ff0080';
                        this.ctx.beginPath();
                        this.ctx.arc(
                            this.food.x * this.cellSize + this.cellSize / 2,
                            this.food.y * this.cellSize + this.cellSize / 2,
                            this.cellSize / 2 - 2,
                            0,
                            Math.PI * 2
                        );
                        this.ctx.fill();
                    }
                    
                    // Draw snake body
                    for (let i = 0; i < this.snake.length; i++) {
                        // Head is brighter green, body parts get progressively darker
                        const colorValue = Math.max(50, 255 - (i * 10));
                        this.ctx.fillStyle = i === 0 ? '#00ff00' : `rgb(0, ${colorValue}, 0)`;
                        
                        this.ctx.fillRect(
                            this.snake[i].x * this.cellSize + 1,
                            this.snake[i].y * this.cellSize + 1,
                            this.cellSize - 2,
                            this.cellSize - 2
                        );
                    }
                    
                    // Draw start instructions if game not started
                    if (!this.gameStarted && !this.gameOver) {
                        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                        
                        this.ctx.fillStyle = 'white';
                        this.ctx.font = '24px Arial';
                        this.ctx.textAlign = 'center';
                        this.ctx.fillText(
                            'Press any arrow key to start',
                            this.canvas.width / 2,
                            this.canvas.height / 2
                        );
                    }
                    
                    // Draw game over screen
                    if (this.gameOver) {
                        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                        
                        this.ctx.fillStyle = 'white';
                        this.ctx.font = '30px Arial';
                        this.ctx.textAlign = 'center';
                        this.ctx.fillText(
                            'GAME OVER',
                            this.canvas.width / 2,
                            this.canvas.height / 2 - 20
                        );
                        
                        this.ctx.font = '24px Arial';
                        this.ctx.fillText(
                            `Score: ${this.score}`,
                            this.canvas.width / 2,
                            this.canvas.height / 2 + 20
                        );
                    }
                },
                
                updateScoreDisplay: function() {
                    // Update game controller score
                    gameController.score = this.score;
                    gameController.updateScore();
                },
                
                endGame: function() {
                    // Clear game interval
                    if (this.gameInterval) {
                        clearInterval(this.gameInterval);
                        this.gameInterval = null;
                    }
                    
                    // Show game over screen
                    this.draw();
                    
                    // Show modal with final score after a short delay
                    setTimeout(() => {
                        gameController.endGame(this.score, 'Game Over');
                    }, 1500);
                },
                
                reset: function() {
                    // Clear interval if it exists
                    if (this.gameInterval) {
                        clearInterval(this.gameInterval);
                        this.gameInterval = null;
                    }
                    
                    // Reset game state
                    this.init();
                },
                
                stop: function() {
                    // Clear interval if it exists
                    if (this.gameInterval) {
                        clearInterval(this.gameInterval);
                        this.gameInterval = null;
                    }
                },
                
                // Improve the playSound function for faster response
                playSound: function(soundName) {
                    if (this.sounds[soundName]) {
                        // Reduce background music volume before playing effect
                        gameController.reduceBackgroundVolume();
                        
                        // Use the alternate sound if the main one is playing
                        if (soundName === 'munch' && !this.sounds.munch.paused) {
                            this.sounds.munch2.currentTime = 0;
                            this.sounds.munch2.play().catch(error => {
                                console.log(`Error playing backup munch sound:`, error);
                            }).finally(() => {
                                // Restore background volume after effect ends
                                setTimeout(() => gameController.restoreBackgroundVolume(), 200);
                            });
                            return;
                        }
                        
                        if (soundName === 'burp' && !this.sounds.burp.paused) {
                            this.sounds.burp2.currentTime = 0;
                            this.sounds.burp2.play().catch(error => {
                                console.log(`Error playing backup burp sound:`, error);
                            }).finally(() => {
                                // Restore background volume after effect ends
                                setTimeout(() => gameController.restoreBackgroundVolume(), 200);
                            });
                            return;
                        }
                        
                        // For immediate playback, set currentTime to 0
                        this.sounds[soundName].currentTime = 0;
                        
                        // Play with high priority and log for debugging
                        const playPromise = this.sounds[soundName].play();
                        if (playPromise !== undefined) {
                            playPromise
                                .catch(error => {
                                    console.log(`Error playing ${soundName} sound:`, error);
                                })
                                .finally(() => {
                                    // Restore background volume after effect ends
                                    setTimeout(() => gameController.restoreBackgroundVolume(), 200);
                                });
                        }
                        
                        // Log when sounds are played
                        console.log(`Playing ${soundName} sound at score:`, this.score);
                    }
                }
            };
            
            // Initialize Snake Game (but don't start the game loop yet)
            SnakeGame.init();
            
            // Create an overlay for the animation
            const overlay = document.createElement('div');
            overlay.id = 'snake-animation-overlay';
            overlay.style.position = 'absolute';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100%';
            overlay.style.height = '100%';
            overlay.style.display = 'flex';
            overlay.style.flexDirection = 'column';
            overlay.style.alignItems = 'center';
            overlay.style.justifyContent = 'center';
            overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
            overlay.style.backdropFilter = 'blur(5px)';
            overlay.style.zIndex = '10';
            overlay.style.padding = '20px';
            
            // Create arrow keys container
            const arrowsContainer = document.createElement('div');
            arrowsContainer.style.display = 'grid';
            arrowsContainer.style.gridTemplateColumns = 'repeat(3, 40px)';
            arrowsContainer.style.gridTemplateRows = 'repeat(3, 40px)';
            arrowsContainer.style.gap = '5px';
            arrowsContainer.style.margin = '15px 0';
            
            // Function to create arrow key elements
            function createArrow(content, className) {
                const arrow = document.createElement('div');
                arrow.innerHTML = content;
                arrow.style.backgroundColor = 'rgba(255, 255, 255, 0.25)';
                arrow.style.borderRadius = '6px';
                arrow.style.width = '35px';
                arrow.style.height = '35px';
                arrow.style.display = 'flex';
                arrow.style.alignItems = 'center';
                arrow.style.justifyContent = 'center';
                arrow.style.color = 'white';
                arrow.style.fontSize = '18px';
                arrow.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)';
                arrow.className = className;
                return arrow;
            }
            
            // Add arrows in grid layout exactly as shown in image
            // Empty cell (top-left)
            arrowsContainer.appendChild(document.createElement('div'));
            // Up arrow (top-center)
            arrowsContainer.appendChild(createArrow('&#8593;', 'arrow up'));
            // Empty cell (top-right)
            arrowsContainer.appendChild(document.createElement('div'));
            // Left arrow (middle-left)
            arrowsContainer.appendChild(createArrow('&#8592;', 'arrow left'));
            // Down arrow (middle-center)
            arrowsContainer.appendChild(createArrow('&#8595;', 'arrow down'));
            // Right arrow (middle-right)
            arrowsContainer.appendChild(createArrow('&#8594;', 'arrow right'));
            
            overlay.appendChild(arrowsContainer);
            
            // Add instructions with typewriter effect
            const instructions = document.createElement('div');
            instructions.style.color = 'white';
            instructions.style.backgroundColor = 'rgba(156, 39, 176, 0.8)';
            instructions.style.padding = '10px 15px';
            instructions.style.borderRadius = '4px';
            instructions.style.fontSize = '13px';
            instructions.style.margin = '15px 0 0 0';
            instructions.style.maxWidth = '250px';
            instructions.style.textAlign = 'center';
            instructions.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.3)';
            overlay.appendChild(instructions);
            
            // Add overlay to snake container
            const snakeContainer = document.getElementById('snake-container');
            snakeContainer.style.position = 'relative';
            snakeContainer.appendChild(overlay);
            
            // Typewriter effect
            const instructionText = "Press arrow keys on your computer to move snake.";
            let i = 0;
            
            function typeWriter() {
                if (i < instructionText.length) {
                    instructions.textContent += instructionText.charAt(i);
                    i++;
                    setTimeout(typeWriter, 50);
                } else {
                    // Typewriter effect is complete, fade out overlay after a short delay
                    setTimeout(() => {
                        overlay.style.opacity = '0';
                        overlay.style.transition = 'opacity 0.8s ease';
                        
                        setTimeout(() => {
                            overlay.remove();
                        }, 800);
                    }, 1500); // Wait 1.5 seconds after text completes before fading
                }
            }
            
            // Start typewriter animation
            setTimeout(typeWriter, 500);
            
            // Store the game in controller
            this.currentGame = SnakeGame;
            
            // Add restart button functionality
            const restartButton = document.getElementById('restart-game');
            if (restartButton) {
                restartButton.addEventListener('click', () => {
                    SnakeGame.reset();
                });
            }
            
            console.log("Snake game initialized with animation");
        } else {
            // Use original function for other game types
            originalStartGame.call(this, gameType);
        }
    };
    
    // Add this line to prevent scrolling
    preventArrowKeyScrolling();
    
    console.log("Snake game setup complete with animation and auto-start");
});

// Add this code to prevent page scrolling during Snake game
function preventArrowKeyScrolling() {
    // Keys we want to prevent default behavior for
    const keysToPrevent = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 
                          'Space', ' ', 'KeyW', 'KeyA', 'KeyS', 'KeyD'];
    
    // Add event listener to window
    window.addEventListener('keydown', function(e) {
        // Check if snake game is active
        const snakeContainer = document.getElementById('snake-container');
        const snakeCanvas = document.getElementById('snake-canvas');
        
        // Only prevent default if snake game is active and visible
        if (!snakeContainer.classList.contains('hidden') && 
            !snakeCanvas.classList.contains('hidden') && 
            keysToPrevent.includes(e.code)) {
            
            // Prevent the default action (scrolling)
            e.preventDefault();
            
            // Log for debugging
            console.log('Prevented default for key:', e.code);
        }
    }, false);
}

function wrapLettersInSpans() {
    const snakeGameTitles = document.querySelectorAll('.game-card[data-game="snake"] h3');
    snakeGameTitles.forEach(title => {
        // Main text on top
        const mainText = "Snake Game";
        
        // Create spans for each letter in "reworked" with proper spacing
        const reworkedText = "reworked".split('').map((letter, index) => 
            `<span>${letter}</span>`
        ).join('');
        
        // Combine all parts with proper structure
        title.innerHTML = `
            ${mainText}
            <div class="reworked-container">
                <span class="static-bracket">(</span>
                <span class="reworked-text">${reworkedText}</span>
                <span class="static-bracket">)</span>
            </div>
        `;
    });
}

// Ensure the function runs after DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    wrapLettersInSpans();
    // ... rest of your initialization code ...
}); 
