import { chromium } from "playwright-core";

const browser = await chromium.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
});

const viewports = [
  { name: "phone-320", width: 320, height: 568 },
  { name: "phone-375", width: 375, height: 812 },
  { name: "phone-430", width: 430, height: 932 },
  { name: "landscape-844", width: 844, height: 390 },
  { name: "desktop-1440", width: 1440, height: 1000 },
];

const results = [];

for (const viewport of viewports) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto("http://127.0.0.1:4173/", { waitUntil: "networkidle" });
  await page.screenshot({
    path: `.impeccable/review/adapt-after-${viewport.name}.png`,
    fullPage: viewport.name === "desktop-1440",
  });

  const metrics = await page.evaluate(() => {
    const interactive = [...document.querySelectorAll("button, a, input")]
      .filter((element) => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
      })
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          label: element.getAttribute("aria-label") || element.textContent.trim() || element.getAttribute("placeholder"),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        };
      });
    const heroMedia = document.querySelector(".hero-media")?.getBoundingClientRect();
    const mobileNav = document.querySelector(".mobile-nav")?.getBoundingClientRect();
    return {
      innerWidth: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      heroMediaTop: heroMedia ? Math.round(heroMedia.top) : null,
      heroMediaBottom: heroMedia ? Math.round(heroMedia.bottom) : null,
      mobileNavVisible: Boolean(mobileNav?.width && mobileNav?.height),
      undersized: interactive.filter(({ width, height }) => width < 44 || height < 44),
    };
  });

  if (viewport.width <= 620) {
    await page.getByRole("button", { name: "3-tap match" }).click();
    const panelVisible = await page.locator(".quiz-panel").isVisible();
    await page.locator('.mobile-nav a[href="#spots"]').click();
    await page.waitForTimeout(250);
    metrics.quizPanelVisible = panelVisible;
    metrics.navReachedSpots = (await page.locator("#spots").boundingBox())?.y < viewport.height;
  }

  results.push({ ...viewport, errors, ...metrics });
  await context.close();
}

await browser.close();
console.log(JSON.stringify(results, null, 2));
