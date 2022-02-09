const puppeteer = require('puppeteer-extra')
const moment = require('moment')
const ChatBot = require('dingtalk-robot-sender')
const __config__ = require('./config.js')

console.log('------ 项目 dailyssr 启动 ------')

// 程序运行时今天'MM月DD日'
let today = null

// 今天是否拿过了
let isReceiptToday = false

// 最后一次成功获取的时间
let lastRectiptDay = ''

// 应用各种规避技术，使无头傀儡的检测更加困难。
const StealthPlugin = require("puppeteer-extra-plugin-stealth")
puppeteer.use(StealthPlugin())

// 非常快速有效的广告和跟踪器拦截器。减少带宽和加载时间。
// const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker')
// puppeteer.use(AdblockerPlugin({ blockTrackers: true }))

// function choose(choices) {
//   var index = Math.floor(Math.random() * choices.length)
//   return choices[index]
// }


/** 获取ssr列表 */
const getSsrList = async () => {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      devtools: false,
      // slowMo: 100, //放慢浏览器执行速度，方便测试观察
      ignoreDefaultArgs: ['--enable-automation'],
      args: [
        // '--start-maximized',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--enable-experimental-cookie-features',
        '--disable-notifications',
        // --proxy-server=${newProxyUrl},
      ],
    })

    const page = await browser.newPage()

    await page.goto(__config__.webSite)

    await page.waitForSelector(__config__.timeSpan)

    const timeSpan = await page.$eval(__config__.timeSpan, node => node.innerText)

    // 网站上的今天
    const webSiteToday = timeSpan.split(' ')[0]
    // console.log('webSiteToday', webSiteToday)

    // 程序调用时的今天
    if (today !== webSiteToday) {
      return { success: false, msg: '没新货', data: [] }
    }

    // 有新货，继续搞
    await page.waitForSelector(__config__.getAllEl)

    await page.click(__config__.getAllEl)

    // 操作剪切板
    const context = await browser.defaultBrowserContext()

    await context.overridePermissions(__config__.webSite, ['clipboard-read'])

    const copiedText = await page.evaluate(`(async () => await navigator.clipboard.readText())()`)
    // console.log(copiedText.split('\n'))

    await browser.close()

    lastRectipt = webSiteToday

    // 返回数组
    return { success: true, msg: '新货到', data: copiedText.split('\n') }
    // return { success: true, msg: '新货到', data: copiedText }
  } catch (e) {
    const msg = '获取酸酸乳列表出错'
    console.log(msg, e)
    return { success: false, msg: msg, data: e }
  }
}

/** 往钉钉推送信息 */
const sendToDd = async res => {
  // 钉钉机器人初始化
  const { baseUrl, accessToken, secret } = __config__.dd
  const ddRobot = new ChatBot({ baseUrl, accessToken, secret })

  if (!res.success) {
    ddRobot.text(res.msg)
    return
  }

  const { data } = res

  /** 卡片-代码提交信息 */
  const title = `钉～请查收${today}的新鲜酸酸乳`

  let text = `## ${title}\n`

  for (let i = 0; i < data.length; i++) {
    const item = data[i]
    if (!item) break

    text += `### 酸酸乳${i}:\n`
    text += `${item}\n`
    // 钉钉上点击不会直接生效?
    // text += `[${item}](${item})\n\n`
  }

  await ddRobot.markdown(title, text)

  console.log('推送钉钉完成')

  isReceiptToday = true
}

/** 主程序 */
const main = async () => {
  today = moment().format('MM月DD日')

  // 新的一天，重置值
  if (today !== lastRectiptDay) {
    isReceiptToday = false
  }

  if (isReceiptToday) {
    console.log('今天已经取过了，明天请早')
    return
  }

  const res = await getSsrList()
  console.log('list response: ', res)

  // 不需要拦截，把结果告诉钉钉
  // if (!res.success) {
  //   console.log(res.msg)
  //   return
  // }

  sendToDd(res)

}

// 先执行一次
// main()

// setInterval(main, __config__.intervalValue)