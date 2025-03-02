// Catch Objects Game
document.addEventListener('DOMContentLoaded', function() {
    console.log("Catch Objects Game loaded");
    
    // Get the Catch Objects game card in the game selection grid
    const catchGameCard = document.querySelector('.game-card[data-game="catch"]');
    if (catchGameCard) {
        catchGameCard.addEventListener('click', initializeCatchGame);
    }
    
    // Main initialization function
    function initializeCatchGame() {
        console.log("Initializing Catch Objects Game");
        
        // Show game area and hide other game containers
        const gameArea = document.getElementById('game-area');
        if (gameArea) {
            gameArea.classList.remove('hidden');
            
            // Hide all other game containers
            document.querySelectorAll('.game-container').forEach(container => {
                container.classList.add('hidden');
            });
        }
        
        // Get catch container
        const catchContainer = document.getElementById('catch-container');
        if (!catchContainer) {
            console.error("Catch container not found!");
            return;
        }
        
        // Show catch container
        catchContainer.classList.remove('hidden');
        
        // Set game title in the main game header
        const titleElement = document.getElementById('current-game-title');
        if (titleElement) {
            titleElement.textContent = 'Catch Objects Game';
        }
        
        // Initialize and start the game
        const catchGame = new CatchGame(catchContainer);
        
        // Store reference for game controller
        if (typeof gameController !== 'undefined') {
            gameController.currentGame = catchGame;
        }
    }
    
    class CatchGame {
        constructor(container) {
            // Game container reference
            this.container = container;
            
            // Game canvas and context
            this.canvas = container.querySelector('#catch-canvas');
            this.ctx = this.canvas.getContext('2d');
            
            // Ensure canvas dimensions are set
            this.canvas.width = 400;
            this.canvas.height = 500;
            
            // Score display element
            this.scoreElement = document.getElementById('game-score');
            
            // Game state
            this.score = 0;
            this.lives = 3;
            this.gameActive = false;
            this.gamePaused = false;
            this.gameTime = 0; // Track elapsed game time in seconds
            this.gameMaxTime = 60; // Game duration in seconds (1 minute)
            
            // Player properties
            this.player = {
                x: this.canvas.width / 2,
                y: this.canvas.height - 50,
                width: 60,
                height: 20,
                color: '#3b82f6',
                speed: 5
            };
            
            // Falling objects array
            this.fallingObjects = [];
            
            // Game configuration
            this.objectSpawnRate = 1200; // Time in ms between object spawns
            this.objectSpawnTimer = 0;
            this.lastFrameTime = 0;
            this.canvasRect = this.canvas.getBoundingClientRect();
            
            // Object types (for variety and different scores)
            this.objectTypes = [
                { type: 'apple', color: '#ef4444', points: 1, radius: 15, speed: 3, image: null },
                { type: 'orange', color: '#f97316', points: 2, radius: 12, speed: 3.5, image: null },
                { type: 'banana', color: '#eab308', points: 3, radius: 10, speed: 4, image: null },
                { type: 'bomb', color: '#000000', points: -5, radius: 15, speed: 5, image: null }
            ];
            
            // Controls state
            this.keys = {
                left: false,
                right: false
            };
            
            // Animation frame ID for cancelling
            this.animationFrameId = null;
            
            // Create UI elements
            this.createUI();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Create sounds
            this.catchSound = this.createCatchSound();
            this.bombSound = this.createBombSound();
            this.gameOverSound = this.createGameOverSound();
            
            // Sound enabled flag
            this.soundEnabled = true;
        }
        
        createUI() {
            // Create score display
            this.scoreDisplay = document.createElement('div');
            this.scoreDisplay.className = 'catch-score';
            this.scoreDisplay.textContent = `Score: ${this.score}`;
            this.container.appendChild(this.scoreDisplay);
            
            // Create lives display
            this.livesDisplay = document.createElement('div');
            this.livesDisplay.className = 'catch-lives';
            this.updateLivesDisplay();
            this.container.appendChild(this.livesDisplay);
            
            // Create timer display
            this.timerDisplay = document.createElement('div');
            this.timerDisplay.className = 'catch-timer';
            this.timerDisplay.textContent = `Time: ${this.gameMaxTime}s`;
            this.container.appendChild(this.timerDisplay);
            
            // Create start screen
            this.startScreen = document.createElement('div');
            this.startScreen.className = 'catch-start-screen';
            this.startScreen.innerHTML = `
                <div class="catch-icon">
                    <i class="fas fa-apple-alt"></i>
                </div>
                <h3>Catch Objects Game</h3>
                <p>Catch the falling fruits to earn points.<br>Avoid the bombs or lose lives!</p>
                <button id="start-catch-game">Start Game</button>
                <div class="catch-controls-help">
                    <div class="key-controls">
                        <p>Move with arrow keys</p>
                        <div class="key-icons">
                            <span class="key"><i class="fas fa-arrow-left"></i></span>
                            <span class="key"><i class="fas fa-arrow-right"></i></span>
                        </div>
                    </div>
                    <div class="key-controls">
                        <p>Or use A/D keys</p>
                        <div class="key-icons">
                            <span class="key">A</span>
                            <span class="key">D</span>
                        </div>
                    </div>
                </div>
            `;
            this.container.appendChild(this.startScreen);
            
            // Add event listener to start button
            const startButton = this.startScreen.querySelector('#start-catch-game');
            startButton.addEventListener('click', () => this.start());
        }
        
        updateLivesDisplay() {
            let heartsHTML = '';
            for (let i = 0; i < this.lives; i++) {
                heartsHTML += '<span class="catch-heart"><i class="fas fa-heart"></i></span>';
            }
            this.livesDisplay.innerHTML = `Lives: ${heartsHTML}`;
        }
        
        setupEventListeners() {
            // Keyboard events for player movement
            window.addEventListener('keydown', (e) => {
                if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
                    this.keys.left = true;
                }
                if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
                    this.keys.right = true;
                }
            });
            
            window.addEventListener('keyup', (e) => {
                if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
                    this.keys.left = false;
                }
                if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
                    this.keys.right = false;
                }
            });
            
            // Reset game when clicking restart button in game header
            document.getElementById('restart-game').addEventListener('click', () => {
                this.reset();
            });
            
            // Pause game when clicking exit button (if using game controller)
            document.getElementById('exit-game').addEventListener('click', () => {
                if (this.gameActive) {
                    this.gamePaused = true;
                    cancelAnimationFrame(this.animationFrameId);
                }
            });
        }
        
        start() {
            // Hide start screen
            this.startScreen.style.display = 'none';
            
            // Reset game state
            this.score = 0;
            this.lives = 3;
            this.gameTime = 0;
            this.fallingObjects = [];
            this.gameActive = true;
            this.gamePaused = false;
            
            // Reset player position
            this.player.x = this.canvas.width / 2;
            
            // Update UI
            this.updateScore();
            this.updateLivesDisplay();
            this.timerDisplay.textContent = `Time: ${this.gameMaxTime}s`;
            
            // Start game loop
            this.lastFrameTime = performance.now();
            this.gameLoop();
        }
        
        gameLoop(timestamp = 0) {
            // Calculate delta time in seconds
            const deltaTime = (timestamp - this.lastFrameTime) / 1000;
            this.lastFrameTime = timestamp;
            
            // Update game time
            if (this.gameActive) {
                this.gameTime += deltaTime;
                const timeRemaining = Math.max(0, this.gameMaxTime - Math.floor(this.gameTime));
                this.timerDisplay.textContent = `Time: ${timeRemaining}s`;
                
                // Check if time is up
                if (this.gameTime >= this.gameMaxTime) {
                    this.gameOver(true); // Game over by time up (win)
                    return;
                }
            }
            
            // Clear canvas
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Adjust player basket width based on number of falling objects
            // This makes it slightly easier to catch multiple fruits that appear at same time
            const fallingFruits = this.fallingObjects.filter(obj => obj.type !== 'bomb');
            if (fallingFruits.length > 1) {
                // Increase basket width slightly when multiple fruits are on screen
                const widthIncrease = Math.min(fallingFruits.length * 5, 20); // Cap at 20px increase
                this.player.width = 60 + widthIncrease;
            } else {
                // Reset to normal width
                this.player.width = 60;
            }
            
            // Update player position
            this.updatePlayer(deltaTime);
            
            // Update falling objects
            this.updateFallingObjects(deltaTime);
            
            // Spawn new objects
            this.objectSpawnTimer += deltaTime * 1000;
            if (this.objectSpawnTimer >= this.objectSpawnRate) {
                this.spawnObject();
                this.objectSpawnTimer = 0;
                
                // Gradually increase difficulty by reducing spawn time
                this.objectSpawnRate = Math.max(500, this.objectSpawnRate - 10);
            }
            
            // Draw game elements
            this.drawGame();
            
            // Continue game loop if game is active
            if (this.gameActive && !this.gamePaused) {
                this.animationFrameId = requestAnimationFrame(this.gameLoop.bind(this));
            }
        }
        
        updatePlayer(deltaTime) {
            // Move player based on key presses
            if (this.keys.left) {
                this.player.x -= this.player.speed * deltaTime * 60;
            }
            if (this.keys.right) {
                this.player.x += this.player.speed * deltaTime * 60;
            }
            
            // Keep player within canvas bounds
            this.player.x = Math.max(this.player.width / 2, Math.min(this.canvas.width - this.player.width / 2, this.player.x));
        }
        
        updateFallingObjects(deltaTime) {
            for (let i = this.fallingObjects.length - 1; i >= 0; i--) {
                const obj = this.fallingObjects[i];
                
                // Move object downward
                obj.y += obj.speed * deltaTime * 60;
                
                // Check if object is caught
                if (this.checkCollision(obj)) {
                    // Handle object catch event
                    this.objectCaught(obj);
                    this.fallingObjects.splice(i, 1);
                    continue;
                }
                
                // Check if object is missed (below canvas)
                if (obj.y > this.canvas.height + obj.radius) {
                    // Only penalize for missing fruits, not bombs
                    if (obj.type !== 'bomb') {
                        this.lives--;
                        this.updateLivesDisplay();
                        
                        // Check if game over
                        if (this.lives <= 0) {
                            this.gameOver(false); // Game over by losing all lives
                            return;
                        }
                    }
                    
                    this.fallingObjects.splice(i, 1);
                }
            }
        }
        
        spawnObject() {
            // Select random object type
            const objectType = this.objectTypes[Math.floor(Math.random() * this.objectTypes.length)];
            
            // Create new falling object
            const newObject = {
                x: Math.random() * (this.canvas.width - 40) + 20,
                y: -20,
                radius: objectType.radius,
                color: objectType.color,
                type: objectType.type,
                points: objectType.points,
                speed: objectType.speed + (Math.random() * 1), // Reduced speed variation
                rotation: 0,
                rotationSpeed: (Math.random() - 0.5) * 0.1
            };
            
            this.fallingObjects.push(newObject);
        }
        
        checkCollision(obj) {
            // Calculate player boundaries
            const playerLeft = this.player.x - this.player.width / 2;
            const playerRight = this.player.x + this.player.width / 2;
            const playerTop = this.player.y - this.player.height / 2;
            
            // Check if the object has collided with the player's basket
            return (
                obj.y + obj.radius >= playerTop &&
                obj.y - obj.radius <= playerTop + 5 && // Only top edge collides
                obj.x >= playerLeft &&
                obj.x <= playerRight
            );
        }
        
        objectCaught(obj) {
            // Add points to score
            this.score += obj.points;
            
            // Update score display
            this.updateScore();
            
            // Play appropriate sound
            if (obj.type === 'bomb') {
                // Lost a life from catching a bomb
                this.lives--;
                this.updateLivesDisplay();
                
                // Play bomb sound
                if (this.soundEnabled) {
                    this.bombSound.play();
                }
                
                // Check if game over
                if (this.lives <= 0) {
                    this.gameOver(false); // Game over by losing all lives
                    return;
                }
            } else {
                // Play catch sound
                if (this.soundEnabled) {
                    this.catchSound.play();
                }
                
                // Track time of last catch to create combo effect
                const now = Date.now();
                const timeSinceLastCatch = now - (this.lastCatchTime || 0);
                this.lastCatchTime = now;
                
                // Create sparkle effect with bonus effect if caught in quick succession
                const isCombo = timeSinceLastCatch < 500; // If caught within 0.5 seconds of previous catch
                this.createSparkle(obj.x, this.player.y - 10, obj.color, isCombo);
                
                // Display combo text if applicable
                if (isCombo) {
                    this.showComboText(obj.x, obj.y);
                }
            }
        }
        
        showComboText(x, y) {
            // Create floating text element
            const comboText = document.createElement('div');
            comboText.className = 'catch-combo-text';
            comboText.textContent = 'COMBO!';
            
            // Position relative to canvas
            comboText.style.left = `${x + this.canvasRect.left}px`;
            comboText.style.top = `${y + this.canvasRect.top - 30}px`;
            
            // Add to body
            document.body.appendChild(comboText);
            
            // Animate and remove
            const animation = comboText.animate([
                { transform: 'translateY(0) scale(1)', opacity: 1 },
                { transform: 'translateY(-40px) scale(1.2)', opacity: 0 }
            ], {
                duration: 800,
                easing: 'ease-out'
            });
            
            animation.onfinish = () => {
                document.body.removeChild(comboText);
            };
        }
        
        createSparkle(x, y, color, isCombo = false) {
            // Create a more elaborate sparkle effect
            const sparkleCount = isCombo ? 10 : 7; // More particles for combo
            const particleSize = isCombo ? 3 : 2; // Larger particles for combo
            
            for (let i = 0; i < sparkleCount; i++) {
                const sparkle = document.createElement('div');
                sparkle.className = 'catch-sparkle';
                
                // Set position relative to canvas
                sparkle.style.left = `${x + this.canvasRect.left}px`;
                sparkle.style.top = `${y + this.canvasRect.top}px`;
                
                // Set color and size
                sparkle.style.backgroundColor = isCombo ? (i % 2 === 0 ? color : '#FFFFFF') : color;
                sparkle.style.width = `${particleSize}px`;
                sparkle.style.height = `${particleSize}px`;
                
                // Add to body
                document.body.appendChild(sparkle);
                
                // Calculate random angle and distance
                const angle = (i / sparkleCount) * Math.PI * 2;
                const distance = isCombo ? 30 : 20;
                
                // Animate and remove after animation
                const animation = sparkle.animate([
                    { 
                        transform: 'translate(0, 0) scale(1)',
                        opacity: 1 
                    },
                    { 
                        transform: `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px) scale(0)`,
                        opacity: 0 
                    }
                ], {
                    duration: isCombo ? 700 : 500,
                    easing: 'ease-out'
                });
                
                animation.onfinish = () => {
                    document.body.removeChild(sparkle);
                };
            }
            
            // Add a central flash
            const flash = document.createElement('div');
            flash.className = 'catch-sparkle';
            flash.style.left = `${x + this.canvasRect.left}px`;
            flash.style.top = `${y + this.canvasRect.top}px`;
            flash.style.backgroundColor = 'white';
            flash.style.width = isCombo ? '20px' : '15px';
            flash.style.height = isCombo ? '20px' : '15px';
            flash.style.borderRadius = '50%';
            
            document.body.appendChild(flash);
            
            const flashAnimation = flash.animate([
                { transform: 'scale(0.3)', opacity: 0.9 },
                { transform: isCombo ? 'scale(1.5)' : 'scale(1.2)', opacity: 0 }
            ], {
                duration: isCombo ? 400 : 300,
                easing: 'ease-out'
            });
            
            flashAnimation.onfinish = () => {
                document.body.removeChild(flash);
            };
        }
        
        drawGame() {
            // Draw player's basket
            this.drawBasket();
            
            // Draw falling objects
            this.fallingObjects.forEach(obj => {
                this.ctx.save();
                this.ctx.translate(obj.x, obj.y);
                this.ctx.rotate(obj.rotation);
                
                if (obj.type === 'apple') {
                    this.drawApple(obj);
                } else if (obj.type === 'orange') {
                    this.drawOrange(obj);
                } else if (obj.type === 'banana') {
                    this.drawBanana(obj);
                } else if (obj.type === 'bomb') {
                    this.drawBomb(obj);
                }
                
                // Update rotation for next frame
                obj.rotation += obj.rotationSpeed;
                
                this.ctx.restore();
            });
        }
        
        drawBasket() {
            // Draw improved basket
            const x = this.player.x;
            const y = this.player.y;
            const width = this.player.width;
            const height = this.player.height;
            
            // Basket body (with gradient)
            const basketGradient = this.ctx.createLinearGradient(
                x - width / 2, 
                y - height / 2, 
                x + width / 2, 
                y + height / 2
            );
            basketGradient.addColorStop(0, '#854d0e');  // Darker brown
            basketGradient.addColorStop(0.5, '#b45309'); // Medium brown
            basketGradient.addColorStop(1, '#92400e');  // Warmer brown
            
            this.ctx.fillStyle = basketGradient;
            
            // Draw rounded basket
            this.ctx.beginPath();
            this.ctx.moveTo(x - width / 2 + 5, y - height / 2); // Top left with radius
            this.ctx.lineTo(x + width / 2 - 5, y - height / 2); // Top right
            this.ctx.quadraticCurveTo(x + width / 2, y - height / 2, x + width / 2, y - height / 2 + 5); // Top right corner
            this.ctx.lineTo(x + width / 2, y + height / 2 - 5); // Right side
            this.ctx.quadraticCurveTo(x + width / 2, y + height / 2, x + width / 2 - 5, y + height / 2); // Bottom right corner
            this.ctx.lineTo(x - width / 2 + 5, y + height / 2); // Bottom side
            this.ctx.quadraticCurveTo(x - width / 2, y + height / 2, x - width / 2, y + height / 2 - 5); // Bottom left corner
            this.ctx.lineTo(x - width / 2, y - height / 2 + 5); // Left side
            this.ctx.quadraticCurveTo(x - width / 2, y - height / 2, x - width / 2 + 5, y - height / 2); // Top left corner
            this.ctx.closePath();
            this.ctx.fill();
            
            // Add basket weave texture
            this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
            this.ctx.lineWidth = 1;
            
            // Horizontal weave lines
            for (let i = 1; i < 3; i++) {
                this.ctx.beginPath();
                this.ctx.moveTo(x - width / 2 + 2, y - height / 2 + (height / 3) * i);
                this.ctx.lineTo(x + width / 2 - 2, y - height / 2 + (height / 3) * i);
                this.ctx.stroke();
            }
            
            // Vertical weave lines
            for (let i = 1; i < 5; i++) {
                this.ctx.beginPath();
                this.ctx.moveTo(x - width / 2 + (width / 5) * i, y - height / 2 + 2);
                this.ctx.lineTo(x - width / 2 + (width / 5) * i, y + height / 2 - 2);
                this.ctx.stroke();
            }
            
            // Draw basket handle
            this.ctx.beginPath();
            this.ctx.lineWidth = 3;
            const handleGradient = this.ctx.createLinearGradient(
                x, y - height / 2 - 20, 
                x, y - height / 2
            );
            handleGradient.addColorStop(0, '#7c2d12'); // Dark brown
            handleGradient.addColorStop(1, '#b45309'); // Medium brown
            
            this.ctx.strokeStyle = handleGradient;
            this.ctx.arc(
                x,
                y - height / 2 - 10,
                20,
                0.1 * Math.PI,
                0.9 * Math.PI,
                true
            );
            this.ctx.stroke();
            
            // Add shine/highlight to the handle
            this.ctx.beginPath();
            this.ctx.lineWidth = 1;
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            this.ctx.arc(
                x,
                y - height / 2 - 10,
                18,
                0.2 * Math.PI,
                0.6 * Math.PI,
                true
            );
            this.ctx.stroke();
        }
        
        drawApple(obj) {
            const radius = obj.radius;
            
            // Create apple gradient
            const appleGradient = this.ctx.createRadialGradient(
                -radius/4, -radius/4, 1, 
                0, 0, radius
            );
            appleGradient.addColorStop(0, '#ef4444'); // Bright red
            appleGradient.addColorStop(0.7, '#dc2626'); // Medium red
            appleGradient.addColorStop(1, '#b91c1c'); // Dark red
            
            // Draw apple body
            this.ctx.fillStyle = appleGradient;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Add highlight
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.beginPath();
            this.ctx.ellipse(-radius/3, -radius/3, radius/3, radius/4, Math.PI/4, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Draw stem
            const stemGradient = this.ctx.createLinearGradient(0, -radius - 5, 0, -radius);
            stemGradient.addColorStop(0, '#422006'); // Dark brown
            stemGradient.addColorStop(1, '#713f12'); // Lighter brown
            
            this.ctx.fillStyle = stemGradient;
            this.ctx.beginPath();
            this.ctx.moveTo(-2, -radius);
            this.ctx.lineTo(-2, -radius - 7);
            this.ctx.bezierCurveTo(-2, -radius - 8, 2, -radius - 8, 2, -radius - 7);
            this.ctx.lineTo(2, -radius);
            this.ctx.closePath();
            this.ctx.fill();
            
            // Draw leaf
            this.ctx.fillStyle = '#22c55e'; // Bright green
            this.ctx.beginPath();
            this.ctx.moveTo(3, -radius - 3);
            this.ctx.bezierCurveTo(8, -radius - 8, 12, -radius - 6, 10, -radius - 2);
            this.ctx.bezierCurveTo(8, -radius - 1, 4, -radius - 1, 3, -radius - 3);
            this.ctx.fill();
            
            // Add leaf detail
            this.ctx.strokeStyle = '#15803d'; // Darker green
            this.ctx.lineWidth = 0.5;
            this.ctx.beginPath();
            this.ctx.moveTo(3, -radius - 3);
            this.ctx.quadraticCurveTo(7, -radius - 5, 10, -radius - 2);
            this.ctx.stroke();
        }
        
        drawOrange(obj) {
            const radius = obj.radius;
            
            // Create orange gradient
            const orangeGradient = this.ctx.createRadialGradient(
                -radius/4, -radius/4, 1, 
                0, 0, radius
            );
            orangeGradient.addColorStop(0, '#fb923c'); // Light orange
            orangeGradient.addColorStop(0.7, '#f97316'); // Medium orange
            orangeGradient.addColorStop(1, '#ea580c'); // Dark orange
            
            // Draw orange body
            this.ctx.fillStyle = orangeGradient;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Add highlight
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.beginPath();
            this.ctx.ellipse(-radius/3, -radius/3, radius/3, radius/4, Math.PI/4, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Draw orange texture (dimples)
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                const x = Math.cos(angle) * radius * 0.5;
                const y = Math.sin(angle) * radius * 0.5;
                this.ctx.beginPath();
                this.ctx.arc(x, y, radius * 0.1, 0, Math.PI * 2);
                this.ctx.fill();
            }
            
            // Add small leaf and stem
            this.ctx.fillStyle = '#15803d'; // Dark green
            this.ctx.beginPath();
            this.ctx.ellipse(0, -radius * 0.8, radius * 0.3, radius * 0.15, 0, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Add stem
            this.ctx.fillStyle = '#92400e'; // Brown
            this.ctx.beginPath();
            this.ctx.arc(0, -radius * 0.9, radius * 0.1, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        drawBanana(obj) {
            const radius = obj.radius;
            
            // Create banana gradients
            const bananaGradient = this.ctx.createLinearGradient(
                -radius * 1.5, 0, 
                radius * 1.5, 0
            );
            bananaGradient.addColorStop(0, '#fde047'); // Light yellow
            bananaGradient.addColorStop(0.6, '#facc15'); // Medium yellow
            bananaGradient.addColorStop(1, '#eab308'); // Dark yellow
            
            // Draw curved banana shape
            this.ctx.fillStyle = bananaGradient;
            this.ctx.beginPath();
            this.ctx.moveTo(-radius * 1.5, 0);
            this.ctx.quadraticCurveTo(0, -radius * 1.2, radius * 1.5, 0); // Top curve
            this.ctx.quadraticCurveTo(0, -radius * 0.6, -radius * 1.5, 0); // Bottom curve
            this.ctx.fill();
            
            // Add shine/highlight
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.beginPath();
            this.ctx.moveTo(-radius, -radius * 0.4);
            this.ctx.quadraticCurveTo(-radius * 0.5, -radius * 0.9, radius * 0.5, -radius * 0.4);
            this.ctx.quadraticCurveTo(0, -radius * 0.6, -radius, -radius * 0.4);
            this.ctx.fill();
            
            // Add banana details/spots
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            for (let i = 0; i < 3; i++) {
                const x = -radius + (i * radius);
                this.ctx.beginPath();
                this.ctx.arc(x, -radius * 0.3, radius * 0.1, 0, Math.PI * 2);
                this.ctx.fill();
            }
            
            // Add banana stem
            this.ctx.fillStyle = '#78350f'; // Dark brown
            this.ctx.beginPath();
            this.ctx.arc(-radius * 1.3, 0, radius * 0.2, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        drawBomb(obj) {
            const radius = obj.radius;
            
            // Create bomb gradient
            const bombGradient = this.ctx.createRadialGradient(
                -radius/3, -radius/3, 1, 
                0, 0, radius
            );
            bombGradient.addColorStop(0, '#475569'); // Light gray
            bombGradient.addColorStop(0.6, '#1e293b'); // Medium slate
            bombGradient.addColorStop(1, '#0f172a'); // Dark slate
            
            // Draw bomb body
            this.ctx.fillStyle = bombGradient;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Draw highlight
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            this.ctx.beginPath();
            this.ctx.ellipse(-radius/3, -radius/3, radius/3, radius/4, Math.PI/4, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Draw fuse base
            this.ctx.fillStyle = '#b45309'; // Brown
            this.ctx.beginPath();
            this.ctx.arc(0, -radius + 1, 3, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Draw fuse
            this.ctx.beginPath();
            this.ctx.lineWidth = 2;
            const fuseGradient = this.ctx.createLinearGradient(
                0, -radius, 
                10, -radius - 15
            );
            fuseGradient.addColorStop(0, '#b45309'); // Brown
            fuseGradient.addColorStop(1, '#78350f'); // Dark brown
            
            this.ctx.strokeStyle = fuseGradient;
            this.ctx.moveTo(0, -radius);
            this.ctx.bezierCurveTo(5, -radius - 5, 8, -radius - 10, 10, -radius - 15);
            this.ctx.stroke();
            
            // Draw spark at end of fuse
            const sparkTime = Date.now() / 100; // For animation
            if (Math.sin(sparkTime) > 0) {
                this.ctx.fillStyle = '#fef08a'; // Yellow
            } else {
                this.ctx.fillStyle = '#f97316'; // Orange
            }
            
            this.ctx.beginPath();
            this.ctx.arc(10, -radius - 15, 3, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Add light glow around the spark
            this.ctx.beginPath();
            const sparkGlow = this.ctx.createRadialGradient(
                10, -radius - 15, 1, 
                10, -radius - 15, 6
            );
            sparkGlow.addColorStop(0, 'rgba(254, 240, 138, 0.8)'); // Yellow with alpha
            sparkGlow.addColorStop(1, 'rgba(254, 240, 138, 0)'); // Transparent
            
            this.ctx.fillStyle = sparkGlow;
            this.ctx.arc(10, -radius - 15, 6, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        updateScore(points = 0) {
            // Update game score
            this.score += points;
            
            // Update score displays
            this.scoreDisplay.textContent = `Score: ${this.score}`;
            if (this.scoreElement) {
                this.scoreElement.textContent = `Score: ${this.score}`;
            }
        }
        
        gameOver(byTimeUp) {
            this.gameActive = false;
            cancelAnimationFrame(this.animationFrameId);
            
            // Create game over screen
            const gameOverScreen = document.createElement('div');
            gameOverScreen.className = 'catch-game-over';
            
            // Different messages based on how the game ended
            if (byTimeUp) {
                gameOverScreen.innerHTML = `
                    <h3>Time's Up!</h3>
                    <p>Your score: ${this.score}</p>
                    <div>
                        <button id="play-again-catch">Play Again</button>
                        <button id="exit-catch">Back to Menu</button>
                    </div>
                `;
                
                // Play win sound if score is good
                if (this.score > 30 && this.soundEnabled) {
                    this.createWinSound().play();
                }
            } else {
                gameOverScreen.innerHTML = `
                    <h3>Game Over</h3>
                    <p>Your score: ${this.score}</p>
                    <div>
                        <button id="play-again-catch">Play Again</button>
                        <button id="exit-catch">Back to Menu</button>
                    </div>
                `;
                
                // Play game over sound
                if (this.soundEnabled) {
                    this.gameOverSound.play();
                }
            }
            
            this.container.appendChild(gameOverScreen);
            
            // Add event listeners to buttons
            gameOverScreen.querySelector('#play-again-catch').addEventListener('click', () => {
                this.container.removeChild(gameOverScreen);
                this.reset();
            });
            
            gameOverScreen.querySelector('#exit-catch').addEventListener('click', () => {
                this.container.removeChild(gameOverScreen);
                
                // Go back to game selection
                const gameArea = document.getElementById('game-area');
                const gamesSection = document.getElementById('games-section');
                
                if (gameArea && gamesSection) {
                    gameArea.classList.add('hidden');
                    gamesSection.classList.remove('hidden');
                }
            });
        }
        
        reset() {
            // Remove any game over screen
            const gameOverScreen = this.container.querySelector('.catch-game-over');
            if (gameOverScreen) {
                this.container.removeChild(gameOverScreen);
            }
            
            // Reset and restart the game
            this.start();
        }
        
        // Sound creation methods
        createCatchSound() {
            return {
                play: () => {
                    try {
                        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                        
                        // Create oscillator and gain node
                        const oscillator = audioContext.createOscillator();
                        const gainNode = audioContext.createGain();
                        
                        // Set up oscillator
                        oscillator.type = 'sine';
                        oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5
                        oscillator.frequency.setValueAtTime(1046.5, audioContext.currentTime + 0.1); // C6
                        
                        // Set up gain node
                        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
                        gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
                        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);
                        
                        // Connect nodes
                        oscillator.connect(gainNode);
                        gainNode.connect(audioContext.destination);
                        
                        // Start and stop
                        oscillator.start(audioContext.currentTime);
                        oscillator.stop(audioContext.currentTime + 0.3);
                    } catch (e) {
                        console.error('Error playing catch sound:', e);
                    }
                }
            };
        }
        
        createBombSound() {
            return {
                play: () => {
                    try {
                        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                        
                        // Create oscillator and gain node
                        const oscillator = audioContext.createOscillator();
                        const gainNode = audioContext.createGain();
                        
                        // Set up oscillator
                        oscillator.type = 'square';
                        oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
                        oscillator.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.5);
                        
                        // Set up gain node
                        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
                        gainNode.gain.linearRampToValueAtTime(0.4, audioContext.currentTime + 0.01);
                        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5);
                        
                        // Connect nodes
                        oscillator.connect(gainNode);
                        gainNode.connect(audioContext.destination);
                        
                        // Start and stop
                        oscillator.start(audioContext.currentTime);
                        oscillator.stop(audioContext.currentTime + 0.5);
                    } catch (e) {
                        console.error('Error playing bomb sound:', e);
                    }
                }
            };
        }
        
        createGameOverSound() {
            return {
                play: () => {
                    try {
                        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                        
                        // Create oscillator and gain node
                        const oscillator = audioContext.createOscillator();
                        const gainNode = audioContext.createGain();
                        
                        // Set up oscillator
                        oscillator.type = 'triangle';
                        oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5
                        oscillator.frequency.setValueAtTime(830.6, audioContext.currentTime + 0.2); // G#5
                        oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.4); // G5
                        oscillator.frequency.setValueAtTime(698.46, audioContext.currentTime + 0.6); // F5
                        
                        // Set up gain node
                        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
                        gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
                        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + 0.8);
                        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 1.0);
                        
                        // Connect nodes
                        oscillator.connect(gainNode);
                        gainNode.connect(audioContext.destination);
                        
                        // Start and stop
                        oscillator.start(audioContext.currentTime);
                        oscillator.stop(audioContext.currentTime + 1.0);
                    } catch (e) {
                        console.error('Error playing game over sound:', e);
                    }
                }
            };
        }
        
        createWinSound() {
            return {
                play: () => {
                    try {
                        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                        
                        // First oscillator (base melody)
                        const oscillator1 = audioContext.createOscillator();
                        const gainNode1 = audioContext.createGain();
                        oscillator1.type = 'triangle';
                        oscillator1.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
                        oscillator1.frequency.setValueAtTime(587.33, audioContext.currentTime + 0.2); // D5
                        oscillator1.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.4); // E5
                        oscillator1.frequency.setValueAtTime(698.46, audioContext.currentTime + 0.6); // F5
                        oscillator1.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.8); // G5
                        
                        gainNode1.gain.setValueAtTime(0, audioContext.currentTime);
                        gainNode1.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.05);
                        gainNode1.gain.setValueAtTime(0.3, audioContext.currentTime + 0.9);
                        gainNode1.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 1.2);
                        
                        oscillator1.connect(gainNode1);
                        gainNode1.connect(audioContext.destination);
                        
                        oscillator1.start(audioContext.currentTime);
                        oscillator1.stop(audioContext.currentTime + 1.2);
                        
                        // Second oscillator (harmony)
                        setTimeout(() => {
                            const oscillator2 = audioContext.createOscillator();
                            const gainNode2 = audioContext.createGain();
                            oscillator2.type = 'sine';
                            oscillator2.frequency.setValueAtTime(1046.5, audioContext.currentTime); // C6
                            
                            gainNode2.gain.setValueAtTime(0, audioContext.currentTime);
                            gainNode2.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.05);
                            gainNode2.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5);
                            
                            oscillator2.connect(gainNode2);
                            gainNode2.connect(audioContext.destination);
                            
                            oscillator2.start(audioContext.currentTime);
                            oscillator2.stop(audioContext.currentTime + 0.5);
                        }, 800);
                    } catch (e) {
                        console.error('Error playing win sound:', e);
                    }
                }
            };
        }
        
        updateGameState(timestamp) {
            // REMOVE THIS ENTIRE METHOD - it was accidentally duplicated
        }
    }
    
    // Add link to CSS file
    const linkElement = document.createElement('link');
    linkElement.rel = 'stylesheet';
    linkElement.href = 'catch-objects.css';
    document.head.appendChild(linkElement);
    
    // Add script tag to HTML
    const scriptTag = document.createElement('script');
    scriptTag.src = 'catch-objects.js';
    document.body.appendChild(scriptTag);
}); 