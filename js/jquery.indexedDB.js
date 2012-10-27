/**
 智能表格提醒数据源
 by:kule 2012-10-19
 */

//indexdb数据库部分
var JqIDB=function(options){
    this.database='anna';
    this.dbVersion='1.0';
    this.fnInit=function(db,fn){
        db.setVersion('1.0').onsuccess=function(){
            db.createObjectStore('store',{keyPath:'specNum'});
            db.close();
            db=null;
            fn();
        }
    };
    this.tableSet={
        store:{
            specNum:null,
            count:null,
            content:'',
            price:0,
            color:'',
            size:''
        },
        storeKey:'specNum',
        storeFn:{
            specNum:function(value,old){return value.toUpperCase()},
            count:function(value,old){return old?old+parseInt(value):value}
        }
    };
    $.extend(this,options);
};

//读取数据。
JqIDB.prototype.getData=function(table,index,fn){
    JqIDB.open(this.database,this.dbVersion,this.fnInit,function(db){
        db.transaction(table,'readonly').objectStore(table)
        .get(index).onsuccess=function(){
            db.close();
            db=null;
            fn(this.result);
        };
    });
};
//模糊查找
JqIDB.prototype.findData=function(table,key,opt,fn){
    JqIDB.open(this.database,this.dbVersion,this.fnInit,function(db){
        key=key.toUpperCase();
        var rst=[];
        db.transaction(table,'readonly').objectStore(table)
        .openCursor(webkitIDBKeyRange.bound(key,key+'\uffff'),'prev')
        .onsuccess=function(e){
            var cursor= e.target.result;
            if(cursor){
                if(opt){
                    rst.push(opt(cursor.value));
                }else{
                    rst.push($.extend({},cursor.value));
                }
                cursor.continue();
            }else{
                db.close();
                db=null;
                fn(rst);
            }
        };
    });
};
//存入数据
JqIDB.prototype.saveData=function(table,obj,fn){
    var This=this;
    JqIDB.open(this.database,this.dbVersion,this.fnInit,function(db){
        if((!obj)||(!obj[This.tableSet[table+'Key']])){//若没有更新值则报错
            toolLq.log('更新值为空，不能执行:'+table+':',obj);
            return;
        }
        db.transaction(table,'readwrite').objectStore(table).
            get(obj[This.tableSet[table+'Key']]).onsuccess=function(){
            var value={},fns=This.tableSet[table+'Fn'];
            var rst=this.result;
            if(!rst){//首次添加
                $.extend(true,value,This.tableSet[table],obj);
                for(var k in fns){
                    value[k]=fns[k](value[k],null);
                }
                this.source.add(value).onsuccess=function(){
                    db.close();
                    db=null;
                    fn&&fn();
                }
            }else{//更新操作
                $.extend(true,value,rst,obj);
                for(var j in fns){
                    value[j]=fns[j](value[j],rst[j]);//新旧记录合并
                }
                this.source.put(value).onsuccess=function(){
                    db.close();
                    db=null;
                    fn&&fn();
                };
            }
        };
    });
};
//打开数据库
JqIDB.open=function(dbName,version,fnInit,fn){
    var args=Array.prototype.slice.call(arguments,0);
    webkitIndexedDB.open(dbName).onsuccess=function(e){
        var db= e.target.result;
        if(!JqIDB._stat.ready){
            JqIDB._tasks.push(args);
            db.close();
            db=null;
            return;
        }
        if(db.version!=version){//若没有创建表，则自动创建
            JqIDB._stat.ready=false;
            JqIDB._tasks.push(args);
            fnInit(db,function(){
                JqIDB._stat.ready=true;
                for(var i=0;i<JqIDB._tasks.length;i++){
                    JqIDB.open.apply(null,JqIDB._tasks[i]);
                }
                JqIDB._tasks=[];
            });
            return;
        }
        fn(db);

    };
};
JqIDB._tasks=[];
JqIDB._stat={ready:true};

//添加样例数据
/*var jqIDB1=new JqIDB();
for(var i=51;i<55;i++){
    jqIDB1.saveData('store',{
        specNum:'np1400'+i,
        count:10,
        content:'',
        price:20.5,
        color:'红',
        size:'ML'
    });
     jqIDB1.saveData('store',{
         specNum:'nz1300'+i,
         count:10,
         content:'',
         price:200,
         color:'蓝',
         size:'XL'
     });
     jqIDB1.saveData('store',{
         specNum:'fq6400'+i,
         count:10,
         content:'',
         price:500.5,
         color:'棕',
         size:'L'
     });
 }*/
var JqSmartTable=function(setting){
    var options={
        oTableSetting:{
            sDom: "rtip",
            bDestroy:true,
            aaData:[],
            aoColumns: [
                { "sTitle": "款号", "sClass": "center" },
                { "sTitle": "内容", "sClass": "center" },
                { "sTitle": "单价" },
                { "sTitle": "库存", "sClass": "center" }
            ],
            oLanguage:{
                sZeroRecords:'暂无此款号',
                sInfo: "共找到 _TOTAL_ 条记录",
                sInfoEmpty: "",
                sInfoFiltered: "",
                sEmptyTable:'暂无此款号'
            }
        },
        sTableSetting:{
            jqSel:'',
            columns:['specNum','content','price','count'],
            startLen:2
        },
        options:{
            delay:false
        }
    };
    $.extend(true,this,options,setting);
    this.jqIDB=null;
    this.oTable=null;
    this.oInput=null;
    this._options={
        history:null,
        selIndex:-1,
        domTable:null,
        close:true
    };
    if(!this.options.delay)this.init();
};
(function(JqSmartTable){
    //初始化
    JqSmartTable.prototype.init=function(){
        this.jqIDB=new JqIDB();
        refreshTable([],this);
    };
    //关闭提示
    JqSmartTable.prototype.close=function(){
        if(!this._options.close)return;
        this.fnFocus(this,e,true);
        $(this._options.domTable).addClass('hide1');
    };
    //打开提示
    JqSmartTable.prototype.open=function(){
        if(this._options.domTable){
            this._options.close=true;
            $(this._options.domTable).removeClass('hide1');
        }
    };
    //外部绑定事件的fnKeyUp接口
    JqSmartTable.prototype.fnKeyUp=function(jqSmT,e){
        switch(e.keyCode){
            case 40:
                return;
            case 38:
                return;
            case 13:
                return;
        }
        if(this.value.length===jqSmT.sTableSetting.startLen){//达到指定搜索长度后从数据库中查询记录
            jqSmT.open();
            if(this.value===jqSmT._options.history){//若与上次记录相同，则不再查询
                jqSmT.oTable.fnFilter(this.value,0);
                return;
            }
            jqSmT._options.history=this.value;
            jqSmT.jqIDB.findData('store',this.value,function(value){
                return toolLq.objToRuleArr(value,jqSmT.sTableSetting.columns);
            },function(rst){
                refreshTable(rst,jqSmT);
            });
        }
        if(this.value.length>2){//使用表格自带的搜索
            jqSmT.open();
            jqSmT.oTable.fnFilter(this.value,0);
        }
    };
    //外部绑定事件的fnFocus接口
    JqSmartTable.prototype.fnFocus=function(jqSmT,e,unbind){
        if(unbind){//自身提供解绑方法
             $('body').unbind('keydown',selSmartTTr);
             return;
         }
        jqSmT.oInput=this;
        $('body').off('keydown',selSmartTTr).on('keydown',{jqSmT:jqSmT,This:this},selSmartTTr);
    };
    //外部绑定事件的fnBlur接口
    JqSmartTable.prototype.fnBlur=function(jqSmT,e){
        jqSmT.close();
    };

    //事件处理函数
    //键盘上下键选择智能提示项目
    function selSmartTTr(e){
        var jqSmT = e.data.jqSmT;
        var This = e.data.This;
        var oSetting=jqSmT.oTable?jqSmT.oTable.fnSettings():null;
        if((!oSetting)||$(oSetting.nTableWrapper).hasClass('hide1'))return;
        if(e.keyCode===40||e.keyCode===38){
            e.keyCode===40?jqSmT._options.selIndex++:jqSmT._options.selIndex--;
            var jqTr=$(oSetting.nTBody).find(['tr:eq(',jqSmT._options.selIndex,')'].join('')),
                start=oSetting._iDisplayStart,
                end=oSetting._iDisplayEnd,
                total=oSetting.fnRecordsDisplay();
            if(start+jqSmT._options.selIndex>=total){//若超出总数则跳出
                jqSmT._options.selIndex=end-start;
                return;
            }
            if(start+jqSmT._options.selIndex<0){//若在顶部
                jqSmT._options.selIndex=0;
                return;
            }
            if(start+jqSmT._options.selIndex===end){
                jqSmT.oTable.fnPageChange('next');//翻到下一页
                jqSmT._options.selIndex=-1;
                selSmartTTr({keyCode:40,data:{jqSmT:e.data.jqSmT,This:e.data.This}});
                return;
            }
            if(jqSmT._options.selIndex<0){
                jqSmT.oTable.fnPageChange('previous');//翻到上一页
                jqSmT._options.selIndex=8;
                selSmartTTr({keyCode:40,data:{jqSmT:e.data.jqSmT,This:e.data.This}});
                return;
            }
            fillInput(jqTr,This);
        }
    }
    //重新生成oTable
    function refreshTable(rst,jqSmT){
        jqSmT.oTableSetting.aaData=rst;
        jqSmT.oTable=$(jqSmT.sTableSetting.jqSel).dataTable(jqSmT.oTableSetting);
        jqSmT._options.history=null;
        jqSmT._options.selIndex=-1;
        jqSmT._options.domTable=jqSmT.oTable.fnSettings().nTableWrapper;
        $(jqSmT._options.domTable).on('mouseenter',{options:jqSmT._options},function(e){
            e.data.options.close=false;
        }).on('mouseleave',{options:jqSmT._options},function(e){
            e.data.options.close=true;
        }).on('click','tbody tr',{jqSmT:jqSmT},function(e){
            var jqSmT=e.data.jqSmT;
            var jqTr=$(this);
            fillInput(jqTr,jqSmT.oInput);
            jqSmT._options.selIndex=jqTr.prevAll().length;
        });
    }
    //高亮行并写入input中
    function fillInput(jqTr,input){
        jqTr.addClass('cur_1').siblings('.cur_1').removeClass('cur_1');//高亮当前行
        input.value=jqTr.children('td:first').text()||input.value;
    }
})(JqSmartTable);
