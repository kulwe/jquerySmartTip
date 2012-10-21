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
                fn(rst);
            }
        }
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
        db.transaction(table,'readwrite').objectStore(table)
        .get(obj[This.tableSet[table+'Key']]).onsuccess=function(){
            var value={},fns=This.tableSet[table+'Fn'];
            var rst=this.result;
            if(!rst){//首次添加
                $.extend(true,value,This.tableSet[table],obj);
                for(var k in fns){
                    value[k]=fns[k](value[k],null);
                }
                this.source.add(value).onsuccess=fn;
            }else{//更新操作
                $.extend(true,value,rst,obj);
                for(var j in fns){
                    value[j]=fns[j](value[j],rst[j]);//新旧记录合并
                }
                this.source.put(value).onsuccess=fn;
            }
        };
    });
};
//打开数据库
JqIDB.open=function(dbName,version,fnInit,fn){
    webkitIndexedDB.open(dbName)
    .onsuccess=function(e){
        var db= e.target.result;
        if(db.version!=version){
            fnInit(db,function(){JqIDB.open(dbName,version,function(){toolLq.log('本地数据库出错!')},toolLq.emptyFun)});
            return;
        }
        fn(db);
    };
};

//添加样例数据
/*
var jqIDB1=new JqIDB();
for(var i=0;i<50;i++){
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
