import puppeteer from 'puppeteer';

async function main() {
  console.log('🧪 TESTING DAILY HEALTH COACH AUTH & DEMO REMOVAL');
  console.log('===================================================');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844 });

    const client = await page.target().createCDPSession();
    await client.send('Network.setBypassServiceWorker', { bypass: true });
    await client.send('Network.clearBrowserCache');

    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));

    await page.goto('http://localhost:8001', { waitUntil: 'networkidle0' });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'networkidle0' });

    // 1. Accept terms if terms consent dialog shows up
    const termsVisible = await page.evaluate(() => {
      const modal = document.getElementById('modalTermsConsent');
      return modal && modal.style.display !== 'none';
    });
    if (termsVisible) {
      console.log('Accepting Terms & Conditions dialog...');
      await page.click('#termsAgreeCheckbox');
      await page.click('#btnAcceptTerms');
      await new Promise(r => setTimeout(r, 400));
    }

    // -------------------------------------------------------------------------
    // TEST 1: Verify "⚡ Demo Day" Button is REMOVED from top right corner
    // -------------------------------------------------------------------------
    console.log('\n--- Test 1: Verify Demo Day Button Removal ---');
    const demoDayButton = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find(b => b.textContent.includes('Demo Day'));
    });
    console.log('Demo Day button exists in top right:', !!demoDayButton);
    if (demoDayButton) {
      throw new Error('FAILED: "⚡ Demo Day" button was NOT removed from header!');
    }
    console.log('✅ PASSED: Demo Day button completely removed from top right corner.');

    // -------------------------------------------------------------------------
    // TEST 2: Verify Auth Overlay is visible on unauthenticated launch
    // -------------------------------------------------------------------------
    console.log('\n--- Test 2: Auth Overlay on Unauthenticated Launch ---');
    const authOverlayVisible = await page.evaluate(() => {
      const overlay = document.getElementById('authOverlay');
      return overlay && window.getComputedStyle(overlay).display !== 'none';
    });
    console.log('Auth Overlay visible initially:', authOverlayVisible);
    if (!authOverlayVisible) {
      throw new Error('FAILED: Auth Overlay should be visible on fresh launch!');
    }
    console.log('✅ PASSED: Auth Overlay enforced for unauthenticated session.');

    // Capture screenshot of Sign In Modal
    await page.screenshot({ path: '/home/ranjith/.gemini/antigravity-ide/brain/80a9f79b-6444-45bd-bf2a-396b8804bebb/dhc_auth_modal.png' });

    // -------------------------------------------------------------------------
    // TEST 3: Auth Validation - Wrong Password Rejection
    // -------------------------------------------------------------------------
    console.log('\n--- Test 3: Wrong Password Validation ---');
    await page.evaluate(() => {
      document.getElementById('loginUsername').value = 'demo';
      document.getElementById('loginPassword').value = 'wrongpassword';
      document.getElementById('formSignIn').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    });
    await new Promise(r => setTimeout(r, 600));

    const authAlertText = await page.evaluate(() => {
      const alert = document.getElementById('authAlert');
      return alert ? alert.textContent.trim() : '';
    });
    console.log('Rejection message on wrong password:', authAlertText);
    if (!authAlertText.toLowerCase().includes('incorrect') && !authAlertText.toLowerCase().includes('invalid')) {
      throw new Error('FAILED: Wrong password was not rejected properly!');
    }
    console.log('✅ PASSED: Wrong password correctly rejected with error banner.');

    // -------------------------------------------------------------------------
    // TEST 4: Quick Demo Login ("if click on demo goto inside demo data show")
    // -------------------------------------------------------------------------
    console.log('\n--- Test 4: Quick Demo Login & Demo Data Verification ---');
    await page.click('#btnQuickDemoLogin');
    await new Promise(r => setTimeout(r, 800));

    // Verify overlay closed
    const overlayHiddenAfterDemo = await page.evaluate(() => {
      const overlay = document.getElementById('authOverlay');
      return !overlay || window.getComputedStyle(overlay).display === 'none';
    });
    console.log('Auth Overlay closed after Demo Login:', overlayHiddenAfterDemo);
    if (!overlayHiddenAfterDemo) throw new Error('FAILED: Auth overlay did not close after Demo Login');

    // Verify Demo User Header Profile & Tag
    const demoHeaderInfo = await page.evaluate(() => {
      const badge = document.getElementById('userProfileBadge');
      const name = document.getElementById('headerUserName')?.textContent.trim();
      const tag = document.getElementById('headerDemoTag');
      return {
        badgeVisible: badge && window.getComputedStyle(badge).display !== 'none',
        name,
        tagVisible: tag && window.getComputedStyle(tag).display !== 'none'
      };
    });
    console.log('Demo User Header Info:', demoHeaderInfo);
    if (!demoHeaderInfo.badgeVisible || !demoHeaderInfo.tagVisible) {
      throw new Error('FAILED: Header does not display Demo user badge & tag!');
    }

    // Verify Demo Data (Pre-loaded 1350ml water logs, food logs, 6-day streak)
    const demoDataState = await page.evaluate(() => {
      const streakText = document.getElementById('streakDaysDisplay')?.textContent.trim();
      const waterVal = document.getElementById('waterTotalDisplay')?.textContent.trim();
      return { streakText, waterVal, rawState: window.app?.state };
    });
    console.log('Demo Session Streak:', demoDataState.streakText);
    console.log('Demo Session Water Total:', demoDataState.rawState?.water_total_ml, 'ml');
    console.log('Demo Session Food Logs Count:', demoDataState.rawState?.food_logs?.length);

    if (!demoDataState.streakText.includes('6 Day Streak')) {
      throw new Error('FAILED: Demo user should see 6 Day Streak!');
    }
    let initialDemoWater = demoDataState.rawState?.water_total_ml;
    if (!initialDemoWater || initialDemoWater <= 0) {
      throw new Error('FAILED: Demo user should have preloaded water logs!');
    }
    console.log(`✅ PASSED: Demo user shows rich demo day data (${initialDemoWater}ml water, 6 Day Streak).`);

    // Capture screenshot of Demo Session
    await page.screenshot({ path: '/home/ranjith/.gemini/antigravity-ide/brain/80a9f79b-6444-45bd-bf2a-396b8804bebb/dhc_demo_session.png' });

    // -------------------------------------------------------------------------
    // TEST 5: Logout & Register Real User ("otherwise user wise data show")
    // -------------------------------------------------------------------------
    console.log('\n--- Test 5: Logout & Real User Registration (Clean Slate) ---');
    await page.click('#headerSignOutBtn');
    await new Promise(r => setTimeout(r, 600));

    const overlayVisibleAfterLogout = await page.evaluate(() => {
      const overlay = document.getElementById('authOverlay');
      return overlay && window.getComputedStyle(overlay).display !== 'none';
    });
    console.log('Auth Overlay visible after sign out:', overlayVisibleAfterLogout);
    if (!overlayVisibleAfterLogout) throw new Error('FAILED: Overlay not visible after sign out');

    // Register a new real user
    const testUsername = 'runner_' + Date.now();
    await page.click('#tabSignUpBtn');
    await new Promise(r => setTimeout(r, 200));

    // Capture screenshot of SignUp tab
    await page.screenshot({ path: '/home/ranjith/.gemini/antigravity-ide/brain/80a9f79b-6444-45bd-bf2a-396b8804bebb/dhc_auth_signup_modal.png' });

    await page.evaluate((uName) => {
      document.getElementById('regFullName').value = 'Ranjith Athlete';
      document.getElementById('regUsername').value = uName;
      document.getElementById('regEmail').value = `${uName}@example.com`;
      document.getElementById('regPassword').value = 'SecretPass123';
      document.getElementById('formSignUp').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    }, testUsername);
    await new Promise(r => setTimeout(r, 1000));

    // Verify Real User Header Profile (No Demo Tag!)
    const realHeaderInfo = await page.evaluate(() => {
      const badge = document.getElementById('userProfileBadge');
      const name = document.getElementById('headerUserName')?.textContent.trim();
      const tag = document.getElementById('headerDemoTag');
      return {
        badgeVisible: badge && window.getComputedStyle(badge).display !== 'none',
        name,
        tagVisible: tag && window.getComputedStyle(tag).display !== 'none'
      };
    });
    console.log('Real User Header Info:', realHeaderInfo);
    if (realHeaderInfo.tagVisible) {
      throw new Error('FAILED: Real user should NOT have Demo tag!');
    }
    if (realHeaderInfo.name !== 'Ranjith Athlete') {
      throw new Error('FAILED: Real user name mismatch: ' + realHeaderInfo.name);
    }

    // Verify Real User has a clean slate (0ml water, 0 food logs, 0-day streak)
    const debugInfo = await page.evaluate(() => {
      return {
        currentUser: window.app?.currentUser,
        localDbUser: window.LocalDB?.getCurrentUser(),
        isRealUser: window.API?.isRealUser(),
        storageUser: localStorage.getItem('dhc_local_user_v1'),
        storageToken: localStorage.getItem('dhc_auth_token'),
        localSummary: window.LocalDB?.getTodaySummary(),
        rawWaterLogs: window.LocalDB?.getWaterLogs()
      };
    });
    console.log('DEBUG INFO IN TEST 5:', JSON.stringify(debugInfo, null, 2));

    const realUserData = await page.evaluate(() => {
      const streakText = document.getElementById('streakDaysDisplay')?.textContent.trim();
      return { streakText, rawState: window.app?.state };
    });
    console.log('Real User Streak:', realUserData.streakText);
    console.log('Real User Water Logs:', realUserData.rawState?.water_logs?.length);
    console.log('Real User Water Total:', realUserData.rawState?.water_total_ml, 'ml');
    console.log('Real User Food Logs:', realUserData.rawState?.food_logs?.length);

    if (realUserData.rawState?.water_total_ml !== 0) {
      throw new Error('FAILED: Real user should start with 0ml water (clean slate)!');
    }
    if (realUserData.rawState?.food_logs?.length !== 0) {
      throw new Error('FAILED: Real user should start with 0 food logs!');
    }
    console.log('✅ PASSED: Real user has clean personal health slate without demo data pollution.');

    // -------------------------------------------------------------------------
    // TEST 6: User-Wise Data Isolation Verification
    // -------------------------------------------------------------------------
    console.log('\n--- Test 6: User-Wise Data Isolation Between Users ---');
    // Real user logs 650ml water
    await page.evaluate(async () => {
      await window.API.logWater(650, 'Post-jog hydration');
      await window.app.refreshData();
    });
    await new Promise(r => setTimeout(r, 500));

    const realUserWaterAfterLog = await page.evaluate(() => window.app?.state?.water_total_ml);
    console.log('Real User Water after log:', realUserWaterAfterLog, 'ml');
    if (realUserWaterAfterLog !== 650) {
      throw new Error('FAILED: Real user water log did not update to 650ml');
    }

    // Capture screenshot of real user isolated dashboard
    await page.screenshot({ path: '/home/ranjith/.gemini/antigravity-ide/brain/80a9f79b-6444-45bd-bf2a-396b8804bebb/dhc_real_user_isolated.png' });

    // Sign out real user and sign back into Demo
    await page.evaluate(() => document.getElementById('headerSignOutBtn').click());
    await new Promise(r => setTimeout(r, 600));

    await page.evaluate(() => document.getElementById('btnQuickDemoLogin').click());
    await new Promise(r => setTimeout(r, 800));

    const demoWaterAfterRealLog = await page.evaluate(() => window.app?.state?.water_total_ml);
    console.log(`Demo User Water Total (should still be ${initialDemoWater}ml):`, demoWaterAfterRealLog, 'ml');
    if (demoWaterAfterRealLog !== initialDemoWater) {
      throw new Error(`FAILED: Demo user data was contaminated by real user data! (Expected ${initialDemoWater}, got ${demoWaterAfterRealLog})`);
    }

    // Sign out Demo and sign back in as Real User with password
    await page.evaluate(() => document.getElementById('headerSignOutBtn').click());
    await new Promise(r => setTimeout(r, 600));

    await page.evaluate((uName) => {
      document.getElementById('loginUsername').value = uName;
      document.getElementById('loginPassword').value = 'SecretPass123';
      document.getElementById('formSignIn').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    }, testUsername);
    await new Promise(r => setTimeout(r, 800));

    const realUserRestoredWater = await page.evaluate(() => window.app?.state?.water_total_ml);
    console.log('Real User Water after re-login (should still be 650ml):', realUserRestoredWater, 'ml');
    if (realUserRestoredWater !== 650) {
      throw new Error('FAILED: Real user personal data was not retained upon re-login!');
    }
    console.log('✅ PASSED: 100% User-Wise Data Isolation verified across user sessions!');

    console.log('\n===================================================');
    console.log('🎉 ALL DAILY HEALTH COACH TESTS PASSED 100%!');
    console.log('===================================================');

    await page.close();
  } finally {
    await browser.close();
  }
}

main().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
