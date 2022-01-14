module.exports = {
  webSite: 'https://lncn.org',
  getAllEl: '#index > div.layout-left-right.el-row > div.boxes-wrapper.layout-main.el-col.el-col-17.el-col-xs-24.el-col-sm-24.el-col-md-17 > div.ssr-list-wrapper.base-box > div.ssr-btn-bar > button > span',
  timeSpan: '#index > div.layout-left-right.el-row > div.boxes-wrapper.layout-main.el-col.el-col-17.el-col-xs-24.el-col-sm-24.el-col-md-17 > div.ssr-list-wrapper.base-box > div.ssr-btn-bar > span',
  serverJiang: {
    sendKey: '',
  },
  dd: {
    baseUrl: 'https://oapi.dingtalk.com/robot/send',
    // 此处是钉钉生成的 webhook 中 ？号后面的token
    accessToken: '92dbd1595dbc829e6bdca24c10a456f00b2236c0e7b02444bc0304a8415b0c01',
    // 此处是签名
    secret: 'SEC859e29d72f86997ba6b1079060de6ca033920b22425473c842e78d5ec12b698b',
  }
}