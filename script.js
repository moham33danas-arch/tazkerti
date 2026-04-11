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
        navigator.serviceWorker.register('/sw.js')  // تم تغيير الاسم إلى sw.js
            .then(function(registration) {
                console.log('✅ Service Worker registered with scope:', registration.scope);
                
                // تحقق إذا فيه تحديث جديد
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

    // تحديث الصفحة عندما يصبح الـ Service Worker جاهز
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
    // إنشاء عنصر الإشعار
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
    
    // إزالة الإشعار تلقائياً بعد 10 ثواني
    setTimeout(() => {
        if (document.body.contains(notification)) {
            document.body.removeChild(notification);
        }
    }, 10000);
}

// ========== إدارة الحالة ==========
const AppState = {
    // حالة التطبيق
    currentUser: null,
    isOnline: navigator.onLine,
    
    // تهيئة التطبيق
    init() {
        this.setupEventListeners();
        this.checkAuthStatus();
        console.log('🚀 TAZKARTI App Initialized');
    },
    
    // إعداد مستمعي الأحداث
    setupEventListeners() {
        // أحداث الاتصال بالإنترنت
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.showOnlineStatus();
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.showOfflineStatus();
        });
        
        // منع الإجراءات الافتراضية (مثل النقر بزر الفأرة الأيمن) - اختياري
        document.addEventListener('contextmenu', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return; // السماح بالقائمة في حقول الإدخال
            }
            e.preventDefault();
        });
    },
    
    // التحقق من حالة المصادقة
    checkAuthStatus() {
        const token = localStorage.getItem('authToken');
        if (token) {
            this.currentUser = this.validateToken(token);
        }
    },
    
    // التحقق من صحة التوكن (مثال)
    validateToken(token) {
        try {
            // منطق التحقق من التوكن - مثال فقط
            return JSON.parse(atob(token.split('.')[1]));
        } catch (error) {
            localStorage.removeItem('authToken');
            return null;
        }
    },
    
    // عرض حالة الاتصال
    showOnlineStatus() {
        this.showToast('✅ تم استعادة الاتصال بالإنترنت', 'success');
    },
    
    showOfflineStatus() {
        this.showToast('⚠️ أنت غير متصل بالإنترنت', 'warning');
    },
    
    // عرض إشعارات (Toast)
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
        
        // تأثير ظهور
        setTimeout(() => toast.style.opacity = '1', 10);
        
        // إخفاء تلقائي بعد 3 ثواني
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

// ========== تشغيل التطبيق ==========
document.addEventListener('DOMContentLoaded', () => {
    AppState.init();
    
    // يمكن إضافة أي تهيئة إضافية هنا
    console.log('📱 TAZKARTI DOM fully loaded');
});

// ========== تصدير الدوال للاستخدام العام ==========
window.safeHTML = safeHTML;
window.displaySafeText = displaySafeText;
window.showUpdateNotification = showUpdateNotification;
window.AppState = AppState;
