// ========== الأمان والحماية ==========
function safeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function displaySafeText(elementId, text) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = text;
    }
}

// ========== Service Worker Registration ==========
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/service-worker.js')
            .then(function(registration) {
                console.log('✅ Service Worker registered with scope:', registration.scope);
                
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    console.log('🔄 New Service Worker found!');
                    
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            console.log('📦 New content available - please refresh!');
                            showUpdateNotification();
                        }
                    });
                });
            })
            .catch(function(error) {
                console.log('❌ Service Worker registration failed:', error);
            });
    });

    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
            refreshing = true;
            console.log('🔄 Controller changed - reloading page');
            window.location.reload();
        }
    });
}

// ========== إشعار التحديث ==========
function showUpdateNotification() {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #1e3a8a;
        color: white;
        padding: 15px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        max-width: 300px;
        font-family: Arial, sans-serif;
    `;
    
    notification.innerHTML = safeHTML(`
        <div style="margin-bottom: 10px;">
            <strong>تحديث جديد متاح!</strong>
        </div>
        <button onclick="location.reload()" style="
            background: white;
            color: #1e3a8a;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
        ">تحديث الآن</button>
    `);
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (document.body.contains(notification)) {
            document.body.removeChild(notification);
        }
    }, 10000);
}

// ========== إدارة الحالة ==========
const AppState = {
    currentUser: null,
    isOnline: navigator.onLine,
    
    init() {
        this.setupEventListeners();
        this.checkAuthStatus();
        console.log('🚀 Tazkerti App Initialized');
    },
    
    setupEventListeners() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.showOnlineStatus();
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.showOfflineStatus();
        });
        
        document.addEventListener('contextmenu', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }
            e.preventDefault();
        });
    },
    
    checkAuthStatus() {
        const token = localStorage.getItem('authToken');
        if (token) {
            this.currentUser = this.validateToken(token);
        }
    },
    
    validateToken(token) {
        try {
            return JSON.parse(atob(token.split('.')[1]));
        } catch (error) {
            localStorage.removeItem('authToken');
            return null;
        }
    },
    
    showOnlineStatus() {
        this.showToast('✅ تم استعادة الاتصال بالإنترنت', 'success');
    },
    
    showOfflineStatus() {
        this.showToast('⚠️ أنت غير متصل بالإنترنت', 'warning');
    },
    
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        const styles = {
            info: 'background: #3b82f6; color: white;',
            success: 'background: #10b981; color: white;',
            warning: 'background: #f59e0b; color: white;',
            error: 'background: #ef4444; color: white;'
        };
        
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            padding: 12px 24px;
            border-radius: 6px;
            z-index: 9999;
            font-weight: bold;
            ${styles[type] || styles.info}
        `;
        
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            if (document.body.contains(toast)) {
                document.body.removeChild(toast);
            }
        }, 3000);
    }
};

// ========== الأدوات المساعدة ==========
const Utils = {
    formatDate(date) {
        return new Date(date).toLocaleDateString('ar-EG');
    },
    
    sanitizeInput(input) {
        return input.trim().replace(/[<>]/g, '');
    },
    
    async loadPage(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Network error');
            return await response.text();
        } catch (error) {
            console.error('❌ Error loading page:', error);
            return '<p>خطأ في تحميل الصفحة</p>';
        }
    },
    
    smoothScrollTo(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    }
};

// ========== تهيئة التطبيق عند تحميل الصفحة ==========
document.addEventListener('DOMContentLoaded', function() {
    AppState.init();
    
    // يمكنك تغيير العناوين حسب الحاجة
    displaySafeText('app-title', 'تطبيق تذكرة');
    
    if (!AppState.isOnline) {
        AppState.showOfflineStatus();
    }
});

// ========== التعامل مع الأخطاء العامة ==========
window.addEventListener('error', function(e) {
    console.error('💥 Global error:', e.error);
});

// جعل بعض الدوال متاحة عالميًا
window.safeHTML = safeHTML;
window.displaySafeText = displaySafeText;
window.AppState = AppState;
window.Utils = Utils;
