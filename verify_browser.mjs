import puppeteer from 'puppeteer';

(async () => {
  console.log('Launching headless Chrome...');
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 950 });

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));

  console.log('Navigating to http://127.0.0.1:8000/?nocache=test1 ...');
  await page.goto('http://127.0.0.1:8000/?nocache=test1', { waitUntil: 'networkidle0' });

  // Wait 1.5s for all renders and animations
  await new Promise(r => setTimeout(r, 1500));

  // 1. Capture Dashboard with Transformation Roadmap
  const outDir = '/home/ranjith/.gemini/antigravity-ide/brain/b6764df6-5f7c-4127-9f90-14f9f957700f';
  await page.screenshot({ path: `${outDir}/1_dashboard_transformation_roadmap.png` });
  console.log('Saved 1_dashboard_transformation_roadmap.png');

  // 2. Scroll to history table and capture
  const historyEl = await page.$('#section-history-explorer');
  if (historyEl) {
    await historyEl.scrollIntoView();
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: `${outDir}/2_date_wise_history_table.png` });
    console.log('Saved 2_date_wise_history_table.png');
  }

  // 3. Test Date Navigator: Click "◀ Prev Day"
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise(r => setTimeout(r, 400));
  console.log('Clicking Prev Day button...');
  await page.evaluate(() => app.shiftDate(-1));
  await new Promise(r => setTimeout(r, 1200));

  await page.screenshot({ path: `${outDir}/3_prev_day_view.png` });
  console.log('Saved 3_prev_day_view.png');

  // 4. Test "Jump to Today"
  console.log('Clicking Jump to Today...');
  await page.evaluate(() => app.jumpToToday());
  await new Promise(r => setTimeout(r, 1200));

  // 5. Open Personal Profile & Metabolic Engine Modal
  console.log('Opening modalSettings...');
  await page.evaluate(() => app.openModal('modalSettings'));
  await new Promise(r => setTimeout(r, 600));

  // 6. Test Auto-Calculate Mifflin-St Jeor
  console.log('Triggering auto-calculate metabolism...');
  await page.evaluate(() => app.previewMetabolismCalculation());
  await new Promise(r => setTimeout(r, 1200));

  await page.screenshot({ path: `${outDir}/4_metabolism_calc_modal.png` });
  console.log('Saved 4_metabolism_calc_modal.png');

  // 7. Save targets
  console.log('Submitting targets form...');
  await page.evaluate(() => {
    document.getElementById('targetsForm').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
  });
  await new Promise(r => setTimeout(r, 1500));

  await page.screenshot({ path: `${outDir}/5_targets_saved_updated_roadmap.png` });
  console.log('Saved 5_targets_saved_updated_roadmap.png');

  await browser.close();
  console.log('Browser verification completed successfully!');
})();
