const fs = require('fs')
const puppeteer = require('puppeteer-extra')
const ChatBot = require('dingtalk-robot-sender')
const __config__ = require('./config.js')
const moment = require('moment')

console.log('------ 项目 dailyssr 启动 ------')

let webSiteTime = ''

// 应用各种规避技术，使无头傀儡的检测更加困难。
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin())

// 非常快速有效的广告和跟踪器拦截器。减少带宽和加载时间。
// const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker')
// puppeteer.use(AdblockerPlugin({ blockTrackers: true }))

// function choose(choices) {
//   var index = Math.floor(Math.random() * choices.length)
//   return choices[index]
// }

/** 
 * 获取ssr列表
 */
const getSsrList = async (logStr) => {
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

    webSiteTime = await page.$eval(__config__.timeSpan, node => node.innerText)
    console.log('webSiteTime 的内容: ', webSiteTime)

    if (logStr === webSiteTime) {
      const msg = `当前没有新货，将在${__config__.intervalValue}毫秒后再试.`
      return { success: false, msg, data: [] }
    }

    console.log('有新货，继续搞')

    await page.waitForSelector(__config__.getAllEl)

    await page.click(__config__.getAllEl)

    // 操作剪切板
    const context = await browser.defaultBrowserContext()

    await context.overridePermissions(__config__.webSite, ['clipboard-read'])

    const copiedText = await page.evaluate(`(async () => await navigator.clipboard.readText())()`)
    // console.log(copiedText.split('\n'))

    await browser.close()

    fs.writeFile(__config__.logFilePath, webSiteTime, (error) => {
      if (error) {
        console.log('写入失败', error)
        return
      }

      console.log(`最新日期写入到 "${__config__.logFilePath}" 成功`)
    })

    // 返回数组
    return { success: true, msg: '新货到', data: copiedText.split('\n') }
  } catch (e) {
    const msg = '获取酸酸乳列表出错'
    console.log(msg, e)
    return { success: false, msg: msg, data: e }
  }
}

/** 往钉钉推送信息 */
const sendToDd = async res => {
  if (!res) return

  // 钉钉机器人初始化
  const { baseUrl, accessToken, secret } = __config__.dd
  const ddRobot = new ChatBot({ baseUrl, accessToken, secret })

  if (!res.success) {
    ddRobot.text(res.msg)
    return
  }

  const { data } = res

  /** 卡片-代码提交信息 */
  const title = `${webSiteTime}的新鲜酸酸乳到货囖～`

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

  console.log('------- 推送钉钉完成 -------', title)
  console.log(' ')
}


const initLogFile = () => {
  try {
    fs.accessSync(__config__.logFilePath)
    console.log('文件存在... 继续')
  } catch (err) {
    console.log('文件不存在... 初始化一个吧')
    fs.writeFileSync(__config__.logFilePath, '')
  }
}

/** 距离上一次拿到数据有没有大于x毫秒 */
const canFetchNow = (logStr) => {
  if (!logStr) return true

  const logMomentStr = `${new Date().getFullYear()}年${logStr}`
  const logMoment = moment(logMomentStr, 'YYYY年MM月DD日 HH点mm分')
  const diff = moment().diff(logMoment)

  console.log('logMoment:', logMomentStr)
  console.log('currentMoment:', moment().format('YYYY年MM月DD日 HH点mm分'))

  if (diff < __config__.fetchInterval) {
    return false
  }

  return true
}

/** 主程序 */
const main = async () => {
  initLogFile()

  // 与本地文件判断
  console.log('开始文件比对..')
  const logData = fs.readFileSync(__config__.logFilePath)
  const logStr = logData.toString()
  console.log(`${__config__.logFilePath} 的内容: `, logStr)

  if (!canFetchNow(logStr)) {
    console.log(`距离上一次拿到数据小于${__config__.fetchInterval / 1000 / 60}分钟，算了，别去请求`)
    return
  }

  console.log('可以执行请求新的ssr列表了')

  const res = await getSsrList(logStr)
  console.log('list response: ', res)

  sendToDd(res)
}

// 先执行一次
main()
// 再跑定时器
setInterval(main, __config__.intervalValue)