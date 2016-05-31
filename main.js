'use strict';

const win = require('ui/window');
const PLANG = require('./language');

class Plugin {
  constructor(opts) {
    console.log('PortScan', opts);
    opts.map((opt) => {
      this.openWin(opt);
    });
  }

  openWin(opt) {
    let w = new win({
      title: PLANG['title'] + '-' + opt['url'],
      height: 550,
      width: 500,
    });

    let layout = w.win.attachLayout('2E');
    layout.cells('a').setText(`<i class="fa fa-cogs"></i> ${PLANG['cella']['title']}`);
    layout.cells('a').hideHeader();

    // toolbar
    let toolbar = layout.cells('a').attachToolbar();
    toolbar.loadStruct([
      { id: 'start', type: 'button', text: PLANG['cella']['start'], icon: 'spinner' }
    ]);

    // form
    let formdata=[
      { type: 'settings', position: 'label-left', labelWidth: 150, inputWidth: 200 },
          {type: 'block', inputWidth: 'auto', offsetTop: 12, list: [
            { type: 'input', label: PLANG['cella']['form']['ip'], name: 'scanip', required: true, validate:"NotEmpty", value: '127.0.0.1'},
            { type: 'input', label: PLANG['cella']['form']['ports'], name: 'scanports', required: true, value: '21,22,23,25,80,110,135,139,445,1433,3306,3389,8080'}
          ]}
      ];
    let form = layout.cells('a').attachForm(formdata, true);
    form.enableLiveValidation(true);

    // Result
    layout.cells('b').setText(`<i class="fa fa-bars"></i> ${PLANG['cellb']['title']}`);
    layout.cells('b').collapse();

    let grid = layout.cells('b').attachGrid();
    grid.setHeader(`
      ${PLANG['cellb']['grid']['ip']},
      ${PLANG['cellb']['grid']['port']},
      ${PLANG['cellb']['grid']['status']}
    `);
    grid.setColTypes("ro,ro,ro");
    grid.setColSorting('str,int,str');
    grid.setInitWidths("150,100,*");
    grid.setColAlign("left,left,center");
    grid.enableMultiselect(true);
    grid.init();

    toolbar.attachEvent('onClick', (id) => {
      switch(id){
        case 'start':
          if (form.validate()) {
            w.win.progressOn();
            let formvals = form.getValues();
            let scanip = formvals['scanip'];
            let scanports = formvals['scanports'];
            let core = new antSword['core'][opt['type']](opt);
            // 根据 shell 类型选择对应的 Payload
            let funcode = {
              php: `function portscan($scanip, $scanport="80"){foreach(explode(",", $scanport) as $port){$fp = @fsockopen($scanip, $port, $errno, $errstr, 1); if(!$fp){echo $scanip."\t".$port."\tClosed\n";}else{echo $scanip."\t".$port."\tOpen\n";@fclose($fp);}}};portscan("${scanip}","${scanports}");`,
              asp: `Sub Scan(scanip, scanports):On Error Resume Next:ports = Split(scanports,","):For i=0 To Ubound(ports):If Isnumeric(ports(i)) Then:set conn=Server.CreateObject("ADODB.connection"):connstr="Provider=SQLOLEDB.1;Data Source="&scanip&","&ports(i)&";User ID=ant;Password=;":conn.ConnectionTimeout=1:conn.open connstr:If Err Then:If Err.number=-2147217843 or Err.number=-2147467259 Then:If InStr(Err.description, "(Connect()).") > 0 Then:response.write scanip&chr(9)&ports(i)&chr(9)&"Closed"&chr(10):Else:response.write scanip&chr(9)&ports(i)&chr(9)&"Open"&chr(10):End If:End If:End If:End If:Next:End Sub:Call Scan("${scanip}", "${scanports}")`,
              aspx: `function Scan(scanip:String, scanports:String) {var sb:System.Text.StringBuilder = new System.Text.StringBuilder();var ports:String[]=scanports.Split(',');var i;for(i = 0;i < ports.Length; i++){var conn:System.Net.Sockets.TcpClient=new System.Net.Sockets.TcpClient();try{conn.Connect(scanip, Int32.Parse(ports[i]));conn.Close();sb.Append(scanip+"\\t"+ports[i]+"\\t"+"Open\\n");}catch(e){sb.Append(scanip+"\\t"+ports[i]+"\\t"+"Closed\\n");};};return sb.ToString();};Response.Write(Scan('${scanip}', '${scanports}'));`
            };

            core.request({
              _: funcode[opt['type']]
            }).then((ret) => {
              let griddata = []
              let count = 1;
              ret['text'].substring(0, ret['text'].length - 1)
              .split('\n')
              .map((item) => {
                griddata.push({
                  id: count,
                  // bgColor: item.search(/open/i) != -1? "#ADF1B9":"",
                  style: item.indexOf('Open') > -1 ? "background-color:#ADF1B9":""
                  data: item.split('\t')
                });
                count++;
              });

              grid.clearAll();
              grid.parse({rows: griddata}, "json");
              layout.cells('a').collapse();
              layout.cells('b').expand();
              toastr.success(PLANG['success'], antSword['language']['toastr']['success']);
              w.win.progressOff();
            }).catch((e) => {
              toastr.error(PLANG['error']+'\n'+JSON.stringify(e), antSword['language']['toastr']['error']);
              w.win.progressOff();
            });
          }
          break;
      }
    });
  }
}

module.exports = Plugin;
