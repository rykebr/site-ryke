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
// EFEITO ROCKSTAR V2 (NITIDEZ PROLONGADA + TRANSIÇÃO SUAVE)
// ======================================================

document.addEventListener("DOMContentLoaded", () => {
    const sections = document.querySelectorAll(".rockstar-section");

    // 1. Prepara as seções (Injeta o BG fixo)
    sections.forEach(sec => {
        const imgSrc = sec.getAttribute("data-bg");
        if (imgSrc) {
            // Cria o elemento de fundo fixo
            const bgDiv = document.createElement("div");
            bgDiv.classList.add("rockstar-bg");
            bgDiv.style.backgroundImage = `url('${imgSrc}')`;
            
            // Camada escura
            const overlayDiv = document.createElement("div");
            overlayDiv.classList.add("rockstar-overlay");

            sec.prepend(overlayDiv);
            sec.prepend(bgDiv);
        }
    });

    // 2. Função de Animação Otimizada
    function onScroll() {
        const viewHeight = window.innerHeight;
        const centerView = viewHeight / 2;

        sections.forEach(sec => {
            const bg = sec.querySelector(".rockstar-bg");
            if (!bg) return;

            const rect = sec.getBoundingClientRect();
            const sectionCenter = rect.top + (rect.height / 2);
            
            // Distância do centro da seção até o centro da tela
            // Valor negativo = seção subindo (saindo por cima)
            // Valor positivo = seção descendo (saindo por baixo)
            const dist = sectionCenter - centerView;
            
            // Normaliza a distância (0 = centro, 1 = borda da tela)
            let normalizedDist = Math.abs(dist) / (viewHeight * 0.85); // 0.85 aumenta a zona ativa

            // --- AQUI ESTÁ O SEGREDO DA NITIDEZ ---
            // Zona Segura: Se a distância for pequena (ex: < 0.3), mantém 100% nítido
            let effectStartThreshold = 0.35; 
            
            let effectFactor = 0;
            if (normalizedDist > effectStartThreshold) {
                // Calcula o efeito apenas para a parte que excede o limite
                effectFactor = (normalizedDist - effectStartThreshold) / (1 - effectStartThreshold);
            }
            
            // Limita o fator entre 0 e 1
            if (effectFactor < 0) effectFactor = 0;
            if (effectFactor > 1) effectFactor = 1;

            // APLICAÇÃO DOS EFEITOS
            // 1. Blur: Começa suave e aumenta (Máximo 15px, não muito exagerado)
            const blurAmount = effectFactor * 15; 
            
            // 2. Opacidade: Mantém alta por mais tempo. Mínimo de 0.4 para evitar fundo preto total.
            // A transição será feita pela sobreposição da próxima seção vindo por cima.
            let opacityAmount = 1 - (effectFactor * 0.6); 
            
            // 3. Scale: Dá um leve zoom quando sai para dar sensação de movimento
            let scaleAmount = 1.1 + (effectFactor * 0.1);

            // 4. Parallax Leve: Move o fundo um pouco para "alongar" a imagem
            // Se está subindo (dist < 0), move imagem para baixo (+)
            const parallaxY = dist * 0.15; 

            // Aplica os estilos com aceleração de hardware (translate3d)
            bg.style.transform = `translate3d(0, ${parallaxY}px, 0) scale(${scaleAmount})`;
            bg.style.filter = `blur(${blurAmount}px)`;
            bg.style.opacity = opacityAmount.toFixed(2);
        });
    }

    // Loop de renderização suave
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
    
    // Inicia
    onScroll();
});