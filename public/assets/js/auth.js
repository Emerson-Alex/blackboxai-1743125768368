// Constantes relacionadas à autenticação
const API_URL = 'https://api.eshop.com'; // Substitua com a URL real da sua API
const TOKEN_KEY = 'eshop_token';

// Gerenciamento do token JWT
const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
const getToken = () => localStorage.getItem(TOKEN_KEY);
const removeToken = () => localStorage.removeItem(TOKEN_KEY);

// Validação de e-mail
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Validação de senha
const isValidPassword = (password) => {
    const minLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*]/.test(password);
    return minLength && hasUpperCase && hasNumber && hasSpecialChar;
};

// Cadastro de usuário
async function register(event) {
    event.preventDefault();
    
    const name = document.getElementById('name').value;
    const email = document.getElementById('email-address').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const terms = document.getElementById('terms').checked;

    // Validações
    if (!name || !email || !password || !confirmPassword) {
        showError('Todos os campos são obrigatórios');
        return;
    }

    if (!isValidEmail(email)) {
        showError('Email inválido');
        return;
    }

    if (!isValidPassword(password)) {
        showError('A senha não atende aos requisitos mínimos');
        return;
    }

    if (password !== confirmPassword) {
        showError('As senhas não coincidem');
        return;
    }

    if (!terms) {
        showError('Você precisa aceitar os termos de serviço');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name,
                email,
                password
            })
        });

        const data = await response.json();

        if (response.ok) {
            showSuccess('Conta criada com sucesso! Redirecionando...');
            setToken(data.token);
            setTimeout(() => {
                window.location.href = '/index.html';
            }, 2000);
        } else {
            showError(data.message || 'Erro ao criar conta');
        }
    } catch (error) {
        showError('Erro ao conectar com o servidor');
    }
}

// Login do usuário
async function login(event) {
    event.preventDefault();
    
    const email = document.getElementById('email-address').value;
    const password = document.getElementById('password').value;
    const remember = document.getElementById('remember-me').checked;

    if (!email || !password) {
        showError('Email e senha são obrigatórios');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email,
                password,
                remember
            })
        });

        const data = await response.json();

        if (response.ok) {
            showSuccess('Login realizado com sucesso! Redirecionando...');
            setToken(data.token);
            setTimeout(() => {
                const redirectUrl = sessionStorage.getItem('redirectUrl') || '/index.html';
                sessionStorage.removeItem('redirectUrl');
                window.location.href = redirectUrl;
            }, 2000);
        } else {
            showError(data.message || 'Credenciais inválidas');
        }
    } catch (error) {
        showError('Erro ao conectar com o servidor');
    }
}

// Logout do usuário
function logout() {
    removeToken();
    window.location.href = '/login.html';
}

// Gerenciamento de mensagens
function showMessage(message, type = 'error') {
    // Remove mensagens existentes
    const existingMessages = document.querySelectorAll('.alert-message');
    existingMessages.forEach(msg => msg.remove());

    const messageDiv = document.createElement('div');
    messageDiv.className = `alert-message relative mt-4 px-4 py-3 rounded ${
        type === 'error' 
            ? 'bg-red-100 border border-red-400 text-red-700' 
            : 'bg-green-100 border border-green-400 text-green-700'
    }`;
    messageDiv.role = 'alert';

    const icon = type === 'error' ? 'times-circle' : 'check-circle';
    const iconClass = type === 'error' ? 'text-red-500' : 'text-green-500';

    messageDiv.innerHTML = `
        <div class="flex items-center">
            <i class="fas fa-${icon} ${iconClass} mr-2"></i>
            <span class="block sm:inline">${message}</span>
        </div>
        <button class="absolute top-0 bottom-0 right-0 px-4 py-3" onclick="this.parentElement.remove()">
            <i class="fas fa-times ${iconClass}"></i>
        </button>
    `;
    
    const form = document.querySelector('form');
    form.parentNode.insertBefore(messageDiv, form.nextSibling);

    // Remove a mensagem após 5 segundos
    setTimeout(() => {
        if (messageDiv.parentElement) {
            messageDiv.remove();
        }
    }, 5000);
}

// Exibir mensagem de erro
function showError(message) {
    showMessage(message, 'error');
}

// Exibir mensagem de sucesso
function showSuccess(message) {
    showMessage(message, 'success');
}

// Verificar status da autenticação
function isAuthenticated() {
    const token = getToken();
    if (!token) return false;

    // Verifica se o token está expirado
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const isExpired = payload.exp <= Date.now() / 1000;
        
        if (isExpired) {
            removeToken();
            showError('Sua sessão expirou. Por favor, faça login novamente.');
            return false;
        }
        
        // Se o token estiver próximo de expirar (menos de 5 minutos), tenta renovar
        const expiresInSeconds = payload.exp - (Date.now() / 1000);
        if (expiresInSeconds < 300) {
            refreshToken();
        }
        
        return true;
    } catch (error) {
        removeToken();
        return false;
    }
}

// Renovar token
async function refreshToken() {
    try {
        const token = getToken();
        if (!token) return;

        const response = await fetch(`${API_URL}/auth/refresh`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            setToken(data.token);
        }
    } catch (error) {
        console.error('Erro ao renovar o token:', error);
    }
}

// Proteger rotas
function protectRoute() {
    if (!isAuthenticated()) {
        window.location.href = '/login.html';
    }
}