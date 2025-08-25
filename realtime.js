// 实时同步模块 - 模拟WebSocket行为
class RealtimeSync {
    constructor() {
        this.isEnabled = false;
        this.syncInterval = null;
        this.lastSyncTime = 0;
        this.callbacks = {
            onRoomUpdate: null,
            onUserJoin: null,
            onUserLeave: null
        };
    }
    
    // 启用实时同步
    enable(roomId, userId) {
        this.roomId = roomId;
        this.userId = userId;
        this.isEnabled = true;
        this.lastSyncTime = Date.now();
        
        // 每秒检查更新
        this.syncInterval = setInterval(() => {
            this.checkForUpdates();
        }, 1000);
        
        console.log('实时同步已启用');
    }
    
    // 禁用实时同步
    disable() {
        this.isEnabled = false;
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
        console.log('实时同步已禁用');
    }
    
    // 设置回调函数
    setCallbacks(callbacks) {
        this.callbacks = { ...this.callbacks, ...callbacks };
    }
    
    // 检查更新
    checkForUpdates() {
        if (!this.isEnabled || !this.roomId) return;
        
        const roomData = this.getRoomData();
        if (!roomData) return;
        
        // 检查房间数据更新
        if (roomData.lastUpdate > this.lastSyncTime) {
            this.handleRoomUpdate(roomData);
        }
        
        // 检查用户变化
        this.checkUserChanges(roomData);
        
        this.lastSyncTime = Date.now();
    }
    
    // 处理房间更新
    handleRoomUpdate(roomData) {
        if (this.callbacks.onRoomUpdate) {
            this.callbacks.onRoomUpdate(roomData);
        }
    }

    
    // 检查用户变化
    checkUserChanges(roomData) {
        // 这里可以实现用户加入/离开的检测
        // 简化实现，实际项目中可以更复杂
    }
    
    // 获取房间数据
    getRoomData() {
        const data = localStorage.getItem(`room_${this.roomId}`);
        return data ? JSON.parse(data) : null;
    }
    
    // 广播更新
    broadcast(type, data) {
        if (!this.isEnabled) return;
        
        // 在真实的WebSocket实现中，这里会发送数据到服务器
        // 现在我们只是触发本地更新
        const roomData = this.getRoomData() || {
            users: [],
            shapes: [],
            currentMap: 'de_dust2'
        };
        
        switch (type) {
            case 'shape_update':
                roomData.shapes = data;
                break;
            case 'map_change':
                roomData.currentMap = data;
                break;
        }
        
        roomData.lastUpdate = Date.now();
        localStorage.setItem(`room_${this.roomId}`, JSON.stringify(roomData));
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RealtimeSync;
} else {
    window.RealtimeSync = RealtimeSync;
}