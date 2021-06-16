/**
 * 插件UI框架
 */

const WIN = require('ui/window');
const LANG = require('../language/');

class UI {
  constructor(opt) {
    // 创建一个windows窗口
    this.win = new WIN({
      title: `${LANG['title']} - ${opt['url']}`,
      // 作为一名代码洁癖患者，我连尺寸的Number都要求有意义，嗯。
      height: 444,
      width: 520,
    });
    this.createMainLayout();
    return {
      onScan: (func) => {
        this.bindToolbarClickHandler(func);
      },
      onAbout: () => {}
    }
  }

  /**
   * 创建上下layout:扫描输入&&扫描结果
   * @return {[type]} [description]
   */
  createMainLayout() {
    let layout = this.win.win.attachLayout('2E');
    // 扫描输入
    layout.cells('a').hideHeader();
    layout.cells('a').setText(`<i class="fa fa-cogs"></i> ${LANG['cella']['title']}`);
    // 扫描结果
    layout.cells('b').setText(`<i class="fa fa-bars"></i> ${LANG['cellb']['title']}`);
    layout.cells('b').collapse();

    // 创建toolbar
    this.createToolbar(layout.cells('a'));
    // 创建form
    this.createForm(layout.cells('a'));
    // 创建grid
    this.createGrid(layout.cells('b'));

    this.layout = layout;
  }

  /**
   * 创建扫描输入工具栏
   * @param  {Object} cell [description]
   * @return {[type]}      [description]
   */
  createToolbar(cell) {
    let toolbar = cell.attachToolbar();
    toolbar.loadStruct([
      { id: 'start', type: 'button', text: LANG['cella']['start'], icon: 'play' }
    ]);
    this.toolbar = toolbar;
  }

  /**
   * 创建扫描输入表单
   * @param  {Object} cell [description]
   * @return {[type]}      [description]
   */
  createForm(cell) {
    let formdata=[{
        type: 'settings', position: 'label-left',
        labelWidth: 150, inputWidth: 200
      }, {
        type: 'block', inputWidth: 'auto',
        offsetTop: 12,
        list: [{
            type: 'input', label: LANG['cella']['form']['ip'], name: 'scanip',
            required: true, validate:"NotEmpty",
            value: '127.0.0.1'
          }, {
            type: 'input', label: LANG['cella']['form']['ports'], name: 'scanports',
            required: true,
            value: '21,22,23,25,80,445,1433,3306,3389,5432,6379,7001,8080,8009,27017'
        }]
    }];
    let form = cell.attachForm(formdata, true);
    form.enableLiveValidation(true);
    this.form = form;
  }

  /**
   * 创建扫描结果表格
   * @param  {Object} cell [description]
   * @return {[type]}      [description]
   */
  createGrid(cell) {
    let grid = cell.attachGrid();
    grid.setHeader(`
      ${LANG['cellb']['grid']['ip']},
      ${LANG['cellb']['grid']['port']},
      ${LANG['cellb']['grid']['status']}
    `);
    grid.setColTypes("ro,ro,ro");
    grid.setColSorting('str,int,str');
    grid.setInitWidths("150,100,*");
    grid.setColAlign("left,left,center");
    grid.enableMultiselect(true);
    grid.init();

    this.grid = grid;
  }

  /**
   * 监听开始按钮点击事件
   * @param  {Function} callback [description]
   * @return {[type]}            [description]
   */
  bindToolbarClickHandler(callback) {
    this.toolbar.attachEvent('onClick', (id) => {
      switch (id) {
        case 'start':
          // 开始扫描
          // 加载中
          this.win.win.progressOn();
          // 获取FORM表单
          let formvals = this.form.getValues();
          // 传递给扫描核心代码
          callback({
            ip: formvals['scanip'],
            ports: formvals['scanports']
          }).then((ret) => {
              // 解析扫描结果
              let griddata = [];
              ret.text.split('\n').map((item, i) => {
                if (!item) { return };
                item = antSword.noxss(item);
                griddata.push({
                  id: i,
                  style: item.indexOf('Open') > -1 ? "background-color:#ADF1B9": "",
                  data: item.split('\t')
                });
              });
              // 渲染UI
              this.grid.clearAll();
              this.grid.parse({
                rows: griddata
              }, "json");
              this.layout.cells('a').collapse();
              this.layout.cells('b').expand();
              toastr.success(LANG['success'], antSword['language']['toastr']['success']);
              // 取消锁定LOADING
              this.win.win.progressOff();
            })
          .catch((err) => {
            console.log(err);
            toastr.error(LANG['error'], antSword['language']['toastr']['error']);
            this.win.win.progressOff();
          });
          break;
        default:

      }
    })
  }
}

module.exports = UI;
