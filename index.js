const path = require("path");
const chalk = require("chalk");
const puppeteer = require("puppeteer");
const makeDir = require("make-dir");
const downloadImage = require("image-downloader").image;
const ora = require("ora");
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function createContext(config) {
    const { url, dest = "stickers" } = config;


    return {
        spinner: ora("Downloading stickers..."),
        config: {
        url,
        dest,
        },
    };
}

async function scrapeStickerUrls(context) {
  const { url: pageUrl } = context.config;

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(pageUrl);
  const elementHandles = await page.evaluate(() =>
    [...document.querySelectorAll(".FnStickerPreviewItem")].map((element) =>
      JSON.parse(element.getAttribute("data-preview"))
    )
  );

  if (elementHandles.length === 0) {
    throw new Error("Could not find any stickers on the specified page");
  }

  const stickerUrls = elementHandles.map(({ id, staticUrl }) => ({
    id,
    staticUrl: staticUrl.split(";")[0],
  }));

  browser.close();

  return stickerUrls;
}

async function downloadStickers(config = {}) {
  let context;
  try {
    context = createContext(config);
    const {
      spinner,
      config: { dest },
    } = context;
    spinner.start();

    const urls = await scrapeStickerUrls(context);
    await makeDir(dest);

    context.spinner.text = `Downloading ${urls.length} stickers...`;

    await Promise.all(
      urls.map((url) =>
        downloadImage({
          url: url.staticUrl,
          dest: path.join(dest, `sticker-${url.id}.png`),
        })
      )
    );

    spinner.succeed(chalk.green(`Saved stickers to ${dest}/`));
  } catch (err) {
    if (context) {
      context.spinner.fail(chalk.red(err.message));
    }
    console.error(err.stack);
    process.exit(1);
  }
}

module.exports = downloadStickers;
