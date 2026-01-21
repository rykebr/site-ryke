const slides = document.querySelectorAll('.slide');
const navBtns = document.querySelectorAll('.nav-btn');
let currentSlide = 0;
const slideInterval = 5000;

// Função Slider (Banner)
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

// --- LÓGICA DO FORMULÁRIO WHATSAPP ---
document.getElementById('formZap').addEventListener('submit', function(e) {
    e.preventDefault(); // Impede a página de recarregar

    // Pega os dados
    let nome = document.getElementById('nome').value;
    let empresa = document.getElementById('empresa').value || "Não informada";
    let condominio = document.getElementById('condominio').value;
    
    // Seu número
    let telefone = "5515981618716";

    // Cria a mensagem
    let texto = `Olá! Vim pelo site da Ryke Sistemas.\n\n*Nome:* ${nome}\n*Empresa:* ${empresa}\n*Condomínio:* ${condominio}\n\nGostaria de solicitar um orçamento.`;

    // Cria o link
    let link = `https://api.whatsapp.com/send?phone=${telefone}&text=${encodeURIComponent(texto)}`;

    // Abre em nova aba
    window.open(link, '_blank');
});