/************************
***** DECLARATIONS: *****
************************/
let cvs         // canvas
let ctx         // context'2d'
let description // game description
let theme1      // original theme (sprite sheet 1)
let theme2      // original them v2 (sprite sheet 2)
let bg          // background
let bird        // bird: yellow
let bird1       // bird: red (unused, kept for reference)
let bird2       // bird: blue (unused, kept for reference)
let pipes       // top and bottom pipes
let ground      // ground floor
let getReady    // get ready screen
let gameOver    // game over screen
let settingsScreen // settings screen object
let map         // map of number images
let score       // score counter
let gameState   // state of game
let frame       // ms/frame = 17; dx/frame = 2; fps = 59;
let degree      // bird rotation degree
let isSoundOn   // toggle for sound (default to true)
let showAboutInfo // Tracks if the About panel should be open

const SFX_SCORE = new Audio()         // sound for scoring
const SFX_FLAP = new Audio()          // sound for flying bird
const SFX_COLLISION = new Audio()     // sound for collision
const SFX_FALL = new Audio()          // sound for falling to the ground
const SFX_SWOOSH = new Audio()        // sound for changing game state

cvs = document.getElementById('game')
ctx = cvs.getContext('2d')
description = document.getElementById('description')
theme1 = new Image()
theme1.src = 'img/og-theme.png'
theme2 = new Image()
theme2.src = 'img/og-theme-2.png'

// --- SOCIAL ICON IMAGE DECLARATIONS ---
let telegramIcon = new Image(); 
telegramIcon.src = 'tele.png';  

let instagramIcon = new Image();
instagramIcon.src = 'insta.png'; 
// --------------------------------------

frame = 0;
degree = Math.PI/180
SFX_SCORE.src = 'audio/sfx_point.wav'
SFX_FLAP.src = 'audio/sfx_wing.wav'
SFX_COLLISION.src = 'audio/sfx_hit.wav'
SFX_FALL.src = 'audio/sfx_die.wav'
SFX_SWOOSH.src = 'audio/sfx_swooshing.wav'
isSoundOn = true; 
showAboutInfo = false; 

// Helper function to play sound only if sound is toggled ON
const playSfx = (sfx) => {
    if (isSoundOn) {
        sfx.currentTime = 0; 
        sfx.play().catch(e => {
            console.log("Audio playback failed (usually fixed by first user click).", e);
        });
    }
}
// Helper function to check if a point (x, y) is inside a box (rect)
function isPointInRect(x, y, rect) {
    return x >= rect.x && x <= rect.x + rect.w && 
           y >= rect.y && y <= rect.y + rect.h;
}

// Helper function to check if a point is inside the main settings panel box
function isPointInSettingsPanel(x, y) {
    const p = settingsScreen;
    return x >= p.x && x <= p.x + p.panelW && 
           y >= p.y && y <= p.y + p.panelH;
}

gameState = {
    current: 0,
    getReady: 0,
    play: 1,
    gameOver: 2,
    settings: 3 
}

//background
bg = {
    imgX: 0, imgY: 0, width: 276, height: 228,
    x: 0, y: cvs.height - 228, w: 276, h: 228, dx: .2,
    render: function() {
        ctx.drawImage(theme1, this.imgX,this.imgY,this.width,this.height, this.x,this.y,this.w,this.h)
        ctx.drawImage(theme1, this.imgX,this.imgY,this.width,this.height, this.x + this.width,this.y,this.w,this.h)
        ctx.drawImage(theme1, this.imgX,this.imgY,this.width,this.height, this.x + this.width*2,this.y,this.w,this.h)
    },
    position: function () {
        if (gameState.current == gameState.getReady || gameState.current == gameState.settings) {
            this.x = 0
        }    
        if (gameState.current == gameState.play) {
            this.x = (this.x-this.dx) % (this.w)
        }
    }
}

//top and bottom pipes
pipes = {
    top: { imgX: 56, imgY: 323, }, bot: { imgX: 84, imgY:323, },
    width: 26, height: 160, w: 55, h: 300, 
    
    // DIFFICULTY ADJUSTMENT: Increased gap and reduced speed
    gap: 120, // Was 85
    dx: 1.5,  // Was 2
    
    minY: -260, maxY: -40, pipeGenerator: [],
    reset: function() { this.pipeGenerator = [] },
    render: function() {
        for (let i = 0; i < this.pipeGenerator.length; i++) {
            let pipe = this.pipeGenerator[i]
            let topPipe = pipe.y
            let bottomPipe = pipe.y + this.gap + this.h
            ctx.drawImage(theme2, this.top.imgX,this.top.imgY,this.width,this.height, pipe.x,topPipe,this.w,this.h)
            ctx.drawImage(theme2, this.bot.imgX,this.bot.imgY,this.width,this.height, pipe.x,bottomPipe,this.w,this.h)
        }
    },
    position: function() {
        if (gameState.current !== gameState.play) { return }
        if (gameState.current == gameState.play) {
            // DIFFICULTY ADJUSTMENT: Less frequent pipe generation
            if (frame%120 == 0) { // Was 100
                this.pipeGenerator.push({ x: cvs.width, y: Math.floor((Math.random() * (this.maxY-this.minY+1)) + this.minY) })
            }
            for (let i = 0; i < this.pipeGenerator.length; i++) {
                let pg = this.pipeGenerator[i]
                let b = { left: bird.x - bird.r, right: bird.x + bird.r, top: bird.y - bird.r, bottom: bird.y + bird.r, }
                let p = {
                    top: { top: pg.y, bottom: pg.y + this.h }, bot: { top: pg.y + this.h + this.gap, bottom: pg.y + this.h*2 + this.gap },
                    left: pg.x, right: pg.x + this.w
                }
                pg.x -= this.dx
                
                if(pg.x < -this.w) {
                    this.pipeGenerator.shift()
                    score.current++
                    playSfx(SFX_SCORE)
                }

                //PIPE COLLISION
                if ((b.left < p.right && b.right > p.left && b.top < p.top.bottom && b.bottom > p.top.top) ||
                    (b.left < p.right && b.right > p.left && b.top < p.bot.bottom && b.bottom > p.bot.top)) {
                        gameState.current = gameState.gameOver
                        playSfx(SFX_COLLISION)
                }
            }
        }
    }
}
//ground floor
ground = {
    imgX: 276, imgY: 0, width: 224, height: 112,
    x: 0, y:cvs.height - 112, w:224, h:112, dx: 2,
    render: function() {
        ctx.drawImage(theme1, this.imgX,this.imgY,this.width,this.height, this.x,this.y,this.w,this.h)
        ctx.drawImage(theme1, this.imgX,this.imgY,this.width,this.height, this.x + this.width,this.y,this.w,this.h)

        // Draw Settings text/button area
        if (gameState.current === gameState.getReady) {
            ctx.fillStyle = '#f0f0f0';
            ctx.textAlign = "left";
            ctx.font = "14px 'Carter One'";
            ctx.fillText("Settings", 10, cvs.height - 10);
            this.settingsArea = { x: 0, y: cvs.height - 30, w: 70, h: 30 };
        }
    },
    position: function() {
        if (gameState.current == gameState.getReady || gameState.current == gameState.settings) {
            this.x = 0
        }
        if (gameState.current == gameState.play) {
            this.x = (this.x-this.dx) % (this.w/2)
        }
    }
}
//map of number images
map = [
    num0 = { imgX: 496, imgY: 60, width: 12, height: 18 }, num1 = { imgX: 135, imgY: 455, width: 10, height: 18 },
    num2 = { imgX: 292, imgY: 160, width: 12, height: 18 }, num3 = { imgX: 306, imgY: 160, width: 12, height: 18 },
    num4 = { imgX: 320, imgY: 160, width: 12, height: 18 }, num5 = { imgX: 334, imgY: 160, width: 12, height: 18 },
    num6 = { imgX: 292, imgY: 184, width: 12, height: 18 }, num7 = { imgX: 306, imgY: 184, width: 12, height: 18 },
    num8 = { imgX: 320, imgY: 184, width: 12, height: 18 }, num9 = { imgX: 334, imgY: 184, width: 12, height: 18 }
]
//current score, top score, tracker
score = {
    current: 0, best: null, x: cvs.width/2, y: 40, w: 15, h: 25,
    reset: function() { this.current = 0 },
    render: function() {
        if (gameState.current == gameState.play || gameState.current == gameState.gameOver) {
            let scoreStr = this.current.toString()
            let totalWidth = scoreStr.length * this.w
            let startX = this.x - totalWidth / 2 + this.w / 2
            for (let i = 0; i < scoreStr.length; i++) {
                let digit = parseInt(scoreStr.charAt(i))
                let numMap = map[digit]
                ctx.drawImage(theme2, numMap.imgX, numMap.imgY, numMap.width, numMap.height, 
                    startX + i * this.w - 3, this.y, this.w, this.h)
            }
        }
    }
}    
//bird : YELLOW BIRD
bird = {
    animation: [
        {imgX: 276, imgY: 114}, {imgX: 276, imgY: 140}, {imgX: 276, imgY: 166}, {imgX: 276, imgY: 140}
    ],
    fr: 0, width: 34, height: 24, x: 50, y: 160, w: 34, h: 24, r: 12, fly: 5.25, gravity: .32, velocity: 0, rotation: 0,
    render: function() {
        let bird = this.animation[this.fr]
        ctx.save()
        ctx.translate(this.x, this.y)
        ctx.rotate(this.rotation)
        ctx.drawImage(theme1, bird.imgX,bird.imgY,this.width,this.height, -this.w/2,-this.h/2,this.w,this.h)
        ctx.restore()
    },
    flap: function() { this.velocity = - this.fly },
    position: function() {
        if (gameState.current == gameState.getReady || gameState.current == gameState.settings) {
            this.y = 160; this.velocity = 0; this.rotation = 0 * degree;
            if (frame%20 == 0) { this.fr += 1 }
            if (this.fr > this.animation.length - 1) { this.fr = 0 }
        } else {
            if (frame%4 == 0) { this.fr += 1 }
            if (this.fr > this.animation.length - 1) { this.fr = 0 }
            this.velocity += this.gravity
            this.y += this.velocity
            if (this.velocity <= this.fly) { this.rotation = -15 * degree } 
            else if (this.velocity >= this.fly+2) { this.rotation = 70 * degree; this.fr = 1 } 
            else { this.rotation = 0 }
            if (this.y+this.h/2 >= cvs.height-ground.h) {
                this.y = cvs.height-ground.h - this.h/2
                if (frame%1 == 0) { this.fr = 2; this.rotation = 70 * degree }
                if (gameState.current == gameState.play) { gameState.current = gameState.gameOver; playSfx(SFX_FALL) }
            }
            if (this.y-this.h/2 <= 0) { this.y = this.r }
        }
    }
}

//get ready screen
getReady = {
    imgX: 0, imgY: 228, width: 174, height: 160,
    x: cvs.width/2 - 174/2, y: cvs.height/2 - 160, w: 174, h: 160,
    render: function() {
        if (gameState.current == gameState.getReady) {    
            ctx.drawImage(theme1, this.imgX,this.imgY,this.width,this.height, this.x,this.y,this.w,this.h)
            description.style.visibility = "visible"
        }
    }
}
//game over screen
gameOver = {
    imgX: 174, imgY: 228, width: 226, height: 158,
    x: cvs.width/2 - 226/2, y: cvs.height/2 - 160, w: 226, h:160,
    render: function() {
        if (gameState.current == gameState.gameOver) {
            ctx.drawImage(theme1, this.imgX,this.imgY,this.width,this.height, this.x,this.y,this.w,this.h)
            description.style.visibility = "visible"
        }
    }
}

// settings screen (FINAL VERSION with all fixes)
settingsScreen = {
    // Panel coordinates 
    panelW: 250,
    panelH: 280,
    x: cvs.width/2 - 250/2,
    y: cvs.height/2 - 140, 

    // Sound Toggle positions - Fixed for full label visibility
    toggleArea: { 
        x: cvs.width/2 - 100, // Left edge for sound label (100px from center)
        y: cvs.height/2 - 60,
        w: 120,
        h: 30
    },
    toggleBtn: { 
        x: cvs.width/2 + 25, // Button position (25px right of center)
        y: cvs.height/2 - 58, 
        w: 50,
        h: 25 
    },
    
    // About Button position
    aboutBtn: { 
        x: cvs.width/2 - 60, 
        y: cvs.height/2 + 20, 
        w: 120,
        h: 30 
    },
    
    // Social Media Link Areas (Using cvs.height/2 + 50 as requested)
    telegramLink: { x: cvs.width/2 - 50, y: cvs.height/2 + 50, w: 40, h: 40 }, 
    instagramLink: { x: cvs.width/2 + 10, y: cvs.height/2 + 50, w: 40, h: 40 }, 
    
    // LIVE SOCIAL LINKS
    telegramURL: 'https://t.me/AthulXc', 
    instagramURL: 'https://instagram.com/datacollectorxc',


    render: function() {
        if (gameState.current === gameState.settings) {
            // 1. BLURRED BACKGROUND EFFECT 
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, cvs.width, cvs.height);

            // 2. Draw the MAIN SETTINGS PANEL BOX
            ctx.fillStyle = '#1c1c1c'; 
            ctx.strokeStyle = '#fbb025'; 
            ctx.lineWidth = 4;
            ctx.fillRect(this.x, this.y, this.panelW, this.panelH);
            ctx.strokeRect(this.x, this.y, this.panelW, this.panelH);
            
            ctx.fillStyle = "#fff";
            ctx.textAlign = "center";
            ctx.font = "24px 'Carter One'";
            ctx.fillText("SETTINGS", cvs.width / 2, this.y + 40);

            if (!showAboutInfo) {
                // --- DEFAULT SETTINGS VIEW (Sound Toggle & About Button) ---
                
                // Sound Label - Fixed for full text visibility
                ctx.font = "16px 'Carter One'";
                ctx.fillStyle = "#fff";
                ctx.textAlign = "left"; 
                ctx.fillText("SOUND EFFECTS:", this.toggleArea.x, this.toggleBtn.y + 19); 
                
                // Sound Toggle Box and Text
                ctx.fillStyle = isSoundOn ? "green" : "red";
                ctx.fillRect(this.toggleBtn.x, this.toggleBtn.y, this.toggleBtn.w, this.toggleBtn.h);
                
                ctx.fillStyle = "#fff";
                ctx.textAlign = "center";
                ctx.fillText(isSoundOn ? "ON" : "OFF", this.toggleBtn.x + this.toggleBtn.w / 2, this.toggleBtn.y + 19);
                
                // ABOUT Button 
                ctx.fillStyle = "#333"; 
                ctx.fillRect(this.aboutBtn.x, this.aboutBtn.y, this.aboutBtn.w, this.aboutBtn.h);
                ctx.fillStyle = "#fff";
                ctx.font = "18px 'Carter One'";
                ctx.fillText("ABOUT GAME", this.aboutBtn.x + this.aboutBtn.w / 2, this.aboutBtn.y + 22);

                // Instruction to exit settings
                ctx.font = "14px 'Carter One'";
                ctx.fillStyle = "#ccc";
                ctx.fillText("Click outside the box to return", cvs.width / 2, this.y + this.panelH - 20);
            
            } else {
                // --- ABOUT INFO PANEL VIEW (Text coordinates adjusted for icon placement) ---
                
                // Version
                ctx.fillStyle = "#fff";
                ctx.textAlign = "center";
                ctx.font = "18px 'Carter One'";
                ctx.fillText("CHURULI BIRD V1.0", cvs.width / 2, this.y + 70); 
                
                // Developer Line 1
                ctx.font = "14px Arial";
                ctx.fillStyle = "#ccc";
                ctx.fillText("Developed and maintained By", cvs.width / 2, this.y + 85); 
                
                // Developer Line 2 
                ctx.font = "14px Arial";
                ctx.fillStyle = "#ccc";
                ctx.fillText("Athulxc from XC", cvs.width / 2, this.y + 105); 
                
                // Connect Header
                ctx.font = "16px 'Carter One'";
                ctx.fillStyle = "#fff";
                ctx.fillText("Connect:", cvs.width / 2, this.y + 135); 

                // --- ICON DRAWING LOGIC ---
                
                // Telegram Icon
                ctx.fillStyle = '#1e90ff'; // Dark Blue background color
                ctx.fillRect(this.telegramLink.x, this.telegramLink.y, this.telegramLink.w, this.telegramLink.h);

                if (telegramIcon.complete) {
                    ctx.drawImage(telegramIcon, this.telegramLink.x, this.telegramLink.y, this.telegramLink.w, this.telegramLink.h);
                } else {
                    ctx.fillStyle = '#fff';
                    ctx.font = "12px Arial";
                    ctx.textAlign = "center";
                    ctx.fillText('T', this.telegramLink.x + 20, this.telegramLink.y + 24); 
                }
                
                // Instagram Icon
                ctx.fillStyle = '#C13584'; // Instagram background color
                ctx.fillRect(this.instagramLink.x, this.instagramLink.y, this.instagramLink.w, this.instagramLink.h);
                
                if (instagramIcon.complete) {
                    ctx.drawImage(instagramIcon, this.instagramLink.x, this.instagramLink.y, this.instagramLink.w, this.instagramLink.h);
                } else {
                    ctx.fillStyle = '#fff';
                    ctx.font = "12px Arial";
                    ctx.textAlign = "center";
                    ctx.fillText('I', this.instagramLink.x + 20, this.instagramLink.y + 24); 
                }
                // ---------------------------------
                
                // Instruction to close
                ctx.font = "14px 'Carter One'";
                ctx.fillStyle = "#ccc";
                ctx.textAlign = "center";
                ctx.fillText("Click to close About", cvs.width / 2, this.y + this.panelH - 20);
            }
        }
    }
};

/*************************
***** INITIAL STARTUP ***** *************************/
theme1.onload = () => { playSfx(SFX_SWOOSH) }
if (theme1.complete) { playSfx(SFX_SWOOSH) }


/************************
***** FUNCTIONS: ********
************************/
let draw = () => {
    ctx.fillStyle = '#00bbc4'
    ctx.fillRect(0,0, cvs.width,cvs.height)
    bg.render()
    pipes.render()
    ground.render()

    if (gameState.current !== gameState.settings) {
        score.render()
        bird.render()
    }
    
    getReady.render()
    gameOver.render()
    settingsScreen.render()
}
let update = () => {
    bird.position()
    bg.position()
    pipes.position()
    ground.position()
}
let loop = () => {
    draw()
    update()
    frame++
}
setInterval(loop, 17) // ~60 FPS

/*************************
***** EVENT HANDLERS ***** *************************/
//on mouse click // tap screen
cvs.addEventListener('click', (e) => {
    const rect = cvs.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // 1. Check for Settings entry click (from Ready screen)
    if (gameState.current === gameState.getReady) {
        if (ground.settingsArea && isPointInRect(clickX, clickY, ground.settingsArea)) {
            gameState.current = gameState.settings;
            showAboutInfo = false;
            playSfx(SFX_SWOOSH);
            return; 
        }
    }
    
    // 2. SETTINGS SCREEN HANDLING
    if (gameState.current === gameState.settings) {
        
        if (showAboutInfo) {
            // Handle social media link clicks (in About panel)
            if (isPointInRect(clickX, clickY, settingsScreen.telegramLink)) {
                window.open(settingsScreen.telegramURL, '_blank'); 
                return;
            } else if (isPointInRect(clickX, clickY, settingsScreen.instagramLink)) {
                window.open(settingsScreen.instagramURL, '_blank'); 
                return;
            }
            
            // If clicked anywhere inside the panel, close about. If clicked outside, exit settings.
            if (isPointInSettingsPanel(clickX, clickY)) {
                showAboutInfo = false;
                playSfx(SFX_SWOOSH);
                return;
            }

        } else {
            // Default Settings View (Sound Toggle & About Button)
            
            // Check for SOUND TOGGLE Click
            if (isPointInRect(clickX, clickY, settingsScreen.toggleBtn)) {
                isSoundOn = !isSoundOn;
                if (isSoundOn) playSfx(SFX_SWOOSH); 
            
            // Check for ABOUT Button Click
            } else if (isPointInRect(clickX, clickY, settingsScreen.aboutBtn)) {
                showAboutInfo = true;
                playSfx(SFX_SWOOSH); 

            // Exit only if clicked OUTSIDE the main settings panel area
            } else if (!isPointInSettingsPanel(clickX, clickY)) {
                gameState.current = gameState.getReady;
                playSfx(SFX_SWOOSH);
            }
        }
        
    // 3. READY SCREEN -> PLAY STATE
    } else if (gameState.current === gameState.getReady) {
        gameState.current = gameState.play
        playSfx(SFX_SWOOSH)
        description.style.visibility = "hidden"
        
    // 4. PLAY STATE -> FLAP
    } else if (gameState.current === gameState.play) {
        bird.flap()
        playSfx(SFX_FLAP)
        
    // 5. GAME OVER SCREEN -> READY STATE
    } else if (gameState.current === gameState.gameOver) {
        pipes.reset()
        score.reset()
        gameState.current = gameState.getReady
        playSfx(SFX_SWOOSH)
        description.style.visibility = "visible"
    }
})

//on spacebar (No settings access via spacebar)
document.body.addEventListener('keydown', (e) => {
    if (e.keyCode == 32) {
        if (gameState.current == gameState.getReady) {
            gameState.current = gameState.play
            playSfx(SFX_SWOOSH)
        } else if (gameState.current == gameState.play) {
            bird.flap()
            playSfx(SFX_FLAP)
            description.style.visibility = "hidden"
        } else if (gameState.current == gameState.gameOver) {
            pipes.reset()
            score.reset()
            playSfx(SFX_SWOOSH)
            gameState.current = gameState.getReady
        }
    }
})
