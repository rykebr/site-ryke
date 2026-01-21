const slides = document.querySelectorAll('.slide');
const navBtns = document.querySelectorAll('.nav-btn');
let currentSlide = 0;
const slideInterval = 6000; // Tempo um pouco maior para ler

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

// --- ENVIO WHATSAPP ---
document.getElementById('formZap').addEventListener('submit', function(e) {
    e.preventDefault();

    let nome = document.getElementById('nome').value;
    let empresa = document.getElementById('empresa').value || "Particular";
    let condominio = document.getElementById('condominio').value;
    
    // Seu número aqui
    let telefone = "5515981618716";

    let texto = `Olá! Vim pelo site da Ryke Sistemas.\n\n*Nome:* ${nome}\n*Condomínio:* ${condominio}\n*Empresa:* ${empresa}\n\nGostaria de solicitar um orçamento para o sistema.`;

    let link = `https://api.whatsapp.com/send?phone=${telefone}&text=${encodeURIComponent(texto)}`;
    window.open(link, '_blank');
});