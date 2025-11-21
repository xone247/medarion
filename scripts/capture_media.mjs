import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';

async function ensureDir(dir) {
	if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function run() {
	const BASE_URL = process.env.APP_URL || 'http://localhost:5173';
	const outScreens = path.resolve('public/media/screens');
	const outVideo = path.resolve('public/media/video');
	await ensureDir(outScreens);
	await ensureDir(outVideo);

	const browser = await chromium.launch({ headless: true });
	const context = await browser.newContext({
		viewport: { width: 1280, height: 720 },
		recordVideo: { dir: outVideo, size: { width: 1280, height: 720 } }
	});
	const page = await context.newPage();
	try {
		await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });

		// Wait for hero to be visible
		await page.waitForSelector('h1', { timeout: 30000 });

		// LIGHT screenshot
		await page.screenshot({ path: path.join(outScreens, 'home-hero-light.png') });

		// DARK screenshot (toggle if present)
		const darkBtn = page.locator('button:has-text("Dark")');
		if (await darkBtn.count().catch(() => 0)) {
			await darkBtn.first().click({ timeout: 5000 }).catch(() => {});
			await page.waitForTimeout(400);
			await page.screenshot({ path: path.join(outScreens, 'home-hero-dark.png') });
		}

		// Small walkthrough video: scroll hero and show CTAs
		await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
		await page.waitForTimeout(500);
		await page.mouse.wheel(0, 450);
		await page.waitForTimeout(600);
		await page.mouse.wheel(0, 450);
		await page.waitForTimeout(600);
		await page.mouse.wheel(0, -600);
		await page.waitForTimeout(800);

		const v = await page.video();
		await page.close(); // flush video
		if (v) {
			const videoPath = await v.path();
			const target = path.join(outVideo, 'home-hero-walkthrough.webm');
			// Move/rename to stable filename
			try {
				fs.renameSync(videoPath, target);
			} catch {
				fs.copyFileSync(videoPath, target);
			}
			console.log('Saved video to', target);
		}
	} finally {
		await context.close();
		await browser.close();
	}
}

run().catch(err => {
	console.error(err);
	process.exit(1);
});


