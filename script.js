// ======================================================
// 1. MENU MOBILE (FUNÇÃO GLOBAL PARA O ONCLICK)
// ======================================================
function toggleMenu() {
    const nav = document.getElementById('nav-menu');
    nav.classList.toggle('active');
}

// ======================================================
// 2. LÓGICA DO SLIDER PRINCIPAL (HERO)
// ======================================================
// Seleciona os elementos somente após o carregamento ou se o script estiver no final do body
const slides = document.querySelectorAll('.slide');
const navBtns = document.querySelectorAll('.nav-btn');
let currentSlide = 0;
const slideInterval = 6000;

function showSlide(index) {
    // Garante que existem slides antes de tentar manipular
    if (slides.length === 0) return;

    slides.forEach(slide => slide.classList.remove('active'));
    navBtns.forEach(btn => btn.classList.remove('active'));
    
    // Usa operador % para garantir loop infinito seguro
    if (index >= slides.length) index = 0;
    if (index < 0) index = slides.length - 1;

    slides[index].classList.add('active');
    navBtns[index].classList.add('active');
    currentSlide = index;
}

function nextSlide() {
    showSlide(currentSlide + 1);
}

let autoPlay = setInterval(nextSlide, slideInterval);

// Função usada nos botões de bolinha do slider
function manualSlide(index) {
    clearInterval(autoPlay);
    showSlide(index);
    autoPlay = setInterval(nextSlide, slideInterval);
}

// ======================================================
// 3. WIDGET RELÓGIO
// ======================================================
function atualizarRelogio() {
    const now = new Date();
    const horas = String(now.getHours()).padStart(2, '0');
    const minutos = String(now.getMinutes()).padStart(2, '0');
    const elementoRelogio = document.getElementById('hora-atual');
    if (elementoRelogio) {
        elementoRelogio.textContent = `${horas}:${minutos}`;
    }
}
// Inicia o relógio
setInterval(atualizarRelogio, 1000);
atualizarRelogio();

// ======================================================
// 4. FUNÇÕES QUE PRECISAM DO DOM CARREGADO
// ======================================================
document.addEventListener("DOMContentLoaded", () => {
    
    // --- WHATSAPP FORM ---
    const formZap = document.getElementById('formZap');
    if (formZap) {
        formZap.addEventListener('submit', function(e) {
            e.preventDefault();
            let nome = document.getElementById('nome').value;
            let empresa = document.getElementById('empresa').value || "Particular";
            let condominio = document.getElementById('condominio').value;
            let telefone = "5515981618716";
            
            let texto = `Olá! Vim pelo site da Ryke Sistemas.\n\n*Nome:* ${nome}\n*Condomínio:* ${condominio}\n*Empresa:* ${empresa}\n\nGostaria de solicitar um orçamento.`;
            let link = `https://api.whatsapp.com/send?phone=${telefone}&text=${encodeURIComponent(texto)}`;
            window.open(link, '_blank');
        });
    }

    // --- FECHAR MENU AO CLICAR EM LINK (MOBILE) ---
    const navLinks = document.querySelectorAll('#nav-menu a');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            const nav = document.getElementById('nav-menu');
            if (nav.classList.contains('active')) {
                nav.classList.remove('active');
            }
        });
    });

    // --- EFEITO ROCKSTAR V2 ---
    const sections = document.querySelectorAll(".rockstar-section");
    sections.forEach(sec => {
        const imgSrc = sec.getAttribute("data-bg");
        if (imgSrc) {
            const bgDiv = document.createElement("div");
            bgDiv.classList.add("rockstar-bg");
            bgDiv.style.backgroundImage = `url('${imgSrc}')`;
            
            const overlayDiv = document.createElement("div");
            overlayDiv.classList.add("rockstar-overlay");

            sec.prepend(overlayDiv);
            sec.prepend(bgDiv);
        }
    });

    function onScroll() {
        const viewHeight = window.innerHeight;
        const centerView = viewHeight / 2;

        sections.forEach(sec => {
            const bg = sec.querySelector(".rockstar-bg");
            if (!bg) return;

            const rect = sec.getBoundingClientRect();
            const sectionCenter = rect.top + (rect.height / 2);
            const dist = sectionCenter - centerView;
            
            // Cálculos do efeito
            let normalizedDist = Math.abs(dist) / (viewHeight * 0.85); 
            let effectStartThreshold = 0.35; 
            
            let effectFactor = 0;
            if (normalizedDist > effectStartThreshold) {
                effectFactor = (normalizedDist - effectStartThreshold) / (1 - effectStartThreshold);
            }
            if (effectFactor < 0) effectFactor = 0;
            if (effectFactor > 1) effectFactor = 1;

            const blurAmount = effectFactor * 15; 
            let opacityAmount = 1 - (effectFactor * 0.6); 
            let scaleAmount = 1.1 + (effectFactor * 0.1);
            const parallaxY = dist * 0.15; 

            // Aplica estilos
            bg.style.transform = `translate3d(0, ${parallaxY}px, 0) scale(${scaleAmount})`;
            bg.style.filter = `blur(${blurAmount}px)`;
            bg.style.opacity = opacityAmount.toFixed(2);
        });
    }

    let ticking = false;
    window.addEventListener("scroll", () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                onScroll();
                ticking = false;
            });
            ticking = true;
        }
    });
    // Inicia o efeito
    onScroll();
});