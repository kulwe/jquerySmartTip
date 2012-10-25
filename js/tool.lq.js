/**
常用工具函数，以后扩展到jquery中
 by：kule 2012-06-06
 */
var toolLq = {
    //记录错误信息及调试信息
    log: function (caption, str) {
        try {
            console.log(caption + '：');
            console.log(str);
        } catch (ex) {
            alert(caption + '：' + str);
        }
    },
    //返回存储的key:value,格式内容。value可为字符串，但是不能含有英文逗点，
    //英文逗点请用&dlq;代替
    getStrValue: function (key, str) {
        str = [',', str, ','].join('');
        var regExp = new RegExp(',' + key + ':([^,]+),');
        str = str.match(regExp);
        return str ? str[1].replace(/&dlq;/g, ',') : str;
    },
    //str转换成json对象，不使用eval
    //英文逗点请用&dlq;代替
    strToJson: function (jsonStr) {
        jsonStr = [',', jsonStr, ','].join('');
        var rstArray, rstObj = {};
        var regExp = new RegExp(',([_\\w]+[\\w\\d_]+):([^,]+),', 'g');
        while ((rstArray = regExp.exec(jsonStr)) != null) {
            regExp.lastIndex--;
            rstObj[rstArray[1]] = rstArray[2].replace(/&dlq;/g, ',');
        }
        rstArray = regExp = null;
        return rstObj;
    },
    //HTML模板替换
    htmlTemplate: function (template, data) {
        //替换符号为${xxx}
        return template.replace(/\$\{([_\w]+[\w\d_]+)\}/g,
            function (s, s1) {
                if (data[s1] != null && data[s1] != undefined) {
                    return data[s1];
                } else {
                    return s
                }
            });
    },
    //"\/Date(1339264818000)\/"json时间解析
    jsonDateParse: function (str) {
        var regExp = new RegExp('[\'\"]?\\\\\/(Date\\(\\d+\\))\\\\\/[\'\"]?', 'gi');
        return str.replace(regExp, 'new $1');
    },
    //utc时间解析，将utc时间解析为本地时间，返回date对象，date.str为字串
    utcStrParse: function (dateStr,format) {
        var tempArray = [],
            date = new Date(),
            srcDate=new Date(),
            funQueue = {
                'y': 'FullYear',
                'M': 'Month',
                'd': 'Date',
                'h': 'Hours',
                'm': 'Minutes',
                's': 'Seconds'
            },
            patt = /(\d+)([\D]+)/g,
            i=0,
            formatArr=[false];
        //格式推断
        if(!format){
            formatArr=[['y','M','d'],//年月日
                ['M','d','y'],//月日年
                ['d','M','y'],//日月年
                ['y','d','M']];//年日月
        }
        dateStr += ';';
        for(var k=0;k<formatArr.length;k++){
            format=formatArr[k]?formatArr[k].concat(['h','m','s']):format;
            i=0;
            date.str = [];
            srcDate.str=[];
            while ((tempArray = patt.exec(dateStr)) != null) {
                tempArray.l = tempArray[1].length;
                if (funQueue[format[i]] == 'Month') tempArray[1] = tempArray[1] - 0 - 1;
                srcDate['set'+funQueue[format[i]]](tempArray[1]-0);
                date['setUTC' + funQueue[format[i]]](tempArray[1] - 0);
                srcDate.temp = srcDate['get' + funQueue[format[i]]]();
                date.temp = date['get' + funQueue[format[i]]]();
                if (funQueue[format[i]] == 'Month'){
                    srcDate.temp++;
                    date.temp++;
                }
                srcDate.str.push(tempArray.l > (srcDate.temp + '').length ? '0' + srcDate.temp : srcDate.temp, tempArray[2]);
                date.str.push(tempArray.l > (date.temp + '').length ? '0' + date.temp : date.temp, tempArray[2]);
                i++;
            }
            srcDate.str = srcDate.str.slice(0, -1).join('');
            date.str = date.str.slice(0, -1).join('');
            if(srcDate.str+';'==dateStr)break;
        }
        delete date.temp;
        date.toString = function () {
            return date.str;
        };
        return date;
    },
    getUTCMi: function (date) {
        return Date.UTC(date.getFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds(), date.getUTCMilliseconds());
    },
    getUTCStr: function (date) {
        return [date.getFullYear(), '/', date.getUTCMonth() + 1, '/', date.getUTCDate()].join('');
    },
    //日期格式化，参数为yyyy-MM-dd，HH:mm:ss
    dateFormat: function (date, format) {
        var _weekName = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
        var _monthName = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
        var formatStr = {
            "M+": date.getMonth() + 1,
            "d+": date.getDate(),
            "h+": date.getHours() > 12 ? date.getHours() - 12 : date.getHours(),
            "H+": date.getHours(),
            "m+": date.getMinutes(),
            "s+": date.getSeconds(),
            "q+": Math.floor((date.getMonth() + 3) / 3),
            "w": '0123456'.indexOf(date.getDay()),
            "t": date.getHours() < 12 ? 'am' : 'pm',
            "W": _weekName[date.getDay()],
            "L": _monthName[date.getMonth()] //non-standard
        };
        if (/(y+)/.test(format)) {
            format = format.replace(RegExp.$1, (date.getFullYear() + '').substr(4 - RegExp.$1.length));
        }
        for (var k in formatStr) {
            if (new RegExp('(' + k + ')').test(format))
                format = format.replace(RegExp.$1, RegExp.$1.length == 1 ? formatStr[k] : ('00' + formatStr[k]).substr(('' + formatStr[k]).length));
        }
        return format;
    },
    //得到好友生日
    utcBirth:function(dateStr,format){
        var day=[x18n.today,x18n.tomorrow];
        var friendDate=new Date(toolLq.utcStrParse(dateStr,format).setHours(8,0,0,0));
        var now=new Date(new Date().setHours(8,0,0,0));
        var zone=Math.floor((friendDate-now)/86400000);
        return zone>=0?day[zone]:friendDate.str;
    },
    //json过滤特殊字符，防止单双引号破坏
    filterJsonChar: function (str,code) {
        switch (code){
            case '1':
                return str.replace(/([^\\])(?=['"])/g,'$1$-\\');
            case '-1':
                return str.replace(/\$\-\\(['"])/g,'$1');
        }
        return str.replace(/['"]/g, '');
    },
    filterCRLF:function(str,code){
        switch(code){
            case '1':
                return str.replace(/(\r\n|\r|\n)/gi,'$-n');
            case '-1'://转换html换行
                return str.replace(/\$\-n/g,'<br />');
            case '-1.1':
                return str.replace(/\$\-n/g,'\n');
        }
        return str.replace(/(\r\n|\r|\n)/gi,'\\n');
    },
    //去空格ltrim()，rtrim(),trim()
    ltrim: function (str) {
        return str.replace(/^\s+/, '');
    },
    rtrim: function (str) {
        return str.replace(/\s+$/, '');
    },
    trim: function (str) {
        return str.replace(/^\s*(\S*)\s*$/, '$1');
    },
    //去单引号，filterChar()
    //若是特殊字符需要转义，未来实现自动判断
    filterChar: function (str, cha) {
        var regExp = new RegExp(cha, 'gi');
        return str.replace(regExp, '');
    },
    //过滤<>符号
    filterLt: function (str) {
        return str.replace(/(<|>)/gi, function (s, s1) {
            if (s1 == '<') {
                return '&lt;';
            } else {
                return '&gt;';
            }
        });
    },
    //过滤script
    filterScript:function(str,tagName){
        tagName=tagName||'script';
        var regExp=new RegExp(['<\\s*(',tagName,'[^>]*)>|<\\*s(\/)\\s*(',tagName,'[^>]*)>'].join(''),'gi');
        return str.replace(regExp,function(s,s1,s2,s3){
            return ['&lt;',s1,s2,s3,'&gt;'].join('');
        });
    },
    getCharsImgs:function(str,imgs,width,height,words,filter){
        var tempDom=$(['<div>',str,'</div>'].join(''));
        var imgDom=tempDom.find('img:lt('+(imgs?imgs:2)+')');
        var rst={imgs:[]};
        var regExp=new RegExp('^'+location.protocol+'//'+location.host,'i');
        words=words||100;
        rst.str=tempDom.text().replace(/\s{2,}/g,' ').slice(0,words);
        imgDom.each(function(){
            rst.imgs.push(['<img src="',this.src.replace(regExp,''),'" width="',width,'" height="',height,'" />'].join(''));
        });
        rst.imgs = rst.imgs.join('');
        return rst;
    },
    //过滤HTML
    filterHtml:function(str,noTagName,hasTagName){
        noTagName=noTagName||
            ['(html|head|body|iframe|a|area|b|big|br|button|dd|dl|dt|div|dd|fieldset|font|',
                'form|frame|frameset|h1|h2|h3|h4|h5|h6|hr|img|input|label|li|link|map|meta|object|',
                'ol|option|p|script|select|span|style|table|tbody|td|textarea|tfoot|th|thead|title|tr|',
                'tt|ul|img|i|s|u)'].join('');
        noTagName=hasTagName?noTagName.replace(hasTagName,''):noTagName;
        var regExp=new RegExp(['<\\s*\/?',noTagName,'\\b[^>]*>'].join(''),'gi');
        return str.replace(regExp,function(s,s1){
            return '';
        });
    },
    //过滤标签，firefox等会以xml解析自定义标签,如pa,故需要过滤所有被<>包围的内容
    filterTag:function(str,hasTagName){
        hasTagName=hasTagName||'';
        var regExp=hasTagName?new RegExp(['<\\s*\/?(?!',hasTagName,'\\b)\\w+\\b[^>]*>'].join(''),'gi'):
            new RegExp('<\\s*\/?\\w+\\b[^>]*>','gi');
        return str.replace(regExp,function(s,s1){
            return '';
        });
    },
    //标记图片
    filterMarkImgs:function(str,flag){
        flag=flag||'${imgs}';
        var imgs=[],
            regExp=new RegExp('<\\s*\/?img\\b[^>]*(src\\s*=(?:[^>=](?!http:))*\\.(?:png|jpg|gif))[^>]*>','gi');
        str=str.replace(regExp,function(s,s1){
            imgs.push(s1);
            return flag;
        });
        return {str:str,imgs:imgs};
    },
    filterRecoverImgs:function(str,imgs,flag,property){
        flag=flag||'\\$\\{imgs\\}';
        property=property||{};
        var pos=0,
            regExp=new RegExp(flag,'gi');
        return str.replace(regExp,function(){
            if(pos>=imgs.length)return '';
            var str=['<img src="',imgs[pos],'" ',
                property.width?'width="'+property.width+'" ':'',
                property.height?'height="'+property.height+'" ':'',
                property.alt?'alt="'+property.alt+'" ':'',
                ' />'].join('');
            pos++;
            return str;
        });
    },
    filterOnlyImg:function(str,flag,property){
        var strObj=toolLq.filterMarkImgs(str,flag);
        str=toolLq.filterTag(strObj.str);
        return toolLq.filterRecoverImgs(str,strObj.imgs,flag,property);
    },
    //过滤邮箱和QQ
    filterEmail:function(str){
        var regExp=new RegExp(['@|([\\d零一二三四五六七八九十]\\s?){6,}|',//数字号码
            'q\\s?q|',//qq
            'm\\s?s\\s?n|',//msn
            'f\\s?a\\s?c\\s?e\\s?b\\s?o\\s?o\\s?k|',//facebook
            'F\\s?B|y\\s?a\\s?h\\s?o\\s?o|',//FB yahoo
            'h\\s?o\\s?t\\s?m\\s?a\\s?i\\s?l|',//hotmail
            's\\s?k\\s?y\\s?p\\s?e|',//skype
            'g\\s?m\\s?a\\s?i\\s?l|',//gmail
            '\\.\\s?c\\s?o\\s?m|163.\\s?c\\s?o\\s?m|',//.com 163.com
            'h\\s?t\\s?t\\s?p.*\\.\\w{2,4}(\\/\\w*)?\\b'//http:
            ].join(''),'gi');
        return str.replace(regExp,'');
    },
    //获得指定节点相对父节点的偏移量，若无指定父节点或父节点错误则指定父节点为html
    //参数node,parentID；返回{left:offsety,top;offsety}
    //by kule 2012-3-3 9:24:50
    offsetParent: function (node, parentId) {
        var offsetParent = null; //用来存储offsetParent
        var offsetFlag = true; //用来决定是否offset累加
        var offsetLeft = Math.max(document.documentElement.scrollLeft,
            document.body.scrollLeft); //兼容不同浏览器对body.scroll的解释
        var offsetTop = Math.max(document.documentElement.scrollTop,
            document.body.scrollLeft);
        offsetLeft += node.offsetLeft;
        offsetTop += node.offsetTop;
        //循环累加offsetParent的offset,直到指定父对象
        //循环累加父级的scroll,直到html元素
        offsetParent = node.offsetParent;
        while ((node = node.parentNode) && node.tagName) {
            //if(node.scrollLeft||node.scrollTop){
            //offsetLeft-=node.scrollLeft;
            //offsetTop+=node.scrollTop;
            //}
            if (node.id == parentId) offsetFlag = false;
            if (node == offsetParent && offsetFlag) {
                offsetLeft += node.offsetLeft;
                offsetTop += node.offsetTop;
                offsetParent = offsetParent.offsetParent;
            }
        }
        node = offsetParent = offsetFlag = null;
        return { left: offsetLeft, top: offsetTop };
    },
    objToRuleArr:function(obj,rule){
        var ret=[];
        for(var i=0;i<rule.length;i++){
            ret.push(obj[rule[i]]);
        }
        return ret;
    },
    emptyFun: function () {},
    levelToImg: function (level) {//等级
        if (isNaN(level)) return;
        var star, //星星的个数
            moon, //月亮的个数
            sun; //太阳的个数
        star = level % 4;
        moon = (level - star) / 4 % 4;
        sun = ((level - star) / 4 - moon) / 4;
        var html = new Array();
        for (var i = 0; i < sun; i++) {
            html.push("<span class='level_icon3_lq'></span>");
        }
        for (i = 0; i < moon; i++) {
            html.push("<span class='level_icon1_lq'></span>");
        }
        for (i = 0; i < star; i++) {
            html.push("<span class='level_icon2_lq'></span>");
        }
        return html.join("");
    },
    charTran: function (str) {
        var tranSet = {
            lt: '<',
            gt: '>'
        };
        return str.replace(/&([^;]+);/gi, function (s, s1) { return tranSet[s1] || s });
    }
};
//post,get重写
$.each(['post','get'],function(i,method){
    $[method]=function(url,data,callback,type,setting){
        var dia;
        var options={
            isLoad:true,
            openMsg:function(){
                dia=loadingDialog(x18n.loading);
            },
            closeMsg:function(){
                dia.close();
                dia=null;
            }
        };
        $.extend(true,options,setting);
        if ( jQuery.isFunction( data ) ) {
            type = type || callback;
            callback = data;
            data = undefined;
        }
        if(!options.isLoad){
            return $.ajax({
                type: method,
                url: url,
                data: data,
                success: callback,
                dataType: type
            });
        }
        options.openMsg();
        return $.ajax({
            type: method,
            url: url,
            data: data,
            success: isLoadCall,
            dataType: type,
            error:options.closeMsg
        });
        function isLoadCall(res){
            options.closeMsg();
            callback(res);
        }
        function loadingDialog(content,lock,skin){
            content=content||'x18n.loading';
            lock=lock||false;
            skin=skin||'loading';
            return $.artDialog({
                content:['<div class="inb_lq ',skin,'"></div><div class="inb_lq info">',content,'</div>'].join(''),
                skin:'remind',
                padding:'0 15px',
                lock:lock,
                esc:false,
                dblClose:false
            });
        }
    };
});
