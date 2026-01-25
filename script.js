document.addEventListener('DOMContentLoaded', () => {
    
    // ===============================================
    // 1. MENU HAMBÚRGUER (Lógica Rockstar)
    // ===============================================
    const menuBtn = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    const bars = document.querySelectorAll('.bar');
    let isMenuOpen = false;

    menuBtn.addEventListener('click', () => {
        toggleMenuLayout();
    });

    // Fechar ao clicar fora
    document.addEventListener('click', (e) => {
        if (!sidebar.contains(e.target) && !menuBtn.contains(e.target) && isMenuOpen) {
            toggleMenuLayout();
        }
    });

    // Fechar ao clicar em um link do menu
    const menuLinks = sidebar.querySelectorAll('a');
    menuLinks.forEach(link => {
        link.addEventListener('click', () => {
            if(isMenuOpen) toggleMenuLayout();
        });
    });

    function toggleMenuLayout() {
        isMenuOpen = !isMenuOpen;
        if (isMenuOpen) {
            sidebar.classList.add('active');
            bars[0].style.transform = 'rotate(45deg) translate(5px, 6px)';
            bars[1].style.opacity = '0';
            bars[2].style.transform = 'rotate(-45deg) translate(5px, -6px)';
        } else {
            sidebar.classList.remove('active');
            bars[0].style.transform = 'none';
            bars[1].style.opacity = '1';
            bars[2].style.transform = 'none';
        }
    }

    // ===============================================
    // 2. WIDGET RELÓGIO (Lógica Ryke)
    // ===============================================
    function atualizarRelogio() {
        const now = new Date();
        const horas = String(now.getHours()).padStart(2, '0');
        const minutos = String(now.getMinutes()).padStart(2, '0');
        const elementoRelogio = document.getElementById('hora-atual');
        if (elementoRelogio) {
            elementoRelogio.textContent = `${horas}:${minutos}`;
        }
    }
    setInterval(atualizarRelogio, 1000);
    atualizarRelogio();

    // ===============================================
    // 3. FORMULÁRIO WHATSAPP (Lógica Ryke)
    // ===============================================
    const formZap = document.getElementById('formZap');
    if (formZap) {
        formZap.addEventListener('submit', function(e) {
            e.preventDefault();
            
            let nome = document.getElementById('nome').value;
            let empresa = document.getElementById('empresa').value || "Particular";
            let condominio = document.getElementById('condominio').value;
            let telefone = "5515981618716"; // Número mantido do original
            
            let texto = `Olá! Vim pelo novo site da Ryke (Estilo Rockstar).\n\n*Nome:* ${nome}\n*Condomínio:* ${condominio}\n*Empresa:* ${empresa}\n\nGostaria de solicitar um orçamento.`;
            
            let link = `https://api.whatsapp.com/send?phone=${telefone}&text=${encodeURIComponent(texto)}`;
            window.open(link, '_blank');
        });
    }

});