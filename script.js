// --- LÓGICA DO SLIDER PRINCIPAL (HERO) ---
const slides = document.querySelectorAll('.slide');
const navBtns = document.querySelectorAll('.nav-btn');
let currentSlide = 0;
const slideInterval = 6000;

function showSlide(index) {
    slides.forEach(slide => slide.classList.remove('active'));
    navBtns.forEach(btn => btn.classList.remove('active'));
    slides[index].classList.add('active');
    navBtns[index].classList.add('active');
    currentSlide = index;
}

function nextSlide() {
    let next = (currentSlide + 1) % slides.length;
    showSlide(next);
}

let autoPlay = setInterval(nextSlide, slideInterval);

function manualSlide(index) {
    clearInterval(autoPlay);
    showSlide(index);
    autoPlay = setInterval(nextSlide, slideInterval);
}

// --- LÓGICA DO WHATSAPP ---
document.getElementById('formZap').addEventListener('submit', function(e) {
    e.preventDefault();
    let nome = document.getElementById('nome').value;
    let empresa = document.getElementById('empresa').value || "Particular";
    let condominio = document.getElementById('condominio').value;
    let telefone = "5515981618716";
    let texto = `Olá! Vim pelo site da Ryke Sistemas.\n\n*Nome:* ${nome}\n*Condomínio:* ${condominio}\n*Empresa:* ${empresa}\n\nGostaria de solicitar um orçamento.`;
    let link = `https://api.whatsapp.com/send?phone=${telefone}&text=${encodeURIComponent(texto)}`;
    window.open(link, '_blank');
});

// ======================================================
// EFEITO ROCKSTAR (BLUR E FADE NO SCROLL)
// ======================================================

document.addEventListener("DOMContentLoaded", () => {
    const sections = document.querySelectorAll(".rockstar-section");

    // 1. Prepara as seções (Injeta o BG e Overlay)
    sections.forEach(sec => {
        const imgSrc = sec.getAttribute("data-bg");
        if (imgSrc) {
            // Cria o elemento de fundo
            const bgDiv = document.createElement("div");
            bgDiv.classList.add("rockstar-bg");
            bgDiv.style.backgroundImage = `url('${imgSrc}')`;
            
            // Cria a camada escura
            const overlayDiv = document.createElement("div");
            overlayDiv.classList.add("rockstar-overlay");

            // Insere no começo da seção
            sec.prepend(overlayDiv);
            sec.prepend(bgDiv);
        }
    });

    // 2. Função de Animação
    function onScroll() {
        const viewHeight = window.innerHeight;
        const centerView = viewHeight / 2;

        sections.forEach(sec => {
            const bg = sec.querySelector(".rockstar-bg");
            if (!bg) return;

            const rect = sec.getBoundingClientRect();
            
            // Ponto central da seção
            const sectionCenter = rect.top + (rect.height / 2);
            
            // Distância do centro da seção até o centro da tela
            const dist = sectionCenter - centerView;
            
            // Efeito Parallax (Move a imagem um pouco para dar profundidade)
            // Se rect.top for negativo (subindo), move o BG para baixo (positivo) devagar
            const parallaxY = rect.top * 0.4; 
            
            // Cálculo do Desfoque e Opacidade
            // Quanto mais longe do centro, mais desfocado e transparente
            // 600px de distância = 100% efeito
            const maxDist = viewHeight * 0.7; 
            let percent = Math.abs(dist) / maxDist;
            
            // Limita porcentagem entre 0 e 1
            if (percent > 1) percent = 1;
            
            // Aplica os efeitos
            // Se estiver no centro (percent=0): Blur 0px, Opacidade 1
            // Se estiver longe (percent=1): Blur 15px, Opacidade 0.2
            
            const blurAmount = percent * 20; // Máximo 20px de blur
            let opacityAmount = 1 - (percent * 0.8); // Mínimo 0.2 de opacidade para não sumir total
            
            if (opacityAmount < 0) opacityAmount = 0;

            // Aplica estilos
            bg.style.transform = `translate3d(0, ${parallaxY}px, 0) scale(1.1)`; // Scale evita bordas brancas no movimento
            bg.style.filter = `blur(${blurAmount}px)`;
            bg.style.opacity = opacityAmount;
        });
    }

    // Otimiza o evento de scroll
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
    
    // Chama uma vez para iniciar
    onScroll();
});