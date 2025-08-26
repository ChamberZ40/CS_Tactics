// Admin删除功能调试脚本
// 在主应用的控制台(F12)中运行此脚本

console.log('🔍 开始调试Admin删除功能...');

// 1. 检查当前用户
console.log('1. 当前用户:', csBoard?.currentUser);

// 2. 检查所有用户
console.log('2. 所有用户:', csBoard?.users ? Array.from(csBoard.users.values()) : '无用户数据');

// 3. 检查是否为admin
const isAdmin = csBoard?.currentUser?.name === 'admin';
console.log('3. 是否为admin:', isAdmin);

// 4. 检查用户数量
const userCount = csBoard?.users?.size || 0;
console.log('4. 用户总数:', userCount);

// 5. 检查是否应该显示删除按钮
const shouldShowDeleteBtn = isAdmin && userCount > 1;
console.log('5. 应该显示删除按钮:', shouldShowDeleteBtn);

// 6. 检查DOM元素
const usersList = document.getElementById('usersList');
console.log('6. 用户列表DOM:', usersList);

if (usersList) {
    const deleteButtons = usersList.querySelectorAll('.delete-user-btn');
    console.log('7. 找到的删除按钮数量:', deleteButtons.length);
    
    if (deleteButtons.length > 0) {
        console.log('✅ 删除按钮存在！');
        deleteButtons.forEach((btn, index) => {
            console.log(`按钮${index + 1}:`, btn);
        });
    } else {
        console.log('❌ 没有找到删除按钮');
        
        // 尝试手动触发用户列表更新
        if (csBoard && typeof csBoard.updateUsersList === 'function') {
            console.log('🔄 尝试强制更新用户列表...');
            csBoard.updateUsersList();
            
            setTimeout(() => {
                const newDeleteButtons = usersList.querySelectorAll('.delete-user-btn');
                console.log('8. 更新后的删除按钮数量:', newDeleteButtons.length);
            }, 100);
        }
    }
} else {
    console.log('❌ 找不到用户列表DOM元素');
}

// 7. 创建临时测试用户（如果需要）
function createTestUsers() {
    if (!csBoard) {
        console.log('❌ csBoard未初始化');
        return;
    }
    
    // 添加测试用户到内存
    const testUser1 = {
        id: 'test1_' + Date.now(),
        name: 'testuser1',
        joinTime: Date.now()
    };
    
    const testUser2 = {
        id: 'test2_' + Date.now(),
        name: 'testuser2',
        joinTime: Date.now() + 1000
    };
    
    csBoard.users.set(testUser1.id, testUser1);
    csBoard.users.set(testUser2.id, testUser2);
    
    // 更新显示
    csBoard.updateUsersList();
    
    console.log('✅ 已添加测试用户，请检查用户列表');
}

console.log('💡 如果需要添加测试用户，运行: createTestUsers()');

// 8. 输出总结
console.log('\n📊 调试总结:');
console.log('- 当前用户是admin:', isAdmin);
console.log('- 用户总数:', userCount);
console.log('- 应该显示删除按钮:', shouldShowDeleteBtn);
console.log('- 用户列表DOM存在:', !!usersList);

if (!isAdmin) {
    console.log('⚠️ 问题：当前用户不是admin，请使用"admin"用户名登录');
} else if (userCount <= 1) {
    console.log('⚠️ 问题：只有一个用户，请添加更多用户或运行 createTestUsers()');
} else {
    console.log('✅ 所有条件满足，删除按钮应该显示');
}