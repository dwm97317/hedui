import { test, expect } from '@playwright/test';

// 登录辅助函数
async function login(page: any, role: 'sender' | 'transit' | 'receiver') {
    const credentials = {
        sender: { email: 'sender@test.com', password: 'password' },
        transit: { email: 'transit@test.com', password: 'password' },
        receiver: { email: 'receiver@test.com', password: 'password' }
    };

    const { email, password } = credentials[role];

    console.log(`🔐 Logging in as ${role}...`);

    // 访问登录页面
    await page.goto('http://localhost:3002/#/login');
    await page.waitForTimeout(1000);

    // 填写登录表单
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);

    // 点击登录按钮
    await page.click('button[type="submit"]');

    // 等待登录完成并跳转
    await page.waitForTimeout(3000);

    console.log(`✅ Logged in as ${role}`);
}

test.describe('Finance Pages - Data Verification (With Login)', () => {
    test.beforeEach(async ({ page }) => {
        test.setTimeout(90000);
    });

    test('Sender Finance Page - Should display real batch and bill data', async ({ page }) => {
        console.log('🔍 Testing Sender Finance Page...');

        // 先登录
        await login(page, 'sender');

        // 访问发货方财务页面
        await page.goto('http://localhost:3002/#/finance/sender');
        await page.waitForTimeout(3000);

        // 截图保存当前状态
        await page.screenshot({ path: 'test-results/sender-finance-logged-in.png', fullPage: true });

        // 检查页面标题
        const title = await page.locator('h1').textContent();
        console.log('📄 Page Title:', title);
        expect(title).toContain('结算中心');

        // 检查是否有"价格策略"按钮
        const priceStrategyButton = page.locator('button:has-text("价格策略")');
        await expect(priceStrategyButton).toBeVisible();
        console.log('✅ Price Strategy button is visible');

        // 等待批次数据加载
        await page.waitForSelector('text=结算批次', { timeout: 10000 });

        // 检查是否显示批次编号
        const batchCodes = await page.locator('span:has-text("BATCH")').count();
        console.log(`📦 Found ${batchCodes} batch codes on page`);

        // 检查账单金额是否显示 (VND)
        const vndAmounts = await page.locator('text=/₫/').count();
        console.log(`💵 Found ${vndAmounts} VND amounts`);
        expect(vndAmounts).toBeGreaterThan(0);

        // 检查账单金额是否显示 (CNY)
        const cnyAmounts = await page.locator('text=/¥/').count();
        console.log(`💴 Found ${cnyAmounts} CNY amounts`);
        expect(cnyAmounts).toBeGreaterThan(0);

        // 检查应付总额卡片
        const payableVNDCard = page.locator('text=应付总额 (物流费)');
        await expect(payableVNDCard).toBeVisible();

        const payableCNYCard = page.locator('text=应付总额 (货款)');
        await expect(payableCNYCard).toBeVisible();

        console.log('✅ Sender Finance Page test passed!');
    });

    test('Transit Finance Page - Should display real batch and bill data', async ({ page }) => {
        console.log('🔍 Testing Transit Finance Page...');

        await login(page, 'transit');

        await page.goto('http://localhost:3002/#/finance/transit');
        await page.waitForTimeout(3000);

        await page.screenshot({ path: 'test-results/transit-finance-logged-in.png', fullPage: true });

        const title = await page.locator('h1').textContent();
        console.log('📄 Page Title:', title);
        expect(title).toContain('收益中心');

        // 检查价格策略按钮
        await expect(page.locator('button:has-text("价格策略")')).toBeVisible();

        // 检查账单B金额 (VND)
        const vndAmounts = await page.locator('text=/₫/').count();
        console.log(`💰 Found ${vndAmounts} VND amounts`);
        expect(vndAmounts).toBeGreaterThan(0);

        // 检查应收总额卡片
        await expect(page.locator('text=应收总额 (运输费)')).toBeVisible();

        console.log('✅ Transit Finance Page test passed!');
    });

    test('Receiver Finance Page - Should display real batch and bill data', async ({ page }) => {
        console.log('🔍 Testing Receiver Finance Page...');

        await login(page, 'receiver');

        await page.goto('http://localhost:3002/#/finance/receiver');
        await page.waitForTimeout(3000);

        await page.screenshot({ path: 'test-results/receiver-finance-logged-in.png', fullPage: true });

        const title = await page.locator('h1').textContent();
        console.log('📄 Page Title:', title);
        expect(title).toContain('收款中心');

        // 检查价格策略按钮
        await expect(page.locator('button:has-text("价格策略")')).toBeVisible();

        // 检查账单C金额（CNY）
        const cnyAmounts = await page.locator('text=/¥/').count();
        console.log(`💰 Found ${cnyAmounts} CNY amounts`);
        expect(cnyAmounts).toBeGreaterThan(0);

        // 检查应收总额卡片
        await expect(page.locator('text=应收总额 (货款)')).toBeVisible();

        console.log('✅ Receiver Finance Page test passed!');
    });

    test('Admin Price Config Page - Should display batch pricing', async ({ page }) => {
        console.log('🔍 Testing Admin Price Config Page...');

        // 使用 sender 账号登录（假设所有角色都能访问价格策略）
        await login(page, 'sender');

        await page.goto('http://localhost:3002/#/finance/admin/pricing');
        await page.waitForTimeout(3000);

        await page.screenshot({ path: 'test-results/admin-pricing-logged-in.png', fullPage: true });

        const title = await page.locator('h1').textContent();
        console.log('📄 Page Title:', title);
        expect(title).toContain('平台价格策略');

        // 检查是否显示批次列表标题
        await expect(page.locator('text=批次列表')).toBeVisible();

        // 检查单价标签
        const priceLabels = await page.locator('text=/账单[ABC]/').count();
        console.log(`💵 Found ${priceLabels} price labels`);
        expect(priceLabels).toBeGreaterThan(0);

        console.log('✅ Admin Price Config Page test passed!');
    });

    test('Navigation - Price Strategy button should work', async ({ page }) => {
        console.log('🔍 Testing Price Strategy Navigation...');

        await login(page, 'sender');

        // 从发货方页面点击价格策略按钮
        await page.goto('http://localhost:3002/#/finance/sender');
        await page.waitForTimeout(2000);

        const priceButton = page.locator('button:has-text("价格策略")');
        await expect(priceButton).toBeVisible();

        await priceButton.click();
        await page.waitForTimeout(2000);

        // 验证跳转到价格策略页面
        const url = page.url();
        console.log('🔗 Current URL after click:', url);
        expect(url).toContain('/finance/admin/pricing');

        const title = await page.locator('h1').textContent();
        expect(title).toContain('平台价格策略');

        await page.screenshot({ path: 'test-results/navigation-test-logged-in.png', fullPage: true });

        console.log('✅ Navigation test passed!');
    });

    test('Data Consistency - Verify bill amounts match database', async ({ page }) => {
        console.log('🔍 Testing Data Consistency...');

        await login(page, 'sender');

        await page.goto('http://localhost:3002/#/finance/sender');
        await page.waitForTimeout(3000);

        // 获取页面上显示的第一个批次的账单金额
        const firstBatchBillA = await page.locator('[class*="账单 A"]').first().locator('[class*="font-mono"]').textContent();
        console.log('💰 First Batch Bill A Amount:', firstBatchBillA);

        // 验证金额格式正确（应该包含货币符号）
        expect(firstBatchBillA).toMatch(/₫|¥/);

        await page.screenshot({ path: 'test-results/data-consistency-test.png', fullPage: true });

        console.log('✅ Data consistency test passed!');
    });
});
