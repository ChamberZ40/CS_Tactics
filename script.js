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
        this.isAdmin = false;
        
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
        this.bindEvents();
        this.loadMapImage();
        this.setupRealtimeSync();
    }
    
    setupRealtimeSync() {
        this.realtimeSync.setCallbacks({
            onRoomUpdate: (roomData) => {
                this.handleRealtimeUpdate(roomData);
            }
        });
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
            // 检查是否为admin
            this.isAdmin = username.toLowerCase() === 'admin';
            
            this.currentUser = {
                id: this.generateId(),
                name: username,
                isAdmin: this.isAdmin,
                joinTime: Date.now()
            };
            
            console.log('用户信息:', this.currentUser);
            console.log('是否为管理员:', this.isAdmin);
            
            // 添加用户到房间
            this.addUserToRoom();
            
            // 更新界面
            this.showMainScreen();
            this.updateRoomInfo();
            this.initCanvasEvents();
            this.loadMapImage();
            this.addTooltips();
            this.updateToolbarPermissions();
            
            // 启用实时同步
            this.realtimeSync.enable(this.roomId, this.currentUser.id);
            
            // 显示成功通知
            const roleText = this.isAdmin ? '（管理员）' : '（观看者）';
            this.showNotification(`成功进入战术室 ${roleText}`, 'success');
            
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
        this.updateConnectionStatus('connected');
    }
    
    // 显示登录界面
    showLoginScreen() {
        document.getElementById('loginScreen').classList.remove('hidden');
        document.getElementById('mainScreen').classList.add('hidden');
        
        // 清空输入框
        document.getElementById('usernameInput').value = '';
    }
    
    // 更新连接状态
    updateConnectionStatus(status) {
        const statusEl = document.getElementById('connectionStatus');
        this.isConnected = status === 'connected';
        
        if (this.isConnected) {
            statusEl.textContent = '连接状态: 已连接';
            statusEl.className = 'connected';
        } else {
            statusEl.textContent = '连接状态: 离线';
            statusEl.className = 'disconnected';
        }
    }
    
    // 离开房间
    leaveRoom() {
        if (this.roomId && this.currentUser) {
            this.removeUserFromRoom();
        }
        
        this.realtimeSync.disable();
        this.currentUser = null;
        this.isAdmin = false;
        this.shapes = [];
        this.users.clear();
        
        this.showLoginScreen();
        this.updateConnectionStatus('disconnected');
    }
    
    // 更新房间信息显示
    updateRoomInfo() {
        document.getElementById('currentUser').textContent = `用户: ${this.currentUser.name}`;
        const roleEl = document.getElementById('userRole');
        if (this.isAdmin) {
            roleEl.textContent = '[管理员]';
            roleEl.style.color = '#ff6b6b';
        } else {
            roleEl.textContent = '[观看者]';
            roleEl.style.color = '#888';
        }
        this.updateUserCount();
    }
    
    // 更新用户数量
    updateUserCount() {
        const count = this.users.size;
        document.getElementById('userCountDisplay').textContent = `在线用户: ${count}`;
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
        const img = new Image();
        img.onload = () => {
            this.mapImage = img;
            console.log(`地图加载成功: ${this.currentMap}, 尺寸: ${img.width}x${img.height}`);
            this.redraw();
        };
        img.onerror = () => {
            console.warn(`无法加载地图: ${this.maps[this.currentMap]}`);
            this.mapImage = null;
            this.redraw();
        };
        img.src = this.maps[this.currentMap] || this.maps['de_dust2'];
    }
    
    // 添加工具提示
    addTooltips() {
        const toolButtons = {
            'move': '移动工具 (1)',
            'playerT': '放置T队员 (2)',
            'playerCT': '放置CT队员 (3)',
            'line': '画线工具 (4)',
            'smoke': '烟雾弹 (5)',
            'flash': '闪光弹 (6)',
            'fire': '燃烧弹 (7)',
            'grenade': '手雷 (8)',
            'text': '文本工具 (9)',
            'erase': '橡皮擦工具 (0)'
        };
        
        Object.keys(toolButtons).forEach(tool => {
            const btn = document.querySelector(`[data-tool="${tool}"]`);
            if (btn) {
                btn.setAttribute('data-tooltip', toolButtons[tool]);
                btn.classList.add('tooltip');
            }
        });
    }
    
    // 更新工具栏权限
    updateToolbarPermissions() {
        const toolBtns = document.querySelectorAll('.tool-btn');
        const mapSelect = document.getElementById('mapSelect');
        const clearAllBtn = document.getElementById('clearAllBtn');
        const exportBtn = document.getElementById('exportBtn');
        
        if (this.isAdmin) {
            // 管理员可以使用所有工具
            toolBtns.forEach(btn => {
                btn.disabled = false;
                btn.style.opacity = '1';
                btn.style.cursor = 'pointer';
            });
            
            if (mapSelect) {
                mapSelect.disabled = false;
                mapSelect.style.opacity = '1';
            }
            
            if (clearAllBtn) {
                clearAllBtn.disabled = false;
                clearAllBtn.style.opacity = '1';
            }
        } else {
            // 观看者只能移动和导出
            toolBtns.forEach(btn => {
                const tool = btn.dataset.tool;
                if (tool === 'move') {
                    btn.disabled = false;
                    btn.style.opacity = '1';
                    btn.style.cursor = 'pointer';
                } else {
                    btn.disabled = true;
                    btn.style.opacity = '0.3';
                    btn.style.cursor = 'not-allowed';
                }
            });
            
            if (mapSelect) {
                mapSelect.disabled = true;
                mapSelect.style.opacity = '0.3';
            }
            
            if (clearAllBtn) {
                clearAllBtn.disabled = true;
                clearAllBtn.style.opacity = '0.3';
            }
            
            // 强制设置为移动工具
            if (this.currentTool !== 'move') {
                this.setTool('move');
            }
        }
        
        if (exportBtn) {
            exportBtn.disabled = false;
            exportBtn.style.opacity = '1';
        }
    }
    
    // 设置工具
    setTool(tool) {
        // 权限检查：非管理员只能使用移动工具
        if (!this.isAdmin && tool !== 'move') {
            this.showNotification('只有管理员才能使用编辑工具', 'warning');
            return;
        }
        
        this.currentTool = tool;
        
        // 更新工具按钮状态
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        const activeBtn = document.querySelector(`[data-tool="${tool}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
        
        // 更新状态显示
        const toolNames = {
            'move': '移动',
            'playerT': 'T队员',
            'playerCT': 'CT队员',
            'line': '画线',
            'smoke': '烟雾弹',
            'flash': '闪光弹',
            'fire': '燃烧弹',
            'grenade': '手雷',
            'erase': '橡皮擦'
        };
        document.getElementById('currentTool').textContent = `当前工具: ${toolNames[tool] || tool}`;
        
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
        if (!this.isAdmin) {
            this.showNotification('只有管理员才能切换地图', 'warning');
            return;
        }
        
        this.currentMap = mapName;
        this.loadMapImage();
        this.syncMapToRoom();
    }
    
    // 清空所有
    clearAll() {
        if (!this.isAdmin) {
            this.showNotification('只有管理员才能清空画布', 'warning');
            return;
        }
        
        if (confirm('确定要清空所有内容吗？')) {
            this.shapes = [];
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
            
            // 添加角色标识
            const roleText = user.isAdmin ? ' [管理员]' : ' [观看者]';
            const roleClass = user.isAdmin ? 'admin' : 'viewer';
            
            userDiv.innerHTML = `
                <span class="username">${user.name}</span>
                <span class="user-role ${roleClass}">${roleText}</span>
            `;
            
            usersList.appendChild(userDiv);
        });
        
        this.updateUserCount();
    }
    
    // 重绘画布
    redraw() {
        if (!this.ctx) return;
        
        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
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
                const playerRadius = 15;
                this.ctx.beginPath();
                this.ctx.arc(shape.x, shape.y, playerRadius, 0, Math.PI * 2);
                this.ctx.fillStyle = shape.side === 'T' ? '#ff4444' : '#4444ff';
                this.ctx.fill();
                this.ctx.strokeStyle = '#ffffff';
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
                
                this.ctx.fillStyle = '#ffffff';
                this.ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, sans-serif';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(shape.side, shape.x, shape.y + 4);
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
                const smokeRadius = 20;
                this.ctx.beginPath();
                this.ctx.arc(shape.x, shape.y, smokeRadius, 0, Math.PI * 2);
                this.ctx.fillStyle = 'rgba(128, 128, 128, 0.7)';
                this.ctx.fill();
                this.ctx.strokeStyle = '#666666';
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
                
                this.ctx.fillStyle = '#ffffff';
                this.ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, sans-serif';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('烟', shape.x, shape.y + 5);
                break;
                
            case 'flash':
                const flashRadius = 12;
                this.ctx.beginPath();
                this.ctx.arc(shape.x, shape.y, flashRadius, 0, Math.PI * 2);
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                this.ctx.fill();
                this.ctx.strokeStyle = '#ffffff';
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
                
                this.ctx.fillStyle = '#000000';
                this.ctx.font = 'bold 10px -apple-system, BlinkMacSystemFont, sans-serif';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('闪', shape.x, shape.y + 3);
                break;
                
            case 'fire':
                const fireRadius = 18;
                this.ctx.beginPath();
                this.ctx.arc(shape.x, shape.y, fireRadius, 0, Math.PI * 2);
                this.ctx.fillStyle = 'rgba(255, 69, 0, 0.7)';
                this.ctx.fill();
                this.ctx.strokeStyle = '#ff4500';
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
                
                this.ctx.fillStyle = '#ffffff';
                this.ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, sans-serif';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('火', shape.x, shape.y + 4);
                break;
                
            case 'grenade':
                const grenadeRadius = 14;
                this.ctx.beginPath();
                this.ctx.arc(shape.x, shape.y, grenadeRadius, 0, Math.PI * 2);
                this.ctx.fillStyle = 'rgba(34, 139, 34, 0.7)';
                this.ctx.fill();
                this.ctx.strokeStyle = '#228b22';
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
                
                this.ctx.fillStyle = '#ffffff';
                this.ctx.font = 'bold 10px -apple-system, BlinkMacSystemFont, sans-serif';
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
        if (!this.isAdmin && this.currentTool !== 'move') {
            return; // 非管理员只能移动
        }
        
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
        const shape = {
            id: this.generateId(),
            type: 'player',
            x: x,
            y: y,
            side: side,
            timestamp: Date.now()
        };
        
        this.shapes.push(shape);
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
        const shape = {
            id: this.generateId(),
            type: type,
            x: x,
            y: y,
            timestamp: Date.now()
        };
        
        this.shapes.push(shape);
        this.saveToHistory();
        this.redraw();
        this.syncToRoom();
    }
    
    // 橡皮擦功能
    eraseAt(x, y) {
        const eraseRadius = 30;
        
        this.shapes = this.shapes.filter(shape => {
            let distance = 0;
            
            switch (shape.type) {
                case 'player':
                case 'smoke':
                case 'flash':
                case 'fire':
                case 'grenade':
                    distance = Math.sqrt((shape.x - x) ** 2 + (shape.y - y) ** 2);
                    return distance > eraseRadius;
                    
                case 'line':
                    // 对于线条，检查端点
                    const dist1 = Math.sqrt((shape.x1 - x) ** 2 + (shape.y1 - y) ** 2);
                    const dist2 = Math.sqrt((shape.x2 - x) ** 2 + (shape.y2 - y) ** 2);
                    return dist1 > eraseRadius && dist2 > eraseRadius;
                    
                default:
                    return true;
            }
        });
        
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
