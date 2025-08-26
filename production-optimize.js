// 生产环境优化脚本
// 用于替换开发版本中的调试代码

function optimizeForProduction() {
    // 禁用所有console输出（生产环境）
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        console.log = function() {};
        console.warn = function() {};
        console.error = function() {};
        console.debug = function() {};
    }
    
    // 确保路径兼容性
    const isGitHubPages = window.location.hostname.includes('github.io');
    if (isGitHubPages) {
        // GitHub Pages特定优化
        document.addEventListener('DOMContentLoaded', function() {
            // 确保所有路径都是相对路径
            const images = document.querySelectorAll('img');
            images.forEach(img => {
                if (img.src.startsWith('/')) {
                    img.src = '.' + img.src;
                }
            });
        });
    }
}

// 在页面加载时运行优化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', optimizeForProduction);
} else {
    optimizeForProduction();
}