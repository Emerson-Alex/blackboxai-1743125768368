// Lista de rotas que requerem autenticação
const protectedRoutes = [
    '/cart.html',
    '/checkout.html',
    '/business-dashboard.html',
    '/business-management.html',
    '/business-compliance.html'
];

// Lista de rotas que devem redirecionar para o dashboard se o usuário já estiver autenticado
const authRoutes = [
    '/login.html',
    '/register.html',
    '/recover-password.html',
    '/reset-password.html'
];

// Verifica se a rota atual precisa de autenticação
function checkRouteProtection() {
    const currentPath = window.location.pathname;
    
    // Obtém o status de autenticação
    const isLoggedIn = isAuthenticated(); // do auth.js

    // Trata rotas protegidas
    if (protectedRoutes.includes(currentPath)) {
        if (!isLoggedIn) {
            // Armazena a URL tentada para redirecionar após o login
            sessionStorage.setItem('redirectUrl', currentPath);
            window.location.href = '/login.html';
            return;
        }
    }

    // Trata rotas de autenticação (impede usuários autenticados de acessar páginas de login/registro)
    if (authRoutes.includes(currentPath)) {
        if (isLoggedIn) {
            window.location.href = '/business-dashboard.html';
            return;
        }
    }

    // Trata redirecionamento após login
    if (isLoggedIn && sessionStorage.getItem('redirectUrl')) {
        const redirectUrl = sessionStorage.getItem('redirectUrl');
        sessionStorage.removeItem('redirectUrl');
        window.location.href = redirectUrl;
    }
}

// Adiciona proteção de rota a todas as páginas protegidas
document.addEventListener('DOMContentLoaded', () => {
    checkRouteProtection();
});

// Função para lidar com o logout do usuário
function handleLogout() {
    logout(); // do auth.js
    window.location.href = '/login.html';
}

// Adiciona indicador de carregamento
function showLoading() {
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'loading-indicator';
    loadingDiv.className = 'fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50 z-50';
    loadingDiv.innerHTML = `
        <div class="bg-white p-5 rounded-lg flex items-center space-x-3">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span class="text-gray-700">Carregando...</span>
        </div>
    `;
    document.body.appendChild(loadingDiv);
}

function hideLoading() {
    const loadingDiv = document.getElementById('loading-indicator');
    if (loadingDiv) {
        loadingDiv.remove();
    }
}

// Adiciona tratamento global de erros AJAX
window.addEventListener('unhandledrejection', function(event) {
    console.error('Erro de promessa não tratado:', event.reason);
    if (event.reason.name === 'TokenExpiredError') {
        // Trata token expirado
        logout();
        window.location.href = '/login.html?session=expired';
    }
});

// Trata parâmetro de sessão expirada
if (window.location.search.includes('session=expired')) {
    showError('Sua sessão expirou. Por favor, faça login novamente.');
    // Limpa a URL
    window.history.replaceState({}, document.title, window.location.pathname);
}