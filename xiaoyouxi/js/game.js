// 获取DOM元素
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');
const finalScoreElement = document.getElementById('finalScore');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const leftBtn = document.getElementById('leftBtn');
const rightBtn = document.getElementById('rightBtn');
const gameOverScreen = document.getElementById('gameOverScreen');

// 设置画布尺寸
canvas.width = 600;
canvas.height = 400;

// 游戏状态
let gameRunning = false;
let animationId;
let score = 0;
let highScore = localStorage.getItem('highScore') || 0;
let obstacleSpeed = 2;
let obstacleFrequency = 120; // 值越小，出现频率越高
let frameCount = 0;
let lastScore = 0;

// 玩家属性
const player = {
    x: canvas.width / 2 - 25, // 居中放置
    y: canvas.height - 80,    // 底部放置，留出一些空间
    width: 50,
    height: 60,
    speed: 5,
    dx: 0,                    // 水平移动方向
    moving: false,
    image: new Image()
};

// 障碍物数组
let obstacles = [];

// 加载图像
player.image.src = 'img/player.svg';
const obstacleImage = new Image();
obstacleImage.src = 'img/obstacle.svg';

// 显示初始高分
highScoreElement.textContent = highScore;

// 添加事件监听器
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);
document.addEventListener('keydown', keyDown);
document.addEventListener('keyup', keyUp);
leftBtn.addEventListener('mousedown', () => { player.dx = -player.speed; player.moving = true; });
rightBtn.addEventListener('mousedown', () => { player.dx = player.speed; player.moving = true; });
leftBtn.addEventListener('mouseup', () => { if(player.dx < 0) { player.dx = 0; player.moving = false; } });
rightBtn.addEventListener('mouseup', () => { if(player.dx > 0) { player.dx = 0; player.moving = false; } });
leftBtn.addEventListener('touchstart', (e) => { e.preventDefault(); player.dx = -player.speed; player.moving = true; });
rightBtn.addEventListener('touchstart', (e) => { e.preventDefault(); player.dx = player.speed; player.moving = true; });
leftBtn.addEventListener('touchend', (e) => { e.preventDefault(); if(player.dx < 0) { player.dx = 0; player.moving = false; } });
rightBtn.addEventListener('touchend', (e) => { e.preventDefault(); if(player.dx > 0) { player.dx = 0; player.moving = false; } });

// 键盘控制
function keyDown(e) {
    if(!gameRunning) return;
    
    if(e.key === 'ArrowLeft' || e.key === 'a') {
        player.dx = -player.speed;
        player.moving = true;
    } else if(e.key === 'ArrowRight' || e.key === 'd') {
        player.dx = player.speed;
        player.moving = true;
    }
}

function keyUp(e) {
    if(!gameRunning) return;
    
    if((e.key === 'ArrowLeft' || e.key === 'a') && player.dx < 0) {
        player.dx = 0;
        player.moving = false;
    } else if((e.key === 'ArrowRight' || e.key === 'd') && player.dx > 0) {
        player.dx = 0;
        player.moving = false;
    }
}

// 障碍物生成函数
function createObstacle() {
    const minSize = 30;
    const maxSize = 50;
    const size = Math.floor(Math.random() * (maxSize - minSize + 1) + minSize);
    
    // 随机水平位置
    const x = Math.random() * (canvas.width - size);
    
    obstacles.push({
        x,
        y: -size,
        width: size,
        height: size
    });
}

// 绘制玩家
function drawPlayer() {
    ctx.drawImage(player.image, player.x, player.y, player.width, player.height);
}

// 绘制障碍物
function drawObstacles() {
    obstacles.forEach(obstacle => {
        ctx.drawImage(obstacleImage, obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    });
}

// 更新玩家位置
function updatePlayer() {
    player.x += player.dx;
    
    // 边界检测
    if(player.x < 0) {
        player.x = 0;
    } else if(player.x + player.width > canvas.width) {
        player.x = canvas.width - player.width;
    }
}

// 更新障碍物位置
function updateObstacles() {
    frameCount++;
    
    // 创建新障碍物
    if(frameCount % obstacleFrequency === 0) {
        createObstacle();
        
        // 随着分数增加，障碍物频率和速度增加
        if(score > lastScore + 10) {
            lastScore = score;
            obstacleFrequency = Math.max(40, obstacleFrequency - 5);
            obstacleSpeed += 0.2;
        }
    }
    
    // 更新已有障碍物
    for(let i = 0; i < obstacles.length; i++) {
        obstacles[i].y += obstacleSpeed;
        
        // 检测玩家碰撞
        if(
            player.x < obstacles[i].x + obstacles[i].width &&
            player.x + player.width > obstacles[i].x &&
            player.y < obstacles[i].y + obstacles[i].height &&
            player.y + player.height > obstacles[i].y
        ) {
            gameOver();
            return;
        }
        
        // 移除超出画布的障碍物，并增加分数
        if(obstacles[i].y > canvas.height) {
            obstacles.splice(i, 1);
            i--;
            
            // 增加分数
            score++;
            scoreElement.textContent = score;
        }
    }
}

// 清除画布
function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// 绘制路面
function drawRoad() {
    const roadWidth = canvas.width;
    const laneCount = 3;
    const laneWidth = roadWidth / laneCount;
    
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 绘制道路分隔线
    ctx.strokeStyle = '#fff';
    ctx.setLineDash([15, 15]); // 虚线样式
    ctx.lineWidth = 2;
    
    for(let i = 1; i < laneCount; i++) {
        ctx.beginPath();
        ctx.moveTo(laneWidth * i, 0);
        ctx.lineTo(laneWidth * i, canvas.height);
        ctx.stroke();
    }
    
    ctx.setLineDash([]); // 重置虚线样式
}

// 游戏循环
function gameLoop() {
    if(!gameRunning) return;
    
    clearCanvas();
    drawRoad();
    
    updatePlayer();
    updateObstacles();
    
    drawObstacles();
    drawPlayer();
    
    animationId = requestAnimationFrame(gameLoop);
}

// 开始游戏
function startGame() {
    // 重置游戏状态
    obstacles = [];
    score = 0;
    frameCount = 0;
    obstacleSpeed = 2;
    obstacleFrequency = 120;
    lastScore = 0;
    
    player.x = canvas.width / 2 - 25;
    player.dx = 0;
    
    // 更新界面
    scoreElement.textContent = score;
    gameOverScreen.classList.add('hidden');
    
    // 开始游戏
    gameRunning = true;
    gameLoop();
}

// 游戏结束
function gameOver() {
    gameRunning = false;
    cancelAnimationFrame(animationId);
    
    // 检查高分
    if(score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
        highScoreElement.textContent = highScore;
    }
    
    // 显示游戏结束界面
    finalScoreElement.textContent = score;
    gameOverScreen.classList.remove('hidden');
}

// 在图像加载完成后显示初始界面
window.addEventListener('load', () => {
    clearCanvas();
    drawRoad();
    
    // 绘制初始玩家位置
    drawPlayer();
}); 