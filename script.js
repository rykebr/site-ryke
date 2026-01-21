const slides = document.querySelectorAll('.slide');
const navBtns = document.querySelectorAll('.nav-btn');
let currentSlide = 0;
const slideInterval = 5000; // Troca a cada 5 segundos

// Função para mudar o slide
function showSlide(index) {
    // Remove a classe active de todos
    slides.forEach(slide => slide.classList.remove('active'));
    navBtns.forEach(btn => btn.classList.remove('active'));

    // Adiciona na atual
    slides[index].classList.add('active');
    navBtns[index].classList.add('active');
    
    currentSlide = index;
}

// Passar automaticamente
function nextSlide() {
    let next = (currentSlide + 1) % slides.length;
    showSlide(next);
}

// Inicia o timer
let autoPlay = setInterval(nextSlide, slideInterval);

// Permite clicar nas bolinhas para mudar
function manualSlide(index) {
    clearInterval(autoPlay); // Para o timer momentaneamente
    showSlide(index);
    autoPlay = setInterval(nextSlide, slideInterval); // Reinicia
}