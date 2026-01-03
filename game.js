// --- 1. SETUP VARIABEL & DATA ---
const actor = document.getElementById('actor');
const container = document.getElementById('game-container');
const scoreDisplay = document.getElementById('score-val'); 
const questionText = document.getElementById('question-display');

// Ambil elemen pijakan (jika ada di HTML)
const platforms = document.querySelectorAll('.platform'); 

// --- PENTING: MENGHITUNG UKURAN LAYAR OTOMATIS ---
let screenWidth = window.innerWidth;
let screenHeight = window.innerHeight;
const actorWidth = 100; // Sesuai lebar aktor di CSS

// Update ukuran jika layar di-resize
window.addEventListener('resize', () => {
    screenWidth = window.innerWidth;
    screenHeight = window.innerHeight;
});

// Fisika & Posisi Player
let x = 50; 
let y = 50; 
let velY = 0; 
let isJumping = false;
const speed = 8; 
const gravity = 0.8;

// Setting Lompat (Dikurangi jadi 17 biar enak buat platforming)
const jumpPower = 17; 

// Variabel Kontrol Damage
let bisaKenaDamage = true; 

// Input Keyboard
const keys = { ArrowRight: false, ArrowLeft: false, ArrowUp: false };

// --- DATA SOAL & JAWABAN ---
const dataSoal = [
    { id: 1, q: "2 + 2", a: "4" },
    { id: 2, q: "100 : 5", a: "20" },
    { id: 3, q: "5 x 5", a: "25" },
    { id: 4, q: "Setengah adalah", a: "1/2" }
];

let score = 0;
let activeElements = []; 
let soalSedangDibawa = null; 

// --- 2. FUNGSI UTAMA (GAME LOOP) ---
function gameLoop() {
    updateMovement();
    checkCollisions();
    requestAnimationFrame(gameLoop); 
}

// --- 3. LOGIKA GERAK & ANIMASI ---
document.addEventListener('keydown', (e) => {
    if (keys.hasOwnProperty(e.code)) keys[e.code] = true;
});
document.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.code)) keys[e.code] = false;
});

function updateMovement() {
    let isMoving = false; 

    // Gerak Kanan
    if (keys.ArrowRight) {
        x += speed;
        actor.style.transform = "scaleX(1)"; 
        isMoving = true;
    }
    // Gerak Kiri
    if (keys.ArrowLeft) {
        x -= speed;
        actor.style.transform = "scaleX(-1)"; 
        isMoving = true;
    }

    // --- BATAS TEMBOK (FULL SCREEN LOGIC) ---
    if (x < 0) x = 0;
    if (x > screenWidth - actorWidth) {
        x = screenWidth - actorWidth; 
    }

    // Lompat
    if (keys.ArrowUp && !isJumping) {
        velY = jumpPower;
        isJumping = true;
    }

    // Fisika Gravitasi
    y += velY;
    velY -= gravity; 

    // --- LOGIKA PIJAKAN / PLATFORM (BARU) ---
    // Cek apakah mendarat di atas platform?
    if (velY <= 0) { // Hanya cek saat jatuh
        platforms.forEach(plat => {
            const pLeft = parseInt(plat.style.left) || 0;
            const pBottom = parseInt(plat.style.bottom) || 0;
            const pWidth = parseInt(plat.style.width) || 100;
            const pHeight = 30; // Tinggi platform visual
            const pTop = pBottom + pHeight;

            // Syarat Mendarat: Kaki pas di atas platform & ada di dalam range lebar platform
            if (
                y >= pTop - 15 &&          
                y <= pTop + 10 &&          
                x + 60 > pLeft &&          
                x + 40 < pLeft + pWidth    
            ) {
                y = pTop; 
                velY = 0;
                isJumping = false;
            }
        });
    }

    // Batas Langit-langit
    if (y > screenHeight - 150) { 
        y = screenHeight - 150; 
        velY = 0; 
    }

    // Batas Lantai Dasar
    if (y < 50) { 
        y = 50;
        velY = 0;
        isJumping = false;
    }

    // Animasi Sprite
    actor.classList.remove('animasi-lari');
    actor.classList.remove('animasi-lompat');
    actor.style.backgroundImage = ""; 

    if (isJumping) {
        actor.classList.add('animasi-lompat');
    } 
    else if (isMoving) {
        actor.classList.add('animasi-lari');
    } 
    else {
        actor.style.backgroundImage = "url('Aset/karakter_diam-removebg-preview.png')";
    }

    // Render Posisi
    actor.style.left = x + "px";
    actor.style.bottom = y + "px";
}

// --- 4. LOGIKA SPAWN (Full Screen & Support Pecahan) ---
function spawnAllElements() {
    activeElements.forEach(el => el.remove());
    activeElements = [];
    
    questionText.innerText = "Ambil kotak [?] SOAL dulu, lalu cari JAWABANNYA!";

    dataSoal.forEach((item) => {
        createItem('soal', item.q, item.a, item.id);
        createItem('jawaban', item.a, item.a, item.id);
    });
}

function createItem(type, displayText, answerKey, idPair) {
    const el = document.createElement('div');
    el.classList.add('item');
    el.classList.add(type === 'soal' ? 'soal-item' : 'jawaban-item');
    
    // --- LOGIKA PECAHAN (BARU) ---
    // Jika teks mengandung tanda '/' (misal 1/2), ubah jadi format susun
    if (type !== 'soal' && displayText.includes('/')) {
        const parts = displayText.split('/');
        el.innerHTML = `
            <div class="pecahan">
                <span class="angka-atas">${parts[0]}</span>
                <span class="angka-bawah">${parts[1]}</span>
            </div>
        `;
    } else {
        el.innerText = type === 'soal' ? "?" : displayText; 
    }
    
    // Posisi Acak Full Screen
    const randomX = Math.floor(Math.random() * (screenWidth - 100)); 
    const randomY = Math.floor(Math.random() * (screenHeight / 2)) + 50; 
    
    el.style.left = randomX + "px";
    el.style.bottom = randomY + "px";
    
    el.dataset.type = type;       
    el.dataset.text = displayText; 
    el.dataset.pairId = idPair;   
    el.dataset.answer = answerKey; 

    container.appendChild(el);
    activeElements.push(el);
}

// --- 5. LOGIKA TABRAKAN ---
function checkCollisions() {
    const actorRect = actor.getBoundingClientRect();

    for (let i = 0; i < activeElements.length; i++) {
        let el = activeElements[i];
        if (!document.body.contains(el)) continue;

        const itemRect = el.getBoundingClientRect();

        if (actorRect.left < itemRect.right &&
            actorRect.right > itemRect.left &&
            actorRect.top < itemRect.bottom &&
            actorRect.bottom > itemRect.top) {
            
            // LOGIKA AMBIL SOAL
            if (el.dataset.type === 'soal') {
                if (soalSedangDibawa === null) {
                    soalSedangDibawa = {
                        text: el.dataset.text,
                        pairId: el.dataset.pairId,
                        correctAnswer: el.dataset.answer
                    };
                    questionText.innerText = "SOAL: " + soalSedangDibawa.text + " = ...? (Cari Jawabannya!)";
                    questionText.style.backgroundColor = "#ffeb3b"; 

                    el.remove();
                    activeElements.splice(i, 1); 
                } 
            }
            // LOGIKA AMBIL JAWABAN
            else if (el.dataset.type === 'jawaban') {
                if (soalSedangDibawa !== null) {
                    if (el.dataset.text === soalSedangDibawa.correctAnswer) {
                        // BENAR
                        score += 20;  
                        if(scoreDisplay) scoreDisplay.innerText = score; 
                        
                        questionText.innerText = "KEREEEEEENNNN BENAR! " + soalSedangDibawa.text + " = " + el.dataset.text;
                        questionText.style.backgroundColor = "#4CAF50"; 
                        
                        el.remove();
                        activeElements.splice(i, 1);
                        soalSedangDibawa = null;
                        
                        if (activeElements.length === 0) {
                             questionText.innerText = "KELAAAAZZZZ KIIIING! SEMUA SOAL TERJAWAB!";
                        }

                    } else {
                        // SALAH
                        if (bisaKenaDamage) {
                            score -= 20; 
                            if(scoreDisplay) scoreDisplay.innerText = score;

                            questionText.innerText = "YAAAHHH SALAH! Bukan jawaban untuk: " + soalSedangDibawa.text;
                            questionText.style.backgroundColor = "#f44336"; 
                            
                            bisaKenaDamage = false;
                            actor.style.opacity = "0.5";

                            setTimeout(() => {
                                bisaKenaDamage = true;
                                actor.style.opacity = "1"; 
                                questionText.style.backgroundColor = "#ffeb3b";
                                questionText.innerText = "SOAL: " + soalSedangDibawa.text + " = ...? (Cari lagi!)";
                            }, 1500);
                        }
                    }
                } else {
                    questionText.innerText = "Ambil kotak [?] SOAL dulu!";
                }
            }
        }
    }
}

spawnAllElements();
gameLoop();