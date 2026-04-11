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
        navigator.serviceWorker.register('/sw.js')
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
        font-family: 'Cairo', sans-serif;
        direction: rtl;
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

// ========== إدارة حالة التطبيق ==========
const AppState = {
    currentUser: null,
    isOnline: navigator.onLine,
    
    init() {
        this.setupEventListeners();
        this.checkAuthStatus();
        console.log('🚀 TAZKARTI App Initialized');
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
        const bgColor = type === 'success' ? '#10b981' : type === 'warning' ? '#f59e0b' : '#3b82f6';
        
        toast.style.cssText = `
            position: fixed;
            bottom: 100px;
            left: 20px;
            right: 20px;
            background: ${bgColor};
            color: white;
            padding: 12px 20px;
            border-radius: 50px;
            box-shadow: 0 8px 20px rgba(0,0,0,0.2);
            z-index: 9999;
            text-align: center;
            font-family: 'Cairo', sans-serif;
            font-weight: bold;
            transition: opacity 0.3s;
            opacity: 0;
            max-width: 400px;
            margin: 0 auto;
        `;
        
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => toast.style.opacity = '1', 10);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }
};

// ==================== PWA: معالجة حدث beforeinstallprompt ====================
let deferredPrompt;
const INSTALL_PROMPT_DISMISSED_KEY = 'pwa_install_dismissed';

// إنشاء واجهة التثبيت المخصصة (تضاف ديناميكياً)
function createInstallPromptUI() {
    // تحقق من وجود العنصر مسبقاً
    if (document.getElementById('pwa-install-prompt')) return;
    
    const promptDiv = document.createElement('div');
    promptDiv.id = 'pwa-install-prompt';
    promptDiv.style.cssText = `
        position: fixed;
        bottom: 100px;
        left: 20px;
        right: 20px;
        z-index: 9998;
        display: none;
        transition: all 0.3s;
    `;
    
    promptDiv.innerHTML = `
        <div style="
            background: rgba(15, 23, 42, 0.95);
            backdrop-filter: blur(8px);
            border: 1px solid rgba(198, 164, 76, 0.3);
            color: white;
            padding: 1rem;
            border-radius: 1.5rem;
            box-shadow: 0 20px 30px -10px rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-family: 'Cairo', sans-serif;
        ">
            <div style="display: flex; align-items: center; gap: 12px;">
                <div style="
                    width: 48px;
                    height: 48px;
                    background: rgba(198, 164, 76, 0.2);
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #C6A44C;
                    font-size: 24px;
                ">
                    <i class="fas fa-download"></i>
                </div>
                <div>
                    <div style="font-weight: 800; font-size: 1rem;">ثبّت تطبيق تزكرتي</div>
                    <div style="font-size: 0.75rem; color: #ccc;">وصول أسرع وتجربة أفضل</div>
                </div>
            </div>
            <div style="display: flex; gap: 8px;">
                <button id="pwa-install-btn" style="
                    background: #C6A44C;
                    color: #0F172A;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 40px;
                    font-weight: bold;
                    font-size: 0.875rem;
                    cursor: pointer;
                    transition: transform 0.1s;
                ">تثبيت</button>
                <button id="pwa-dismiss-btn" style="
                    background: transparent;
                    border: none;
                    color: #aaa;
                    font-size: 1.5rem;
                    cursor: pointer;
                    padding: 0 8px;
                ">×</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(promptDiv);
    
    // ربط الأحداث
    document.getElementById('pwa-install-btn').addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`PWA install outcome: ${outcome}`);
            deferredPrompt = null;
            promptDiv.style.display = 'none';
        }
    });
    
    document.getElementById('pwa-dismiss-btn').addEventListener('click', () => {
        promptDiv.style.display = 'none';
        // تخزين وقت الرفض لتجنب الإظهار المتكرر
        localStorage.setItem(INSTALL_PROMPT_DISMISSED_KEY, Date.now());
    });
    
    return promptDiv;
}

// التقاط حدث beforeinstallprompt
window.addEventListener('beforeinstallprompt', (e) => {
    // منع ظهور المطالبة التلقائية
    e.preventDefault();
    // حفظ الحدث
    deferredPrompt = e;
    
    // التحقق من أن التطبيق غير مثبت بالفعل
    if (window.matchMedia('(display-mode: standalone)').matches) {
        console.log('App already installed (standalone mode)');
        return;
    }
    
    // التحقق من عدم رفض المستخدم مؤخراً (خلال 3 أيام)
    const dismissedAt = localStorage.getItem(INSTALL_PROMPT_DISMISSED_KEY);
    if (dismissedAt) {
        const daysSinceDismissed = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60 * 24);
        if (daysSinceDismissed < 3) {
            console.log('Install prompt dismissed recently, skipping');
            return;
        }
    }
    
    // إنشاء وإظهار واجهة التثبيت
    const promptUI = createInstallPromptUI();
    promptUI.style.display = 'block';
    
    console.log('✅ beforeinstallprompt captured, showing install prompt');
});

// التأكد من إخفاء الواجهة إذا تم تثبيت التطبيق لاحقاً
window.addEventListener('appinstalled', () => {
    console.log('PWA installed successfully');
    const promptUI = document.getElementById('pwa-install-prompt');
    if (promptUI) promptUI.style.display = 'none';
    deferredPrompt = null;
    AppState.showToast('✅ تم تثبيت التطبيق بنجاح!', 'success');
});

// ========== تشغيل التطبيق ==========
document.addEventListener('DOMContentLoaded', () => {
    AppState.init();
    console.log('📱 TAZKARTI DOM fully loaded');
    
    // إضافة دالة مساعدة للاستدعاء اليدوي (اختياري)
    window.triggerInstallPrompt = function() {
        if (deferredPrompt) {
            deferredPrompt.prompt();
        } else {
            // إذا لم يتوفر الحدث، نوجه المستخدم للطريقة اليدوية
            alert('خاصية التثبيت غير متوفرة حالياً.\nيمكنك استخدام قائمة المتصفح (⋮) ثم "تثبيت التطبيق" أو "إضافة إلى الشاشة الرئيسية".');
        }
    };
});

// ========== تصدير الدوال للاستخدام العام ==========
window.safeHTML = safeHTML;
window.displaySafeText = displaySafeText;
window.showUpdateNotification = showUpdateNotification;
window.AppState = AppState;
