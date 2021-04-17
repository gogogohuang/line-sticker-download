const path = require("path");
const chalk = require("chalk");
const puppeteer = require("puppeteer");
const makeDir = require("make-dir");
const downloadImage = require("image-downloader").image;
const ora = require("ora");

const scrapeStickerUrls = async (url, stickerPackageId) => {
  const pageUrl = `${url}/${stickerPackageId}`;
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
    stickerId: id,
    stickerStaticUrl: staticUrl.split(";")[0],
  }));

  browser.close();

  return stickerUrls;
}


const downloadImg = async (urls, imgPath) => {
  try {
    await Promise.all(
      urls.map((url) =>
        downloadImage({
          url: url.stickerStaticUrl,
          dest: path.join(imgPath, `sticker-${url.stickerId}.png`),
        })
      )
    );
  } catch (error) {
    console.log(error);
  }
}

const index = async (args= {}) => {
  const spinner = ora("Downloading stickers...");
  
  try {
    const { url, stickerPackageIds, path } = args;

    spinner.start();

    for (let i  = 0; i < stickerPackageIds.length; i++) {
      const stickerPackageId = stickerPackageIds[i];
      const imgUrls = await scrapeStickerUrls(url, stickerPackageId);
      await makeDir(`${path}/${stickerPackageId}`);
      await downloadImg(imgUrls, `${path}/${stickerPackageId}`);

      spinner.text = `Downloading ${stickerPackageId} - ${imgUrls.length} stickers...`;
    }

    spinner.succeed(chalk.green(`Saved stickers to ${path}/`));
  } catch (err) {
    if (args) {
      spinner.fail(chalk.red(err.message));
    }

    console.error(err.stack);
    process.exit(1);
  }
}

module.exports = index;
