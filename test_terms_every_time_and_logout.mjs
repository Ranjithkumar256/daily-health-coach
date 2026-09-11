import puppeteer from 'puppeteer';

async function main() {
  console.log('🧪 TESTING TERMS & PERMISSIONS "ASK EVERY TIME", VALIDATION & LOGOUT');
  console.log('=====================================================================');

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

    // =========================================================================
    // PART 1: TESTING PAISATRACK (http://localhost:8000)
    // =========================================================================
    console.log('\n--- PART 1: PaisaTrack (http://localhost:8000) ---');
    await page.goto('http://localhost:8000', { waitUntil: 'networkidle0' });

    // Step 1.1: Verify Terms Modal is displayed on fresh session ("ask every time")
    const paisaTermsVisible = await page.evaluate(() => {
      const modal = document.getElementById('modalTermsConsent');
      return modal && window.getComputedStyle(modal).display !== 'none';
    });
    console.log('PaisaTrack: Terms modal visible on fresh launch:', paisaTermsVisible);
    if (!paisaTermsVisible) throw new Error('FAILED: PaisaTrack Terms modal must appear on fresh launch!');

    const paisaCheckboxUnchecked = await page.evaluate(() => {
      const chk = document.getElementById('termsAgreeCheckbox');
      return chk && !chk.checked;
    });
    console.log('PaisaTrack: Agreement checkbox is initially unchecked:', paisaCheckboxUnchecked);
    if (!paisaCheckboxUnchecked) throw new Error('FAILED: Checkbox should start unchecked!');

    // Step 1.2: Click Accept WITHOUT checking box -> Must show error & logout button
    console.log('PaisaTrack: Clicking Accept without checking box...');
    await page.click('#btnAcceptTerms');
    await new Promise(r => setTimeout(r, 400));

    const paisaValidationState = await page.evaluate(() => {
      const modal = document.getElementById('modalTermsConsent');
      const alert = document.getElementById('termsAgreeErrorAlert');
      const logoutOpt = document.getElementById('termsLogoutOption');
      const isStillOpen = modal && window.getComputedStyle(modal).display !== 'none';
      return {
        isStillOpen,
        alertVisible: alert && window.getComputedStyle(alert).display !== 'none',
        alertText: alert ? alert.textContent.trim() : '',
        logoutVisible: logoutOpt && window.getComputedStyle(logoutOpt).display !== 'none'
      };
    });
    console.log('PaisaTrack validation state:', paisaValidationState);
    if (!paisaValidationState.isStillOpen) throw new Error('FAILED: Modal closed without checkbox agreement!');
    if (!paisaValidationState.alertVisible || !paisaValidationState.alertText.includes('Please check this box')) {
      throw new Error('FAILED: "Please check this box" alert not displayed!');
    }
    if (!paisaValidationState.logoutVisible) {
      throw new Error('FAILED: Logout option was not shown when user did not check box!');
    }
    console.log('✅ PASSED: PaisaTrack correctly enforces checkbox, displays warning, and displays Logout option.');

    // Capture screenshot of PaisaTrack validation error & logout option
    await page.screenshot({ path: '/home/ranjith/.gemini/antigravity-ide/brain/80a9f79b-6444-45bd-bf2a-396b8804bebb/paisatrack_terms_validation_logout.png' });

    // Step 1.3: Click the Logout option from the terms modal
    console.log('PaisaTrack: Clicking "Logout" from terms modal...');
    await page.click('#btnTermsLogout');
    await new Promise(r => setTimeout(r, 600));

    const paisaLoggedOut = await page.evaluate(() => {
      const modal = document.getElementById('modalTermsConsent');
      const authOverlay = document.getElementById('authOverlay');
      const modalClosed = !modal || window.getComputedStyle(modal).display === 'none';
      const authVisible = authOverlay && window.getComputedStyle(authOverlay).display !== 'none';
      return { modalClosed, authVisible };
    });
    console.log('PaisaTrack logout state:', paisaLoggedOut);
    if (!paisaLoggedOut.modalClosed) throw new Error('FAILED: Terms modal should close on logout');
    if (!paisaLoggedOut.authVisible) throw new Error('FAILED: Auth overlay should show after logout');
    console.log('✅ PASSED: Clicking Logout from terms modal successfully logs user out in PaisaTrack.');

    // Step 1.4: Log back in and test successful acceptance
    console.log('PaisaTrack: Logging back in as demo to verify successful agreement...');
    await page.click('#btnQuickDemoLogin');
    await new Promise(r => setTimeout(r, 600));

    // Show terms modal for session and accept
    await page.evaluate(() => BackupManager.showTermsModal(false));
    await new Promise(r => setTimeout(r, 400));
    await page.click('#termsAgreeCheckbox');
    await page.click('#btnAcceptTerms');
    await new Promise(r => setTimeout(r, 400));

    const paisaAcceptedModalClosed = await page.evaluate(() => {
      const modal = document.getElementById('modalTermsConsent');
      return !modal || window.getComputedStyle(modal).display === 'none';
    });
    console.log('PaisaTrack: Modal closed after checking box and accepting:', paisaAcceptedModalClosed);
    if (!paisaAcceptedModalClosed) throw new Error('FAILED: Modal did not close upon checking box and accepting');
    console.log('✅ PASSED: PaisaTrack completes full terms flow flawlessly.');

    // =========================================================================
    // PART 2: TESTING DAILY HEALTH COACH (http://localhost:8001)
    // =========================================================================
    console.log('\n--- PART 2: Daily Health Coach (http://localhost:8001) ---');
    await page.goto('http://localhost:8001', { waitUntil: 'networkidle0' });

    // Step 2.1: Verify Terms Modal is displayed on launch
    const dhcTermsVisible = await page.evaluate(() => {
      const modal = document.getElementById('modalTermsConsent');
      return modal && window.getComputedStyle(modal).display !== 'none';
    });
    console.log('Daily Health Coach: Terms modal visible initially:', dhcTermsVisible);
    if (!dhcTermsVisible) throw new Error('FAILED: Daily Health Coach terms modal must appear on launch!');

    // Step 2.2: Click Accept WITHOUT checking box -> Must show error & logout button
    console.log('Daily Health Coach: Clicking Accept without checking box...');
    await page.click('#btnAcceptTerms');
    await new Promise(r => setTimeout(r, 400));

    const dhcValidationState = await page.evaluate(() => {
      const modal = document.getElementById('modalTermsConsent');
      const alert = document.getElementById('termsAgreeErrorAlert');
      const logoutOpt = document.getElementById('termsLogoutOption');
      const isStillOpen = modal && window.getComputedStyle(modal).display !== 'none';
      return {
        isStillOpen,
        alertVisible: alert && window.getComputedStyle(alert).display !== 'none',
        alertText: alert ? alert.textContent.trim() : '',
        logoutVisible: logoutOpt && window.getComputedStyle(logoutOpt).display !== 'none'
      };
    });
    console.log('Daily Health Coach validation state:', dhcValidationState);
    if (!dhcValidationState.isStillOpen) throw new Error('FAILED: DHC modal closed without checkbox agreement!');
    if (!dhcValidationState.alertVisible || !dhcValidationState.alertText.includes('Please check this box')) {
      throw new Error('FAILED: "Please check this box" alert not displayed in DHC!');
    }
    if (!dhcValidationState.logoutVisible) {
      throw new Error('FAILED: Logout option not shown in DHC!');
    }
    console.log('✅ PASSED: Daily Health Coach enforces checkbox, displays alert, and displays Logout button.');

    // Capture screenshot of DHC validation error & logout option
    await page.screenshot({ path: '/home/ranjith/.gemini/antigravity-ide/brain/80a9f79b-6444-45bd-bf2a-396b8804bebb/dhc_terms_validation_logout.png' });

    // Step 2.3: Click the Logout button from DHC terms modal
    console.log('Daily Health Coach: Clicking "Logout" from terms modal...');
    await page.click('#btnTermsLogout');
    await new Promise(r => setTimeout(r, 600));

    const dhcLoggedOut = await page.evaluate(() => {
      const modal = document.getElementById('modalTermsConsent');
      const authOverlay = document.getElementById('authOverlay');
      const modalClosed = !modal || window.getComputedStyle(modal).display === 'none';
      const authVisible = authOverlay && window.getComputedStyle(authOverlay).display !== 'none';
      return { modalClosed, authVisible };
    });
    console.log('Daily Health Coach logout state:', dhcLoggedOut);
    if (!dhcLoggedOut.modalClosed) throw new Error('FAILED: DHC terms modal should close on logout');
    if (!dhcLoggedOut.authVisible) throw new Error('FAILED: DHC auth overlay should show after logout');
    console.log('✅ PASSED: Clicking Logout from terms modal successfully logs user out in Daily Health Coach.');

    // Step 2.4: Log back in as Demo and accept terms
    console.log('Daily Health Coach: Logging in as Quick Demo...');
    await page.click('#btnQuickDemoLogin');
    await new Promise(r => setTimeout(r, 600));

    await page.evaluate(() => BackupManager.showTermsModal(false));
    await new Promise(r => setTimeout(r, 400));
    await page.click('#termsAgreeCheckbox');
    await page.click('#btnAcceptTerms');
    await new Promise(r => setTimeout(r, 400));

    // Step 2.5: Verify Terms link is REMOVED from Backup modal
    console.log('\n--- Verifying Terms Link Removed from Backup Modal ---');
    await page.evaluate(() => BackupManager.openBackupModal());
    await new Promise(r => setTimeout(r, 400));

    const termsInBackupModal = await page.evaluate(() => {
      const backupModal = document.getElementById('modalBackup');
      if (!backupModal) return false;
      return backupModal.textContent.includes('Review Terms of Service & Permission Reasons');
    });
    console.log('Review Terms link found in Backup modal (should be false):', termsInBackupModal);
    if (termsInBackupModal) {
      throw new Error('FAILED: "Review Terms of Service & Permission Reasons" MUST BE REMOVED from Backup modal!');
    }
    console.log('✅ PASSED: "Review Terms of Service & Permission Reasons" successfully removed from Backup modal.');

    await page.evaluate(() => {
      const modal = document.getElementById('modalBackup');
      if (modal) modal.style.display = 'none';
    });

    // Step 2.6: Open Targets / Profile Modal ("traget button click then open profile here can show and change")
    console.log('\n--- Verifying Terms Management in Targets / Profile Modal ---');
    await page.evaluate(() => window.app.openModal('modalSettings'));
    await new Promise(r => setTimeout(r, 400));

    const profileTermsInfo = await page.evaluate(() => {
      const card = document.getElementById('termsProfileManagementCard');
      const badge = document.getElementById('profileTermsStatusBadge');
      const btn = document.getElementById('btnReviewTermsFromProfile');
      return {
        cardVisible: !!card,
        badgeText: badge ? badge.textContent.trim() : '',
        btnVisible: !!btn,
        btnText: btn ? btn.textContent.trim() : ''
      };
    });
    console.log('Profile modal terms card info:', profileTermsInfo);
    if (!profileTermsInfo.cardVisible || !profileTermsInfo.btnVisible) {
      throw new Error('FAILED: Terms review section not found in Targets / Profile modal!');
    }
    console.log('✅ PASSED: Terms of Service & Permission Reasons is present in Profile modal with Review & Change action.');

    // Scroll to Terms section inside Profile modal and capture screenshot
    await page.evaluate(() => {
      const card = document.getElementById('termsProfileManagementCard');
      card?.scrollIntoView({ behavior: 'instant', block: 'center' });
    });
    await new Promise(r => setTimeout(r, 200));
    await page.screenshot({ path: '/home/ranjith/.gemini/antigravity-ide/brain/80a9f79b-6444-45bd-bf2a-396b8804bebb/dhc_profile_terms_section.png' });

    // Step 2.7: Click "Review & Change Consent" from inside Profile modal
    console.log('Daily Health Coach: Clicking "Review & Change Consent" inside Profile modal...');
    await page.click('#btnReviewTermsFromProfile');
    await new Promise(r => setTimeout(r, 500));

    const termsModalReopened = await page.evaluate(() => {
      const modal = document.getElementById('modalTermsConsent');
      const chk = document.getElementById('termsAgreeCheckbox');
      return {
        modalVisible: modal && window.getComputedStyle(modal).display !== 'none',
        checkboxChecked: chk ? chk.checked : false
      };
    });
    console.log('Terms modal opened from Profile modal:', termsModalReopened);
    if (!termsModalReopened.modalVisible) {
      throw new Error('FAILED: Terms modal did not open from Profile modal!');
    }
    console.log('✅ PASSED: Clicking Review in Profile opens Terms & Permissions dialog to show and change consent.');

    // Capture screenshot of Terms modal opened from Profile
    await page.screenshot({ path: '/home/ranjith/.gemini/antigravity-ide/brain/80a9f79b-6444-45bd-bf2a-396b8804bebb/dhc_terms_opened_from_profile.png' });

    console.log('\n=====================================================================');
    console.log('🎉 ALL TERMS "ASK EVERY TIME", VALIDATION & LOGOUT TESTS PASSED 100%!');
    console.log('=====================================================================');

    await page.close();
  } finally {
    await browser.close();
  }
}

main().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
