/**
 * 核心扫描模块
 */

class Scanner {
  constructor(opt, argv) {
    return new Promise((res, rej) => {
      // 初始化核心模块
      let core = new antSword['core'][opt['type']](opt);
      // 请求数据
      let code = {};
      if (opt['type'] === 'jsp') {
        code = core.other.portscan({
          ip: argv.ip,
          ports: argv.ports
        })
      } else {
        code = {
          _: this.template[opt['type']](argv.ip, argv.ports)
        }
      }
      core.request(code).then(res)
      .catch((err)=>{return rej(err);});
    })
  }

  /**
   * 扫描代码函数
   * @return {[type]}      [description]
   */
  get template() {
    return {
      jspjs: (ip, ports) => `importPackage(Packages.java.net);
        function createSocket(ip, port) {
          var socket = null;
          try {
            socket = new Socket();
            socket.setReuseAddress(true);
            socket.setKeepAlive(false);
            socket.setTcpNoDelay(true);
            socket.setSoLinger(true, 0);
            socket.connect(new InetSocketAddress(ip, port), 30);
            socket.setSoTimeout(1);
            return socket;
          } catch (ex) {
            if(socket!=null){
              socket.close();
            }
            ex.printStackTrace();
            throw ex;
          }
        };
        function Scan(ip, ports) {
          var sb = new StringBuffer();
          var portlist = ports.split(",");
          var socket = null;
          for (var i=0; i<portlist.length; i++) {
            try {
              socket = createSocket(ip, Integer.parseInt(portlist[i]));
              sb.append(ip + "\\t" + portlist[i] + "\\tOpen\\n");
            } catch (e) {
              sb.append(ip + "\\t" + portlist[i] + "\\tClosed\\n");
            } finally {
              try {
                if (socket != null) {
                  socket.close();
                }
              } catch (ex) {}
            }
          };
          return sb.toString();
        };
        output.append(Scan("${ip}","${ports}"));
      `,
      php4: (ip, ports) => `
      function portscan($scanip, $scanport="80"){
        foreach(explode(",", $scanport) as $port){
          $fp = @fsockopen($scanip, $port, $errno, $errstr, 1);
          if(!$fp){
            echo $scanip."\t".$port."\tClosed\n";
          }else{
            echo $scanip."\t".$port."\tOpen\n";
            @fclose($fp);
          }
        }
      };
      portscan("${ip}","${ports}");`,
      php: (ip, ports) => `
        function portscan($scanip, $scanport="80"){
          foreach(explode(",", $scanport) as $port){
            $fp = @fsockopen($scanip, $port, $errno, $errstr, 1);
            if(!$fp){
              echo $scanip."\t".$port."\tClosed\n";
            }else{
              echo $scanip."\t".$port."\tOpen\n";
              @fclose($fp);
            }
          }
        };
        portscan("${ip}","${ports}");`,
      asp: (ip, ports) => `Sub Scan(scanip, scanports):On Error Resume Next:ports = Split(scanports,","):For i=0 To Ubound(ports):If Isnumeric(ports(i)) Then:set conn=Server.CreateObject("ADODB.connection"):connstr="Provider=SQLOLEDB.1;Data Source="&scanip&","&ports(i)&";User ID=ant;Password=;":conn.ConnectionTimeout=1:conn.open connstr:If Err Then:If Err.number=-2147217843 or Err.number=-2147467259 Then:If InStr(Err.description, "(Connect()).") > 0 Then:response.write scanip&chr(9)&ports(i)&chr(9)&"Closed"&chr(10):Else:response.write scanip&chr(9)&ports(i)&chr(9)&"Open"&chr(10):End If:End If:End If:End If:Next:End Sub:Call Scan("${ip}", "${ports}")`,
      aspx: (ip, ports) => `function Scan(scanip:String, scanports:String) {var sb:System.Text.StringBuilder = new System.Text.StringBuilder();var ports:String[]=scanports.Split(',');var i;for(i = 0;i < ports.Length; i++){var conn:System.Net.Sockets.TcpClient=new System.Net.Sockets.TcpClient();try{conn.Connect(scanip, Int32.Parse(ports[i]));conn.Close();sb.Append(scanip+"\\t"+ports[i]+"\\t"+"Open\\n");}catch(e){sb.Append(scanip+"\\t"+ports[i]+"\\t"+"Closed\\n");};};return sb.ToString();};Response.Write(Scan('${ip}', '${ports}'));`
    }
  }
}

module.exports = Scanner;
