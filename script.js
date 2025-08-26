// CS战术板 - 多人协作版
class CSStrategyBoard {
    constructor() {
        console.log('开始初始化CSStrategyBoard...');
        
        this.currentUser = null;
        this.roomId = 'MAIN_ROOM';
        this.currentTool = 'move';
        this.isDrawing = false;
        this.users = new Map();
        this.shapes = [];
        this.history = [];
        this.redoStack = [];
        this.isConnected = false;
        this.realtimeSync = new RealtimeSync();
        
        // 道具数量限制
        this.itemCounts = {
            smoke: 0,
            fire: 0,
            grenade: 0,
            flash: 0,
            playerT: 0,
            playerCT: 0
        };
        
        this.maxCounts = {
            smoke: 5,
            fire: 5,
            grenade: 5,
            flash: 10,
            playerT: 5,
            playerCT: 5
        };
        
        // 画布相关
        this.canvas = null;
        this.ctx = null;
        this.startX = 0;
        this.startY = 0;
        this.currentShape = null;
        
        // 地图资源
        this.maps = {
            'de_dust2': 'maps/de_dust2.jpg',
            'de_mirage': 'maps/de_mirage.jpg',
            'de_inferno': 'maps/de_inferno.jpg'
        };
        this.currentMap = 'de_dust2';
        this.mapImage = null;
        
        console.log('属性初始化完成，开始调用init...');
        this.init();
    }
    
    init() {
        console.log('😠 紧急修复工具栏显示问题...');
        this.emergencyToolbarFix(); // 紧急修复
        this.bindEvents();
        this.loadMapImage();
        this.setupRealtimeSync();
        this.setupToolbarScrollDetection(); // 添加工具栏滚动检测
        this.setupContentOverflowWarning(); // 添加内容溢出警告系统
        this.setupGlobalContentVisibilityMonitoring(); // 添加全局内容可见性监控
    }
    
    // 紧急修复工具栏显示问题
    emergencyToolbarFix() {
        console.log('😡 正在执行最强力的工具栏修复...');
        
        const toolbar = document.getElementById('toolbar');
        if (!toolbar) {
            console.error('⚠️ 工具栏元素不存在！');
            return;
        }
        
        // 检测是否为移动端
        const isMobile = window.innerWidth <= 768;
        
        if (isMobile) {
            // 移动端：底部垂直布局，支持滚动
            toolbar.style.cssText = `
                display: flex !important;
                position: fixed !important;
                bottom: 0 !important;
                left: 0 !important;
                right: 0 !important;
                top: auto !important;
                width: 100% !important;
                height: 90px !important;
                z-index: 10000 !important;
                visibility: visible !important;
                opacity: 1 !important;
                pointer-events: auto !important;
                background: rgba(255, 255, 255, 0.98) !important;
                backdrop-filter: blur(25px) !important;
                border-top: 2px solid rgba(0, 122, 255, 0.3) !important;
                border-left: none !important;
                flex-direction: column !important;
                padding: 8px 6px !important;
                gap: 4px !important;
                overflow-x: hidden !important;
                overflow-y: auto !important;
                box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15) !important;
                -webkit-overflow-scrolling: touch !important;
                scroll-behavior: smooth !important;
            `;
            
            // 移动端主内容区调整 - 占满整个屏幕
            const mainContent = document.querySelector('.main-content');
            if (mainContent) {
                mainContent.style.cssText = `
                    position: fixed !important;
                    top: 40px !important;
                    bottom: 60px !important;
                    left: 0 !important;
                    right: 0 !important;
                    width: 100% !important;
                    display: flex !important;
                    flex: 1 !important;
                    overflow: hidden !important;
                `;
            }
        } else {
            // 桌面端：右侧垂直布局，上移位置
            toolbar.style.cssText = `
                display: flex !important;
                position: fixed !important;
                top: 40px !important;
                right: 0 !important;
                bottom: 0 !important;
                left: auto !important;
                width: 220px !important;
                height: auto !important;
                z-index: 999999 !important;
                visibility: visible !important;
                opacity: 1 !important;
                pointer-events: auto !important;
                background: rgba(255, 255, 255, 0.95) !important;
                backdrop-filter: blur(20px) !important;
                border-left: 2px solid rgba(0, 122, 255, 0.3) !important;
                flex-direction: column !important;
                padding: 15px !important;
                gap: 10px !important;
                overflow-y: auto !important;
                box-shadow: -4px 0 20px rgba(0, 0, 0, 0.1) !important;
            `;
            
            // 桌面端主内容区调整
            const mainContent = document.querySelector('.main-content');
            if (mainContent) {
                mainContent.style.cssText = `
                    position: fixed !important;
                    top: 40px !important;
                    bottom: 0 !important;
                    left: 0 !important;
                    right: 220px !important;
                    display: flex !important;
                    flex: 1 !important;
                    overflow: hidden !important;
                `;
            }
        }
        
        // 确保所有工具按钮可见
        const toolButtons = toolbar.querySelectorAll('.tool-btn');
        toolButtons.forEach(btn => {
            btn.style.display = 'flex';
            btn.style.visibility = 'visible';
            btn.style.opacity = '1';
        });
        
        // 确保所有工具组可见
        const toolGroups = toolbar.querySelectorAll('.tool-group');
        toolGroups.forEach(group => {
            group.style.display = 'flex';
            group.style.visibility = 'visible';
            group.style.opacity = '1';
        });
        
        // 确保所有工具栏行可见
        const toolbarRows = toolbar.querySelectorAll('.toolbar-row');
        toolbarRows.forEach(row => {
            row.style.display = 'flex';
            row.style.visibility = 'visible';
            row.style.opacity = '1';
        });
        
        console.log(`✅ 超级强力修复完成！${isMobile ? '移动端底部' : '桌面端右侧'}工具栏绝对显示`);
    }
    
    setupRealtimeSync() {
        this.realtimeSync.setCallbacks({
            onRoomUpdate: (roomData) => {
                this.handleRealtimeUpdate(roomData);
            },
            onUserJoin: (userData) => {
                console.log(`👋 新用户加入: ${userData.user ? userData.user.name : '未知用户'}`);
                this.showNotification(`${userData.user ? userData.user.name : '用户'} 加入了房间`, 'info');
            },
            onUserLeave: (userData) => {
                console.log(`🚪 用户离开: ${userData.userName || userData.userId}`);
                this.showNotification(`${userData.userName || '用户'} 离开了房间`, 'info');
            }
        });
    }
    
    // 设置工具栏滚动检测，确保所有内容可见
    setupToolbarScrollDetection() {
        const toolbar = document.getElementById('toolbar');
        if (!toolbar) return;
        
        // 增强的滚动能力检测函数
        const checkScrollability = () => {
            const isVerticalScrollable = toolbar.scrollHeight > toolbar.clientHeight;
            const isHorizontalScrollable = toolbar.scrollWidth > toolbar.clientWidth;
            const hasOverflow = isVerticalScrollable || isHorizontalScrollable;
            
            // 设置滚动相关的CSS类
            if (hasOverflow) {
                toolbar.classList.add('scrollable', 'has-scroll');
            } else {
                toolbar.classList.remove('scrollable', 'has-scroll');
            }
            
            // 记录详细的滚动状态信息
            console.log('📊 工具栏内容状态检测:', {
                工具栏实际高度: toolbar.scrollHeight,
                工具栏显示高度: toolbar.clientHeight,
                工具栏实际宽度: toolbar.scrollWidth,
                工具栏显示宽度: toolbar.clientWidth,
                需要垂直滚动: isVerticalScrollable,
                需要水平滚动: isHorizontalScrollable,
                总滚动状态: hasOverflow ? '需要滚动' : '无需滚动',
                子元素数量: toolbar.children.length
            });
            
            // 如果需要滚动，显示提示信息
            if (hasOverflow) {
                console.log('✅ 工具栏内容可滚动，所有内容均可访问');
            }
            
            // 确保滚动指示器正确显示
            updateScrollIndicators();
        };
        
        // 增强的滚动指示器更新函数
        const updateScrollIndicators = () => {
            const scrollTop = toolbar.scrollTop;
            const scrollLeft = toolbar.scrollLeft;
            const maxScrollTop = toolbar.scrollHeight - toolbar.clientHeight;
            const maxScrollLeft = toolbar.scrollWidth - toolbar.clientWidth;
            
            // 更加精确的滚动指示器显示逻辑
            const shouldShowTopIndicator = maxScrollTop > 5 && scrollTop > 5;
            const shouldShowBottomIndicator = maxScrollTop > 5 && scrollTop < (maxScrollTop - 5);
            const shouldShowLeftIndicator = maxScrollLeft > 5 && scrollLeft > 5;
            const shouldShowRightIndicator = maxScrollLeft > 5 && scrollLeft < (maxScrollLeft - 5);
            
            if (shouldShowTopIndicator || shouldShowBottomIndicator || shouldShowLeftIndicator || shouldShowRightIndicator) {
                toolbar.classList.add('has-scroll');
            } else if (maxScrollTop <= 5 && maxScrollLeft <= 5) {
                toolbar.classList.remove('has-scroll');
            }
        };
        
        // 初始检测（多次检测确保准确性）
        setTimeout(checkScrollability, 50);
        setTimeout(checkScrollability, 150);
        setTimeout(checkScrollability, 300);
        
        // 窗口大小改变时重新检测（防抖处理）
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                checkScrollability();
                console.log('📱 窗口大小改变，重新检测工具栏滚动状态');
            }, 100);
        });
        
        // 工具栏内容改变时重新检测（增强版）
        const observer = new MutationObserver((mutations) => {
            let shouldRecheck = false;
            mutations.forEach(mutation => {
                if (mutation.type === 'childList' || 
                    (mutation.type === 'attributes' && 
                     ['class', 'style'].includes(mutation.attributeName))) {
                    shouldRecheck = true;
                }
            });
            
            if (shouldRecheck) {
                setTimeout(checkScrollability, 50);
                console.log('🔄 工具栏内容发生变化，重新检测滚动状态');
            }
        });
        
        observer.observe(toolbar, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class', 'style', 'hidden']
        });
        
        // 增强的滚动事件监听，提供实时视觉反馈
        let scrollTimeout;
        toolbar.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            updateScrollIndicators();
            
            // 设置防抖的滚动状态检测
            scrollTimeout = setTimeout(() => {
                checkScrollability();
            }, 150);
        }, { passive: true }); // 使用被动监听优化性能
        
        // 添加键盘导航支持，确保可访问性
        toolbar.addEventListener('keydown', (e) => {
            const scrollAmount = 50;
            switch (e.key) {
                case 'ArrowUp':
                    e.preventDefault();
                    toolbar.scrollTop -= scrollAmount;
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    toolbar.scrollTop += scrollAmount;
                    break;
                case 'PageUp':
                    e.preventDefault();
                    toolbar.scrollTop -= toolbar.clientHeight * 0.8;
                    break;
                case 'PageDown':
                    e.preventDefault();
                    toolbar.scrollTop += toolbar.clientHeight * 0.8;
                    break;
                case 'Home':
                    e.preventDefault();
                    toolbar.scrollTop = 0;
                    break;
                case 'End':
                    e.preventDefault();
                    toolbar.scrollTop = toolbar.scrollHeight;
                    break;
            }
            updateScrollIndicators();
        });
        
        // 设置工具栏为可聚焦，支持键盘导航
        if (!toolbar.getAttribute('tabindex')) {
            toolbar.setAttribute('tabindex', '0');
        }
        
        console.log('✅ 增强版工具栏滚动检测设置完成，支持键盘导航');
    }
    
    // 设置内容溢出警告系统，确保用户知道所有内容都可访问
    setupContentOverflowWarning() {
        const toolbar = document.getElementById('toolbar');
        if (!toolbar) return;
        
        // 创建滚动提示元素
        const createScrollHint = () => {
            let scrollHint = document.getElementById('scroll-hint');
            if (!scrollHint) {
                scrollHint = document.createElement('div');
                scrollHint.id = 'scroll-hint';
                scrollHint.innerHTML = `
                    <div class="scroll-hint-content">
                        <span class="scroll-icon">↕️</span>
                        <span class="scroll-text">工具栏可滚动查看更多内容</span>
                        <span class="scroll-close" onclick="this.parentElement.parentElement.style.display='none'">×</span>
                    </div>
                `;
                scrollHint.style.cssText = `
                    position: fixed;
                    top: 50%;
                    right: 220px;
                    transform: translateY(-50%);
                    z-index: 9999;
                    background: linear-gradient(135deg, #007aff, #0051d5);
                    color: white;
                    padding: 8px 12px;
                    border-radius: 8px;
                    font-size: 12px;
                    font-weight: 500;
                    box-shadow: 0 4px 20px rgba(0, 122, 255, 0.3);
                    animation: fadeInOut 3s ease-in-out;
                    pointer-events: auto;
                    cursor: pointer;
                    max-width: 200px;
                    text-align: center;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    backdrop-filter: blur(10px);
                `;
                
                // 添加动画样式
                if (!document.getElementById('scroll-hint-styles')) {
                    const style = document.createElement('style');
                    style.id = 'scroll-hint-styles';
                    style.textContent = `
                        @keyframes fadeInOut {
                            0% { opacity: 0; transform: translateY(-50%) scale(0.9); }
                            10% { opacity: 1; transform: translateY(-50%) scale(1); }
                            90% { opacity: 1; transform: translateY(-50%) scale(1); }
                            100% { opacity: 0; transform: translateY(-50%) scale(0.9); }
                        }
                        .scroll-hint-content {
                            display: flex;
                            align-items: center;
                            gap: 6px;
                        }
                        .scroll-icon {
                            font-size: 14px;
                            animation: bounce 1s infinite alternate;
                        }
                        .scroll-close {
                            margin-left: auto;
                            cursor: pointer;
                            font-size: 16px;
                            opacity: 0.8;
                            transition: opacity 0.2s;
                        }
                        .scroll-close:hover {
                            opacity: 1;
                        }
                        @keyframes bounce {
                            from { transform: translateY(-2px); }
                            to { transform: translateY(2px); }
                        }
                        @media (max-width: 768px) {
                            #scroll-hint {
                                right: 10px !important;
                                max-width: 150px !important;
                                font-size: 10px !important;
                            }
                        }
                    `;
                    document.head.appendChild(style);
                }
                
                document.body.appendChild(scrollHint);
                
                // 3秒后自动隐藏
                setTimeout(() => {
                    if (scrollHint && scrollHint.parentNode) {
                        scrollHint.style.display = 'none';
                    }
                }, 3000);
            }
            return scrollHint;
        };
        
        // 检查内容是否溢出并显示提示
        const checkContentOverflow = () => {
            const hasVerticalOverflow = toolbar.scrollHeight > toolbar.clientHeight + 5;
            const hasHorizontalOverflow = toolbar.scrollWidth > toolbar.clientWidth + 5;
            
            if (hasVerticalOverflow || hasHorizontalOverflow) {
                // 只在第一次检测到溢出时显示提示
                if (!toolbar.dataset.overflowWarningShown) {
                    createScrollHint();
                    toolbar.dataset.overflowWarningShown = 'true';
                    console.log('⚠️ 检测到工具栏内容溢出，已显示滚动提示');
                }
            }
        };
        
        // 初始检查
        setTimeout(checkContentOverflow, 500);
        
        // 窗口大小改变时重新检查
        window.addEventListener('resize', () => {
            setTimeout(checkContentOverflow, 200);
        });
        
        console.log('✅ 内容溢出警告系统设置完成');
    }
    
    // 全局内容可见性监控系统，确保所有内容始终可访问且不被挤压
    setupGlobalContentVisibilityMonitoring() {
        // 强化工具栏保护机制
        const forceToolbarVisibility = () => {
            const toolbar = document.getElementById('toolbar');
            if (!toolbar) return;
            
            // 确保工具栏始终可见且不被挤压
            const style = window.getComputedStyle(toolbar);
            
            // 检查并修复显示问题
            if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
                console.log('🔧 强制修复工具栏显示问题');
                toolbar.style.display = 'flex';
                toolbar.style.visibility = 'visible';
                toolbar.style.opacity = '1';
            }
            
            // 确保工具栏有正确的层级
            const zIndex = parseInt(style.zIndex) || 0;
            if (zIndex < 9999) {
                toolbar.style.zIndex = '9999';
                console.log('🔧 修复工具栏层级问题');
            }
            
            // 确保工具栏宽度/高度不被挤压
            const isMobile = window.innerWidth <= 768;
            if (isMobile) {
                // 移动端检查高度
                const minHeight = 80; // 最小高度
                if (toolbar.offsetHeight < minHeight) {
                    toolbar.style.height = minHeight + 'px';
                    toolbar.style.minHeight = minHeight + 'px';
                    console.log('🔧 修复移动端工具栏高度被挤压问题');
                }
            } else {
                // 桌面端检查宽度
                const minWidth = 200; // 最小宽度
                if (toolbar.offsetWidth < minWidth) {
                    toolbar.style.width = minWidth + 'px';
                    toolbar.style.minWidth = minWidth + 'px';
                    console.log('🔧 修复桌面端工具栏宽度被挤压问题');
                }
            }
            
            // 确保工具按钮不被挤压
            const toolButtons = toolbar.querySelectorAll('.tool-btn');
            toolButtons.forEach((btn, index) => {
                const btnStyle = window.getComputedStyle(btn);
                if (btnStyle.display === 'none' || btnStyle.visibility === 'hidden') {
                    btn.style.display = 'flex';
                    btn.style.visibility = 'visible';
                    console.log(`🔧 修复工具按钮 ${index + 1} 被隐藏问题`);
                }
            });
        };
        
        // 监控所有关键元素的可见性
        const monitorElements = () => {
            const elementsToMonitor = [
                { selector: '#toolbar', name: '工具栏' },
                { selector: '.top-bar', name: '顶部栏' },
                { selector: '.main-content', name: '主内容区' },
                { selector: '.canvas-container', name: '地图区域' }
            ];
            
            elementsToMonitor.forEach(({ selector, name }) => {
                const element = document.querySelector(selector);
                if (element) {
                    const rect = element.getBoundingClientRect();
                    const isVisible = rect.width > 0 && rect.height > 0;
                    const isInViewport = rect.top < window.innerHeight && rect.bottom > 0;
                    
                    if (!isVisible || !isInViewport) {
                        console.warn(`⚠️ ${name}可能不可见:`, {
                            元素: selector,
                            尺寸: { 宽度: rect.width, 高度: rect.height },
                            位置: { 顶部: rect.top, 底部: rect.bottom },
                            窗口高度: window.innerHeight,
                            建议: '请检查CSS布局或尝试滚动页面'
                        });
                    }
                }
            });
        };
        
        // 检查是否有内容被裁切或挤压
        const checkContentCompression = () => {
            const toolbar = document.getElementById('toolbar');
            if (!toolbar) return;
            
            const toolGroups = toolbar.querySelectorAll('.tool-group');
            let compressedGroups = 0;
            
            toolGroups.forEach((group, index) => {
                const rect = group.getBoundingClientRect();
                const toolbarRect = toolbar.getBoundingClientRect();
                
                // 检查工具组是否被挤压
                if (rect.right > toolbarRect.right || rect.bottom > toolbarRect.bottom) {
                    compressedGroups++;
                    console.log(`📊 工具组 ${index + 1} 被挤压，需要滚动查看`);
                }
                
                // 检查工具组内的按钮是否被挤压
                const buttons = group.querySelectorAll('.tool-btn');
                buttons.forEach((btn, btnIndex) => {
                    const btnRect = btn.getBoundingClientRect();
                    if (btnRect.width < 20 || btnRect.height < 15) { // 最小可点击尺寸
                        console.warn(`⚠️ 工具按钮 ${btnIndex + 1} 被过度挤压`);
                    }
                });
            });
            
            if (compressedGroups > 0) {
                console.log(`ℹ️ 总计 ${compressedGroups} 个工具组被挤压，工具栏可滚动`);
            }
        };
        
        // 综合监控和修复
        const comprehensiveMonitoring = () => {
            forceToolbarVisibility(); // 强制保证工具栏可见
            monitorElements();
            checkContentCompression();
        };
        
        // 初始监控
        setTimeout(comprehensiveMonitoring, 500);
        
        // 高频监控（每2秒）
        setInterval(comprehensiveMonitoring, 2000);
        
        // 窗口大小改变时立即检查
        window.addEventListener('resize', () => {
            setTimeout(comprehensiveMonitoring, 100);
        });
        
        // 屏幕方向改变时检查
        window.addEventListener('orientationchange', () => {
            setTimeout(comprehensiveMonitoring, 300);
        });
        
        // 页面可见性改变时检查
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                setTimeout(comprehensiveMonitoring, 100);
            }
        });
        
        console.log('✅ 增强版全局内容可见性监控系统已启动，包含防挤压保护');
    }
    
    handleRealtimeUpdate(roomData) {
        if (roomData.shapes && JSON.stringify(roomData.shapes) !== JSON.stringify(this.shapes)) {
            this.shapes = roomData.shapes;
            this.redraw();
        }
        
        if (roomData.currentMap && roomData.currentMap !== this.currentMap) {
            this.currentMap = roomData.currentMap;
            document.getElementById('mapSelect').value = this.currentMap;
            this.loadMapImage();
        }
        
        if (roomData.users) {
            this.users = new Map(roomData.users.map(u => [u.id, u]));
            this.updateUsersList();
        }
    }
    
    // 绑定事件
    bindEvents() {
        console.log('开始绑定事件...');
        
        // 登录相关
        const joinBtn = document.getElementById('joinRoomBtn');
        const usernameInput = document.getElementById('usernameInput');
        
        if (joinBtn) {
            joinBtn.addEventListener('click', () => {
                console.log('进入战术室按钮被点击');
                this.joinRoom();
            });
            console.log('✅ 进入战术室按钮事件绑定成功');
        } else {
            console.error('❌ 找不到joinRoomBtn元素');
        }
        
        if (usernameInput) {
            usernameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    console.log('在用户名输入框中按了Enter');
                    this.joinRoom();
                }
            });
            console.log('✅ 用户名输入框Enter事件绑定成功');
        } else {
            console.error('❌ 找不到usernameInput元素');
        }
        
        // 主界面相关
        const leaveBtn = document.getElementById('leaveRoomBtn');
        if (leaveBtn) {
            leaveBtn.addEventListener('click', () => this.leaveRoom());
            console.log('✅ 离开房间按钮事件绑定成功');
        }
        
        // 用户列表按钮
        const userListBtn = document.getElementById('userListBtn');
        if (userListBtn) {
            userListBtn.addEventListener('click', () => this.showUserList());
            console.log('✅ 用户列表按钮事件绑定成功');
        }
        
        // 关闭用户列表按钮
        const closeUserListBtn = document.getElementById('closeUserListBtn');
        if (closeUserListBtn) {
            closeUserListBtn.addEventListener('click', () => this.hideUserList());
            console.log('✅ 关闭用户列表按钮事件绑定成功');
        }
        
        // 工具栏
        const toolBtns = document.querySelectorAll('.tool-btn');
        console.log(`找到 ${toolBtns.length} 个工具按钮`);
        toolBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.setTool(e.target.dataset.tool));
        });
        
        const mapSelect = document.getElementById('mapSelect');
        if (mapSelect) {
            mapSelect.addEventListener('change', (e) => this.changeMap(e.target.value));
            console.log('✅ 地图选择器事件绑定成功');
        }
        
        // 清空按钮
        const clearAllBtn = document.getElementById('clearAllBtn');
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => this.clearAll());
            console.log('✅ 清空按钮事件绑定成功');
        }
        
        // 导出按钮
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportPNG());
            console.log('✅ 导出按钮事件绑定成功');
        }
        
        console.log('事件绑定完成');
        
        // 添加页面关闭和退出监听器
        this.setupPageUnloadListeners();
    }
    
    // 设置页面卸载监听器
    setupPageUnloadListeners() {
        // 监听页面关闭事件
        window.addEventListener('beforeunload', (event) => {
            console.log('🖼️ 用户即将关闭页面，准备从用户列表中移除...');
            this.handleUserLeaving();
        });
        
        // 监听页面隐藏事件（用于移动端切换应用）
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                console.log('😵 页面被隐藏，用户可能切换了应用');
                // 延迟一会再移除，防止短暂切换
                setTimeout(() => {
                    if (document.hidden && this.currentUser) {
                        console.log('🖼️ 页面持续隐藏，从用户列表中移除用户');
                        this.handleUserLeaving();
                    }
                }, 30000); // 30秒后如果还是隐藏状态就移除用户
            } else {
                console.log('👁️ 页面重新可见，用户回来了');
                // 用户回来时重新添加到用户列表
                if (this.currentUser) {
                    this.addUserToRoom();
                }
            }
        });
        
        // 监听窗口获得和失去焦点
        window.addEventListener('focus', () => {
            console.log('👁️ 窗口获得焦点，用户正在使用应用');
            if (this.currentUser) {
                this.addUserToRoom(); // 重新添加用户到列表
            }
        });
        
        window.addEventListener('blur', () => {
            console.log('😵 窗口失去焦点，用户可能切换到其他应用');
            // 不立即移除，因为可能只是短暂切换
        });
        
        // 移动端特殊处理：监听pagehide事件
        window.addEventListener('pagehide', (event) => {
            console.log('🖼️ 页面被隐藏或卸载（移动端），从用户列表中移除');
            this.handleUserLeaving();
        });
        
        console.log('✅ 页面关闭和退出监听器设置完成');
    }
    
    // 处理用户离开
    handleUserLeaving() {
        if (this.currentUser && this.roomId) {
            console.log(`🚪 用户 ${this.currentUser.name} 正在离开房间...`);
            
            // 从用户列表中移除
            this.removeUserFromRoom();
            
            // 广播用户离开事件
            this.realtimeSync.broadcast('user_leave', {
                userId: this.currentUser.id,
                userName: this.currentUser.name,
                timestamp: Date.now()
            });
            
            console.log(`✅ 用户 ${this.currentUser.name} 已从用户列表中移除`);
        }
    }
    
    // 加入房间
    joinRoom() {
        console.log('开始进入战术室...');
        
        const username = document.getElementById('usernameInput').value.trim();
        
        console.log('用户名:', username);
        
        if (!username) {
            this.showNotification('请输入用户名', 'error');
            return;
        }
        
        try {
            this.currentUser = {
                id: this.generateId(),
                name: username,
                joinTime: Date.now()
            };
            
            console.log('用户信息:', this.currentUser);
            
            // 添加用户到房间
            this.addUserToRoom();
            
            // 更新界面
            this.showMainScreen();
            this.updateRoomInfo();
            this.initCanvasEvents();
            this.loadMapImage();
            
            // 启用实时同步
            this.realtimeSync.enable(this.roomId, this.currentUser.id);
            
            // 显示成功通知
            this.showNotification('成功进入战术室', 'success');
            
            console.log('成功进入战术室');
        } catch (error) {
            console.error('进入战术室失败:', error);
            this.showNotification('进入战术室失败，请重试', 'error');
        }
    }
    
    // 显示主界面
    showMainScreen() {
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('mainScreen').classList.remove('hidden');
    }
    
    // 显示登录界面
    showLoginScreen() {
        document.getElementById('loginScreen').classList.remove('hidden');
        document.getElementById('mainScreen').classList.add('hidden');
        
        // 清空输入框
        document.getElementById('usernameInput').value = '';
    }
    
    // 更新连接状态 - 已移除，不再需要显示连接状态
    // updateConnectionStatus 方法已删除
    
    // 离开房间
    leaveRoom() {
        if (this.roomId && this.currentUser) {
            console.log(`🚪 用户 ${this.currentUser.name} 正常离开房间`);
            
            // 广播用户离开事件
            this.realtimeSync.broadcast('user_leave', {
                userId: this.currentUser.id,
                userName: this.currentUser.name,
                timestamp: Date.now()
            });
            
            // 从房间移除用户
            this.removeUserFromRoom();
        }
        
        this.realtimeSync.disable();
        this.currentUser = null;
        this.shapes = [];
        this.users.clear();
        
        this.showLoginScreen();
        
        console.log('✅ 已成功离开房间并返回登录界面');
    }
    
    // 更新房间信息显示
    updateRoomInfo() {
        document.getElementById('currentUser').textContent = `用户: ${this.currentUser.name}`;
        this.updateUserCount();
    }
    
    // 更新用户数量
    updateUserCount() {
        const count = this.users.size;
        document.getElementById('userCountDisplay').textContent = `在线用户: ${count}`;
    }
    
    // 显示用户列表
    showUserList() {
        document.getElementById('userListModal').classList.remove('hidden');
        this.updateUsersList();
    }
    
    // 隐藏用户列表
    hideUserList() {
        document.getElementById('userListModal').classList.add('hidden');
    }
    
    // 更新用户列表显示
    updateUsersList() {
        const usersList = document.getElementById('usersList');
        if (!usersList) return;
        
        usersList.innerHTML = '';
        
        this.users.forEach(user => {
            const userItem = document.createElement('div');
            userItem.className = 'user-item';
            
            const avatar = document.createElement('div');
            avatar.className = 'user-avatar';
            avatar.textContent = user.name.charAt(0).toUpperCase();
            
            const name = document.createElement('div');
            name.className = 'user-name';
            name.textContent = user.name;
            
            userItem.appendChild(avatar);
            userItem.appendChild(name);
            usersList.appendChild(userItem);
        });
    }
    
    // 检查道具数量限制
    canAddItem(type) {
        const currentCount = this.itemCounts[type] || 0;
        const maxCount = this.maxCounts[type] || 0;
        
        if (currentCount >= maxCount) {
            const itemNames = {
                smoke: '烟雾弹',
                fire: '燃烧弹',
                grenade: '手雷',
                flash: '闪光弹',
                playerT: 'T队员',
                playerCT: 'CT队员'
            };
            
            this.showNotification(`${itemNames[type]}数量已达上限(${maxCount}个)`, 'error');
            return false;
        }
        
        return true;
    }
    
    // 更新道具数量
    updateItemCount(type, delta = 1) {
        if (!this.itemCounts.hasOwnProperty(type)) return;
        
        this.itemCounts[type] = Math.max(0, this.itemCounts[type] + delta);
        this.syncData();
    }
    
    // 重新计算道具数量
    recalculateItemCounts() {
        // 重置所有计数
        Object.keys(this.itemCounts).forEach(key => {
            this.itemCounts[key] = 0;
        });
        
        // 重新计算
        this.shapes.forEach(shape => {
            if (shape.type === 'player') {
                const playerType = `player${shape.side}`;
                if (this.itemCounts.hasOwnProperty(playerType)) {
                    this.itemCounts[playerType]++;
                }
            } else if (this.itemCounts.hasOwnProperty(shape.type)) {
                this.itemCounts[shape.type]++;
            }
        });
    }
    
    // 同步数据
    syncData() {
        this.syncToRoom();
    }
    
    // 初始化画布事件
    initCanvasEvents() {
        this.canvas = document.getElementById('tacticCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // 设置画布大小为自适应
        this.resizeCanvas();
        
        // 监听窗口大小变化
        window.addEventListener('resize', () => {
            this.resizeCanvas();
        });
        
        // 监听屏幕方向变化
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.resizeCanvas();
            }, 100);
        });
        
        // 鼠标事件
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
        this.canvas.addEventListener('mouseleave', (e) => this.onMouseUp(e));
        
        // 禁用右键菜单
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // 触摸事件支持
        this.canvas.addEventListener('touchstart', (e) => this.onTouchStart(e));
        this.canvas.addEventListener('touchmove', (e) => this.onTouchMove(e));
        this.canvas.addEventListener('touchend', (e) => this.onTouchEnd(e));
    }
    
    // 画布自适应调整
    resizeCanvas() {
        if (!this.canvas) return;
        
        const container = this.canvas.parentElement;
        if (!container) return;
        
        // 获取容器的实际大小
        const containerRect = container.getBoundingClientRect();
        const containerWidth = containerRect.width - 20; // 减去内边距
        const containerHeight = containerRect.height - 20;
        
        // 计算最优尺寸（保持正方形）
        const size = Math.min(containerWidth, containerHeight, 1024);
        
        // 设置画布尺寸
        this.canvas.width = size;
        this.canvas.height = size;
        
        // 设置显示尺寸
        this.canvas.style.width = size + 'px';
        this.canvas.style.height = size + 'px';
        
        // 重新绘制
        this.redraw();
        
        console.log(`画布大小调整为: ${size}x${size}`);
    }
    
    // 将屏幕坐标转换为画布坐标
    screenToCanvas(screenX, screenY) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        return {
            x: (screenX - rect.left) * scaleX,
            y: (screenY - rect.top) * scaleY
        };
    }
    
    // 加载地图图像
    loadMapImage() {
        // 清空之前的地图引用
        this.mapImage = null;
        
        const img = new Image();
        img.onload = () => {
            this.mapImage = img;
            console.log(`地图加载成功: ${this.currentMap}, 尺寸: ${img.width}x${img.height}`);
            // 立即重绘，确保新地图显示
            this.redraw();
        };
        img.onerror = () => {
            console.warn(`无法加载地图: ${this.maps[this.currentMap]}`);
            this.mapImage = null;
            // 即使加载失败也要重绘，显示默认背景
            this.redraw();
        };
        img.src = this.maps[this.currentMap] || this.maps['de_dust2'];
    }
    
    // 设置工具
    setTool(tool) {
        this.currentTool = tool;
        
        // 更新工具按钮状态
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        const activeBtn = document.querySelector(`[data-tool="${tool}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
        
        // 更新鼠标样式
        this.updateCursor();
    }
    
    // 更新鼠标样式
    updateCursor() {
        if (!this.canvas) return;
        
        const cursors = {
            'move': 'move',
            'playerT': 'pointer',
            'playerCT': 'pointer',
            'line': 'crosshair',
            'smoke': 'pointer',
            'flash': 'pointer',
            'fire': 'pointer',
            'grenade': 'pointer',
            'erase': 'pointer'
        };
        
        this.canvas.style.cursor = cursors[this.currentTool] || 'default';
    }
    
    // 切换地图
    changeMap(mapName) {
        this.currentMap = mapName;
        
        // 立即清空画布，防止残留上一张地图的痕迹
        if (this.ctx) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            // 绘制临时背景，显示加载状态
            this.ctx.fillStyle = '#f8f9fa';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = '#1d1d1f';
            this.ctx.font = 'bold 32px -apple-system, BlinkMacSystemFont, sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('地图切换中...', this.canvas.width / 2, this.canvas.height / 2);
        }
        
        // 切换地图时清空所有内容
        this.shapes = [];
        this.recalculateItemCounts();
        
        // 加载新地图
        this.loadMapImage();
        this.syncMapToRoom();
        
        this.showNotification(`已切换到 ${mapName} 并清空所有内容`, 'success');
    }
    
    // 清空所有
    clearAll() {
        if (confirm('确定要清空所有内容吗？')) {
            this.shapes = [];
            this.recalculateItemCounts();
            this.saveToHistory();
            this.redraw();
            this.syncToRoom();
        }
    }
    
    // 导出PNG
    exportPNG() {
        const link = document.createElement('a');
        link.download = `cs_tactic_${this.roomId}_${Date.now()}.png`;
        link.href = this.canvas.toDataURL('image/png');
        link.click();
    }
    
    // 添加用户到房间
    addUserToRoom() {
        const roomData = this.getRoomData() || { users: [], shapes: [], currentMap: 'de_dust2' };
        
        // 添加当前用户
        roomData.users = roomData.users.filter(u => u.id !== this.currentUser.id);
        roomData.users.push(this.currentUser);
        
        // 加载房间数据
        this.shapes = roomData.shapes || [];
        this.currentMap = roomData.currentMap || 'de_dust2';
        
        // 更新地图选择器
        document.getElementById('mapSelect').value = this.currentMap;
        
        // 保存房间数据
        this.saveRoomData(roomData);
        
        // 更新用户列表
        this.users = new Map(roomData.users.map(u => [u.id, u]));
        this.updateUsersList();
        
        // 广播用户加入事件
        this.realtimeSync.broadcast('user_join', {
            user: this.currentUser,
            timestamp: Date.now()
        });
        
        console.log(`👋 用户 ${this.currentUser.name} 已加入房间`);
    }
    
    // 从房间移除用户
    removeUserFromRoom() {
        const roomData = this.getRoomData();
        if (roomData) {
            roomData.users = roomData.users.filter(u => u.id !== this.currentUser.id);
            this.saveRoomData(roomData);
        }
    }
    
    // 获取房间数据
    getRoomData() {
        const data = localStorage.getItem(`room_${this.roomId}`);
        return data ? JSON.parse(data) : null;
    }
    
    // 保存房间数据
    saveRoomData(data) {
        data.lastUpdate = Date.now();
        localStorage.setItem(`room_${this.roomId}`, JSON.stringify(data));
    }
    
    // 同步到房间
    syncToRoom() {
        if (!this.roomId) return;
        
        const roomData = this.getRoomData() || { users: [], shapes: [], currentMap: 'de_dust2' };
        roomData.shapes = this.shapes;
        roomData.currentMap = this.currentMap;
        this.saveRoomData(roomData);
    }
    
    // 同步地图到房间
    syncMapToRoom() {
        if (!this.roomId) return;
        
        const roomData = this.getRoomData() || { users: [], shapes: [], currentMap: 'de_dust2' };
        roomData.currentMap = this.currentMap;
        this.saveRoomData(roomData);
    }
    
    // 更新用户列表
    updateUsersList() {
        const usersList = document.getElementById('usersList');
        if (!usersList) return;
        
        usersList.innerHTML = '';
        
        this.users.forEach(user => {
            const userDiv = document.createElement('div');
            userDiv.className = 'user-item';
            if (user.id === this.currentUser.id) {
                userDiv.classList.add('self');
            }
            
            userDiv.innerHTML = `
                <span class="username">${user.name}</span>
            `;
            
            usersList.appendChild(userDiv);
        });
        
        this.updateUserCount();
    }
    
    // 重绘画布
    redraw() {
        if (!this.ctx) return;
        
        // 完全清空画布，确保没有残留
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 重置画布状态
        this.ctx.globalAlpha = 1.0;
        this.ctx.globalCompositeOperation = 'source-over';
        
        // 绘制地图背景
        if (this.mapImage) {
            this.ctx.drawImage(this.mapImage, 0, 0, this.canvas.width, this.canvas.height);
        } else {
            // 如果没有地图，绘制默认背景
            this.ctx.fillStyle = '#f8f9fa';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            // 显示地图名称
            this.ctx.fillStyle = '#1d1d1f';
            this.ctx.font = 'bold 48px -apple-system, BlinkMacSystemFont, sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(this.currentMap.toUpperCase(), this.canvas.width / 2, this.canvas.height / 2);
            
            this.ctx.font = '24px -apple-system, BlinkMacSystemFont, sans-serif';
            this.ctx.fillText('地图加载中...', this.canvas.width / 2, this.canvas.height / 2 + 60);
        }
        
        // 绘制所有形状
        this.shapes.forEach(shape => {
            this.drawShape(shape);
        });
    }
    
    // 绘制单个形状
    drawShape(shape) {
        this.ctx.save();
        
        switch (shape.type) {
            case 'player':
                const playerRadius = 12; // 从15缩小到12，让队员图标更紧凑
                this.ctx.beginPath();
                this.ctx.arc(shape.x, shape.y, playerRadius, 0, Math.PI * 2);
                this.ctx.fillStyle = shape.side === 'T' ? '#ff4444' : '#4444ff';
                this.ctx.fill();
                this.ctx.strokeStyle = '#ffffff';
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
                
                this.ctx.fillStyle = '#ffffff';
                this.ctx.font = 'bold 10px -apple-system, BlinkMacSystemFont, sans-serif'; // 略微减小字体
                this.ctx.textAlign = 'center';
                this.ctx.fillText(shape.side, shape.x, shape.y + 3); // 调整文字位置
                break;
                
            case 'line':
                this.ctx.beginPath();
                this.ctx.moveTo(shape.x1, shape.y1);
                this.ctx.lineTo(shape.x2, shape.y2);
                this.ctx.strokeStyle = '#007aff';
                this.ctx.lineWidth = 3;
                this.ctx.stroke();
                break;
                
            case 'smoke':
                const smokeRadius = 16; // 从20缩小到16，让烟雾弹图标更紧凑
                this.ctx.beginPath();
                this.ctx.arc(shape.x, shape.y, smokeRadius, 0, Math.PI * 2);
                this.ctx.fillStyle = 'rgba(128, 128, 128, 0.7)';
                this.ctx.fill();
                this.ctx.strokeStyle = '#666666';
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
                
                this.ctx.fillStyle = '#ffffff';
                this.ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, sans-serif'; // 略微减小字体
                this.ctx.textAlign = 'center';
                this.ctx.fillText('烟', shape.x, shape.y + 4);
                break;
                
            case 'flash':
                const flashRadius = 10; // 从12缩小到10，让闪光弹图标更紧凑
                this.ctx.beginPath();
                this.ctx.arc(shape.x, shape.y, flashRadius, 0, Math.PI * 2);
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                this.ctx.fill();
                this.ctx.strokeStyle = '#ffffff';
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
                
                this.ctx.fillStyle = '#000000';
                this.ctx.font = 'bold 9px -apple-system, BlinkMacSystemFont, sans-serif'; // 略微减小字体
                this.ctx.textAlign = 'center';
                this.ctx.fillText('闪', shape.x, shape.y + 3);
                break;
                
            case 'fire':
                const fireRadius = 14; // 从18缩小到14，让燃烧弹图标更紧凑
                this.ctx.beginPath();
                this.ctx.arc(shape.x, shape.y, fireRadius, 0, Math.PI * 2);
                this.ctx.fillStyle = 'rgba(255, 69, 0, 0.7)';
                this.ctx.fill();
                this.ctx.strokeStyle = '#ff4500';
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
                
                this.ctx.fillStyle = '#ffffff';
                this.ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, sans-serif'; // 略微减小字体
                this.ctx.textAlign = 'center';
                this.ctx.fillText('火', shape.x, shape.y + 3); // 调整文字位置
                break;
                
            case 'grenade':
                const grenadeRadius = 12; // 从14缩小到12，让手雷图标更紧凑
                this.ctx.beginPath();
                this.ctx.arc(shape.x, shape.y, grenadeRadius, 0, Math.PI * 2);
                this.ctx.fillStyle = 'rgba(34, 139, 34, 0.7)';
                this.ctx.fill();
                this.ctx.strokeStyle = '#228b22';
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
                
                this.ctx.fillStyle = '#ffffff';
                this.ctx.font = 'bold 9px -apple-system, BlinkMacSystemFont, sans-serif'; // 略微减小字体
                this.ctx.textAlign = 'center';
                this.ctx.fillText('雷', shape.x, shape.y + 3);
                break;
        }
        
        this.ctx.restore();
    }
    
    // 鼠标事件处理
    onMouseDown(e) {
        if (!this.canvas) return;
        
        const coords = this.screenToCanvas(e.clientX, e.clientY);
        this.startX = coords.x;
        this.startY = coords.y;
        
        this.handleToolAction(this.startX, this.startY, 'down');
    }
    
    onMouseMove(e) {
        if (!this.canvas) return;
        
        const coords = this.screenToCanvas(e.clientX, e.clientY);
        this.handleToolAction(coords.x, coords.y, 'move');
    }
    
    onMouseUp(e) {
        if (!this.canvas) return;
        
        const coords = this.screenToCanvas(e.clientX, e.clientY);
        this.handleToolAction(coords.x, coords.y, 'up');
    }
    
    // 触摸事件处理
    onTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const coords = this.screenToCanvas(touch.clientX, touch.clientY);
        this.startX = coords.x;
        this.startY = coords.y;
        
        this.handleToolAction(this.startX, this.startY, 'down');
    }
    
    onTouchMove(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const coords = this.screenToCanvas(touch.clientX, touch.clientY);
        
        this.handleToolAction(coords.x, coords.y, 'move');
    }
    
    onTouchEnd(e) {
        e.preventDefault();
        this.handleToolAction(0, 0, 'up');
    }
    
    // 工具操作处理
    handleToolAction(x, y, action) {
        switch (this.currentTool) {
            case 'playerT':
            case 'playerCT':
                if (action === 'down') {
                    this.addPlayer(x, y, this.currentTool.replace('player', ''));
                }
                break;
                
            case 'line':
                this.handleLineDrawing(x, y, action);
                break;
                
            case 'smoke':
            case 'flash':
            case 'fire':
            case 'grenade':
                if (action === 'down') {
                    this.addGrenade(x, y, this.currentTool);
                }
                break;
                
            case 'erase':
                if (action === 'down' || (action === 'move' && this.isDrawing)) {
                    this.eraseAt(x, y);
                }
                break;
        }
    }
    
    // 添加玩家
    addPlayer(x, y, side) {
        const type = `player${side}`;
        
        // 检查数量限制
        if (!this.canAddItem(type)) {
            return;
        }
        
        const shape = {
            id: this.generateId(),
            type: 'player',
            x: x,
            y: y,
            side: side,
            timestamp: Date.now()
        };
        
        this.shapes.push(shape);
        this.updateItemCount(type, 1);
        this.saveToHistory();
        this.redraw();
        this.syncToRoom();
    }
    
    // 处理画线
    handleLineDrawing(x, y, action) {
        if (action === 'down') {
            this.isDrawing = true;
            this.currentShape = {
                id: this.generateId(),
                type: 'line',
                x1: x,
                y1: y,
                x2: x,
                y2: y,
                timestamp: Date.now()
            };
        } else if (action === 'move' && this.isDrawing) {
            this.currentShape.x2 = x;
            this.currentShape.y2 = y;
            this.redraw();
            
            // 绘制预览
            this.ctx.save();
            this.ctx.strokeStyle = '#007aff';
            this.ctx.lineWidth = 3;
            this.ctx.setLineDash([5, 5]);
            this.ctx.beginPath();
            this.ctx.moveTo(this.currentShape.x1, this.currentShape.y1);
            this.ctx.lineTo(this.currentShape.x2, this.currentShape.y2);
            this.ctx.stroke();
            this.ctx.restore();
        } else if (action === 'up' && this.isDrawing) {
            this.isDrawing = false;
            this.currentShape.x2 = x;
            this.currentShape.y2 = y;
            
            this.shapes.push(this.currentShape);
            this.saveToHistory();
            this.redraw();
            this.syncToRoom();
            this.currentShape = null;
        }
    }
    
    // 添加道具
    addGrenade(x, y, type) {
        // 检查数量限制
        if (!this.canAddItem(type)) {
            return;
        }
        
        const shape = {
            id: this.generateId(),
            type: type,
            x: x,
            y: y,
            timestamp: Date.now()
        };
        
        this.shapes.push(shape);
        this.updateItemCount(type, 1);
        this.saveToHistory();
        this.redraw();
        this.syncToRoom();
    }
    
    // 橡皮擦功能
    eraseAt(x, y) {
        const eraseRadius = 30;
        
        const originalLength = this.shapes.length;
        this.shapes = this.shapes.filter(shape => {
            let distance = 0;
            let shouldKeep = true;
            
            switch (shape.type) {
                case 'player':
                case 'smoke':
                case 'flash':
                case 'fire':
                case 'grenade':
                    distance = Math.sqrt((shape.x - x) ** 2 + (shape.y - y) ** 2);
                    shouldKeep = distance > eraseRadius;
                    break;
                    
                case 'line':
                    // 对于线条，检查端点
                    const dist1 = Math.sqrt((shape.x1 - x) ** 2 + (shape.y1 - y) ** 2);
                    const dist2 = Math.sqrt((shape.x2 - x) ** 2 + (shape.y2 - y) ** 2);
                    shouldKeep = dist1 > eraseRadius && dist2 > eraseRadius;
                    break;
                    
                default:
                    shouldKeep = true;
            }
            
            return shouldKeep;
        });
        
        // 如果有元素被删除，重新计算道具数量
        if (this.shapes.length !== originalLength) {
            this.recalculateItemCounts();
        }
        
        this.redraw();
        this.syncToRoom();
    }
    
    // 保存历史
    saveToHistory() {
        this.history.push(JSON.stringify(this.shapes));
        if (this.history.length > 50) {
            this.history.shift();
        }
        this.redoStack = [];
    }
    
    // 生成随机ID
    generateId() {
        return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    }
    
    // 显示通知
    showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, duration);
    }
}

// 初始化应用
let csBoard;
window.addEventListener('DOMContentLoaded', () => {
    console.log('DOM加载完成，初始化CS战术板...');
    
    // 立即强制修复工具栏
    const emergencyFix = () => {
        const toolbar = document.getElementById('toolbar');
        if (toolbar) {
            toolbar.style.display = 'flex';
            toolbar.style.position = 'fixed';
            toolbar.style.zIndex = '99999';
            toolbar.style.visibility = 'visible';
            toolbar.style.opacity = '1';
            toolbar.style.pointerEvents = 'auto';
            console.log('🚑 立即修复工具栏显示问题');
        }
    };
    
    emergencyFix();
    setTimeout(emergencyFix, 100);
    setTimeout(emergencyFix, 500);
    
    try {
        csBoard = new CSStrategyBoard();
        console.log('CS战术板初始化成功');
        
        // 检查必要的DOM元素是否存在
        const requiredElements = [
            'loginScreen', 'mainScreen', 'usernameInput',
            'joinRoomBtn', 'tacticCanvas'
        ];
        
        const missingElements = requiredElements.filter(id => !document.getElementById(id));
        if (missingElements.length > 0) {
            console.error('缺少必要的DOM元素:', missingElements);
        } else {
            console.log('所有必要的DOM元素都存在');
        }
    } catch (error) {
        console.error('CS战术板初始化失败:', error);
    }
});
