const app = getApp()
var plugin = requirePlugin("WechatSI")

// 获取**全局唯一**的语音识别管理器**recordRecoManager**
let manager = plugin.getRecordRecognitionManager()

Page({
  data: {
    focus: false,
    inputValue: '',
    type: '',
    name: '无',
    currentText:'',
    id:0
  },


  bindKeyInput: function (e) {
    this.setData({
      inputValue: e.detail.value
    })
  },



  search() {
    var that=this
    function getType() {
      return new Promise(function (resolve, reject) {
        wx.request({                                                
          url: 'https://sffc.sh-service.com/wx_miniprogram/sites/feiguan/trashTypes_2/Handler/Handler.ashx?a=GET_KEYWORDS&kw=' + that.data.inputValue,
          method: 'GET',
          success(res) {
            console.log(res.data)
            if (!res.data.kw_arr) {
              that.setData({
                type: '查询不到的垃圾',
                name: '无'
              })
            } else {
              that.setData({
                type: res.data.kw_arr[0].TypeKey,
                name: res.data.kw_arr[0].Name
              })
              if (that.data.type == '可回收') {
                that.setData({
                  type: '可回收垃圾',
                  id:1
                })
              }
              if (that.data.type == '有害垃圾') {
                that.setData({
                  id:2
                })
              }
              if (that.data.type == '湿垃圾') {
                that.setData({
                  type: '厨余垃圾',
                  id:3
                })
              }
              if (that.data.type == '干垃圾') {       
                that.setData({
                  type: '其他垃圾',
                  id:4
                })
              }

              wx.request({                                                //调用MQTT下发指令API
                url: 'https://api.heclouds.com/cmds?device_id=562340823', //仅为示例，并非真实的接口地址
                data: String(that.data.id),
                header: {
                  'content-type': ' text/plain', // 默认值
                  'api-key': 'H6txx6=R1aSvNXESa33uDtgN3ng='
                },
                method: 'POST',
                success(res) {
                  console.log(res.data)
                }
              })

            }
            resolve();
          }
        })
      })
    }

    getType().then(() => {

      wx.showModal({

        content: this.data.inputValue + '是' + this.data.type + '\r\n匹配结果：' + this.data.name,
        showCancel: true,
        confirmText: '确定',
        success(res) {
          if (res.confirm) {
            console.log('用户点击了确定')
          } else if (res.cancel) {
            console.log('用户点击了取消')
          }
        }
      })

    });

  },
  /**
   * 按住按钮开始语音识别
   */
  streamRecord: function () {

    manager.start({

      lang: 'zh_CN',

    })

  },
  /**
   * 松开按钮结束语音识别
   */
  streamRecordEnd: function () {
    manager.stop()
  },


  loadModal() {
    this.setData({
      loadModal: true
    })
    setTimeout(() => {
      this.setData({
        loadModal: false
      })
    }, 2000)
  },


  actionSheetTap() {                                                //ActionSheet
    wx.showActionSheet({
      itemList: ['可回收物', '有害垃圾', '厨余垃圾', '其他垃圾'],
      success(e) {
        console.log(e.tapIndex);

        wx.request({                                                //调用MQTT下发指令API
          url: 'https://api.heclouds.com/cmds?device_id=562340823', //仅为示例，并非真实的接口地址
          data: String(e.tapIndex + 1),
          header: {
            'content-type': ' text/plain', // 默认值
            'api-key': 'H6txx6=R1aSvNXESa33uDtgN3ng='
          },
          method: 'POST',
          success(res) {
            console.log(res.data)
          }
        })

      }

    })
  },
  onLoad: function () {
    app.getRecordAuth()
    this.initRecord()
  },
  initRecord: function () {

    //有新的识别内容返回，则会调用此事件

    manager.onRecognize = (res) => {

      console.log(res.result)
      let text = res.result
 
      this.setData({

        currentText: text.substring(0, text.length - 1),

      })

    }

    // 识别结束事件

    manager.onStop = (res) => {

      let text = res.result

      if (text == '') {

        // 用户没有说话，可以做一下提示处理...
        console.log("No Input Detected……")

        return

      }

      this.setData({

        currentText: text.substring(0, text.length - 1),
        inputValue: text.substring(0, text.length - 1)

      })

      this.search()
    }

  },


})